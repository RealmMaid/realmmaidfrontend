import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    const [adminMessages, setAdminMessages] = useState([]);
    const [adminCustomerSessions, setAdminCustomerSessions] = useState({});
    const [typingPeers, setTypingPeers] = useState({});

    useEffect(() => {
        if (socketRef.current) return;
        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        const socket = io(socketIOUrl, { withCredentials: true });
        socketRef.current = socket;

        // --- Event Handlers ---
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleConnectError = (error) => console.error('[Socket.IO Provider] Connection Error:', error);

        const handleAdminInitialized = (data) => {
            if (!data) return;
            setAdminMessages(data.adminChatHistory || []);
            const sessionsObject = (data.customerChatSessions || []).reduce((acc, session) => {
                if (session && session.sessionId) acc[session.sessionId] = { sessionDetails: session, messages: [] };
                return acc;
            }, {});
            setAdminCustomerSessions(sessionsObject);
        };

        const handleCustomerSessionInitialized = (data) => {
            if (!data || !data.sessionId) return;
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        };

        const handleNewCustomerSession = (payload) => {
            console.log("[DEBUG] Received 'new_customer_session' event:", payload);
            if (!payload || !payload.data) return;
            setAdminCustomerSessions(prev => {
                if(prev[payload.data.id]) return prev;
                console.log("[DEBUG] Adding new session card to admin dashboard.");
                return { ...prev, [payload.data.id]: { sessionDetails: payload.data, messages: [] } };
            });
        };
        
        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.session_id) return;
            const sessionId = message.session_id;

            setAdminCustomerSessions(prevSessions => {
                const targetSession = prevSessions[sessionId];
                if (!targetSession) {
                    // This logic was added in the previous step and remains.
                    const newSessionDetails = { sessionId: sessionId, participantName: 'Guest', status: 'active', updated_at: message.created_at, last_message_text: message.message_text };
                    return { ...prevSessions, [sessionId]: { sessionDetails: newSessionDetails, messages: [message] } };
                }
                if (targetSession.messages.some(m => m.id === message.id)) return prevSessions;
                const updatedSession = { ...targetSession, messages: [...targetSession.messages, message], sessionDetails: { ...targetSession.sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }};
                return { ...prevSessions, [sessionId]: updatedSession };
            });
        };

        const handleNewAdminMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.id) return;
            const sessionId = message.session_id;
            
            setCustomerChat(prev => {
                console.log(`[DEBUG GUEST] handleNewAdminMessage called for session ${sessionId}. Current state session ID is ${prev.sessionId}.`);
                if (String(prev.sessionId) !== String(sessionId)) {
                    console.log("[DEBUG GUEST] Session ID does not match. Aborting state update.");
                    return prev;
                }
                if (prev.messages.some(m => m.id === message.id)) {
                    console.log("[DEBUG GUEST] Duplicate message detected. Aborting state update.");
                    return prev;
                }
                const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                const newState = { ...prev, messages: [...newMessages, message] };
                console.log("[DEBUG GUEST] State update successful. New message count:", newState.messages.length);
                return newState;
            });
            
            setAdminCustomerSessions(prevSessions => {
                const targetSession = prevSessions[sessionId];
                if (!targetSession) return prevSessions;
                const newMessages = targetSession.messages.filter(m => !String(m.id).startsWith('local-'));
                if (newMessages.some(m => m.id === message.id)) return prevSessions;
                const updatedSession = { ...targetSession, messages: [...newMessages, message], sessionDetails: { ...targetSession.sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }};
                return { ...prevSessions, [sessionId]: updatedSession };
            });
        };

        const handlePeerIsTyping = ({ sessionId, userName }) => setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        const handlePeerStoppedTyping = ({ sessionId }) => {
            setTypingPeers(prev => {
                const newPeers = { ...prev };
                delete newPeers[sessionId];
                return newPeers;
            });
        };
        const handleMessagesWereRead = ({ sessionId, messageIds, readAt }) => {
            const updateMessages = (msgs) => msgs.map(m => messageIds.includes(m.id) ? { ...m, read_at: readAt } : m);
            setCustomerChat(prev => String(prev.sessionId) === String(sessionId) ? { ...prev, messages: updateMessages(prev.messages) } : prev);
            setAdminCustomerSessions(prev => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: updateMessages(prev[sessionId].messages) } } : prev);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('admin_initialized', handleAdminInitialized);
        socket.on('customer_session_initialized', handleCustomerSessionInitialized);
        socket.on('new_customer_session', handleNewCustomerSession);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);
        socket.on('messages_were_read', handleMessagesWereRead);

        return () => {
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Emitter functions are unchanged...
    const sendCustomerMessage = useCallback((messageText) => { if (socketRef.current?.connected) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId }; setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]})); socketRef.current.emit('customer_chat_message', { text: messageText }); } }, [customerChat.sessionId]);
    const sendAdminReply = useCallback((messageText, targetSessionId) => { if (socketRef.current?.connected && targetSessionId && user) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id }; setAdminCustomerSessions(prev => { if (!prev[targetSessionId]) return prev; return { ...prev, [targetSessionId]: { ...prev[targetSessionId], messages: [...prev[targetSessionId].messages, optimisticMessage] }}; }); socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId }); } }, [user]);
    const loadSessionHistory = useCallback(async (sessionId) => { if (!adminCustomerSessions[sessionId] || adminCustomerSessions[sessionId].messages.length > 0) return; try { const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`); if (response.data.success) { setAdminCustomerSessions(prev => (prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } } : prev)); } } catch (error) { console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error); } }, [adminCustomerSessions]);
    const sendAdminMessage = useCallback((messageText) => { if (socketRef.current?.connected) { socketRef.current.emit('admin_chat_message', { text: messageText }); } }, []);
    const emitStartTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('start_typing', { sessionId }); } }, []);
    const emitStopTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('stop_typing', { sessionId }); } }, []);
    const emitMessagesRead = useCallback((sessionId, messageIds) => { if (socketRef.current?.connected && sessionId && messageIds.length > 0) { socketRef.current.emit('messages_read', { sessionId, messageIds }); } }, []);
    
    const value = { isConnected, user, customerChat, adminCustomerSessions, setAdminCustomerSessions, adminMessages, typingPeers, sendCustomerMessage, sendAdminMessage, sendAdminReply, loadSessionHistory, emitStartTyping, emitStopTyping, emitMessagesRead };

    return ( <WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider> );
};

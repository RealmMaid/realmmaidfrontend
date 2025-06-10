import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
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

    // --- ADD THIS TEMPORARY TEST LISTENER ---
    useEffect(() => {
        // This check ensures we don't add the listener before the socket is ready.
        if (!socketRef.current) return;

        // This is the handler for our special test event.
        const handleTestEvent = (data) => {
            console.log('%c SUCCESS: TEST EVENT RECEIVED!', 'color: lime; font-weight: bold; font-size: 24px;', data);
            alert('SUCCESS! The test broadcast was received!');
        };

        // Listen for the event from the server.
        socketRef.current.on('test-event', handleTestEvent);

        // Clean up the listener when the component unmounts.
        return () => {
            if (socketRef.current) {
                socketRef.current.off('test-event', handleTestEvent);
            }
        };
    }, []); // Note the empty dependency array, so this runs only once.
    // ----------------------------------------


    useEffect(() => {
        if (socketRef.current) return;
        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        const socket = io(socketIOUrl, { withCredentials: true });
        socketRef.current = socket;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleConnectError = (error) => console.error('[Socket.IO Provider] Connection Error:', error);
        
        const handleAdminInitialized = (data) => { if (!data) return; setAdminMessages(data.adminChatHistory || []); const sessionsObject = (data.customerChatSessions || []).reduce((acc, session) => { if (session && session.sessionId) acc[session.sessionId] = { sessionDetails: session, messages: [] }; return acc; }, {}); setAdminCustomerSessions(sessionsObject); };
        const handleCustomerSessionInitialized = (data) => { if (!data || !data.sessionId) return; setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] }); };
        const handleNewCustomerSession = (payload) => { if (!payload || !payload.data) return; setAdminCustomerSessions(prev => { if (prev[payload.data.id]) return prev; return { ...prev, [payload.data.id]: { sessionDetails: payload.data, messages: [] } }; }); };
        
        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.session_id) return;
            const sessionId = message.session_id;
            setAdminCustomerSessions(prevSessions => {
                const targetSession = prevSessions[sessionId];
                if (!targetSession) {
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
                if (String(prev.sessionId) !== String(sessionId) || prev.messages.some(m => m.id === message.id)) return prev;
                const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                return { ...prev, messages: [...newMessages, message] };
            });
            setAdminCustomerSessions(prevSessions => {
                const targetSession = prevSessions[sessionId];
                if (!targetSession || targetSession.messages.some(m => m.id === message.id)) return prevSessions;
                const newMessages = targetSession.messages.filter(m => !String(m.id).startsWith('local-'));
                const updatedSession = { ...targetSession, messages: [...newMessages, message], sessionDetails: { ...targetSession.sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }};
                return { ...prevSessions, [sessionId]: updatedSession };
            });
        };

        const handlePeerIsTyping = ({ sessionId, userName }) => setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        const handlePeerStoppedTyping = ({ sessionId }) => { setTypingPeers(prev => { const newPeers = { ...prev }; delete newPeers[sessionId]; return newPeers; }); };
        const handleMessagesWereRead = ({ sessionId, messageIds, readAt }) => { const updateMessages = (msgs) => msgs.map(m => messageIds.includes(m.id) ? { ...m, read_at: readAt } : m); setCustomerChat(prev => String(prev.sessionId) === String(sessionId) ? { ...prev, messages: updateMessages(prev.messages) } : prev); setAdminCustomerSessions(prev => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: updateMessages(prev[sessionId].messages) } } : prev); };

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

        return () => { if (socketRef.current) { socketRef.current.removeAllListeners(); socketRef.current.disconnect(); socketRef.current = null; } };
    }, []);

    const sendCustomerMessage = useCallback((messageText) => { if (socketRef.current?.connected) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId }; setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]})); socketRef.current.emit('customer_chat_message', { text: messageText }); } }, [customerChat.sessionId]);
    const sendAdminReply = useCallback((messageText, targetSessionId) => { if (socketRef.current?.connected && targetSessionId && user) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id }; setAdminCustomerSessions(prev => { if (!prev[targetSessionId]) return prev; return { ...prev, [targetSessionId]: { ...prev[targetSessionId], messages: [...prev[targetSessionId].messages, optimisticMessage] }}; }); socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId }); } }, [user]);
    const loadSessionHistory = useCallback(async (sessionId) => { if (!adminCustomerSessions[sessionId] || adminCustomerSessions[sessionId].messages.length > 0) return; try { const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`); if (response.data.success) { setAdminCustomerSessions(prev => (prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } } : prev)); } } catch (error) { console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error); } }, [adminCustomerSessions]);
    const sendAdminMessage = useCallback((messageText) => { if (socketRef.current?.connected) { socketRef.current.emit('admin_chat_message', { text: messageText }); } }, []);
    const emitStartTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('start_typing', { sessionId }); } }, []);
    const emitStopTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('stop_typing', { sessionId }); } }, []);
    const emitMessagesRead = useCallback((sessionId, messageIds) => { if (socketRef.current?.connected && sessionId && messageIds.length > 0) { socketRef.current.emit('messages_read', { sessionId, messageIds }); } }, []);
    
    const value = useMemo(() => ({ isConnected, user, customerChat, adminCustomerSessions, setAdminCustomerSessions, adminMessages, typingPeers, sendCustomerMessage, sendAdminMessage, sendAdminReply, loadSessionHistory, emitStartTyping, emitStopTyping, emitMessagesRead }), [isConnected, user, customerChat, adminCustomerSessions, adminMessages, typingPeers]);

    return ( <WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider> );
};

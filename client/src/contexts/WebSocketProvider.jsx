import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthLoading } = useAuth();
    
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    const [adminMessages, setAdminMessages] = useState([]);
    const [adminCustomerSessions, setAdminCustomerSessions] = useState({});
    const [typingPeers, setTypingPeers] = useState({});

    useEffect(() => {
        if (socketRef.current) return;

        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        
        const socket = io(socketIOUrl, { withCredentials: true });
        socketRef.current = socket;

        // Define handlers to be used in listeners
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleConnectError = (error) => console.error('[Socket.IO Provider] Connection Error:', error);

        const handleAdminInitialized = (data) => {
            if (!data) return;
            setAdminMessages(data.adminChatHistory || []);
            const sessionsObject = (data.customerChatSessions || []).reduce((acc, session) => {
                if (session && session.sessionId) {
                   acc[session.sessionId] = { sessionDetails: session, messages: [] };
                }
                return acc;
            }, {});
            setAdminCustomerSessions(sessionsObject);
        };

        const handleCustomerSessionInitialized = (data) => {
            if (!data || !data.sessionId) return;
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        };

        const handleNewCustomerSession = (payload) => {
            if (!payload || !payload.data) return;
            setAdminCustomerSessions(prev => ({ ...prev, [payload.data.id]: { sessionDetails: payload.data, messages: [] } }));
        };

        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.session_id) return;
            
            const sessionId = message.session_id;
            
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    if (!newMessages.some(m => m.id === message.id)) {
                        newMessages.push(message);
                    }
                    return { ...prev, messages: newMessages };
                }
                return prev;
            });

            setAdminCustomerSessions(prev => {
                if (!prev[sessionId] || prev[sessionId].messages.some(m => m.id === message.id)) return prev;
                const updatedSession = { ...prev[sessionId], messages: [...prev[sessionId].messages, message], sessionDetails: { ...prev[sessionId].sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }};
                return { ...prev, [sessionId]: updatedSession };
            });
        };

        const handleNewAdminMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.id) return;

            const sessionId = message.session_id;
            
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    if (!newMessages.some(m => m.id === message.id)) {
                        newMessages.push(message);
                    }
                    return { ...prev, messages: newMessages };
                }
                return prev;
            });
            
            setAdminCustomerSessions(prev => {
                if (!sessionId || !prev[sessionId]) return prev;

                const newMessages = prev[sessionId].messages.filter(m => !String(m.id).startsWith('local-'));
                if (!newMessages.some(m => m.id === message.id)) {
                    newMessages.push(message);
                }

                const updatedSession = { ...prev[sessionId], messages: newMessages, sessionDetails: { ...prev[sessionId].sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }};
                return { ...prev, [sessionId]: updatedSession };
            });
        };

        const handlePeerIsTyping = ({ sessionId, userName }) => setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        const handlePeerStoppedTyping = ({ sessionId }) => setTypingPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[sessionId];
            return newPeers;
        });
        const handleMessagesWereRead = ({ sessionId, messageIds, readAt }) => {
            const updateMessages = (msgs) => msgs.map(m => messageIds.includes(m.id) ? { ...m, read_at: readAt } : m);
            setCustomerChat(prev => String(prev.sessionId) === String(sessionId) ? { ...prev, messages: updateMessages(prev.messages) } : prev);
            setAdminCustomerSessions(prev => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: updateMessages(prev[sessionId].messages) } } : prev);
        };

        // Attach listeners
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

        // Cleanup function to remove listeners
        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect', handleConnect);
                socketRef.current.off('disconnect', handleDisconnect);
                socketRef.current.off('connect_error', handleConnectError);
                socketRef.current.off('admin_initialized', handleAdminInitialized);
                socketRef.current.off('customer_session_initialized', handleCustomerSessionInitialized);
                socketRef.current.off('new_customer_session', handleNewCustomerSession);
                socketRef.current.off('new_customer_message', handleNewCustomerMessage);
                socketRef.current.off('new_admin_message', handleNewAdminMessage);
                socketRef.current.off('peer_is_typing', handlePeerIsTyping);
                socketRef.current.off('peer_stopped_typing', handlePeerStoppedTyping);
                socketRef.current.off('messages_were_read', handleMessagesWereRead);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const sendCustomerMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: 'guest',
                created_at: new Date().toISOString(),
                session_id: customerChat.sessionId
            };
            setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('customer_chat_message', { text: messageText });
        }
    }, [customerChat.sessionId]);

    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: 'admin',
                created_at: new Date().toISOString(),
                session_id: targetSessionId,
                admin_user_id: user.id,
            };
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                return { ...prev, [targetSessionId]: { ...prev[targetSessionId], messages: [...prev[targetSessionId].messages, optimisticMessage] }};
            });
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    const loadSessionHistory = useCallback(async (sessionId) => {
        if (adminCustomerSessions[sessionId]?.messages?.length > 0) return;
        try {
            const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`);
            if (response.data.success) {
                setAdminCustomerSessions(prev => (prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } } : prev));
            }
        } catch (error) {
            console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

    const sendAdminMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
             socketRef.current.emit('admin_chat_message', { text: messageText });
        }
    }, []);
    
    const emitStartTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('start_typing', { sessionId });
        }
    }, []);

    const emitStopTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('stop_typing', { sessionId });
        }
    }, []);

    const emitMessagesRead = useCallback((sessionId, messageIds) => {
        if (socketRef.current?.connected && sessionId && messageIds.length > 0) {
            socketRef.current.emit('messages_read', { sessionId, messageIds });
        }
    }, []);
    
    const value = {
        isConnected,
        user,
        customerChat,
        adminCustomerSessions,
        setAdminCustomerSessions,
        adminMessages,
        sendCustomerMessage,
        sendAdminMessage,
        loadSessionHistory,
        typingPeers,
        emitStartTyping,
        emitStopTyping,
        emitMessagesRead,
        sendAdminReply,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

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
        if (isAuthLoading) {
            return;
        }

        if (socketRef.current) {
            return;
        }

        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        
        console.log(`[Socket.IO Provider] Initializing connection to ${socketIOUrl}...`);

        const socket = io(socketIOUrl, {
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket.IO Provider] Connected with socket ID:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO Provider] Disconnected.');
            setIsConnected(false);
        });
        
        socket.on('connect_error', (error) => {
            console.error('[Socket.IO Provider] Connection Error:', error);
        });

        socket.on('admin_initialized', (data) => {
            // Safety check for the whole data object
            if (!data) return;
            console.log('[Socket.IO Provider] Event received: admin_initialized');
            setAdminMessages(data.adminChatHistory || []);
            const sessionsObject = (data.customerChatSessions || []).reduce((acc, session) => {
                if (session && session.sessionId) {
                   acc[session.sessionId] = { sessionDetails: session, messages: [] };
                }
                return acc;
            }, {});
            setAdminCustomerSessions(sessionsObject);
        });

        socket.on('customer_session_initialized', (data) => {
            // Safety check for the whole data object
            if (!data) return;
            console.log('[Socket.IO Provider] Event received: customer_session_initialized');
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        });

        socket.on('new_customer_session', (message) => {
            // Safety check for the whole message object
            if (!message || !message.data) return;
            console.log('[Socket.IO Provider] Event received: new_customer_session');
            setAdminCustomerSessions(prev => ({
                ...prev,
                [message.data.id]: { sessionDetails: message.data, messages: [] }
            }));
        });

        socket.on('new_customer_message', (message) => {
            // === CUTE LITTLE SAFETY NET! ===
            // If the message is empty or broken, we just ignore it! No more crashing!
            if (!message || !message.session_id) {
                console.warn('[Socket.IO Provider] Received a malformed new_customer_message. Ignoring.', message);
                return;
            }
            console.log('[Socket.IO Provider] Event received: new_customer_message');
            const sessionId = message.session_id;
            
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                   return { ...prev, messages: [...prev.messages, message] };
                }
                return prev;
            });

            setAdminCustomerSessions(prev => {
                if (!prev[sessionId]) return prev;
                const updatedSession = {
                    ...prev[sessionId],
                    messages: [...prev[sessionId].messages, message],
                    sessionDetails: {
                        ...prev[sessionId].sessionDetails,
                        last_message_text: message.message_text,
                        updated_at: message.created_at,
                    }
                };
                return { ...prev, [sessionId]: updatedSession };
            });
        });

        socket.on('new_admin_message', (message) => {
            // === ANOTHER CUTE LITTLE SAFETY NET! ===
            if (!message || !message.id) {
                console.warn('[Socket.IO Provider] Received a malformed new_admin_message. Ignoring.', message);
                return;
            }
            console.log('[Socket.IO Provider] Event received: new_admin_message');
            setAdminMessages(prev => [...prev, message]);
        });

        socket.on('peer_is_typing', ({ sessionId, userName }) => {
            console.log(`[Socket.IO Provider] Event received: peer_is_typing for session ${sessionId}`);
            setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        });

        socket.on('peer_stopped_typing', ({ sessionId }) => {
            console.log(`[Socket.IO Provider] Event received: peer_stopped_typing for session ${sessionId}`);
            setTypingPeers(prev => {
                const newPeers = { ...prev };
                delete newPeers[sessionId];
                return newPeers;
            });
        });

        socket.on('messages_were_read', ({ sessionId, messageIds, readAt }) => {
            console.log(`[Socket.IO Provider] Event received: messages_were_read for session ${sessionId}`);
            
            const updateMessages = (messages) => messages.map(msg => 
                messageIds.includes(msg.id) ? { ...msg, read_at: readAt } : msg
            );

            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                    return { ...prev, messages: updateMessages(prev.messages) };
                }
                return prev;
            });

            setAdminCustomerSessions(prev => {
                if (!prev[sessionId]) return prev;
                return {
                    ...prev,
                    [sessionId]: {
                        ...prev[sessionId],
                        messages: updateMessages(prev[sessionId].messages),
                    },
                };
            });
        });

        return () => {
            if (socketRef.current) {
                console.log('[Socket.IO Provider] Disconnecting socket...');
                socketRef.current.disconnect();
            }
            socketRef.current = null;
        };
    }, [isAuthLoading]);

    const loadSessionHistory = useCallback(async (sessionId) => {
        if (adminCustomerSessions[sessionId]?.messages?.length > 0) {
            return;
        }
        try {
            const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`);
            if (response.data..success) {
                setAdminCustomerSessions(prev => {
                    if (!prev[sessionId]) return prev;
                    return { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } };
                });
            }
        } catch (error) {
            console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

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

    const sendCustomerMessage = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId) {
            emitStopTyping(targetSessionId);
            socketRef.current.emit('customer_chat_message', { text: messageText, sessionId: targetSessionId });
            
            const optimisticMessage = {
                id: `local-${Date.now()}`, message_text: messageText, sender_type: user?.isAdmin ? 'admin' : (user ? 'user' : 'guest'),
                created_at: new Date().toISOString(), session_id: targetSessionId,
                admin_user_id: user?.isAdmin ? user.id : null,
                user_id: user && !user.isAdmin ? user.id : null,
            };
            
            if (String(customerChat.sessionId) === String(targetSessionId)) {
                setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            }
            
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                const updatedSession = {
                    ...prev[targetSessionId],
                    messages: [...prev[targetSessionId].messages, optimisticMessage],
                    sessionDetails: { ...prev[targetSessionId].sessionDetails, last_message_text: optimisticMessage.message_text, updated_at: optimisticMessage.created_at }
                };
                return { ...prev, [targetSessionId]: updatedSession };
            });
        }
    }, [customerChat.sessionId, user, emitStopTyping]);
    
    const sendAdminMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
             socketRef.current.emit('admin_chat_message', { text: messageText });
        }
    }, []);

    const value = {
        isConnected, user, customerChat, adminCustomerSessions, setAdminCustomerSessions,
        adminMessages, sendCustomerMessage, sendAdminMessage, loadSessionHistory,
        typingPeers, emitStartTyping, emitStopTyping,
        emitMessagesRead,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

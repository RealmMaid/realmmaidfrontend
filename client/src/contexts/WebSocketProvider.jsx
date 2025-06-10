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
        if (isAuthLoading) return;
        if (socketRef.current) return;

        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        console.log(`[Socket.IO Provider] Initializing connection to ${socketIOUrl}...`);

        const socket = io(socketIOUrl, { withCredentials: true });
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
            if (!data) return;
            console.log(`[Socket.IO Provider] Event received: customer_session_initialized for session ${data.sessionId}`);
            // When the session is initialized, we get the ID and any existing history.
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        });

        socket.on('new_customer_session', (payload) => {
            if (!payload || !payload.data) return;
            console.log('[Socket.IO Provider] Event received: new_customer_session');
            setAdminCustomerSessions(prev => ({
                ...prev,
                [payload.data.id]: { sessionDetails: payload.data, messages: [] }
            }));
        });

        socket.on('new_customer_message', (payload) => {
            const message = payload; // The server now sends the message directly
            if (!message || !message.session_id) {
                return;
            }
            console.log('[Socket.IO Provider] Event received: new_customer_message');
            const sessionId = message.session_id;
            
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

        socket.on('new_admin_message', (payload) => {
            const message = payload; // The server now sends the message directly
            if (!message || !message.id) {
                return;
            }
            console.log('[Socket.IO Provider] Event received: new_admin_message');
            
            if (!message.session_id) {
                setAdminMessages(prev => [...prev, message]);
                return;
            }

            const sessionId = message.session_id;

            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                   return { ...prev, messages: [...prev.messages, message] };
                }
                return prev;
            });

            setAdminCustomerSessions(prev => {
                if (!prev[sessionId]) return prev;
                // Avoid adding duplicate optimistic message if it exists
                if (prev[sessionId].messages.some(m => m.id === message.id)) {
                    return prev;
                }
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

        socket.on('peer_is_typing', ({ sessionId, userName }) => {
            setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        });

        socket.on('peer_stopped_typing', ({ sessionId }) => {
            setTypingPeers(prev => {
                const newPeers = { ...prev };
                delete newPeers[sessionId];
                return newPeers;
            });
        });

        socket.on('messages_were_read', ({ sessionId, messageIds, readAt }) => {
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
                return { ...prev, [sessionId]: { ...prev[sessionId], messages: updateMessages(prev[sessionId].messages) } };
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthLoading]);

    const loadSessionHistory = useCallback(async (sessionId) => {
        if (adminCustomerSessions[sessionId]?.messages?.length > 0) return;
        try {
            const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`);
            if (response.data.success) {
                setAdminCustomerSessions(prev => {
                    if (!prev[sessionId]) return prev;
                    return { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } };
                });
            }
        } catch (error) {
            console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

    // For the GUEST to send a message
    const sendCustomerMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('customer_chat_message', { text: messageText });
            // The guest's UI will update when the server sends 'customer_session_initialized'
            // and the first 'new_customer_message'.
        }
    }, []);

    // For the ADMIN to reply to a GUEST
    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId) {
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: 'admin',
                created_at: new Date().toISOString(),
                session_id: targetSessionId,
                admin_user_id: user.id,
            };

            // Optimistically update the admin's UI
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                const updatedSession = {
                    ...prev[targetSessionId],
                    messages: [...prev[targetSessionId].messages, optimisticMessage],
                };
                return { ...prev, [targetSessionId]: updatedSession };
            });

            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);
    
    // For the ADMIN to chat with other ADMINS
    const sendAdminMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
             socketRef.current.emit('admin_chat_message', { text: messageText });
        }
    }, []);
    
    const emitStartTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) socketRef.current.emit('start_typing', { sessionId });
    }, []);

    const emitStopTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) socketRef.current.emit('stop_typing', { sessionId });
    }, []);

    const emitMessagesRead = useCallback((sessionId, messageIds) => {
        if (socketRef.current?.connected && sessionId && messageIds.length > 0) {
            socketRef.current.emit('messages_read', { sessionId, messageIds });
        }
    }, []);

    const value = {
        isConnected, user, customerChat, adminCustomerSessions, setAdminCustomerSessions,
        adminMessages, sendCustomerMessage, sendAdminMessage, loadSessionHistory,
        typingPeers, emitStartTyping, emitStopTyping, emitMessagesRead, sendAdminReply,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

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
    const [typingPeers, setTypingPeers] = useState({}); // --- NEW: State to track who is typing

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
            console.log('[Socket.IO Provider] Event received: admin_initialized', data);
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
            console.log('[Socket.IO Provider] Event received: customer_session_initialized', data);
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        });

        socket.on('new_customer_session', (message) => {
            console.log('[Socket.IO Provider] Event received: new_customer_session', message);
            setAdminCustomerSessions(prev => ({
                ...prev,
                [message.data.id]: { sessionDetails: message.data, messages: [] }
            }));
        });

        socket.on('new_customer_message', (message) => {
            console.log('[Socket.IO Provider] Event received: new_customer_message', message);
            const msgData = message;
            const sessionId = msgData.session_id;
            
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                   return { ...prev, messages: [...prev.messages, msgData] };
                }
                return prev;
            });

            setAdminCustomerSessions(prev => {
                if (!prev[sessionId]) return prev;
                const updatedSession = {
                    ...prev[sessionId],
                    messages: [...prev[sessionId].messages, msgData],
                    sessionDetails: {
                        ...prev[sessionId].sessionDetails,
                        last_message_text: msgData.message_text,
                        updated_at: msgData.created_at,
                    }
                };
                return { ...prev, [sessionId]: updatedSession };
            });
        });

        socket.on('new_admin_message', (message) => {
            console.log('[Socket.IO Provider] Event received: new_admin_message', message);
            setAdminMessages(prev => [...prev, message]);
        });

        // --- NEW: Listen for typing events from the server ---
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
            if (response.data.success) {
                setAdminCustomerSessions(prev => {
                    if (!prev[sessionId]) return prev;
                    return {
                        ...prev,
                        [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] }
                    };
                });
            }
        } catch (error) {
            console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

    // --- NEW: Functions to emit typing events TO the server ---
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

    const sendCustomerMessage = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId) {
            emitStopTyping(targetSessionId); // Stop typing when message is sent
            socketRef.current.emit('customer_chat_message', { text: messageText, sessionId: targetSessionId });
            
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: user?.isAdmin ? 'admin' : (user ? 'user' : 'guest'),
                created_at: new Date().toISOString(),
                session_id: targetSessionId
            };
            
            if (String(customerChat.sessionId) === String(targetSessionId)) {
                setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            }
            
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                const updatedSession = {
                    ...prev[targetSessionId],
                    messages: [...prev[targetSessionId].messages, optimisticMessage],
                    sessionDetails: {
                        ...prev[targetSessionId].sessionDetails,
                        last_message_text: optimisticMessage.message_text,
                        updated_at: optimisticMessage.created_at,
                    }
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
        isConnected,
        user,
        customerChat,
        adminCustomerSessions,
        setAdminCustomerSessions,
        adminMessages,
        sendCustomerMessage,
        sendAdminMessage,
        loadSessionHistory,
        typingPeers, // --- NEW: Expose typing status
        emitStartTyping, // --- NEW: Expose function
        emitStopTyping, // --- NEW: Expose function
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

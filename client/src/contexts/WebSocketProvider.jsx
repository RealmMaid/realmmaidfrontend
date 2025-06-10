import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';
import { io } from 'socket.io-client'; // --- NEW: Import the Socket.IO client ---

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthLoading } = useAuth();
    
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    const [adminMessages, setAdminMessages] = useState([]);
    const [adminCustomerSessions, setAdminCustomerSessions] = useState({});

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        // Prevent multiple connections
        if (socketRef.current) {
            return;
        }

        // --- NEW: Use the Socket.IO server URL ---
        // Note: For Socket.IO, we use the base HTTP URL, not a 'ws://' URL.
        const socketIOUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '') || 'http://localhost:3000';
        
        console.log(`[Socket.IO Provider] Initializing connection to ${socketIOUrl}...`);

        // --- NEW: Connect using io() and enable withCredentials for session handling ---
        const socket = io(socketIOUrl, {
            withCredentials: true,
        });
        socketRef.current = socket;

        // --- NEW: Standard Socket.IO event listeners ---
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

        // --- Listen for our custom events from the server ---
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
            const msgData = message.data;
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
            setAdminMessages(prev => [...prev, message.data]);
        });

        // Cleanup on component unmount
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

    const sendCustomerMessage = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId) {
            // Instead of .send(), we .emit() a named event
            socketRef.current.emit('customer_chat_message', { text: messageText, sessionId: targetSessionId });
            
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: user?.isAdmin ? 'admin' : (user ? 'user' : 'guest'),
                created_at: new Date().toISOString(),
                session_id: targetSessionId
            };
            
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

            if (String(customerChat.sessionId) === String(targetSessionId)) {
                setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            }
        }
    }, [customerChat.sessionId, user]);
    
    const sendAdminMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
             socketRef.current.emit('admin_chat_message', { text: messageText });
             const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_name: user?.firstName || 'Admin',
                sender_type: 'admin',
                created_at: new Date().toISOString(),
             };
             setAdminMessages(prev => [...prev, optimisticMessage]);
        }
    }, [user]);

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
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

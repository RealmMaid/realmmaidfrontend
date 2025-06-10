import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';

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
        if (isAuthLoading) { return; }
        if (socketRef.current) { return; }
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

        console.log(`[WebSocketProvider] Initializing connection to ${wsUrl}...`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('[WebSocketProvider] WebSocket Connected.');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('[WebSocketProvider] Message received:', message);

            switch (message.type) {
                case 'admin_initialized':
                    setAdminMessages(message.data.adminChatHistory || []);
                    const sessionsObject = (message.data.customerChatSessions || []).reduce((acc, session) => {
                        if (session && session.sessionId) {
                           acc[session.sessionId] = { sessionDetails: session, messages: [] };
                        }
                        return acc;
                    }, {});
                    setAdminCustomerSessions(sessionsObject);
                    break;
                case 'customer_session_initialized':
                    setCustomerChat({ sessionId: message.sessionId, messages: message.history || [] });
                    break;
                case 'new_customer_session':
                    setAdminCustomerSessions(prev => ({
                        ...prev,
                        [message.data.id]: { sessionDetails: message.data, messages: [] }
                    }));
                    break;
                case 'new_customer_message': { // Brackets add block scope
                    const msgData = message.data;
                    const sessionId = msgData.session_id;

                    // --- FIX: This logic now correctly separates the two UI updates ---

                    // 1. Update the customer's own chat window ONLY if the session IDs match.
                    // This prevents an admin's UI from trying to update their personal chat widget
                    // with a message from a different customer's session.
                    setCustomerChat(prev => {
                        if (String(prev.sessionId) === String(sessionId)) {
                           return { ...prev, messages: [...prev.messages, msgData] };
                        }
                        return prev;
                    });

                    // 2. Separately, update the admin dashboard view with the new message.
                    setAdminCustomerSessions(prev => {
                        // If the session isn't on the admin's dashboard, do nothing.
                        if (!prev[sessionId]) return prev;

                        // Otherwise, update the session with the new message data.
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
                    break;
                }
                case 'new_admin_message':
                    setAdminMessages(prev => [...prev, message.data]);
                    break;
            }
        };

        ws.onerror = (error) => console.error('[WebSocketProvider] WebSocket Error:', error);

        ws.onclose = () => {
            console.log('[WebSocketProvider] WebSocket Disconnected.');
            setIsConnected(false);
            socketRef.current = null; 
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close();
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
            console.error(`[WebSocketProvider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

    const sendCustomerMessage = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.readyState === WebSocket.OPEN && targetSessionId) {
            const payload = { type: 'customer_chat_message', text: messageText, sessionId: targetSessionId };
            socketRef.current.send(JSON.stringify(payload));
            
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
        if (socketRef.current?.readyState === WebSocket.OPEN) {
             socketRef.current.send(JSON.stringify({ type: 'admin_chat_message', text: messageText }));
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

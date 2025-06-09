// client/src/contexts/WebSocketProvider.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

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

        if (socketRef.current) {
            return;
        }

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
                case 'new_customer_message':
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
                            // Also update the session details with the new last message!
                            sessionDetails: {
                                ...prev[sessionId].sessionDetails,
                                last_message_text: msgData.message_text,
                                updated_at: msgData.created_at,
                            }
                        };
                        return { ...prev, [sessionId]: updatedSession };
                    });
                    break;
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
            
            // --- FIX: The optimistic update for the admin view needs to update the session details too! ---
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                const updatedSession = {
                    ...prev[targetSessionId],
                    // Add the new message to the messages array
                    messages: [...prev[targetSessionId].messages, optimisticMessage],
                    // AND update the session details so it stays sorted correctly!
                    sessionDetails: {
                        ...prev[targetSessionId].sessionDetails,
                        last_message_text: optimisticMessage.message_text,
                        updated_at: optimisticMessage.created_at,
                    }
                };
                return { ...prev, [targetSessionId]: updatedSession };
            });

            // The optimistic update for the customer's own chat window is simpler and can stay the same
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
        adminMessages,
        sendCustomerMessage,
        sendAdminMessage,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

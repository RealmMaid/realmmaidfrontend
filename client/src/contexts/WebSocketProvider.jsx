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

        // --- PRODUCTION-READY SETUP ---
        // This logic dynamically creates the correct WebSocket URL for any environment.
        // It checks if the page is secure (https) to use 'wss', otherwise 'ws'.
        // It uses `window.location.host` to connect to the same server that served the page,
        // which is exactly how it will work on Render.
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}`;

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
                        if (session && session.id) {
                           acc[session.id] = { sessionDetails: session, messages: session.messages || [] };
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
                        if (prev.sessionId === sessionId) {
                           return { ...prev, messages: [...prev.messages, msgData] };
                        }
                        return prev;
                    });

                    setAdminCustomerSessions(prev => {
                        if (!prev[sessionId]) return prev;
                        return {
                            ...prev,
                            [sessionId]: {
                                ...prev[sessionId],
                                messages: [...prev[sessionId].messages, msgData]
                            }
                        };
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

            if (customerChat.sessionId === targetSessionId) {
                setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            }
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                return {
                    ...prev,
                    [targetSessionId]: {
                        ...prev[targetSessionId],
                        messages: [...prev[targetSessionId].messages, optimisticMessage]
                    }
                };
            });
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

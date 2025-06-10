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
        // ... (useEffect remains the same)
    }, [isAuthLoading]);

    // --- ADDED DEBUG LOGS HERE ---
    const loadSessionHistory = useCallback(async (sessionId) => {
        console.log(`[WebSocketProvider] loadSessionHistory called for session ID: ${sessionId}`);
        
        if (adminCustomerSessions[sessionId]?.messages?.length > 0) {
            console.log(`[WebSocketProvider] History for session ${sessionId} already exists. Skipping fetch.`);
            return;
        }

        console.log(`[WebSocketProvider] Fetching history via API...`);
        try {
            const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`);
            console.log(`[WebSocketProvider] API response received for session ${sessionId}:`, response);
            if (response.data.success) {
                console.log(`[WebSocketProvider] API call successful. Updating state with ${response.data.messages?.length || 0} messages.`);
                setAdminCustomerSessions(prev => {
                    if (!prev[sessionId]) return prev;
                    const newState = {
                        ...prev,
                        [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] }
                    };
                    console.log(`[WebSocketProvider] State update complete for session ${sessionId}.`);
                    return newState;
                });
            } else {
                console.error(`[WebSocketProvider] API call returned success:false for session ${sessionId}.`);
            }
        } catch (error) {
            console.error(`[WebSocketProvider] API call FAILED for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);


    const sendCustomerMessage = useCallback((messageText, targetSessionId) => { /* ... */ }, [customerChat.sessionId, user]);
    const sendAdminMessage = useCallback((messageText) => { /* ... */ }, [user]);

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

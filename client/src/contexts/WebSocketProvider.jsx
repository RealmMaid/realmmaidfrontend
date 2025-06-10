import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
// 1. Import the useQueryClient hook from React Query
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    // 2. Get an instance of the query client
    const queryClient = useQueryClient();

    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    // We no longer need the adminCustomerSessions state for the list itself.
    // React Query is now managing that list. We only need it for the active chat modal.
    const [activeChat, setActiveChat] = useState({ sessionId: null, messages: [] });
    const [typingPeers, setTypingPeers] = useState({});

    useEffect(() => {
        if (socketRef.current) return;
        const socket = io((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', ''), { withCredentials: true });
        socketRef.current = socket;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        // 3. This is the magic! When a new session is created...
        const handleNewCustomerSession = () => {
            console.log('New session event received, invalidating chat sessions query!');
            // ...we tell React Query to mark the 'chatSessions' data as stale.
            // React Query will then automatically refetch it.
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        };
        
        // We do the same for new messages, as this updates the 'last_message_text' in the list.
        const handleNewCustomerMessage = (payload) => {
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });

            // We can also update the active chat modal if it's open
            if (payload.savedMessage?.session_id === activeChat.sessionId) {
                setActiveChat(prev => ({ ...prev, messages: [...prev.messages, payload.savedMessage] }));
            }
        };

        const handleNewAdminMessage = (payload) => {
            // Update the guest's chat window
            setCustomerChat(prev => {
                if (String(prev.sessionId) !== String(payload.savedMessage?.session_id) || prev.messages.some(m => m.id === payload.savedMessage.id)) return prev;
                return { ...prev, messages: [...prev.messages, payload.savedMessage] };
            });

            // Update the active chat modal if it's open
             if (payload.savedMessage?.session_id === activeChat.sessionId) {
                setActiveChat(prev => ({ ...prev, messages: [...prev.messages, payload.savedMessage] }));
            }
        };

        const handlePeerIsTyping = ({ sessionId, userName }) => setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        const handlePeerStoppedTyping = ({ sessionId }) => { setTypingPeers(prev => { const newPeers = { ...prev }; delete newPeers[sessionId]; return newPeers; }); };
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('new_customer_session', handleNewCustomerSession);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [queryClient, activeChat.sessionId]); // Add dependencies

    // Functions to interact with the chat, like sending messages
    const sendCustomerMessage = useCallback((messageText) => { /* ... unchanged ... */ }, []);
    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id };
            setActiveChat(prev => ({...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    const value = useMemo(() => ({
        isConnected,
        customerChat,
        activeChat,
        setActiveChat,
        typingPeers,
        sendCustomerMessage,
        sendAdminReply,
        // Other functions...
    }), [isConnected, customerChat, activeChat, typingPeers, sendAdminReply]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

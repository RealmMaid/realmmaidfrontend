import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.jsx';
import API from '../api/axios';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    const [activeAdminChat, setActiveAdminChat] = useState({ sessionId: null, messages: [] });
    const [typingPeers, setTypingPeers] = useState({});

    useEffect(() => {
        if (socketRef.current) return;
        const socket = io((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', ''), { withCredentials: true });
        socketRef.current = socket;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        // This is still perfect for when a BRAND NEW session is created.
        const handleNewCustomerSession = () => {
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        };
        
        // This is the smart update logic.
        const updateSessionInCache = (message) => {
            const sessionId = message.session_id;
            // setQueryData lets us directly manipulate the cached data
            queryClient.setQueryData(['chatSessions'], (oldData) => {
                if (!oldData) return oldData; // If there's no cache, do nothing
                
                // Find the index of the session we need to update
                const sessionIndex = oldData.findIndex(s => s.sessionId === sessionId);
                if (sessionIndex === -1) return oldData; // Session not in the list, do nothing
                
                const newSessions = [...oldData]; // Create a new array for immutability
                // Update just the one session with the new last message and timestamp
                newSessions[sessionIndex] = {
                    ...newSessions[sessionIndex],
                    last_message_text: message.message_text,
                    updated_at: message.created_at,
                };
                return newSessions;
            });
        };
        
        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message) return;
            // Update the cache smartly instead of refetching
            updateSessionInCache(message);
            // Update the active modal if it's open
            setActiveAdminChat(prev => {
                if (prev.sessionId === message.session_id && !prev.messages.some(m => m.id === message.id)) {
                    return { ...prev, messages: [...prev.messages, message] };
                }
                return prev;
            });
        };

        const handleNewAdminMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message) return;
            // Update the cache smartly
            updateSessionInCache(message);
            
            // Update the guest's own chat window
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(message.session_id) && !prev.messages.some(m => m.id === message.id)) {
                    return { ...prev, messages: [...prev.messages, message] };
                }
                return prev;
            });

            // Update the admin's active chat modal
            setActiveAdminChat(prev => {
                if (prev.sessionId === message.session_id && !prev.messages.some(m => m.id.startsWith('local-') && m.id === message.id)) {
                    const newMessages = prev.messages.filter(m => !m.id.startsWith('local-'));
                    return { ...prev, messages: [...newMessages, message] };
                }
                return prev;
            });
        };

        // Other handlers remain the same...
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
    }, [queryClient]);

    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id };
            setActiveAdminChat(prev => ({...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    // The rest of the provider is the same...
    const sendCustomerMessage = useCallback((messageText) => { if (socketRef.current?.connected) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId }; setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]})); socketRef.current.emit('customer_chat_message', { text: messageText }); } }, [customerChat.sessionId]);
    const value = useMemo(() => ({ isConnected, customerChat, activeAdminChat, setActiveAdminChat, typingPeers, sendAdminReply, sendCustomerMessage }), [isConnected, customerChat, activeAdminChat, typingPeers, sendAdminReply, sendCustomerMessage]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

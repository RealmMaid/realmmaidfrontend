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
    
    // This state is only for the guest's own chat window.
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    
    // This state is only for the currently open chat modal in the admin dashboard.
    const [activeAdminChat, setActiveAdminChat] = useState({ sessionId: null, messages: [] });
    
    const [typingPeers, setTypingPeers] = useState({});

    // This is the main connection hook.
    useEffect(() => {
        if (socketRef.current) return;
        const socket = io((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', ''), { withCredentials: true });
        socketRef.current = socket;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        // When a new session is created or a message is sent, we tell React Query
        // that the list of sessions is out of date. React Query then refetches it automatically.
        const invalidateChatSessions = () => {
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        };
        
        const handleNewCustomerMessage = (payload) => {
            invalidateChatSessions(); // Update the main list
            // If the modal for this chat is open, add the message to it
            setActiveAdminChat(prev => {
                if (prev.sessionId === payload.savedMessage?.session_id) {
                    return { ...prev, messages: [...prev.messages, payload.savedMessage] };
                }
                return prev;
            });
        };

        const handleNewAdminMessage = (payload) => {
            invalidateChatSessions(); // Update the main list
            
            // Update the guest's own chat window
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(payload.savedMessage?.session_id) && !prev.messages.some(m => m.id === payload.savedMessage.id)) {
                    return { ...prev, messages: [...prev.messages, payload.savedMessage] };
                }
                return prev;
            });

            // Update the admin's active chat modal
            setActiveAdminChat(prev => {
                if (prev.sessionId === payload.savedMessage?.session_id && !prev.messages.some(m => m.id === payload.savedMessage.id)) {
                     const newMessages = prev.messages.filter(m => !m.id.startsWith('local-'));
                    return { ...prev, messages: [...newMessages, payload.savedMessage] };
                }
                return prev;
            });
        };

        const handlePeerIsTyping = ({ sessionId, userName }) => setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        const handlePeerStoppedTyping = ({ sessionId }) => {
            setTypingPeers(prev => {
                const newPeers = { ...prev };
                delete newPeers[sessionId];
                return newPeers;
            });
        };
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('new_customer_session', invalidateChatSessions);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [queryClient]); // This dependency array is now correct.

    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id };
            setActiveAdminChat(prev => ({...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    const value = useMemo(() => ({
        isConnected,
        customerChat,
        activeAdminChat,
        setActiveAdminChat,
        typingPeers,
        sendAdminReply,
        // Other functions you might need
    }), [isConnected, customerChat, activeAdminChat, typingPeers, sendAdminReply]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

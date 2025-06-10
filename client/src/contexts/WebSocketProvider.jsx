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

        const invalidateChatSessions = () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        
        const handleNewCustomerMessage = (payload) => {
            invalidateChatSessions();
            setActiveAdminChat(prev => {
                if (prev.sessionId === payload.savedMessage?.session_id && !prev.messages.some(m => m.id === payload.savedMessage.id)) {
                    return { ...prev, messages: [...prev.messages, payload.savedMessage] };
                }
                return prev;
            });
        };

        const handleNewAdminMessage = (payload) => {
            invalidateChatSessions();
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(payload.savedMessage?.session_id) && !prev.messages.some(m => m.id === payload.savedMessage.id)) {
                    const newMessages = prev.messages.filter(m => !m.id.startsWith('local-'));
                    return { ...prev, messages: [...newMessages, payload.savedMessage] };
                }
                return prev;
            });
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
    }, [queryClient]);

    // --- THIS FUNCTION IS NOW RESTORED ---
    const sendCustomerMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId };
            setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('customer_chat_message', { text: messageText });
        }
    }, [customerChat.sessionId]);
    // ------------------------------------

    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id };
            setActiveAdminChat(prev => ({...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    const emitStartTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) { socketRef.current.emit('start_typing', { sessionId }); }
    }, []);

    const emitStopTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) { socketRef.current.emit('stop_typing', { sessionId }); }
    }, []);

    const value = useMemo(() => ({
        isConnected,
        customerChat,
        activeAdminChat,
        setActiveAdminChat,
        typingPeers,
        sendAdminReply,
        emitStartTyping,
        emitStopTyping,
        // --- IT IS NOW ADDED BACK TO THE CONTEXT VALUE ---
        sendCustomerMessage,
    }), [isConnected, customerChat, activeAdminChat, typingPeers, sendAdminReply, emitStartTyping, emitStopTyping, sendCustomerMessage]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

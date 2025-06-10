import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// 1. Import the toast object
import { toast } from 'react-hot-toast';
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
        
        // --- THIS IS THE UPDATED FUNCTION ---
        const handleNewCustomerSession = (payload) => {
            // 2. We create a nice message using data from the event payload
            const participantName = payload?.data?.participantName || 'A new visitor';
            const message = `New chat started with ${participantName}.`;
            
            // 3. Show the toast notification!
            toast(message, { icon: '💬' });
            
            // 4. Invalidate the query so the list still updates automatically
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        };
        
        const updateSessionInCache = (message) => {
            const sessionId = message.session_id;
            queryClient.setQueryData(['chatSessions'], (oldData) => {
                if (!oldData) return oldData;
                const sessionIndex = oldData.findIndex(s => s.sessionId === sessionId);
                if (sessionIndex === -1) return oldData;
                const newSessions = [...oldData];
                newSessions[sessionIndex] = { ...newSessions[sessionIndex], last_message_text: message.message_text, updated_at: message.created_at };
                return newSessions;
            });
        };

        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message) return;
            updateSessionInCache(message);
            setActiveAdminChat(prev => {
                if (prev.sessionId === message.session_id && !prev.messages.some(m => m.id === message.id)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    return { ...prev, messages: [...newMessages, message] };
                }
                return prev;
            });
        };

        const handleNewAdminMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message) return;
            updateSessionInCache(message);
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(message.session_id) && !prev.messages.some(m => m.id === message.id)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    return { ...prev, messages: [...newMessages, message] };
                }
                return prev;
            });
            setActiveAdminChat(prev => {
                if (prev.sessionId === message.session_id && !prev.messages.some(m => m.id === message.id)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    return { ...prev, messages: [...newMessages, message] };
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
        socket.on('new_customer_session', handleNewCustomerSession);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [queryClient]);

    // The rest of the file remains the same...
    const sendCustomerMessage = useCallback((messageText) => { if (socketRef.current?.connected) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId }; setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]})); socketRef.current.emit('customer_chat_message', { text: messageText }); } }, [customerChat.sessionId]);
    const sendAdminReply = useCallback((messageText, targetSessionId) => { if (socketRef.current?.connected && targetSessionId && user) { const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'admin', created_at: new Date().toISOString(), session_id: targetSessionId, admin_user_id: user.id }; setActiveAdminChat(prev => ({...prev, messages: [...prev.messages, optimisticMessage]})); socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId }); } }, [user]);
    const emitStartTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('start_typing', { sessionId }); } }, []);
    const emitStopTyping = useCallback((sessionId) => { if (socketRef.current?.connected) { socketRef.current.emit('stop_typing', { sessionId }); } }, []);
    const value = useMemo(() => ({ isConnected, customerChat, activeAdminChat, setActiveAdminChat, typingPeers, sendAdminReply, sendCustomerMessage, emitStartTyping, emitStopTyping }), [isConnected, customerChat, activeAdminChat, typingPeers, sendAdminReply, sendCustomerMessage, emitStartTyping, emitStopTyping]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

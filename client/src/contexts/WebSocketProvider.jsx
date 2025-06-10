import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid library

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

// This helper function gets the unique guest ID from localStorage or creates a new one.
const getOrCreateGuestIdentifier = () => {
    const GUEST_ID_KEY = 'chatGuestIdentifier';
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
        guestId = uuidv4();
        localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
};

export const WebSocketProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    const [activeAdminChat, setActiveAdminChat] = useState({ sessionId: null, messages: [] });
    const [typingPeers, setTypingPeers] = useState({});

    useEffect(() => {
        // Disconnect any existing socket before creating a new one
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // For guests, get or create their persistent identifier.
        // For logged-in users, this will be null.
        const guestIdentifier = user ? null : getOrCreateGuestIdentifier();

        // Create the socket instance with the auth payload
        const socket = io((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', ''), {
            withCredentials: true,
            auth: {
                guestIdentifier: guestIdentifier
            }
        });
        socketRef.current = socket;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        const handleNewCustomerSession = (payload) => {
            const participantName = payload?.data?.participantName || 'a new visitor';
            toast(`New chat started with ${participantName}.`, { icon: '💬' });
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
                    return { ...prev, messages: [...prev.messages, message] };
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

        const handleAdminInitialized = (data) => {
            if(data.customerChatSessions) {
                queryClient.setQueryData(['chatSessions'], data.customerChatSessions);
            }
        };

        const handleCustomerSessionInitialized = (data) => {
            if(data.sessionId) {
                setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('admin_initialized', handleAdminInitialized);
        socket.on('customer_session_initialized', handleCustomerSessionInitialized);
        socket.on('new_customer_session', handleNewCustomerSession);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [queryClient, user]); // Re-run this effect if the user logs in/out

    const sendCustomerMessage = useCallback((messageText) => {
        if (socketRef.current?.connected && customerChat.sessionId) {
            const optimisticMessage = { id: `local-${Date.now()}`, message_text: messageText, sender_type: 'guest', created_at: new Date().toISOString(), session_id: customerChat.sessionId };
            setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('customer_chat_message', { text: messageText });
        }
    }, [customerChat.sessionId]);

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
        sendCustomerMessage,
        emitStartTyping,
        emitStopTyping,
    }), [isConnected, customerChat, activeAdminChat, typingPeers, sendAdminReply, sendCustomerMessage, emitStartTyping, emitStopTyping]);

    return (<WebSocketContext.Provider value={value}> {children} </WebSocketContext.Provider>);
};

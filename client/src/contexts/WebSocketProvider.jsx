import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../api/axios';
import { io } from 'socket.io-client';

// Create the context
const WebSocketContext = createContext(null);

// Create a custom hook for easy access to the context
export const useWebSocket = () => useContext(WebSocketContext);

// Create the Provider component
export const WebSocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthLoading } = useAuth();
    
    // State for guest-facing chat
    const [customerChat, setCustomerChat] = useState({ sessionId: null, messages: [] });
    
    // State for admin-facing features
    const [adminMessages, setAdminMessages] = useState([]); // For the internal admin-only chat
    const [adminCustomerSessions, setAdminCustomerSessions] = useState({}); // For managing customer chats
    
    // State for real-time UI updates
    const [typingPeers, setTypingPeers] = useState({});

    // This useEffect hook handles the entire lifecycle of the WebSocket connection.
    useEffect(() => {
        // Prevent multiple connections
        if (socketRef.current) return;

        // Determine the server URL for Socket.IO
        const socketIOUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '');
        
        // Initialize the Socket.IO client
        const socket = io(socketIOUrl, {
            withCredentials: true, // Important for sending session cookies
        });
        socketRef.current = socket;

        // --- Define Event Handlers ---

        const handleConnect = () => {
            console.log('[Socket.IO Provider] Connection established successfully.');
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            console.log('[Socket.IO Provider] Connection lost.');
            setIsConnected(false);
        };

        const handleConnectError = (error) => {
            console.error('[Socket.IO Provider] Connection Error:', error);
        };

        // Handler for when an admin connects and receives initial data
        const handleAdminInitialized = (data) => {
            if (!data) return;
            console.log('[Socket.IO Provider] Admin initialized with data.');
            setAdminMessages(data.adminChatHistory || []);
            const sessionsObject = (data.customerChatSessions || []).reduce((acc, session) => {
                if (session && session.sessionId) {
                   acc[session.sessionId] = { sessionDetails: session, messages: [] };
                }
                return acc;
            }, {});
            setAdminCustomerSessions(sessionsObject);
        };

        // Handler for when a guest connects and gets their session info
        const handleCustomerSessionInitialized = (data) => {
            if (!data || !data.sessionId) return;
            console.log(`[Socket.IO Provider] Customer session ${data.sessionId} initialized.`);
            setCustomerChat({ sessionId: data.sessionId, messages: data.history || [] });
        };

        // Handler for admins when a new guest starts a chat
        const handleNewCustomerSession = (payload) => {
            if (!payload || !payload.data) return;
            console.log(`[Socket.IO Provider] New customer session received: ${payload.data.id}`);
            setAdminCustomerSessions(prev => ({ ...prev, [payload.data.id]: { sessionDetails: payload.data, messages: [] } }));
        };

        // Handler for new messages from a guest (for both guest and admin)
        const handleNewCustomerMessage = (payload) => {
            const message = payload.savedMessage;
            if (!message || !message.session_id) return;
            
            const sessionId = message.session_id;
            
            // Update the guest's own chat window
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                    // Replace optimistic message and add the real one
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    if (!newMessages.some(m => m.id === message.id)) {
                        newMessages.push(message);
                    }
                    return { ...prev, messages: newMessages };
                }
                return prev;
            });

            // Update the admin's view of this specific customer session
            setAdminCustomerSessions(prev => {
                if (!prev[sessionId] || prev[sessionId].messages.some(m => m.id === message.id)) return prev;
                const updatedSession = { 
                    ...prev[sessionId], 
                    messages: [...prev[sessionId].messages, message], 
                    sessionDetails: { ...prev[sessionId].sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }
                };
                return { ...prev, [sessionId]: updatedSession };
            });
        };

        // Handler for new messages from an admin (for both guest and admin)
            const handleNewAdminMessage = (payload) => {
            // --- ADD THIS DEBUG LOG ---
                console.log("[DEBUG] Guest client received 'new_admin_message' event with payload:", payload);

            const message = payload.savedMessage;
            if (!message || !message.id) return;

            const sessionId = message.session_id;
            
            // Update the guest's chat window
            setCustomerChat(prev => {
                if (String(prev.sessionId) === String(sessionId)) {
                    const newMessages = prev.messages.filter(m => !String(m.id).startsWith('local-'));
                    if (!newMessages.some(m => m.id === message.id)) {
                        newMessages.push(message);
                    }
                    return { ...prev, messages: newMessages };
                }
                return prev;
            });
            
            // Update the admin's view of the customer session
            setAdminCustomerSessions(prev => {
                // ... this logic remains the same
            });
        };
            
            // Update the admin's view of the customer session
            setAdminCustomerSessions(prev => {
                if (!sessionId || !prev[sessionId]) return prev;

                // Replace optimistic message from admin
                const newMessages = prev[sessionId].messages.filter(m => !String(m.id).startsWith('local-'));
                if (!newMessages.some(m => m.id === message.id)) {
                    newMessages.push(message);
                }

                const updatedSession = { 
                    ...prev[sessionId], 
                    messages: newMessages, 
                    sessionDetails: { ...prev[sessionId].sessionDetails, last_message_text: message.message_text, updated_at: message.created_at }
                };
                return { ...prev, [sessionId]: updatedSession };
            });
        };

        // --- DEBUG TARGET ---
        // These handlers are key to solving the typing indicator issue.
        const handlePeerIsTyping = ({ sessionId, userName }) => {
            console.log(`[DEBUG] Received 'peer_is_typing' event for session: ${sessionId}`);
            setTypingPeers(prev => ({ ...prev, [sessionId]: userName || true }));
        };

        const handlePeerStoppedTyping = ({ sessionId }) => {
            console.log(`[DEBUG] Received 'peer_stopped_typing' event for session: ${sessionId}`);
            setTypingPeers(prev => {
                const newPeers = { ...prev };
                delete newPeers[sessionId];
                return newPeers;
            });
        };
        
        // Handler for when messages are marked as read
        const handleMessagesWereRead = ({ sessionId, messageIds, readAt }) => {
            const updateMessages = (msgs) => msgs.map(m => messageIds.includes(m.id) ? { ...m, read_at: readAt } : m);
            setCustomerChat(prev => String(prev.sessionId) === String(sessionId) ? { ...prev, messages: updateMessages(prev.messages) } : prev);
            setAdminCustomerSessions(prev => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: updateMessages(prev[sessionId].messages) } } : prev);
        };

        // --- Attach Listeners to Socket ---
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('admin_initialized', handleAdminInitialized);
        socket.on('customer_session_initialized', handleCustomerSessionInitialized);
        socket.on('new_customer_session', handleNewCustomerSession);
        socket.on('new_customer_message', handleNewCustomerMessage);
        socket.on('new_admin_message', handleNewAdminMessage);
        socket.on('peer_is_typing', handlePeerIsTyping);
        socket.on('peer_stopped_typing', handlePeerStoppedTyping);
        socket.on('messages_were_read', handleMessagesWereRead);

        // Cleanup function to run when the component unmounts
        return () => {
            if (socketRef.current) {
                console.log('[Socket.IO Provider] Cleaning up listeners and disconnecting.');
                socketRef.current.off('connect', handleConnect);
                socketRef.current.off('disconnect', handleDisconnect);
                socketRef.current.off('connect_error', handleConnectError);
                socketRef.current.off('admin_initialized', handleAdminInitialized);
                socketRef.current.off('customer_session_initialized', handleCustomerSessionInitialized);
                socketRef.current.off('new_customer_session', handleNewCustomerSession);
                socketRef.current.off('new_customer_message', handleNewCustomerMessage);
                socketRef.current.off('new_admin_message', handleNewAdminMessage);
                socketRef.current.off('peer_is_typing', handlePeerIsTyping);
                socketRef.current.off('peer_stopped_typing', handlePeerStoppedTyping);
                socketRef.current.off('messages_were_read', handleMessagesWereRead);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // --- Define Emitter Functions ---
    // These functions are exposed via context to the rest of the app for sending events.

    const sendCustomerMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
            // Optimistic UI update
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: 'guest',
                created_at: new Date().toISOString(),
                session_id: customerChat.sessionId
            };
            setCustomerChat(prev => ({ ...prev, messages: [...prev.messages, optimisticMessage]}));
            socketRef.current.emit('customer_chat_message', { text: messageText });
        }
    }, [customerChat.sessionId]);

    const sendAdminReply = useCallback((messageText, targetSessionId) => {
        if (socketRef.current?.connected && targetSessionId && user) {
            // Optimistic UI update
            const optimisticMessage = {
                id: `local-${Date.now()}`,
                message_text: messageText,
                sender_type: 'admin',
                created_at: new Date().toISOString(),
                session_id: targetSessionId,
                admin_user_id: user.id,
            };
            setAdminCustomerSessions(prev => {
                if (!prev[targetSessionId]) return prev;
                return { ...prev, [targetSessionId]: { ...prev[targetSessionId], messages: [...prev[targetSessionId].messages, optimisticMessage] }};
            });
            socketRef.current.emit('admin_to_customer_message', { text: messageText, sessionId: targetSessionId });
        }
    }, [user]);

    const loadSessionHistory = useCallback(async (sessionId) => {
        if (adminCustomerSessions[sessionId]?.messages?.length > 0) return;
        try {
            const response = await API.get(`/admin/chat/sessions/${sessionId}/messages`);
            if (response.data.success) {
                setAdminCustomerSessions(prev => (prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], messages: response.data.messages || [] } } : prev));
            }
        } catch (error) {
            console.error(`[Socket.IO Provider] Failed to fetch history for session ${sessionId}:`, error);
        }
    }, [adminCustomerSessions]);

    const sendAdminMessage = useCallback((messageText) => {
        if (socketRef.current?.connected) {
             socketRef.current.emit('admin_chat_message', { text: messageText });
        }
    }, []);
    
    const emitStartTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('start_typing', { sessionId });
        }
    }, []);

    const emitStopTyping = useCallback((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('stop_typing', { sessionId });
        }
    }, []);

    const emitMessagesRead = useCallback((sessionId, messageIds) => {
        if (socketRef.current?.connected && sessionId && messageIds.length > 0) {
            socketRef.current.emit('messages_read', { sessionId, messageIds });
        }
    }, []);
    
    // --- Value provided to consuming components ---
    const value = {
        isConnected,
        user,
        customerChat,
        adminCustomerSessions,
        setAdminCustomerSessions,
        adminMessages,
        typingPeers,
        sendCustomerMessage,
        sendAdminMessage,
        sendAdminReply,
        loadSessionHistory,
        emitStartTyping,
        emitStopTyping,
        emitMessagesRead,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

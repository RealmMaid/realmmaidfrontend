import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useWebSocketActions } from '../contexts/WebSocketProvider.jsx';
import { useChatStore } from '../hooks/useChatStore.js'; // Import the Zustand store

// The component's props are much simpler now. It only needs to know which session to display.
export const ChatModal = ({ show, onClose, session }) => {
    const [messageText, setMessageText] = useState('');
    const { user: currentUser } = useAuth();

    // Get ACTIONS from the context provider.
    const { sendAdminReply, emitStartTyping, emitStopTyping } = useWebSocketActions();

    // Get STATE from the Zustand store.
    // This selector ensures the component only re-renders when the specific data it needs changes.
    const { messages, isConnected } = useChatStore(state => ({
        // We only pull messages if the active chat in the store matches the session for this modal.
        messages: state.activeAdminChat.sessionId === session.sessionId ? state.activeAdminChat.messages : [],
        isConnected: state.isConnected
    }));
    
    // Get the action to set the active chat directly from the store.
    const setActiveAdminChat = useChatStore(state => state.setActiveAdminChat);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messageRef = useReadReceipts(messages, session?.sessionId);
    
    /**
     * This effect is crucial. When the modal is shown, it tells the global Zustand store
     * which chat session the admin is currently viewing. This populates `activeAdminChat`
     * in the store, allowing this component to receive the correct messages.
     */
    useEffect(() => {
        if (show && session) {
            // We fetch the latest messages for the session from the React Query cache
            // to ensure the chat is up-to-date when opened.
            const queryClient = new (require('@tanstack/react-query').QueryClient)();
            const cachedMessages = queryClient.getQueryData(['messages', session.sessionId]) || [];
            
            setActiveAdminChat({
                sessionId: session.sessionId,
                messages: cachedMessages.length > 0 ? cachedMessages : (session.messages || []),
            });
        }
    }, [show, session, setActiveAdminChat]);

    useEffect(() => {
        if (show) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, show]);

    useEffect(() => {
        return () => clearTimeout(typingTimeoutRef.current);
    }, []);

    if (!show || !session) return null;

    const handleTyping = (e) => {
        setMessageText(e.target.value);
        if (session.sessionId) {
            if (!typingTimeoutRef.current) emitStartTyping(session.sessionId);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
               emitStopTyping(session.sessionId);
               typingTimeoutRef.current = null;
            }, 1500);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (messageText.trim() && session.sessionId) {
            emitStopTyping(session.sessionId);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            
            sendAdminReply({ text: messageText.trim(), sessionId: session.sessionId });
            setMessageText('');
        }
    };

    const getMessageStatus = (msg) => {
        if (String(msg.id).startsWith('local-')) return 'sending';
        if (msg.read_at) return 'read';
        return 'sent';
    }

    return (
        <div className="modal-backdrop active">
            <div className="modal-content chat-modal">
                <div className="modal-header">
                    <h4>Chat with {session.participantName || `Session ${session.sessionId}`}</h4>
                    <button type="button" className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body chat-messages-container">
                    {Array.isArray(messages) && messages.map((msg) => {
                        if (!msg || typeof msg !== 'object' || !msg.id) return null;

                        const isAdminMessage = msg.sender_type === 'admin';
                        const isMyMessage = currentUser && isAdminMessage && (String(msg.admin_user_id) === String(currentUser.id));
                        
                        let senderName = isMyMessage ? 'You' : (isAdminMessage ? 'Admin' : (session.participantName || 'Guest'));
                        const messageStatus = isMyMessage ? getMessageStatus(msg) : null;

                        return (
                            <div 
                                ref={messageRef} 
                                data-message-id={msg.id} 
                                key={msg.id} 
                                className={`chat-message-item-wrapper ${isMyMessage ? 'admin-message' : 'user-message'}`}
                                style={{ opacity: messageStatus === 'sending' ? 0.7 : 1 }}
                            >
                                <span className="msg-sender-name">{senderName}</span>
                                <div className="chat-message-item">
                                    <p className="msg-text">{msg.message_text}</p>
                                    <span className="msg-timestamp">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMyMessage && <span className={`read-receipt ${messageStatus}`}>✓✓</span>}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="modal-footer">
                    <form onSubmit={handleSend}>
                        <input
                            type="text"
                            value={messageText}
                            onChange={handleTyping}
                            placeholder={isConnected ? "Type your message..." : "Disconnected"}
                            autoFocus
                            disabled={!isConnected}
                        />
                        <button type="submit" className="btn btn-primary-action" disabled={!isConnected || !messageText.trim()}>Send</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
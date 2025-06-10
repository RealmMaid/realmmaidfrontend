import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReadReceipts } from '../hooks/useReadReceipts';

// We pass all necessary data and functions as props from the parent.
export const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected, emitStartTyping, emitStopTyping }) => {
    const [messageText, setMessageText] = useState('');
    const { user: currentUser } = useAuth();
    
    // Refs for auto-scrolling and typing indicator logic
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Custom hook to handle marking messages as read
    const messageRef = useReadReceipts(messages, session?.sessionId);

    // Effect to scroll to the bottom when new messages arrive
    useEffect(() => {
        if (show) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, show]);

    // Cleanup effect for the typing timeout
    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    // Don't render anything if the modal isn't supposed to be shown
    if (!show || !session) return null;

    // Handler for the typing input field
    const handleTyping = (e) => {
        const newText = e.target.value;
        setMessageText(newText);
        if (!typingTimeoutRef.current) {
            emitStartTyping(session.sessionId);
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(session.sessionId);
            typingTimeoutRef.current = null;
        }, 1500);
    };

    // Handler for sending a message
    const handleSend = (e) => {
        e.preventDefault();
        if (messageText.trim() && session.sessionId) {
            clearTimeout(typingTimeoutRef.current);
            emitStopTyping(session.sessionId);
            typingTimeoutRef.current = null;
            // The actual send logic is handled by the parent component
            onSendMessage(messageText, session.sessionId);
            setMessageText('');
        }
    };

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
                        // Determine if the message is from the currently logged-in admin
                        const isMyMessage = currentUser && isAdminMessage && (msg.admin_user_id === currentUser.id || msg.adminUserId === currentUser.id);
                        
                        let senderName = isMyMessage ? 'You' : (isAdminMessage ? 'Admin' : (session.participantName || 'Guest'));

                        return (
                            <div ref={messageRef} data-message-id={msg.id} key={msg.id} className={`chat-message-item-wrapper ${isMyMessage ? 'admin-message' : 'user-message'}`}>
                                <span className="msg-sender-name">{senderName}</span>
                                <div className="chat-message-item">
                                    <p className="msg-text">{msg.message_text}</p>
                                    <span className="msg-timestamp">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMyMessage && <span className={`read-receipt ${msg.read_at ? 'read' : ''}`}>✓✓</span>}
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
                        <button type="submit" className="btn btn-primary-action" disabled={!isConnected}>Send</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';

export const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected, emitStartTyping, emitStopTyping }) => {
    const [messageText, setMessageText] = useState('');
    const { user: currentUser } = useAuth();
    // Getting the mutation function from our context
    const { sendAdminReply } = useWebSocket();

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const messageRef = useReadReceipts(messages, session?.sessionId);

    useEffect(() => {
        if (show) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, show]);

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    if (!show || !session) return null;

    const handleTyping = (e) => {
        const newText = e.target.value;
        setMessageText(newText);
        if (!typingTimeoutRef.current && session.sessionId) {
            emitStartTyping(session.sessionId);
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if(session.sessionId) {
               emitStopTyping(session.sessionId);
            }
            typingTimeoutRef.current = null;
        }, 1500);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (messageText.trim() && session.sessionId) {
            clearTimeout(typingTimeoutRef.current);
            if(session.sessionId) {
              emitStopTyping(session.sessionId);
            }
            typingTimeoutRef.current = null;
            
            // Calling the mutation to send the message
            sendAdminReply({ text: messageText.trim(), sessionId: session.sessionId });
            
            setMessageText('');
        }
    };

    // A small helper to add a visual cue for optimistic messages
    const getMessageStatus = (msg) => {
        if (String(msg.id).startsWith('local-')) {
            return 'sending';
        }
        if (msg.read_at) {
            return 'read';
        }
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
                        const isMyMessage = currentUser && isAdminMessage && (msg.admin_user_id === currentUser.id || msg.adminUserId === currentUser.id);
                        
                        let senderName = isMyMessage ? 'You' : (isAdminMessage ? 'Admin' : (session.participantName || 'Guest'));
                        const messageStatus = isMyMessage ? getMessageStatus(msg) : null;

                        return (
                            <div ref={messageRef} data-message-id={msg.id} key={msg.id} className={`chat-message-item-wrapper ${isMyMessage ? 'admin-message' : 'user-message'}`}>
                                <span className="msg-sender-name">{senderName}</span>
                                <div className="chat-message-item" style={{ opacity: messageStatus === 'sending' ? 0.7 : 1 }}>
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

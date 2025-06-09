import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider';
import { useAuth } from '../hooks/useAuth';

const AdminChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { user } = useAuth();
    
    // --- UPDATED: Using new state and functions from the WebSocket context ---
    const { adminMessages, sendAdminMessage, isConnected } = useWebSocket();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [adminMessages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() && isConnected) {
            sendAdminMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    
    // The component is only rendered for admins, so no need for extra checks here.
    return (
        <div className="admin-chat-widget-container">
            {isOpen && (
                 <div className="floating-chat-panel">
                    <div className="chat-panel-header">
                        <h3>Admin Chat</h3>
                        <button onClick={() => setIsOpen(false)} aria-label="Close Admin Chat">×</button>
                    </div>
                    <div className="chat-messages-area">
                        {adminMessages.length > 0 ? adminMessages.map((msg) => (
                             <div key={msg.id} className={`chat-message ${msg.user_id === user.id ? 'current-admin' : 'other-admin'}`}>
                                <strong>{msg.senderName || 'Admin'}:</strong> {msg.message_text}
                                <span className="msg-timestamp">{new Date(msg.created_at).toLocaleTimeString()}</span>
                            </div>
                        )) : (
                            <p className="text-center">No admin messages yet.</p>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-area">
                        <form onSubmit={handleSend}>
                            <input
                                type="text"
                                className="selectable"
                                placeholder={isConnected ? "Message other admins..." : "Connecting..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={!isConnected}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!isConnected}>Send</button>
                        </form>
                    </div>
                 </div>
            )}
            <button className="chat-toggle-button" onClick={() => setIsOpen(prev => !prev)} aria-label="Toggle Admin Chat">
                {isOpen ? '✕' : '�'}
            </button>
        </div>
    );
};

export default AdminChat;
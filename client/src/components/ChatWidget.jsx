import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx'; // Import useAuth to know who is who

const ChatWidgetStyles = () => (
    <style>{`
        /* ... Your existing styles ... */
        .chat-message-item-wrapper { display: flex; flex-direction: column; max-width: 80%; }
        .msg-sender-name { font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); margin-bottom: 2px; }
        .chat-message-item-wrapper.user-message { align-self: flex-end; align-items: flex-end; }
        .chat-message-item-wrapper.admin-message { align-self: flex-start; align-items: flex-start; }
    `}</style>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { customerChat, isConnected, sendCustomerMessage } = useWebSocket();
    const { user: currentUser } = useAuth(); // Get the current user
    const { sessionId, messages } = customerChat;
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);
    
    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() && isConnected && sessionId) {
            sendCustomerMessage(newMessage.trim(), sessionId);
            setNewMessage('');
        }
    };

    const isChatReady = isConnected && sessionId;

    return (
        <>
            <ChatWidgetStyles />
            <button className="chat-fab" onClick={() => setIsOpen(p => !p)} aria-label="Toggle Chat">
                 {isOpen ? '✕' : '💬'}
            </button>
            <div className={`chat-panel ${isOpen ? 'visible' : ''}`}>
                <div className="chat-panel-header">
                    <h3>Support Chat</h3>
                    <button onClick={() => setIsOpen(false)} aria-label="Close Chat">×</button>
                </div>
                <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? (sessionId ? 'Connected' : 'Initializing Session...') : 'Connecting...'}
                </div>
                <div className="chat-messages-area">
                    {messages.map((msg, index) => {
                        // --- NEW: Logic to determine who sent the message ---
                        const isMyMessage = msg.sender_type === 'guest' || (currentUser && msg.user_id === currentUser.id);
                        const senderName = msg.sender_type === 'admin' ? 'Admin' : 'You';

                        return (
                            <div key={msg.id || `msg-${index}-${new Date().getTime()}`} className={`chat-message-item-wrapper ${isMyMessage ? 'user-message' : 'admin-message'}`}>
                                <span className="msg-sender-name">{senderName}</span>
                                <div className={`chat-message ${isMyMessage ? 'user' : 'admin'}`}>
                                   {msg.message_text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                    <form onSubmit={handleSend}>
                        <input
                            type="text"
                            className="selectable"
                            placeholder={isChatReady ? "Type a message..." : "Please wait..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!isChatReady}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" disabled={!isChatReady}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const ChatWidgetStyles = () => (
    <style>{`
        /* Styles for the main widget and chat panel */
        .chat-fab { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-primary); color: var(--text-dark); display: flex; align-items: center; justify-content: center; font-size: 2rem; border: none; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 1060; transition: transform 0.2s ease-out; }
        .chat-fab:hover { transform: scale(1.1); }
        .chat-panel { position: fixed; bottom: 90px; right: 20px; width: 370px; max-width: 90vw; height: 500px; max-height: calc(100vh - 120px); z-index: 1050; border-radius: var(--radius-lg); background-color: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; transform: translateY(20px) scale(0.95); opacity: 0; transition: transform 0.2s ease-out, opacity 0.2s ease-out; visibility: hidden; }
        .chat-panel.visible { transform: translateY(0) scale(1); opacity: 1; visibility: visible; }
        .chat-panel-header { padding: 1rem; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; }
        .chat-panel-header h3 { font-family: var(--font-pixel); color: var(--accent-lavender); margin: 0; }
        .chat-panel-header button { background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; }
        .chat-messages-area { flex-grow: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .chat-input-area { border-top: 1px solid var(--card-border); padding: 1rem; }
        .chat-input-area form { display: flex; gap: 0.5rem; }
        .chat-input-area input { flex-grow: 1; }
        .chat-status { text-align: center; padding: 0.5rem; font-size: 0.8rem; }
        .chat-status.connected { color: var(--accent-green); }
        .chat-status.disconnected { color: var(--accent-red); }

        /* Styles for individual messages */
        .chat-message-item-wrapper { display: flex; flex-direction: column; max-width: 80%; }
        .msg-sender-name { font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); margin-bottom: 2px; }
        .chat-message-item-wrapper.user-message { align-self: flex-end; align-items: flex-end; }
        .chat-message-item-wrapper.admin-message { align-self: flex-start; align-items: flex-start; }
        .chat-message { max-width: 100%; word-wrap: break-word; padding: 0.5rem 0.75rem; border-radius: 15px; line-height: 1.4; }
        .chat-message.user { background-color: var(--accent-pink); color: var(--text-dark); border-bottom-right-radius: 3px; }
        .chat-message.admin { background-color: var(--accent-lavender); color: var(--text-dark); border-bottom-left-radius: 3px; }
    `}</style>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    // The widget now also gets admin chat messages to display them correctly
    const { customerChat, adminMessages, isConnected, sendCustomerMessage, sendAdminMessage } = useWebSocket();
    const { user: currentUser } = useAuth();
    
    // --- NEW: Logic to determine which messages and session to use ---
    const isAdmin = currentUser?.isAdmin;
    // If the user is an admin, the widget shows the admin-to-admin chat.
    // Otherwise, it shows the customer-to-admin support chat.
    const messages = isAdmin ? adminMessages : customerChat.messages;
    const currentSessionId = customerChat.sessionId;
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);
    
    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() && isConnected) {
            if (isAdmin) {
                sendAdminMessage(newMessage.trim());
            } else if (currentSessionId) {
                sendCustomerMessage(newMessage.trim(), currentSessionId);
            }
            setNewMessage('');
        }
    };

    // The chat is ready if the connection is live AND (a customer session exists OR the user is an admin).
    const isChatReady = isConnected && (currentSessionId || isAdmin);

    // The entire widget should only appear if a customer session has started, OR if the user is an admin.
    if (!currentSessionId && !isAdmin) {
        return null;
    }

    return (
        <>
            <ChatWidgetStyles />
            <button className="chat-fab" onClick={() => setIsOpen(p => !p)} aria-label="Toggle Chat">
                 {isOpen ? '✕' : '💬'}
            </button>
            <div className={`chat-panel ${isOpen ? 'visible' : ''}`}>
                <div className="chat-panel-header">
                    <h3>{isAdmin ? 'Admin Chat' : 'Support Chat'}</h3>
                    <button onClick={() => setIsOpen(false)} aria-label="Close Chat">×</button>
                </div>
                <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? (isChatReady ? 'Connected' : 'Initializing Session...') : 'Connecting...'}
                </div>
                <div className="chat-messages-area">
                    {messages.map((msg, index) => {
                        // This logic determines if the message is from the person currently looking at the screen.
                        const isAdminMessage = msg.sender_type === 'admin';
                        let isMyMessage = false;
                        if (currentUser) { // If a user is logged in...
                            isMyMessage = isAdminMessage ? msg.admin_user_id === currentUser.id : msg.user_id === currentUser.id;
                        } else { // If it's a guest...
                            isMyMessage = msg.sender_type === 'guest';
                        }
                        
                        // Determine what name to display above the message bubble.
                        let senderName = 'Guest';
                        if (isAdminMessage) {
                          senderName = isMyMessage ? 'You' : (msg.sender_name || 'Admin');
                        } else {
                          senderName = isMyMessage ? 'You' : (currentUser?.firstName || 'User');
                        }

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

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const ChatWidgetStyles = () => (
    <style>{`
        /* ... Your existing styles ... */
        .chat-message-item-wrapper { display: flex; flex-direction: column; max-width: 80%; }
        .msg-sender-name { font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); margin-bottom: 2px; }
        .chat-message-item-wrapper.user-message { align-self: flex-end; align-items: flex-end; }
        .chat-message-item-wrapper.admin-message { align-self: flex-start; align-items: flex-start; }
        .chat-message { max-width: 100%; word-wrap: break-word; }
    `}</style>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { customerChat, isConnected, sendCustomerMessage, sendAdminMessage, adminMessages } = useWebSocket();
    const { user: currentUser } = useAuth();
    
    // --- NEW: Decide which chat history to display ---
    // If the current user is an admin, show the admin-to-admin chat. Otherwise, show the customer chat.
    const isViewingAdminChat = currentUser?.isAdmin && isOpen;
    const messages = isViewingAdminChat ? adminMessages : customerChat.messages;
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
            if (isViewingAdminChat) {
                sendAdminMessage(newMessage.trim());
            } else if (currentSessionId) {
                sendCustomerMessage(newMessage.trim(), currentSessionId);
            }
            setNewMessage('');
        }
    };

    // --- FIX: The chat widget should be "ready" as long as it has a session ID OR the user is an admin ---
    const isChatReady = isConnected && (currentSessionId || currentUser?.isAdmin);

    // --- FIX: The entire widget should render if a session exists (for guests) OR if the user is an admin ---
    if (!currentSessionId && !currentUser?.isAdmin) {
        return null; // Don't render anything if there's no session and the user isn't an admin.
    }

    return (
        <>
            <ChatWidgetStyles />
            <button className="chat-fab" onClick={() => setIsOpen(p => !p)} aria-label="Toggle Chat">
                 {isOpen ? '✕' : '💬'}
            </button>
            <div className={`chat-panel ${isOpen ? 'visible' : ''}`}>
                <div className="chat-panel-header">
                    <h3>{isViewingAdminChat ? 'Admin Chat' : 'Support Chat'}</h3>
                    <button onClick={() => setIsOpen(false)} aria-label="Close Chat">×</button>
                </div>
                <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? (isChatReady ? 'Connected' : 'Initializing Session...') : 'Connecting...'}
                </div>
                <div className="chat-messages-area">
                    {messages.map((msg, index) => {
                        // --- FIX: This logic is now much more robust ---
                        const isAdminMessage = msg.sender_type === 'admin';
                        let isMyMessage = false;
                        if (currentUser) { // If user is logged in
                            isMyMessage = isAdminMessage ? msg.admin_user_id === currentUser.id : msg.user_id === currentUser.id;
                        } else { // If user is a guest
                            isMyMessage = msg.sender_type === 'guest';
                        }
                        
                        let senderName = 'Guest';
                        if (isAdminMessage) {
                            senderName = isMyMessage ? 'You' : msg.sender_name || 'Admin';
                        } else {
                            senderName = isMyMessage ? 'You' : (currentUser?.firstName || 'User');
                        }

                        return (
                            <div key={msg.id || `msg-${index}`} className={`chat-message-item-wrapper ${isMyMessage ? 'user-message' : 'admin-message'}`}>
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

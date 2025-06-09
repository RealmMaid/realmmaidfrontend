import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';

const ChatWidgetStyles = () => (
    <style>{`
        /* Styles remain the same */
        .chat-fab { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-primary); color: var(--text-dark); display: flex; align-items: center; justify-content: center; font-size: 2rem; border: none; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 1060; transition: transform 0.2s ease-out; }
        .chat-fab:hover { transform: scale(1.1); }
        .chat-panel { position: fixed; bottom: 90px; right: 20px; width: 370px; max-width: 90vw; height: 500px; max-height: calc(100vh - 120px); z-index: 1050; border-radius: var(--radius-lg); background-color: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; transform: translateY(20px) scale(0.95); opacity: 0; transition: transform 0.2s ease-out, opacity 0.2s ease-out; visibility: hidden; }
        .chat-panel.visible { transform: translateY(0) scale(1); opacity: 1; visibility: visible; }
        .chat-panel-header { padding: 1rem; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; }
        .chat-panel-header h3 { font-family: var(--font-pixel); color: var(--accent-lavender); margin: 0; }
        .chat-panel-header button { background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; }
        .chat-messages-area { flex-grow: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .chat-message { max-width: 80%; padding: 0.5rem 0.75rem; border-radius: 15px; line-height: 1.4; }
        .chat-message.user { background-color: var(--accent-pink); color: var(--text-dark); border-bottom-right-radius: 3px; align-self: flex-end; }
        .chat-message.admin { background-color: var(--accent-lavender); color: var(--text-dark); border-bottom-left-radius: 3px; align-self: flex-start; }
        .chat-input-area { border-top: 1px solid var(--card-border); padding: 1rem; }
        .chat-input-area form { display: flex; gap: 0.5rem; }
        .chat-input-area input { flex-grow: 1; }
        .chat-status { text-align: center; padding: 0.5rem; font-size: 0.8rem; }
        .chat-status.connected { color: var(--accent-green); }
        .chat-status.disconnected { color: var(--accent-red); }
    `}</style>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { customerChat, isConnected, sendCustomerMessage } = useWebSocket();
    const { sessionId, messages } = customerChat;
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        console.log('[ChatWidget] DEBUG: State updated.', { isConnected, sessionId, messageCount: messages.length });
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isConnected, sessionId]);
    
    const handleSend = (e) => {
        e.preventDefault();
        console.log('[ChatWidget] DEBUG: handleSend triggered.');
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
                    {messages.map((msg) => (
                        <div key={msg.id || msg.created_at} className={`chat-message ${msg.sender_type === 'user' || msg.sender_type === 'guest' ? 'user' : 'admin'}`}>
                           {msg.message_text}
                        </div>
                    ))}
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

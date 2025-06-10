import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';

// Modal component remains the same
const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!show || !session) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim() && session.sessionId) {
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
          {messages.map((msg, index) => (
            <div key={msg.id || `msg-${index}`} className={`chat-message-item ${msg.sender_type === 'admin' ? 'admin-message' : 'user-message'}`}>
              <p className="msg-text">{msg.message_text}</p>
              <span className="msg-timestamp">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="modal-footer">
            <form onSubmit={handleSend}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
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


function ChatManagement() {
  const { adminCustomerSessions, setAdminCustomerSessions, sendCustomerMessage, isConnected, loadSessionHistory } = useWebSocket();
  const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

  const sessionsArray = Object.values(adminCustomerSessions)
    .map(s => s.sessionDetails)
    .filter(Boolean)
    .filter(session => session.status !== 'archived' && session.status !== 'resolved')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  // --- ADDED DEBUG LOGS HERE ---
  const handleViewChat = async (session) => {
    console.log('[ChatManagement] handleViewChat clicked for session:', session);
    if (session && session.sessionId) {
      console.log(`[ChatManagement] Session ID is valid (${session.sessionId}). Calling loadSessionHistory...`);
      await loadSessionHistory(session.sessionId);
      console.log(`[ChatManagement] loadSessionHistory finished. Opening modal for session ${session.sessionId}.`);
      setActiveModal({ show: true, sessionId: session.sessionId });
    } else {
      console.error('[ChatManagement] handleViewChat called with invalid session:', session);
    }
  };
  
  const handleAdminSendMessage = (messageText, sessionId) => { /* ... */ };
  const closeModal = () => { /* ... */ };
  const handleSessionStatusChange = async (sessionId, action) => { /* ... */ };
  
  const modalSessionData = activeModal.sessionId ? adminCustomerSessions[activeModal.sessionId] : null;

  return (
    <>
      <ChatModal /* ... */ />

      <div className="content-section">
        <div className="content-header">
          <h2>Chat Management</h2>
          <p>View and manage all active customer chat sessions in real-time.</p>
        </div>

        <div className="card-list-container">
            {sessionsArray.length > 0 ? sessionsArray.map((session) => {
                if (!session || !session.sessionId) return null;
                let participantDisplay;
                if (session.user_id) { /* ... */ } 
                else { /* ... */ }
                
                return (
                    <div key={session.sessionId} className="card chat-session-item">
                        <div className="session-details">
                            <strong className="participant-name">{participantDisplay}</strong>
                            {/* ... */}
                        </div>
                        <div className="chat-actions">
                            <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
                            {/* ... */}
                        </div>
                    </div>
                );
            }) : (
                <div className="card text-center"><p>No active chat sessions.</p></div>
            )}
        </div>
      </div>
    </>
  );
}

export default ChatManagement;

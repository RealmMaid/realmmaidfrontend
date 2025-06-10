import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx'; // --- NEW: Import useAuth to know who the current user is
import API from '../api/axios';

// Modal for viewing and replying to a chat session
const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected, currentUser }) => {
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
          {messages.map((msg, index) => {
            // --- NEW: Determine the sender's name for display ---
            let senderName = '';
            const isAdminMessage = msg.sender_type === 'admin';

            if (isAdminMessage) {
              // If the current user is an admin, show "You". Otherwise, show "Admin".
              senderName = currentUser?.isAdmin ? 'You' : 'Admin';
            } else {
              // If the current user is an admin, show the participant's name. Otherwise, show "You".
              senderName = currentUser?.isAdmin ? (session.participantName || 'Guest') : 'You';
            }
            
            return (
              <div key={msg.id || `msg-${index}`} className={`chat-message-item-wrapper ${isAdminMessage ? 'admin-message' : 'user-message'}`}>
                {/* Display the sender's name above the message bubble */}
                <span className="msg-sender-name">{senderName}</span>
                <div className="chat-message-item">
                  <p className="msg-text">{msg.message_text}</p>
                  <span className="msg-timestamp">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
  const { user: currentUser } = useAuth(); // Get the current user to pass to the modal
  const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

  const sessionsArray = Object.values(adminCustomerSessions)
    .map(s => s.sessionDetails)
    .filter(Boolean)
    .filter(session => session.status !== 'archived' && session.status !== 'resolved')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  const handleViewChat = async (session) => {
    if (session && session.sessionId) {
      await loadSessionHistory(session.sessionId);
      setActiveModal({ show: true, sessionId: session.sessionId });
    }
  };
  
  const handleAdminSendMessage = (messageText, sessionId) => {
    if (!isConnected) {
        console.error("Cannot send message: WebSocket is disconnected.");
        return;
    }
    sendCustomerMessage(messageText, sessionId);
  };
  
  const closeModal = () => {
    setActiveModal({ show: false, sessionId: null });
  };

  const handleSessionStatusChange = async (sessionId, action) => {
    const endpoint = `/admin/chat/sessions/${sessionId}/${action}`;
    try {
        const response = await API.post(endpoint);
        if (response.data.success) {
            if(setAdminCustomerSessions) {
                setAdminCustomerSessions(prev => {
                    const newSessions = { ...prev };
                    if (newSessions[sessionId]) {
                        newSessions[sessionId].sessionDetails.status = action === 'archive' ? 'archived' : 'resolved';
                    }
                    return newSessions;
                });
            }
        }
    } catch (error) {
        console.error(`Failed to ${action} session ${sessionId}:`, error);
    }
  };
  
  const modalSessionData = activeModal.sessionId ? adminCustomerSessions[activeModal.sessionId] : null;

  return (
    <>
      <ChatModal
        show={activeModal.show && !!modalSessionData}
        onClose={closeModal}
        session={modalSessionData?.sessionDetails}
        messages={modalSessionData?.messages || []}
        onSendMessage={handleAdminSendMessage}
        isConnected={isConnected}
        currentUser={currentUser}
      />

      <div className="content-section">
        <div className="content-header">
          <h2>Chat Management</h2>
          <p>View and manage all active customer chat sessions in real-time.</p>
        </div>

        <div className="card-list-container">
            {sessionsArray.length > 0 ? sessionsArray.map((session) => {
                if (!session || !session.sessionId) return null;
                
                // --- FIX: This logic now correctly displays the name and IP ---
                let participantDisplay;
                if (session.user_id) {
                    // It's a logged-in user
                    participantDisplay = (
                        <>
                            {session.userFirstName || session.participantName}
                            {session.lastIpAddress && <span className="participant-ip">({session.lastIpAddress})</span>}
                        </>
                    );
                } else {
                    // It's a guest
                    participantDisplay = session.lastIpAddress || session.participantName || `Guest Session`;
                }
                
                return (
                    <div key={session.sessionId} className="card chat-session-item">
                        <div className="session-details">
                            <strong className="participant-name">{participantDisplay}</strong>
                            <span className="session-id">Session ID: {session.sessionId}</span>
                            <span className={`session-status status-${session.status}`}>{session.status}</span>
                            <p className="last-message">"{session.last_message_text || 'No messages yet...'}"</p>
                            <small className="last-update">Last Update: {new Date(session.updated_at).toLocaleString()}</small>
                        </div>
                        <div className="chat-actions">
                            <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
                            {session.status !== 'resolved' && (
                                <button onClick={() => handleSessionStatusChange(session.sessionId, 'resolve')} className="btn btn-sm btn-success-action">Resolve</button>
                            )}
                            <button onClick={() => handleSessionStatusChange(session.sessionId, 'archive')} className="btn btn-sm btn-danger-action">Archive</button>
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

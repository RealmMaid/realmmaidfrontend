import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';

// Modal component remains the same
const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected }) => { /* ... */ };

function ChatManagement() {
  // --- NEW: Get the setAdminCustomerSessions function from our context ---
  const { adminCustomerSessions, setAdminCustomerSessions, sendCustomerMessage, isConnected, loadSessionHistory } = useWebSocket();
  const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

  const sessionsArray = Object.values(adminCustomerSessions)
    .map(s => s.sessionDetails)
    .filter(Boolean)
    .filter(session => session.status !== 'archived' && session.status !== 'resolved')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  const handleViewChat = async (session) => { /* ... */ };
  const handleAdminSendMessage = (messageText, sessionId) => { /* ... */ };
  const closeModal = () => { /* ... */ };
  
  const handleSessionStatusChange = async (sessionId, action) => {
    const endpoint = `/admin/chat/sessions/${sessionId}/${action}`;
    try {
        const response = await API.post(endpoint);
        if (response.data.success) {
            // This now correctly uses the setter from the context, which will
            // trigger a re-render for any component using the session list!
            setAdminCustomerSessions(prev => {
                const newSessions = { ...prev };
                if (newSessions[sessionId]) {
                    newSessions[sessionId].sessionDetails.status = action === 'archive' ? 'archived' : 'resolved';
                }
                return newSessions;
            });
            console.log(`Session ${sessionId} successfully marked as ${action}.`);
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
      />
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

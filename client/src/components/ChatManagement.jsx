import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useReadReceipts } from '../hooks/useReadReceipts.js';
import API from '../api/axios';

// Modal for viewing and replying to a chat session
const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected, currentUser, emitStartTyping, emitStopTyping }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Use our new custom hook to handle read receipts
  const messageRef = useReadReceipts(messages, session?.sessionId);

  useEffect(() => {
    if (show) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, show]);

  // Cleanup the typing timeout when the modal is closed
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!show || !session) return null;

  const handleTyping = (e) => {
    const newText = e.target.value;
    setMessageText(newText);

    // If the typing timer isn't already running, start it and emit the event
    if (!typingTimeoutRef.current) {
      // CORRECTED: Use the specific function for the "start typing" event
      emitStartTyping(session.sessionId);
    }

    // Reset the timer
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // CORRECTED: When the timer runs out, emit the "stop typing" event
      emitStopTyping(session.sessionId);
      typingTimeoutRef.current = null;
    }, 1500);
  };
  
  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim() && session.sessionId) {
      // When a message is sent, clear the "typing" timeout and immediately emit "stop typing"
      clearTimeout(typingTimeoutRef.current);
      // CORRECTED: Ensure stop typing is emitted on send
      emitStopTyping(session.sessionId);
      typingTimeoutRef.current = null;
      
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
          {messages.map((msg) => {
            const isAdminMessage = msg.sender_type === 'admin';
            // An admin is looking at this modal, so "my" message is one I sent as an admin
            const isMyMessage = isAdminMessage && msg.admin_user_id === currentUser.id;
            
            let senderName = isMyMessage ? 'You' : (session.participantName || 'Guest');
            
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
        <div className="typing-indicator-container">
          {/* Typing indicator logic will be added in a later step */}
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


function ChatManagement() {
  const { adminCustomerSessions, setAdminCustomerSessions, sendCustomerMessage, isConnected, loadSessionHistory, typingPeers, emitStartTyping, emitStopTyping } = useWebSocket();
  const { user: currentUser } = useAuth();
  const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

  const sessionsArray = Object.values(adminCustomerSessions)
    .map(s => s.sessionDetails)
    .filter(Boolean)
    .filter(session => session.status !== 'archived')
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
        typingPeers={typingPeers}
        emitStartTyping={emitStartTyping}
        emitStopTyping={emitStopTyping}
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
                if (session.user_id) {
                    participantDisplay = (
                        <>
                            {session.userFirstName || session.participantName}
                            {session.lastIpAddress && <span className="participant-ip">({session.lastIpAddress})</span>}
                        </>
                    );
                } else {
                    participantDisplay = session.lastIpAddress || session.participantName || `Guest Session`;
                }
                
                const isPeerTyping = typingPeers[session.sessionId];

                return (
                    <div key={session.sessionId} className="card chat-session-item">
                        <div className="session-details">
                            <strong className="participant-name">{participantDisplay}</strong>
                            <span className="session-id">Session ID: {session.sessionId}</span>
                            <span className={`session-status status-${session.status}`}>{session.status}</span>
                            <p className="last-message">"{session.last_message_text || 'No messages yet...'}"</p>
                            {isPeerTyping && <div className="typing-indicator"><span>typing...</span></div>}
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

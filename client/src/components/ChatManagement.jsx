import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useReadReceipts } from '../hooks/useReadReceipts.js';
import API from '../api/axios';

const ChatModal = ({ show, onClose, session, messages, onSendMessage, isConnected, currentUser, emitStartTyping, emitStopTyping, isPeerTyping }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const messageRef = useReadReceipts(messages, session?.sessionId);

  useEffect(() => {
    if (show) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, show, isPeerTyping]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!show || !session) return null;

  const handleTyping = (e) => {
    const newText = e.target.value;
    setMessageText(newText);
    if (!typingTimeoutRef.current) {
      emitStartTyping(session.sessionId);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(session.sessionId);
      typingTimeoutRef.current = null;
    }, 1500);
  };
  
  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim() && session.sessionId) {
      clearTimeout(typingTimeoutRef.current);
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
          {Array.isArray(messages) && messages.map((msg, index) => {
            
            // --- NEW DEBUG LOG ---
            // This will show us the exact data for each message being rendered.
            console.log('[DEBUG] ChatModal is rendering message:', msg);
            // ---------------------

            if (!msg || typeof msg !== 'object' || !msg.id) {
                console.warn('[DEBUG] ChatModal skipped rendering a malformed message object:', msg);
                return null;
            }
            const isAdminMessage = msg.sender_type === 'admin';
            const isMyMessage = currentUser && isAdminMessage && (msg.admin_user_id === currentUser.id || msg.adminUserId === currentUser.id);
            let senderName = isMyMessage ? 'You' : (isAdminMessage ? 'Admin' : (session.participantName || 'Guest'));
            
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

          {isPeerTyping && (
            <div className="chat-message-item-wrapper user-message">
                <div className="chat-message-item">
                    <p className="msg-text" style={{color: '#888'}}><i>Typing...</i></p>
                </div>
            </div>
          )}

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
                <button type="submit" className="btn btn-primary-action" disabled={!isConnected}>Send</button>
            </form>
        </div>
      </div>
    </div>
  );
};


function ChatManagement() {
  const { 
    adminCustomerSessions,
    setAdminCustomerSessions,
    isConnected, 
    loadSessionHistory,
    typingPeers,
    emitStartTyping,
    emitStopTyping,
    sendAdminReply 
  } = useWebSocket();
  
  const { user: currentUser } = useAuth();
  const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

  // The previous useEffect has been removed as it served its purpose.

  const sessionsArray = Object.values(adminCustomerSessions)
    .filter(s => s && s.sessionDetails)
    .map(s => {
        const isPeerTyping = typingPeers[s.sessionDetails.sessionId];
        return { ...s.sessionDetails, isTyping: !!isPeerTyping }
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  const handleViewChat = async (session) => {
    if (session && session.sessionId) {
      await loadSessionHistory(session.sessionId);
      setActiveModal({ show: true, sessionId: session.sessionId });
    }
  };
  
  const handleAdminSendMessage = (messageText, sessionId) => {
    if (!isConnected) { console.error("WS disconnected."); return; }
    sendAdminReply(messageText, sessionId);
  };
  
  const closeModal = () => { setActiveModal({ show: false, sessionId: null }); };

  const handleSessionStatusChange = async (sessionId, action) => {
    try {
        const response = await API.post(`/admin/chat/sessions/${sessionId}/${action}`);
        if (response.data.success && setAdminCustomerSessions) {
            setAdminCustomerSessions(prev => {
                const newSessions = { ...prev };
                if (newSessions[sessionId]) {
                    newSessions[sessionId].sessionDetails.status = action === 'archive' ? 'archived' : 'resolved';
                }
                return newSessions;
            });
        }
    } catch (error) { console.error(`Failed to ${action} session ${sessionId}:`, error); }
  };
  
  const modalSessionData = activeModal.sessionId ? adminCustomerSessions[activeModal.sessionId] : null;
  
  const isModalPeerTyping = !!(activeModal.sessionId && typingPeers[activeModal.sessionId]);

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
        emitStartTyping={emitStartTyping}
        emitStopTyping={emitStopTyping}
        isPeerTyping={isModalPeerTyping}
      />
      <div className="content-section">
        <div className="content-header">
          <h2>Chat Management</h2>
          <p>View and manage all active customer chat sessions in real-time.</p>
        </div>
        <div className="card-list-container">
            {sessionsArray.length > 0 ? sessionsArray.map((session) => {
                if (!session || !session.sessionId) return null;
                let participantDisplay = session.lastIpAddress || session.participantName || `Guest Session`;
                if (session.user_id) {
                    participantDisplay = (<>{session.userFirstName || session.participantName}{session.lastIpAddress && <span className="participant-ip">({session.lastIpAddress})</span>}</>);
                }
                return (
                    <div key={session.sessionId} className="card chat-session-item">
                        <div className="session-details">
                            <strong className="participant-name">{participantDisplay}</strong>
                            <span className="session-id">Session ID: {session.sessionId}</span>
                            <span className={`session-status status-${session.status}`}>{session.status}</span>
                            <p className="last-message">"{session.last_message_text || 'No messages yet...'}"</p>
                            {session.isTyping && <div className="typing-indicator"><span>typing...</span></div>}
                            <small className="last-update">Last Update: {new Date(session.updated_at).toLocaleString()}</small>
                        </div>
                        <div className="chat-actions">
                            <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
                            {session.status !== 'resolved' && ( <button onClick={() => handleSessionStatusChange(session.sessionId, 'resolve')} className="btn btn-sm btn-success-action">Resolve</button> )}
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios'; // Use the configured axios instance
import { useWebSocket } from '../contexts/WebSocketProvider'; // Import the WebSocket hook

// Modal for viewing and replying to a chat session
const ChatModal = ({ show, onClose, session, onSendMessage, messages, loadingMessages, isConnected }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!show || !session) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText); // Pass only the text
      setMessageText('');
    }
  };

  return (
    <div className="modal-backdrop active">
      <div className="modal-content chat-modal" style={{height: '600px', width: '450px'}}>
        <div className="modal-header">
          <h4>Chat with {session.participantName || `Session ${session.sessionId}`}</h4>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body chat-messages-container" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto'}}>
          {loadingMessages ? (
            <p>Loading messages...</p>
          ) : (
            // --- FIX: Check for both messageText (from optimistic update) and message_text (from DB) ---
            messages.map((msg, index) => (
              <div key={msg.id || `msg-${index}`} className={`chat-message-item ${msg.senderType === 'admin' || msg.sender_type === 'admin' ? 'admin-message' : 'user-message'}`}>
                <p className="msg-text">{msg.messageText || msg.message_text}</p>
                <span className="msg-timestamp">{new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="modal-footer">
            <form onSubmit={handleSend} className="chat-reply-form">
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


// Generic confirmation modal for actions
const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;
    return (
        <div className="modal-backdrop active">
            <div className="modal-content">
                <h4>{title}</h4>
                <p>{children}</p>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary-action">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger-action">Confirm</button>
                </div>
            </div>
        </div>
    );
};


function ChatManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { messages: liveMessages, sendMessage, isConnected } = useWebSocket();

  const [modal, setModal] = useState({ type: null, data: null });
  const [selectedSessionMessages, setSelectedSessionMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/admin/chat/sessions');
      if (response.data.success) {
        setSessions(response.data.chatSessions || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch sessions.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (liveMessages.length === 0) return;

    fetchSessions(); 

    if (modal.type === 'view' && modal.data) {
      const latestMessage = liveMessages[liveMessages.length - 1];
      if (String(latestMessage.session_id) === String(modal.data.sessionId)) {
        if (!selectedSessionMessages.some(m => m.id === latestMessage.id || m.id === latestMessage.localId)) {
          setSelectedSessionMessages(prevMessages => [...prevMessages, latestMessage]);
        }
      }
    }
  }, [liveMessages, modal.type, modal.data, fetchSessions, selectedSessionMessages]);


  const handleViewChat = async (session) => {
    if (!session || session.sessionId === undefined) {
      setError("Cannot view chat: Session ID is missing.");
      return;
    }

    setModal({ type: 'view', data: session });
    setLoadingMessages(true);
    try {
      const response = await API.get(`/api/admin/chat/sessions/${session.sessionId}/messages`);
      if (response.data.success) {
        setSelectedSessionMessages(response.data.messages || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch messages.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSelectedSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const handleAdminSendMessage = (messageText) => {
    if (!isConnected) {
        setError("Cannot send message: WebSocket is disconnected.");
        return;
    }
    sendMessage(messageText);
  };
  
  const handleSessionAction = async (action, sessionId) => {
      // --- FIX: Add guard clause for missing sessionId ---
      if (sessionId === undefined) {
        setError(`Cannot ${action} session: Session ID is missing.`);
        return;
      }
      const endpoints = {
          close: { method: 'put', url: `/api/admin/chat/sessions/${sessionId}/close` },
          archive: { method: 'delete', url: `/api/admin/chat/sessions/${sessionId}/archive` }
      };
      if (!endpoints[action]) return;
      try {
        await API[endpoints[action].method](endpoints[action].url);
        closeModal();
        fetchSessions();
      } catch (err) {
        setError(err.response?.data?.message || `Failed to ${action} session.`);
      }
  };

  const openConfirmationModal = (type, session) => {
    setModal({ type, data: session });
  };

  const closeModal = () => {
    setModal({ type: null, data: null });
    setSelectedSessionMessages([]);
  };

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <>
      <ChatModal
        show={modal.type === 'view'}
        onClose={closeModal}
        session={modal.data}
        messages={selectedSessionMessages}
        loadingMessages={loadingMessages}
        onSendMessage={handleAdminSendMessage}
        isConnected={isConnected}
      />
      <ConfirmationModal
        show={modal.type === 'close' || modal.type === 'archive'}
        onClose={closeModal}
        onConfirm={() => handleSessionAction(modal.type, modal.data?.sessionId)}
        title={`Confirm ${modal.type}`}
      >
        Are you sure you want to {modal.type} the chat session with <strong>{modal.data?.participantName}</strong>?
        {modal.type === 'archive' && ' This action cannot be undone.'}
      </ConfirmationModal>

      <div className="content-section">
        <div className="content-header">
          <h2>Chat Management</h2>
          <p>View and manage all active customer chat sessions.</p>
        </div>
        
        {error && <div className="message-area error" style={{ display: 'block' }}>{error}</div>}

        <div className="card-list-container">
            {/* --- FIX: Use sessionId and index for a guaranteed unique key --- */}
            {sessions.length > 0 ? sessions.map((session, index) => (
                <div key={session.sessionId || `session-${index}`} className="card chat-session-item">
                    <div>
                        <strong>Session ID:</strong> {session.sessionId !== undefined ? session.sessionId : 'N/A'} <br/>
                        <strong>Participant:</strong> {session.participantName || 'Unknown'} <br/>
                        <strong>Status:</strong> {session.status} | <strong>Messages:</strong> {session.messageCount} <br/>
                        <small>Last Update: {new Date(session.updated_at).toLocaleString()}</small>
                    </div>
                    <div className="chat-actions">
                        <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action" disabled={session.sessionId === undefined}>View</button>
                        <button onClick={() => openConfirmationModal('close', session)} className="btn btn-sm btn-warning-action" disabled={session.sessionId === undefined}>Close</button>
                        <button onClick={() => openConfirmationModal('archive', session)} className="btn btn-sm btn-danger-action" disabled={session.sessionId === undefined}>Archive</button>
                    </div>
                </div>
            )) : (
                <div className="card text-center"><p>No active chat sessions.</p></div>
            )}
        </div>
      </div>
    </>
  );
}

export default ChatManagement;

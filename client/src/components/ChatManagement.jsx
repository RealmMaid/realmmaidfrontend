import React, { useState } from 'react';
import { useWebSocketActions } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';
import { useChatSessions } from '../hooks/useChatSessions.js';
import { useUpdateSessionStatus } from '../hooks/useUpdateSessionStatus.js'; // 1. Import our new mutation hook
import { ChatModal } from './ChatModal.jsx';

function ChatManagement() {
    // Our existing query for fetching data
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    
    // 2. Our new mutation hook!
    // 'mutateAsync' is the function we call to trigger the action.
    // 'isPending' is a boolean that is true while the mutation is in progress.
    const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateSessionStatus();
    
    const { isConnected, typingPeers, activeAdminChat, setActiveAdminChat, sendAdminReply, emitStartTyping, emitStopTyping } = useWebSocketActions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleViewChat = async (session) => {
        try {
            const response = await API.get(`/chat/sessions/${session.sessionId}/messages`);
            if (response.data.success) {
                setActiveAdminChat({
                    sessionId: session.sessionId,
                    participantName: session.participantName || `Guest ${session.sessionId}`,
                    messages: response.data.messages || []
                });
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(`Failed to fetch history for session ${session.sessionId}:`, err);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveAdminChat({ sessionId: null, participantName: null, messages: [] });
    };

    // 3. This function is now much simpler. It just calls our mutation hook.
    const handleSessionStatusChange = async (sessionId, action) => {
        try {
            await updateStatus({ sessionId, action });
            // We can show a success toast here in the future!
        } catch (err) {
            // Error handling is already done inside the hook, but we can add more here if needed.
            console.error("Handler caught error:", err);
        }
    };

    if (isLoading) return <div className="content-section"><p>Loading chat sessions...</p></div>;
    if (isError) return <div className="content-section"><p>Error loading sessions: {error.message}</p></div>;

    const sessionsArray = sessions
        ?.map(s => ({ ...s, isTyping: typingPeers[s.sessionId] }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return (
        <>
            <ChatModal show={isModalOpen} onClose={handleCloseModal} session={activeAdminChat} messages={activeAdminChat.messages} onSendMessage={sendAdminReply} isConnected={isConnected} emitStartTyping={emitStartTyping} emitStopTyping={emitStopTyping} />
            <div className="content-section">
                <div className="content-header">
                    <h2>Chat Management</h2>
                    <p>View and manage all active customer chat sessions in real-time.</p>
                </div>
                <div className="card-list-container">
                    {sessionsArray && sessionsArray.length > 0 ? sessionsArray.map((session) => {
                        const participantDisplay = session.participantName || `Guest ${session.sessionId}`;
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
                                    <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action" disabled={isUpdatingStatus}>View Chat</button>
                                    {session.status !== 'resolved' && (
                                        <button onClick={() => handleSessionStatusChange(session.sessionId, 'resolve')} className="btn btn-sm btn-success-action" disabled={isUpdatingStatus}>
                                            {isUpdatingStatus ? 'Resolving...' : 'Resolve'}
                                        </button>
                                    )}
                                    <button onClick={() => handleSessionStatusChange(session.sessionId, 'archive')} className="btn btn-sm btn-danger-action" disabled={isUpdatingStatus}>
                                        {isUpdatingStatus ? 'Archiving...' : 'Archive'}
                                    </button>
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

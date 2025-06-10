import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';
import { useChatSessions } from '../hooks/useChatSessions.js';

// 1. We now import the ChatModal from its own dedicated file!
import { ChatModal } from './ChatModal.jsx';

function ChatManagement() {
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    const { isConnected, typingPeers, sendAdminReply, emitStartTyping, emitStopTyping } = useWebSocket();
    
    // State to manage which chat modal is open and its specific messages
    const [activeChat, setActiveChat] = useState({ sessionId: null, participantName: null, messages: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewChat = async (session) => {
        // Fetch the message history for just the selected session
        try {
            const response = await API.get(`/admin/chat/sessions/${session.sessionId}/messages`);
            if (response.data.success) {
                // Set the active chat data and open the modal
                setActiveChat({
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
        setActiveChat({ sessionId: null, participantName: null, messages: [] });
    };

    if (isLoading) {
        return <div className="content-section"><p>Loading chat sessions...</p></div>;
    }

    if (isError) {
        return <div className="content-section"><p>Error loading sessions: {error.message}</p></div>;
    }

    // Combine session data from React Query with real-time typing data
    const sessionsArray = sessions
        ?.map(s => ({
            ...s,
            isTyping: typingPeers[s.sessionId],
        }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return (
        <>
            {/* 2. The ChatModal is now rendered here, clean and simple. */}
            <ChatModal
                show={isModalOpen}
                onClose={handleCloseModal}
                session={activeChat}
                messages={activeChat.messages}
                onSendMessage={sendAdminReply}
                isConnected={isConnected}
                emitStartTyping={emitStartTyping}
                emitStopTyping={emitStopTyping}
            />

            <div className="content-section">
                <div className="content-header">
                    <h2>Chat Management</h2>
                    <p>View and manage all active customer chat sessions in real-time.</p>
                </div>

                <div className="card-list-container">
                    {sessionsArray && sessionsArray.length > 0 ? sessionsArray.map((session) => {
                        if (!session || !session.sessionId) return null;
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
                                    <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
                                    {/* Status change buttons would go here */}
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

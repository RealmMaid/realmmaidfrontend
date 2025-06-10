import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';
import { useChatSessions } from '../hooks/useChatSessions.js';
import { ChatModal } from './ChatModal.jsx';

function ChatManagement() {
    // Data fetching is now handled perfectly by React Query
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    
    // We get the necessary real-time data and functions from our corrected provider
    const { isConnected, typingPeers, activeAdminChat, setActiveAdminChat, sendAdminReply } = useWebSocket();
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewChat = async (session) => {
        // When we open a chat, we fetch its history and set it as the "active" chat
        try {
            const response = await API.get(`/admin/chat/sessions/${session.sessionId}/messages`);
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

    if (isLoading) {
        return <div className="content-section"><p>Loading chat sessions...</p></div>;
    }

    if (isError) {
        return <div className="content-section"><p>Error loading sessions: {error.message}</p></div>;
    }

    const sessionsArray = sessions
        ?.map(s => ({
            ...s,
            isTyping: typingPeers[s.sessionId],
        }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return (
        <>
            <ChatModal
                show={isModalOpen}
                onClose={handleCloseModal}
                session={activeAdminChat}
                messages={activeAdminChat.messages}
                onSendMessage={sendAdminReply}
                isConnected={isConnected}
                // We pass placeholder functions for typing for now, can be wired up if needed
                emitStartTyping={() => {}}
                emitStopTyping={() => {}}
            />

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
                                    <p className="last-message">"{session.last_message_text || 'No messages yet...'}"</p>
                                    {session.isTyping && <div className="typing-indicator"><span>typing...</span></div>}
                                </div>
                                <div className="chat-actions">
                                    <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
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

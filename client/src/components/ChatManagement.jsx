import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import API from '../api/axios';
import { useChatSessions } from '../hooks/useChatSessions.js';
import { ChatModal } from './ChatModal.jsx'; // We'll move the modal to its own file for cleanliness

function ChatManagement() {
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    const { isConnected, typingPeers, activeChat, setActiveChat, sendAdminReply } = useWebSocket();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewChat = async (session) => {
        // Fetch message history for the selected session
        try {
            const response = await API.get(`/admin/chat/sessions/${session.sessionId}/messages`);
            if (response.data.success) {
                setActiveChat({ sessionId: session.sessionId, messages: response.data.messages, participantName: session.participantName });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error(`Failed to fetch history for session ${session.sessionId}:`, error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveChat({ sessionId: null, messages: [] });
    };
    
    if (isLoading) return <div className="content-section"><p>Loading chat sessions...</p></div>;
    if (isError) return <div className="content-section"><p>Error loading sessions: {error.message}</p></div>;
    
    const sessionsArray = sessions
        ?.map(s => ({ ...s, isTyping: typingPeers[s.sessionId] }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return (
        <>
            <ChatModal
                show={isModalOpen}
                onClose={handleCloseModal}
                session={activeChat}
                messages={activeChat.messages}
                onSendMessage={sendAdminReply}
                isConnected={isConnected}
            />

            <div className="content-section">
                <div className="content-header">
                    <h2>Chat Management</h2>
                    <p>View and manage all active customer chat sessions in real-time.</p>
                </div>
                <div className="card-list-container">
                    {sessionsArray && sessionsArray.length > 0 ? sessionsArray.map((session) => (
                        <div key={session.sessionId} className="card chat-session-item">
                           {/* ... JSX for the session card, no changes here ... */}
                           <div className="session-details">
                                <strong className="participant-name">{session.participantName || `Guest ${session.sessionId}`}</strong>
                                <p className="last-message">"{session.last_message_text || 'No messages yet...'}"</p>
                                {session.isTyping && <div className="typing-indicator"><span>typing...</span></div>}
                            </div>
                            <div className="chat-actions">
                                <button onClick={() => handleViewChat(session)} className="btn btn-sm btn-secondary-action">View Chat</button>
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

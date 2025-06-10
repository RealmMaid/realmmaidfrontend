import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import API from '../api/axios';
import { useChatSessions } from '../hooks/useChatSessions.js';
import { ChatModal } from './ChatModal.jsx';

function ChatManagement() {
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    const { isConnected, typingPeers, activeAdminChat, setActiveAdminChat, sendAdminReply, emitStartTyping, emitStopTyping } = useWebSocket();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleViewChat = async (session) => {
        try {
            // NOTE: The URL here is correct because it's inside the /api/chat router on the backend.
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

    const handleSessionStatusChange = async (sessionId, action) => {
        try {
            // --- THIS IS THE CORRECTED LINE ---
            // The extra '/api' is removed. The axios instance will add it correctly.
            await API.post(`/admin/chat/sessions/${sessionId}/${action}`);
            
            // On success, we tell React Query the list is stale
            await queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        } catch (err) {
            console.error(`Failed to ${action} session ${sessionId}:`, err);
        }
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

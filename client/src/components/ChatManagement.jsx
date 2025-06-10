import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import API from '../api/axios';

// 1. We import our new custom hook!
import { useChatSessions } from '../hooks/useChatSessions.js';

// NOTE: We have removed the ChatModal from this file for now to simplify.
// We will add it back later once the data fetching is refactored.

function ChatManagement() {
    // 2. We call our new hook to get the session data.
    // React Query gives us the data, plus status states like isLoading and isError.
    const { data: sessions, isLoading, isError, error } = useChatSessions();
    
    // We still need the WebSocket context for real-time updates later.
    const { isConnected, typingPeers } = useWebSocket();
    const { user: currentUser } = useAuth();
    const [activeModal, setActiveModal] = useState({ show: false, sessionId: null });

    // 3. We handle the loading and error states right at the top.
    // This makes our return statement much cleaner.
    if (isLoading) {
        return <div className="content-section"><p>Loading chat sessions...</p></div>;
    }

    if (isError) {
        return <div className="content-section"><p>Error loading sessions: {error.message}</p></div>;
    }
    
    // 4. We prepare the sessions array for rendering.
    // Note: We now use the 'sessions' data directly from our useQuery hook.
    const sessionsArray = sessions
        ?.map(s => {
            const isPeerTyping = typingPeers[s.sessionId];
            return { ...s, isTyping: isPeerTyping };
        })
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    // We'll add these handlers back in the next step.
    const handleViewChat = (session) => console.log("View chat for:", session);
    const handleSessionStatusChange = (sessionId, action) => console.log(`Perform ${action} on ${sessionId}`);

    return (
        <>
            {/* The ChatModal component will be added back here later */}

            <div className="content-section">
                <div className="content-header">
                    <h2>Chat Management</h2>
                    <p>View and manage all active customer chat sessions in real-time.</p>
                </div>

                <div className="card-list-container">
                    {sessionsArray && sessionsArray.length > 0 ? sessionsArray.map((session) => {
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

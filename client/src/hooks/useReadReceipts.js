import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketProvider';
import { useAuth } from './useAuth';

/**
 * A custom hook to manage sending read receipts for chat messages.
 * It uses the Intersection Observer API to detect when messages become visible.
 * @param {Array} messages - The array of message objects for the current chat.
 * @param {number|string|null} sessionId - The ID of the current chat session.
 * @returns {function} A ref callback to attach to each message element.
 */
export const useReadReceipts = (messages, sessionId) => {
    const { emitMessagesRead } = useWebSocket();
    const { user: currentUser } = useAuth();
    const observer = useRef(null);
    const observedMessageIds = useRef(new Set());

    // This function will be called by the IntersectionObserver when a message's visibility changes.
    const handleIntersection = useCallback((entries) => {
        const readableMessageIds = entries
            .filter(entry => entry.isIntersecting) // Find messages that are now visible
            .map(entry => parseInt(entry.target.dataset.messageId, 10)); // Get their IDs from the data attribute

        if (readableMessageIds.length > 0) {
            console.log('[useReadReceipts] Emitting messages_read for IDs:', readableMessageIds);
            emitMessagesRead(sessionId, readableMessageIds);
            
            // Once we've sent the read receipt, we can stop observing that element to prevent re-sending.
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.current.unobserve(entry.target);
                    observedMessageIds.current.delete(parseInt(entry.target.dataset.messageId, 10));
                }
            });
        }
    }, [sessionId, emitMessagesRead]);
    
    // This effect sets up the observer when the messages array changes.
    useEffect(() => {
        // Disconnect the old observer if it exists, cleaning up previous listeners.
        if (observer.current) {
            observer.current.disconnect();
        }

        // Create a new Intersection Observer instance.
        observer.current = new IntersectionObserver(handleIntersection, {
            root: null, // observes intersections relative to the document's viewport
            rootMargin: '0px',
            threshold: 0.5, // Trigger when 50% or more of the message is visible
        });
        
        // When the component unmounts, make sure to disconnect the observer.
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [handleIntersection]);

    // This is a callback ref that we will attach to each message element.
    const messageRef = useCallback((node) => {
        if (node) {
            const messageId = parseInt(node.dataset.messageId, 10);
            const message = messages.find(m => m.id === messageId);
            
            // Determine if the message was sent by the current user.
            let isMyMessage = false;
            if (currentUser) {
                isMyMessage = message.sender_type === 'admin' ? message.admin_user_id === currentUser.id : message.user_id === currentUser.id;
            } else {
                isMyMessage = message.sender_type === 'guest';
            }

            // We only need to observe messages that are from the other person, haven't been read yet,
            // and are not already being observed.
            if (message && !message.read_at && !isMyMessage && !observedMessageIds.current.has(messageId)) {
                observer.current.observe(node);
                observedMessageIds.current.add(messageId);
            }
        }
    }, [messages, currentUser, handleIntersection]); // Rerun when messages or user change

    return messageRef;
};

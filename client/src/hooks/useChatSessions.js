import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';

// This is the function that will actually fetch the data from your API.
const fetchChatSessions = async () => {
    // We assume you have an endpoint that returns all active sessions.
    // Let's say it's GET /api/admin/chat/sessions
    const { data } = await API.get('/admin/chat/sessions');
    if (data.success) {
        return data.sessions;
    }
    // If the API call was not successful, throw an error.
    // React Query will catch this and put the query in an 'error' state.
    throw new Error(data.message || 'Failed to fetch chat sessions');
};

// This is our custom hook. It uses React Query's useQuery to wrap our fetching function.
export const useChatSessions = () => {
    return useQuery({
        queryKey: ['chatSessions'], // This is the unique key for this query in the cache.
        queryFn: fetchChatSessions,  // This is the function that will be called to fetch the data.
    });
};

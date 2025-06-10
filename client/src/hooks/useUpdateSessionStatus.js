import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/axios';

// This async function will send the request to the server.
// It accepts an object with the sessionId and the action ('resolve' or 'archive').
const updateSessionStatus = async ({ sessionId, action }) => {
    const { data } = await API.post(`/admin/chat/sessions/${sessionId}/${action}`);
    return data;
};

// This is our custom hook that uses React Query's useMutation.
export const useUpdateSessionStatus = () => {
    // Get an instance of the Query Client
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSessionStatus, // The function to call when we want to mutate data
        
        // This is the magic part! After the mutation is successful...
        onSuccess: () => {
            // ...we tell React Query to invalidate the 'chatSessions' query.
            // This will cause the list on the dashboard to automatically refetch and update.
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        },
        onError: (error) => {
            // We can add user-friendly error handling here in the future!
            console.error("Failed to update session status:", error);
        }
    });
};

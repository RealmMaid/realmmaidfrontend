import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = create((set, get) => ({
  // STATE
  isConnected: false,
  customerChat: { sessionId: null, messages: [] },
  activeAdminChat: { sessionId: null, messages: [] },
  typingPeers: {},
  
  // ACTIONS
  setConnected: (status) => set({ isConnected: status }),

  // Initializes the customer's session (or resumes it)
  initializeCustomerSession: (sessionData) => {
    set({
      customerChat: {
        sessionId: sessionData.sessionId,
        messages: sessionData.history || [],
      },
    });
  },

  // Sets the currently active chat for an admin
  setActiveAdminChat: (chatData) => {
    set({ activeAdminChat: chatData });
  },

  // Adds a message to the correct chat session
  addMessage: (message) => {
    const { customerChat, activeAdminChat } = get();
    
    // Update customer's own chat
    if (customerChat.sessionId && String(customerChat.sessionId) === String(message.session_id)) {
      set(state => ({
        customerChat: {
          ...state.customerChat,
          // Replace optimistic message with the real one from the server
          messages: state.customerChat.messages
            .filter(m => m.id !== message.optimisticId)
            .concat(message)
        }
      }));
    }
    
    // Update the admin's active chat
    if (activeAdminChat.sessionId && String(activeAdminChat.sessionId) === String(message.session_id)) {
      set(state => ({
        activeAdminChat: {
          ...state.activeAdminChat,
          messages: state.activeAdminChat.messages
            .filter(m => m.id !== message.optimisticId)
            .concat(message)
        }
      }));
    }
  },

  // Adds an optimistic message to the UI immediately
  addOptimisticMessage: (message) => {
    const optimisticMsg = {
        ...message,
        id: `local-${uuidv4()}`, // Give it a temporary local ID
        created_at: new Date().toISOString(),
    };

    const { customerChat, activeAdminChat } = get();

    if (customerChat.sessionId && String(customerChat.sessionId) === String(optimisticMsg.session_id)) {
        set(state => ({
            customerChat: {
                ...state.customerChat,
                messages: [...state.customerChat.messages, optimisticMsg]
            }
        }));
    }
    if (activeAdminChat.sessionId && String(activeAdminChat.sessionId) === String(optimisticMsg.session_id)) {
        set(state => ({
            activeAdminChat: {
                ...state.activeAdminChat,
                messages: [...state.activeAdminChat.messages, optimisticMsg]
            }
        }));
    }
    // Return the temp ID so we can find it later
    return optimisticMsg.id;
  },

  // Reverts an optimistic message if the server call fails
  revertOptimisticMessage: (optimisticId, sessionId) => {
      const { customerChat, activeAdminChat } = get();
      if (customerChat.sessionId === sessionId) {
          set(state => ({
              customerChat: {
                  ...state.customerChat,
                  messages: state.customerChat.messages.filter(m => m.id !== optimisticId)
              }
          }));
      }
      if (activeAdminChat.sessionId === sessionId) {
          set(state => ({
              activeAdminChat: {
                  ...state.activeAdminChat,
                  messages: state.activeAdminChat.messages.filter(m => m.id !== optimisticId)
              }
          }));
      }
  },

  // --- Typing status actions ---
  setPeerTyping: (sessionId, userName) => {
    set(state => ({
      typingPeers: { ...state.typingPeers, [sessionId]: userName || true }
    }));
  },

  clearPeerTyping: (sessionId) => {
    set(state => {
      const newPeers = { ...state.typingPeers };
      delete newPeers[sessionId];
      return { typingPeers: newPeers };
    });
  },
}));

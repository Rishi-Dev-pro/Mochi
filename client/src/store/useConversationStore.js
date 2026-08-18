/**
 * Zustand Conversation Store
 *
 * Centralized, shared store for chat message history and conversation status.
 * Ensures identical message stream across Home, Chat, and Voice subsystems.
 */

import { create } from 'zustand'

export const INITIAL_MOCHI_MESSAGE = {
  id: 'welcome-msg',
  role: 'assistant',
  content: 'Hello! I am Mochi, your companion. How are you feeling today?',
  emotion: 'happy',
  intensity: 0.9,
  timestamp: new Date().toISOString(),
}

export const useConversationStore = create((set) => ({
  messages: [INITIAL_MOCHI_MESSAGE],
  loading: false,
  error: null,

  setMessages: (messagesOrUpdater) => {
    set((state) => ({
      messages: typeof messagesOrUpdater === 'function' ? messagesOrUpdater(state.messages) : messagesOrUpdater
    }))
  },

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, msg]
    }))
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  clearMessages: () => {
    set({
      messages: [
        {
          ...INITIAL_MOCHI_MESSAGE,
          id: `welcome-${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      ],
      error: null
    })
  }
}))

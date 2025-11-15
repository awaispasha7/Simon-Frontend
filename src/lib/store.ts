import { create } from 'zustand'

interface ChatStore {
  init: () => void
  send: (message: string) => void
}

export const useChatStore = create<ChatStore>(() => ({
  init: () => {
    // Initialize chat store
  },
  send: (message: string) => {
    // Send message logic
    console.log('Sending message:', message)
  }
}))

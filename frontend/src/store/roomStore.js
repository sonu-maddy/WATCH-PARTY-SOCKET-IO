import { create } from 'zustand';

export const roomStore = create((set) => ({
  myRole: 'PARTICIPANT',
  myUserId: '',
  participants: [],
  chat: [], 
  videoId: 'dQw4w9WgXcQ',
  isPlaying: false,
  setStoreData: (data) => set((state) => ({ ...state, ...data })),
  addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })) 
}));
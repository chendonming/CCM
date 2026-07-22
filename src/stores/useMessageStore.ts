import { create } from 'zustand';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface Message {
  id: number;
  type: MessageType;
  content: string;
}

interface MessageState {
  messages: Message[];
  showMessage: (content: string, type?: MessageType) => void;
  removeMessage: (id: number) => void;
}

let nextId = 1;

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],

  showMessage: (content: string, type: MessageType = 'info') => {
    const id = nextId++;
    set((state) => ({
      messages: [...state.messages, { id, type, content }],
    }));
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }));
    }, 3000);
  },

  removeMessage: (id: number) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },
}));

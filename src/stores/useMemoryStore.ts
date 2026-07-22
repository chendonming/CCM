import { create } from 'zustand';
import type { MemoryEntry, MemoryGraph } from '@/types';

interface MemoryState {
  entries: MemoryEntry[];
  graph: MemoryGraph | null;
  loading: boolean;
  error: string | null;
  scanMemory: (path: string) => Promise<void>;
  getReferenceGraph: (path: string) => Promise<void>;
  deleteMemory: (path: string, entryId: string) => Promise<number>;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  entries: [],
  graph: null,
  loading: false,
  error: null,

  scanMemory: async (path: string) => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const entries = await invoke<MemoryEntry[]>('scan_memory', { path });
      set({ entries, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  getReferenceGraph: async (path: string) => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const graph = await invoke<MemoryGraph>('get_reference_graph', { path });
      set({ graph, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  deleteMemory: async (path: string, entryId: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const cleaned = await invoke<number>('delete_memory', { path, entryId });
    // Refresh after delete
    try {
      const entries = await invoke<MemoryEntry[]>('scan_memory', { path });
      set({ entries });
    } catch { /* ignore */ }
    return cleaned;
  },
}));

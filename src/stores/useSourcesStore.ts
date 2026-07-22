import { create } from 'zustand';
import type { SourceDirectory } from '@/types';

interface SourcesState {
  sources: SourceDirectory[];
  loading: boolean;
  error: string | null;
  fetchSources: () => Promise<void>;
  addSource: (name: string, path: string) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
}

export const useSourcesStore = create<SourcesState>((set, get) => ({
  sources: [],
  loading: false,
  error: null,

  fetchSources: async () => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const sources = await invoke<SourceDirectory[]>('list_sources');
      set({ sources, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  addSource: async (name: string, path: string, skipConflicts?: boolean) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const sources = await invoke<SourceDirectory[]>('add_source', {
      name,
      path,
      skipConflicts: skipConflicts ?? false,
    });
    set({ sources });
  },

  removeSource: async (id: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const sources = await invoke<SourceDirectory[]>('remove_source', { sourceId: id });
      set({ sources });
    } catch (err) {
      set({ error: String(err) });
    }
  },
}));

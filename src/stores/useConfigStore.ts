import { create } from 'zustand';
import type { AppConfig } from '@/types';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: AppConfig) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const config = await invoke<AppConfig>('get_config');
      set({ config, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  updateConfig: async (config: AppConfig) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('update_config', { config });
      set({ config });
    } catch (err) {
      set({ error: String(err) });
    }
  },
}));

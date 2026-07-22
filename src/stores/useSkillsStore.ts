import { create } from 'zustand';
import type { Entity } from '@/types';

interface SkillsState {
  skills: Entity[];
  loading: boolean;
  error: string | null;
  filter: {
    category: string;
    language: string;
    search: string;
  };
  fetchSkills: () => Promise<void>;
  deploySkill: (sourcePath: string, targetType: string, projectRoot?: string) => Promise<string>;
  undeploySkill: (targetPath: string) => Promise<void>;
  deleteEntity: (resourceDir: string) => Promise<void>;
  setFilter: (filter: Partial<SkillsState['filter']>) => void;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loading: false,
  error: null,
  filter: {
    category: '',
    language: '',
    search: '',
  },

  fetchSkills: async () => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const skills = await invoke<Entity[]>('list_skills');
      set({ skills, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  deploySkill: async (sourcePath: string, targetType: string, projectRoot?: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const targetPath = await invoke<string>('deploy_skill', {
      sourcePath,
      targetType,
      projectRoot: projectRoot || null,
    });
    await get().fetchSkills();
    return targetPath;
  },

  undeploySkill: async (targetPath: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('undeploy_skill', { targetPath });
    await get().fetchSkills();
  },

  deleteEntity: async (resourceDir: string, force = false) => {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<string>('delete_entity', { resourceDir, force });
    await get().fetchSkills();
    return result;
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },
}));

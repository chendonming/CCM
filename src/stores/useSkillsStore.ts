import { create } from 'zustand';
import type { Entity } from '@/types';

interface SkillsState {
  skills: Entity[];
  loading: boolean;
  error: string | null;
  conflictedIds: Set<string>;
  filter: {
    category: string;
    language: string;
    search: string;
  };
  fetchSkills: () => Promise<void>;
  deploySkill: (sourcePath: string, targetType: string, projectRoot?: string) => Promise<string>;
  undeploySkill: (targetPath: string) => Promise<void>;
  deleteEntity: (resourceDir: string, force?: boolean) => Promise<string>;
  setFilter: (filter: Partial<SkillsState['filter']>) => void;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loading: false,
  error: null,
  conflictedIds: new Set<string>(),
  filter: {
    category: '',
    language: '',
    search: '',
  },

  fetchSkills: async () => {
    set({ loading: true, error: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const [skills, conflictedIds] = await Promise.all([
        invoke<Entity[]>('list_skills'),
        invoke<string[]>('get_conflict_ids'),
      ]);
      set({ skills, conflictedIds: new Set(conflictedIds), loading: false });
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

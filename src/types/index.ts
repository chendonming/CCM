export type EntityType = 'skill' | 'agent' | 'rule';
export type Language = 'zh' | 'en' | 'bilingual';
export type DeployTarget = { type: 'global' } | { type: 'project'; projectRoot: string };
export type GitStatus = 'up_to_date' | 'behind' | 'unknown';

export interface Deployment {
  target: DeployTarget;
  target_path: string;
  active: boolean;
}

export interface Entity {
  id: string;
  entity_type: EntityType;
  name: string;
  description: string;
  source_path: string;
  resource_dir: string;
  deployments: Deployment[];
  language: Language;
  has_translation: boolean;
  category: string;
  origin: string | null;
  updated_at: string;
  is_git_repo: boolean;
  remote_url: string | null;
  body: string;
  is_builtin_source: boolean;
}

export interface SourceDirectory {
  id: string;
  name: string;
  path: string;
  is_builtin?: boolean;
  skip_entity_ids?: string[];
}

export interface MemoryEntry {
  id: string;
  file_path: string;
  entry_type: string;
  name: string;
  description: string;
  content: string;
  references: string[];
  referenced_by: string[];
}

export interface MemoryGraph {
  entries: MemoryEntry[];
  orphan_references: string[];
}

export interface ConflictInfo {
  conflict_type: string;
  value: string;
  new_path: string;
  existing_path: string;
}

export interface ConflictResult {
  conflicts: ConflictInfo[];
  total_entities: number;
}

export interface DeployableProject {
  name: string;
  root_path: string;
}

export interface UiPreferences {
  sidebar_collapsed: boolean;
  theme: string;
  skip_symlink_check: boolean;
}

export interface AppConfig {
  version: string;
  source_directories: SourceDirectory[];
  deployable_projects: DeployableProject[];
  categories: string[];
  ui_preferences: UiPreferences;
}

export const BUILTIN_CATEGORIES = [
  '前端', '后端', 'DevOps', 'AI', '工具', '安全', '测试', '数据库', '未分类',
];

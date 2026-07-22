use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("YAML parse error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid path: {0}")]
    InvalidPath(String),
    #[error("Git error: {0}")]
    Git(String),
    #[error("{0}")]
    Any(#[from] anyhow::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    Skill,
    Agent,
    Rule,
}

impl std::fmt::Display for EntityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EntityType::Skill => write!(f, "skill"),
            EntityType::Agent => write!(f, "agent"),
            EntityType::Rule => write!(f, "rule"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Language {
    Zh,
    En,
    Bilingual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DeployTarget {
    Global,
    Project(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub target: DeployTarget,
    pub target_path: PathBuf,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub id: String,
    pub entity_type: EntityType,
    pub name: String,
    pub description: String,
    pub source_path: PathBuf,
    pub resource_dir: PathBuf,
    pub deployments: Vec<Deployment>,
    pub language: Language,
    pub has_translation: bool,
    pub category: String,
    pub origin: Option<String>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub is_git_repo: bool,
    pub remote_url: Option<String>,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceDirectory {
    pub id: String,
    pub name: String,
    pub path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub file_path: PathBuf,
    pub entry_type: String,
    pub name: String,
    pub description: String,
    pub content: String,
    pub references: Vec<String>,
    pub referenced_by: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryGraph {
    pub entries: Vec<MemoryEntry>,
    pub orphan_references: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GitStatus {
    UpToDate,
    Behind { commits: usize },
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedSkill {
    pub name: String,
    pub description: String,
    pub metadata: Option<serde_yaml::Value>,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub source_directories: Vec<SourceDirectory>,
    pub deployable_projects: Vec<DeployableProject>,
    pub categories: Vec<String>,
    pub ui_preferences: UiPreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployableProject {
    pub name: String,
    pub root_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiPreferences {
    pub sidebar_collapsed: bool,
    pub theme: String,
    pub skip_symlink_check: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: "1".to_string(),
            source_directories: vec![],
            deployable_projects: vec![],
            categories: vec![
                "前端".to_string(),
                "后端".to_string(),
                "DevOps".to_string(),
                "AI".to_string(),
                "工具".to_string(),
                "安全".to_string(),
                "测试".to_string(),
                "数据库".to_string(),
                "未分类".to_string(),
            ],
            ui_preferences: UiPreferences {
                sidebar_collapsed: false,
                theme: "system".to_string(),
                skip_symlink_check: false,
            },
        }
    }
}

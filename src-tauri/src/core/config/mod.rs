pub mod migration;

use crate::core::types::{AppConfig, DeployableProject, Result, SourceDirectory};
use std::path::PathBuf;

fn config_dir() -> PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".claude-ccm")
}

fn config_path() -> PathBuf {
    config_dir().join("config.json")
}

/// Load app configuration from ~/.claude-ccm/config.json
pub fn load_config() -> Result<AppConfig> {
    let path = config_path();

    if !path.exists() {
        let config = AppConfig::default();
        save_config(&config)?;
        return Ok(config);
    }

    let content = std::fs::read_to_string(&path)?;
    let config: AppConfig = serde_json::from_str(&content)?;
    Ok(config)
}

/// Save app configuration to ~/.claude-ccm/config.json
pub fn save_config(config: &AppConfig) -> Result<()> {
    let dir = config_dir();
    std::fs::create_dir_all(&dir)?;

    let path = config_path();
    let content = serde_json::to_string_pretty(config)?;
    std::fs::write(&path, content)?;

    Ok(())
}

/// Add a source directory
pub fn add_source(source: SourceDirectory) -> Result<AppConfig> {
    let mut config = load_config()?;

    // Check for duplicate
    if config.source_directories.iter().any(|s| s.path == source.path) {
        return Ok(config);
    }

    config.source_directories.push(source);
    save_config(&config)?;
    Ok(config)
}

/// Remove a source directory by id
pub fn remove_source(id: &str) -> Result<AppConfig> {
    let mut config = load_config()?;
    config.source_directories.retain(|s| s.id != id);
    save_config(&config)?;
    Ok(config)
}

/// Add a deployable project
pub fn add_project(project: DeployableProject) -> Result<AppConfig> {
    let mut config = load_config()?;

    if config.deployable_projects.iter().any(|p| p.root_path == project.root_path) {
        return Ok(config);
    }

    config.deployable_projects.push(project);
    save_config(&config)?;
    Ok(config)
}

/// Remove a deployable project
pub fn remove_project(root_path: &str) -> Result<AppConfig> {
    let mut config = load_config()?;
    config.deployable_projects.retain(|p| {
        p.root_path.to_string_lossy().as_ref() != root_path
    });
    save_config(&config)?;
    Ok(config)
}

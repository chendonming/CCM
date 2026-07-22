use crate::core::types::{DeployableProject, GitStatus};
use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn import_from_github(
    url: String,
    target_dir: String,
) -> Result<String, String> {
    let target = std::path::PathBuf::from(&target_dir);
    crate::core::gitops::clone_repo(&url, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn check_git_updates(path: String) -> Result<GitStatus, String> {
    let repo_path = std::path::PathBuf::from(&path);
    crate::core::gitops::check_remote_status(&repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pull_skill(path: String) -> Result<String, String> {
    let repo_path = std::path::PathBuf::from(&path);
    crate::core::gitops::pull_remote(&repo_path).map_err(|e| e.to_string())?;
    Ok("Pull completed successfully".to_string())
}

#[tauri::command]
pub async fn list_projects(_state: State<'_, AppState>) -> Result<Vec<DeployableProject>, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    Ok(config.deployable_projects)
}

#[tauri::command]
pub async fn add_project(name: String, root_path: String) -> Result<Vec<DeployableProject>, String> {
    let project = DeployableProject {
        name,
        root_path: std::path::PathBuf::from(&root_path),
    };
    let config = crate::core::config::add_project(project).map_err(|e| e.to_string())?;
    Ok(config.deployable_projects)
}

#[tauri::command]
pub async fn remove_project(root_path: String) -> Result<Vec<DeployableProject>, String> {
    let config = crate::core::config::remove_project(&root_path).map_err(|e| e.to_string())?;
    Ok(config.deployable_projects)
}

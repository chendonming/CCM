use crate::core::types::Entity;
use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn list_skills(_state: State<'_, AppState>) -> Result<Vec<Entity>, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    let entities =
        crate::core::skill::scanner::collect_all_sources(&config.source_directories)
            .map_err(|e| e.to_string())?;
    Ok(entities)
}

#[tauri::command]
pub async fn get_conflict_ids(_state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    let entities =
        crate::core::skill::scanner::collect_all_sources(&config.source_directories)
            .map_err(|e| e.to_string())?;
    Ok(crate::core::skill::scanner::get_conflict_ids(&entities))
}

#[tauri::command]
pub async fn get_skill(skill_id: String, _state: State<'_, AppState>) -> Result<Entity, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    let entities =
        crate::core::skill::scanner::collect_all_sources(&config.source_directories)
            .map_err(|e| e.to_string())?;

    entities
        .into_iter()
        .find(|e| e.id == skill_id)
        .ok_or_else(|| format!("Skill '{}' not found", skill_id))
}

#[tauri::command]
pub async fn deploy_skill(
    source_path: String,
    target_type: String,
    project_root: Option<String>,
) -> Result<String, String> {
    let source = std::path::PathBuf::from(&source_path);

    let target_path = if target_type == "global" {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .map_err(|e| e.to_string())?;
        std::path::PathBuf::from(home)
            .join(".claude")
            .join("skills")
            .join(
                source
                    .parent()
                    .and_then(|p| p.file_name())
                    .unwrap_or_else(|| source.as_os_str()),
            )
    } else {
        let root = project_root.ok_or("Project root required for project deployment")?;
        std::path::PathBuf::from(&root)
            .join(".claude")
            .join("skills")
            .join(
                source
                    .parent()
                    .and_then(|p| p.file_name())
                    .unwrap_or_else(|| source.as_os_str()),
            )
    };

    crate::core::symlink::create_symlink(&source, &target_path).map_err(|e| e.to_string())?;

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn undeploy_skill(target_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&target_path);
    crate::core::symlink::remove_symlink(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_entity(resource_dir: String, force: bool) -> Result<String, String> {
    let path = std::path::PathBuf::from(&resource_dir);
    if !path.exists() {
        return Err(format!("Path not found: {}", resource_dir));
    }

    if force {
        std::fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
        return Ok("deleted".to_string());
    }

    // Try sending to recycle bin first
    trash::delete_all(&path).map_err(|e| format!("trash_failed:{}", e))?;
    Ok("trashed".to_string())
}

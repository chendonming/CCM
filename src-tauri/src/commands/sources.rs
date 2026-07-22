use crate::core::types::{ConflictResponse, SourceDirectory};
use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn list_sources(_state: State<'_, AppState>) -> Result<Vec<SourceDirectory>, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    Ok(config.source_directories)
}

#[tauri::command]
pub async fn add_source(
    name: String,
    path: String,
    skip_conflicts: Option<bool>,
) -> Result<Vec<SourceDirectory>, String> {
    let new_path = std::path::PathBuf::from(&path);

    // Check for name/id conflicts before adding
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    let existing_entities =
        crate::core::skill::scanner::collect_all_sources(&config.source_directories)
            .map_err(|e| e.to_string())?;
    let (conflicts, total_entities, conflicted_entity_ids) =
        crate::core::skill::scanner::check_conflicts(&new_path, &existing_entities)
            .map_err(|e| e.to_string())?;

    if !conflicts.is_empty() {
        if skip_conflicts.unwrap_or(false) {
            // Store conflicting entity IDs so they are excluded at scan time
            let source = SourceDirectory {
                id: uuid(),
                name,
                path: new_path,
                is_builtin: false,
                skip_entity_ids: conflicted_entity_ids,
            };
            let config = crate::core::config::add_source(source).map_err(|e| e.to_string())?;
            return Ok(config.source_directories);
        }

        let response = ConflictResponse {
            conflicts,
            total_entities,
        };
        let json = serde_json::to_string(&response).map_err(|e| e.to_string())?;
        return Err(format!("CONFLICT:{}", json));
    }

    let source = SourceDirectory {
        id: uuid(),
        name,
        path: new_path,
        is_builtin: false,
        skip_entity_ids: vec![],
    };
    let config = crate::core::config::add_source(source).map_err(|e| e.to_string())?;
    Ok(config.source_directories)
}

#[tauri::command]
pub async fn open_in_explorer(path: String) -> Result<(), String> {
    let p = std::path::PathBuf::from(&path);
    let dir = if p.is_dir() {
        p
    } else {
        p.parent()
            .map(|d| d.to_path_buf())
            .unwrap_or(p)
    };

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(dir.as_os_str())
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(dir.as_os_str())
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(dir.as_os_str())
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn remove_source(source_id: String) -> Result<Vec<SourceDirectory>, String> {
    let config = crate::core::config::remove_source(&source_id).map_err(|e| e.to_string())?;
    Ok(config.source_directories)
}

fn uuid() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("src_{:x}", nanos)
}

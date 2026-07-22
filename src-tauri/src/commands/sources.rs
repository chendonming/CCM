use crate::core::types::SourceDirectory;
use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn list_sources(_state: State<'_, AppState>) -> Result<Vec<SourceDirectory>, String> {
    let config = crate::core::config::load_config().map_err(|e| e.to_string())?;
    Ok(config.source_directories)
}

#[tauri::command]
pub async fn add_source(name: String, path: String) -> Result<Vec<SourceDirectory>, String> {
    let source = SourceDirectory {
        id: uuid(),
        name,
        path: std::path::PathBuf::from(&path),
        is_builtin: false,
    };
    let config = crate::core::config::add_source(source).map_err(|e| e.to_string())?;
    Ok(config.source_directories)
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

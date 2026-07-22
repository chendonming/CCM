use crate::core::types::AppConfig;
use tauri::State;
use crate::AppState;

#[tauri::command]
pub async fn get_config(_state: State<'_, AppState>) -> Result<AppConfig, String> {
    crate::core::config::load_config().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_config(config: AppConfig) -> Result<(), String> {
    crate::core::config::save_config(&config).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_symlink_support() -> Result<bool, String> {
    Ok(crate::core::symlink::check_symlink_capability())
}

#[tauri::command]
pub async fn get_symlink_help() -> Result<String, String> {
    Ok(crate::core::symlink::windows::symlink_help_message())
}

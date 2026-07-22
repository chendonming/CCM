use crate::core::types::{MemoryEntry, MemoryGraph};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn scan_memory(path: String) -> Result<Vec<MemoryEntry>, String> {
    let dir = std::path::PathBuf::from(&path);
    crate::core::memory::scan_memory_dir(&dir).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reference_graph(path: String) -> Result<MemoryGraph, String> {
    let dir = std::path::PathBuf::from(&path);
    let entries = crate::core::memory::scan_memory_dir(&dir).map_err(|e| e.to_string())?;
    let orphans = crate::core::memory::graph::find_orphans(&entries);
    Ok(MemoryGraph { entries, orphan_references: orphans })
}

#[tauri::command]
pub async fn delete_memory(path: String, entry_id: String) -> Result<usize, String> {
    let dir = std::path::PathBuf::from(&path);
    crate::core::memory::delete_memory_entry(&dir, &entry_id).map_err(|e| e.to_string())
}

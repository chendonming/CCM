use crate::core::types::Result;
use serde::{Deserialize, Serialize};
use std::path::Path;

const CCM_CACHE_DIR: &str = ".claude-ccm";
const TRANSLATIONS_DIR: &str = "translations";

/// JSON-encoded translation cache with source-file staleness tracking
#[derive(Serialize, Deserialize)]
struct CachedTranslation {
    /// ISO 8601 timestamp of the source file's mtime when translated
    source_modified: String,
    /// Translated markdown body
    content: String,
}

fn cache_dir() -> std::path::PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());
    std::path::PathBuf::from(home).join(CCM_CACHE_DIR).join(TRANSLATIONS_DIR)
}

fn new_cache_path(skill_id: &str) -> std::path::PathBuf {
    cache_dir().join(format!("{}.zh.json", skill_id))
}

fn legacy_cache_path(skill_id: &str) -> std::path::PathBuf {
    cache_dir().join(format!("{}.zh.md", skill_id))
}

fn modified_iso(path: &Path) -> Result<String> {
    let mtime = path.metadata()?.modified()?;
    let datetime: chrono::DateTime<chrono::Utc> = mtime.into();
    Ok(datetime.to_rfc3339())
}

/// Path the new-format cache file would occupy
pub fn translation_cache_path(skill_id: &str) -> std::path::PathBuf {
    new_cache_path(skill_id)
}

/// Quick existence check — does NOT validate freshness.
/// Used by the scanner where performance matters.
pub fn has_translation_cache(skill_id: &str) -> bool {
    if new_cache_path(skill_id).exists() {
        return true;
    }
    // Legacy fallback
    legacy_cache_path(skill_id).exists()
}

/// Full validity check: cache exists AND source file has not been modified since caching.
pub fn has_valid_translation(skill_id: &str, source_path: &Path) -> Result<bool> {
    let path = new_cache_path(skill_id);
    if !path.exists() {
        // No new-format cache; check legacy (treat as stale, will be rebuilt on next translate)
        return Ok(legacy_cache_path(skill_id).exists());
    }

    let cached: CachedTranslation = serde_json::from_str(&std::fs::read_to_string(&path)?)?;
    let current = modified_iso(source_path)?;
    Ok(cached.source_modified >= current)
}

/// Read cached translation content. Returns `None` when no cache exists.
pub fn read_translation(skill_id: &str) -> Result<Option<String>> {
    // Try new format first
    let new_path = new_cache_path(skill_id);
    if new_path.exists() {
        let cached: CachedTranslation =
            serde_json::from_str(&std::fs::read_to_string(&new_path)?)?;
        return Ok(Some(cached.content));
    }

    // Legacy format fallback
    let legacy_path = legacy_cache_path(skill_id);
    if legacy_path.exists() {
        return Ok(Some(std::fs::read_to_string(&legacy_path)?));
    }

    Ok(None)
}

/// Save translation to cache, recording the source file's mtime for staleness checks.
pub fn save_translation(skill_id: &str, content: &str, source_path: &Path) -> Result<()> {
    let path = new_cache_path(skill_id);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let source_modified = modified_iso(source_path)?;
    let cached = CachedTranslation {
        source_modified,
        content: content.to_string(),
    };
    std::fs::write(&path, serde_json::to_string_pretty(&cached)?)?;

    // Clean up legacy format if it exists
    let legacy = legacy_cache_path(skill_id);
    if legacy.exists() {
        let _ = std::fs::remove_file(&legacy);
    }
    Ok(())
}

/// Delete translation cache
pub fn delete_translation(skill_id: &str) -> Result<()> {
    let path = new_cache_path(skill_id);
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    // Also clean up legacy
    let legacy = legacy_cache_path(skill_id);
    if legacy.exists() {
        std::fs::remove_file(&legacy)?;
    }
    Ok(())
}

/// Translate SKILL body to Chinese (placeholder — uses a basic approach)
pub fn translate_to_chinese(text: &str) -> String {
    // TODO: In v1, this is a placeholder that wraps the text.
    // Future: integrate with Claude API or local translation engine.
    format!(
        "<!-- 自动翻译 (Chinese translation) -->\n\n{}",
        text
    )
}

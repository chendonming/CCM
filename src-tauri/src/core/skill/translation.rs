use crate::core::types::Result;

const CCM_CACHE_DIR: &str = ".claude-ccm";
const TRANSLATIONS_DIR: &str = "translations";

fn cache_dir() -> std::path::PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());
    std::path::PathBuf::from(home).join(CCM_CACHE_DIR).join(TRANSLATIONS_DIR)
}

/// Get the path where a translation cache file would be stored
pub fn translation_cache_path(skill_id: &str) -> std::path::PathBuf {
    cache_dir().join(format!("{}.zh.md", skill_id))
}

/// Check if a translation cache exists
pub fn has_translation(skill_id: &str) -> bool {
    translation_cache_path(skill_id).exists()
}

/// Read cached translation
pub fn read_translation(skill_id: &str) -> Result<Option<String>> {
    let path = translation_cache_path(skill_id);
    if path.exists() {
        Ok(Some(std::fs::read_to_string(&path)?))
    } else {
        Ok(None)
    }
}

/// Save translation to cache
pub fn save_translation(skill_id: &str, content: &str) -> Result<()> {
    let path = translation_cache_path(skill_id);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, content)?;
    Ok(())
}

/// Delete translation cache
pub fn delete_translation(skill_id: &str) -> Result<()> {
    let path = translation_cache_path(skill_id);
    if path.exists() {
        std::fs::remove_file(&path)?;
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

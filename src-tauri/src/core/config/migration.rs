use crate::core::types::AppConfig;

/// Migrate config from older versions to the latest format
pub fn migrate(config: &mut AppConfig) {
    match config.version.as_str() {
        "1" => {
            // v1 → v2: Built-in ~/.claude/skills source is now added
            // by load_config() automatically, so just bump version
            config.version = "2".to_string();
        }
        "2" => {
            // Current version — no migration needed
        }
        _ => {
            // Unknown version, reset to defaults
            *config = AppConfig::default();
        }
    }
}

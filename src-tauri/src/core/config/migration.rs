use crate::core::types::AppConfig;

/// Placeholder for future config version migration logic
pub fn migrate(config: &mut AppConfig) {
    match config.version.as_str() {
        "1" => {
            // Current version — no migration needed
        }
        _ => {
            // Unknown version, reset to defaults
            *config = AppConfig::default();
        }
    }
}

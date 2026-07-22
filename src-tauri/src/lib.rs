pub mod commands;
pub mod core;

use std::sync::Mutex;

pub struct AppState {
    pub initialized: Mutex<bool>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(AppState {
            initialized: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            // Skills
            commands::skills::list_skills,
            commands::skills::get_skill,
            commands::skills::deploy_skill,
            commands::skills::undeploy_skill,
            commands::skills::delete_entity,
            // Sources
            commands::sources::list_sources,
            commands::sources::add_source,
            commands::sources::remove_source,
            // Git import
            commands::git_import::import_from_github,
            commands::git_import::check_git_updates,
            commands::git_import::pull_skill,
            commands::git_import::list_projects,
            commands::git_import::add_project,
            commands::git_import::remove_project,
            // Translation
            commands::translation::translate_skill,
            commands::translation::force_translate_skill,
            commands::translation::get_translation,
            commands::translation::has_translation,
            // Memory
            commands::memory::scan_memory,
            commands::memory::get_reference_graph,
            commands::memory::delete_memory,
            // Editor
            commands::editor::get_skill_content,
            commands::editor::save_skill_content,
            commands::editor::create_new_skill,
            // Config
            commands::config::get_config,
            commands::config::update_config,
            commands::config::check_symlink_support,
            commands::config::get_symlink_help,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use crate::core::types::EntityType;

#[tauri::command]
pub async fn get_skill_content(path: String) -> Result<String, String> {
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(content)
}

#[tauri::command]
pub async fn save_skill_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn create_new_skill(
    name: String,
    description: String,
    category: String,
    entity_type: String,
    target_dir: String,
) -> Result<String, String> {
    let dir = std::path::PathBuf::from(&target_dir);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let entity_type = match entity_type.to_lowercase().as_str() {
        "agent" => EntityType::Agent,
        "rule" => EntityType::Rule,
        _ => EntityType::Skill,
    };

    let template = match entity_type {
        EntityType::Skill => crate::core::skill::template::generate_skill_template(&name, &description, &category),
        EntityType::Agent => crate::core::skill::template::generate_agent_template(&name, &description),
        EntityType::Rule => crate::core::skill::template::generate_rule_template(&name, &description),
    };

    let filename = match entity_type {
        EntityType::Skill => "SKILL.md",
        EntityType::Agent => "AGENT.md",
        EntityType::Rule => "RULE.md",
    };

    let skill_dir = dir.join(&name);
    std::fs::create_dir_all(&skill_dir).map_err(|e| e.to_string())?;
    let file_path = skill_dir.join(filename);
    std::fs::write(&file_path, &template).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

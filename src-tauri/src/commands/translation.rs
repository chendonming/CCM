#[tauri::command]
pub async fn translate_skill(skill_id: String, body: String) -> Result<String, String> {
    let translated = crate::core::skill::translation::translate_to_chinese(&body);
    crate::core::skill::translation::save_translation(&skill_id, &translated)
        .map_err(|e| e.to_string())?;
    Ok(translated)
}

#[tauri::command]
pub async fn force_translate_skill(skill_id: String, body: String) -> Result<String, String> {
    // Force re-translate by deleting cache first
    let _ = crate::core::skill::translation::delete_translation(&skill_id);
    let translated = crate::core::skill::translation::translate_to_chinese(&body);
    crate::core::skill::translation::save_translation(&skill_id, &translated)
        .map_err(|e| e.to_string())?;
    Ok(translated)
}

#[tauri::command]
pub async fn get_translation(skill_id: String) -> Result<Option<String>, String> {
    crate::core::skill::translation::read_translation(&skill_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn has_translation(skill_id: String) -> Result<bool, String> {
    Ok(crate::core::skill::translation::has_translation(&skill_id))
}

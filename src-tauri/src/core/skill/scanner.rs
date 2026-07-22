use crate::core::types::{
    ConflictInfo, DeployTarget, Deployment, Entity, EntityType, Language, ParsedSkill, Result,
    SourceDirectory,
};
use std::collections::HashSet;
use std::path::Path;

use super::parser;

/// Determine language from description text
fn detect_language(text: &str) -> Language {
    let has_cjk = text.chars().any(|c| {
        let range = c as u32;
        (0x4E00..=0x9FFF).contains(&range)
            || (0x3400..=0x4DBF).contains(&range)
            || (0x2E80..=0x2EFF).contains(&range)
    });

    if has_cjk {
        if text.chars().all(|c| c.is_ascii_alphanumeric() || c.is_whitespace() || c.is_ascii_punctuation()) {
            Language::En
        } else {
            Language::Bilingual
        }
    } else {
        Language::En
    }
}

/// Scan a single directory for SKILL.md files
pub fn scan_directory(dir: &Path, skip_ids: &[String]) -> Result<Vec<Entity>> {
    let mut entities = Vec::new();

    if !dir.exists() || !dir.is_dir() {
        return Ok(entities);
    }

    let entries = walkdir::WalkDir::new(dir)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_name().to_string_lossy().to_lowercase() == "skill.md"
                || e.file_name().to_string_lossy().to_lowercase() == "agent.md"
                || e.file_name().to_string_lossy().to_lowercase() == "rule.md"
        });

    for entry in entries {
        let path = entry.path().to_path_buf();
        let content = std::fs::read_to_string(&path)?;

        let parsed: ParsedSkill = parser::parse_skill_md(&content)?;
        let resource_dir = path.parent().unwrap_or(&path).to_path_buf();

        let entity_type = match entry.file_name().to_string_lossy().to_lowercase().as_str() {
            "agent.md" => EntityType::Agent,
            "rule.md" => EntityType::Rule,
            _ => EntityType::Skill,
        };

        let id = resource_dir
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| {
                path.file_stem()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default()
            });

        // Skip entities that are in the skip list
        if skip_ids.contains(&id) {
            continue;
        }

        let is_git_repo = is_git_repository(&resource_dir);
        let remote_url = if is_git_repo {
            get_remote_url(&resource_dir)
        } else {
            None
        };

        let language = detect_language(&parsed.description);

        let has_translation = crate::core::skill::translation::has_translation_cache(&id);

        entities.push(Entity {
            id,
            entity_type,
            name: parsed.name,
            description: parsed.description,
            source_path: path,
            resource_dir,
            deployments: vec![],
            language,
            has_translation,
            category: "未分类".to_string(),
            origin: parsed
                .metadata
                .and_then(|m| m.get("origin").and_then(|v| v.as_str().map(|s| s.to_string()))),
            updated_at: chrono::Utc::now(),
            is_git_repo,
            remote_url,
            body: parsed.body,
            is_builtin_source: false,
        });
    }

    Ok(entities)
}

/// Scan multiple source directories
pub fn collect_all_sources(sources: &[SourceDirectory]) -> Result<Vec<Entity>> {
    let mut all = Vec::new();
    for source in sources {
        let entities = scan_directory(&source.path, &source.skip_entity_ids)?;

        if source.is_builtin {
            for mut entity in entities {
                entity.is_builtin_source = true;
                entity.deployments = vec![Deployment {
                    target: DeployTarget::Global,
                    target_path: entity.resource_dir.clone(),
                    active: true,
                }];
                all.push(entity);
            }
        } else {
            all.extend(entities);
        }
    }
    Ok(all)
}

/// Check for name/id conflicts between a new source directory and existing entities,
/// as well as internal conflicts within the new source directory itself.
/// Returns (conflicts, total_entities_scanned, conflicted_new_entity_ids).
pub fn check_conflicts(
    new_source_dir: &Path,
    existing_entities: &[Entity],
) -> Result<(Vec<ConflictInfo>, usize, Vec<String>)> {
    let new_entities = scan_directory(new_source_dir, &[])?;
    let total_entities = new_entities.len();
    let mut conflicts = Vec::new();
    let mut conflicted_new_ids = HashSet::new();

    // Check internal conflicts within the new source directory
    for i in 0..new_entities.len() {
        for j in (i + 1)..new_entities.len() {
            if new_entities[i].name == new_entities[j].name {
                conflicts.push(ConflictInfo {
                    conflict_type: "name".to_string(),
                    value: new_entities[i].name.clone(),
                    new_path: new_entities[i].source_path.to_string_lossy().to_string(),
                    existing_path: new_entities[j].source_path.to_string_lossy().to_string(),
                });
                conflicted_new_ids.insert(new_entities[i].id.clone());
                conflicted_new_ids.insert(new_entities[j].id.clone());
            }
            if new_entities[i].id == new_entities[j].id {
                conflicts.push(ConflictInfo {
                    conflict_type: "id".to_string(),
                    value: new_entities[i].id.clone(),
                    new_path: new_entities[i].source_path.to_string_lossy().to_string(),
                    existing_path: new_entities[j].source_path.to_string_lossy().to_string(),
                });
                conflicted_new_ids.insert(new_entities[i].id.clone());
                conflicted_new_ids.insert(new_entities[j].id.clone());
            }
        }
    }

    // Check cross-source conflicts between new entities and existing entities
    for new_entity in &new_entities {
        if let Some(existing) = existing_entities.iter().find(|e| e.name == new_entity.name) {
            conflicts.push(ConflictInfo {
                conflict_type: "name".to_string(),
                value: new_entity.name.clone(),
                new_path: new_entity.source_path.to_string_lossy().to_string(),
                existing_path: existing.source_path.to_string_lossy().to_string(),
            });
            conflicted_new_ids.insert(new_entity.id.clone());
        }
        if let Some(existing) = existing_entities.iter().find(|e| e.id == new_entity.id) {
            conflicts.push(ConflictInfo {
                conflict_type: "id".to_string(),
                value: new_entity.id.clone(),
                new_path: new_entity.source_path.to_string_lossy().to_string(),
                existing_path: existing.source_path.to_string_lossy().to_string(),
            });
            conflicted_new_ids.insert(new_entity.id.clone());
        }
    }

    let conflicted_entity_ids: Vec<String> = conflicted_new_ids.into_iter().collect();
    Ok((conflicts, total_entities, conflicted_entity_ids))
}

/// Given a list of all entities, return the IDs of entities that have
/// name or id conflicts with another entity in the same list.
pub fn get_conflict_ids(entities: &[Entity]) -> Vec<String> {
    let mut conflicted: Vec<String> = Vec::new();

    for i in 0..entities.len() {
        for j in (i + 1)..entities.len() {
            if entities[i].name == entities[j].name {
                conflicted.push(entities[i].id.clone());
                conflicted.push(entities[j].id.clone());
            } else if entities[i].id == entities[j].id {
                conflicted.push(entities[i].id.clone());
                conflicted.push(entities[j].id.clone());
            }
        }
    }

    conflicted.sort();
    conflicted.dedup();
    conflicted
}

//// Check if a directory is inside a git repository
pub fn is_git_repository(dir: &Path) -> bool {
    let mut check_dir = Some(dir);
    while let Some(d) = check_dir {
        if d.join(".git").exists() {
            return true;
        }
        check_dir = d.parent();
    }
    false
}

/// Get the remote origin URL (SSH preferred)
fn get_remote_url(dir: &Path) -> Option<String> {
    let git_dir = find_git_dir(dir)?;
    let config_path = git_dir.join("config");
    let config = std::fs::read_to_string(config_path).ok()?;

    for line in config.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("url = ") {
            let url = trimmed.trim_start_matches("url = ");
            if url.contains("github.com") || url.contains("git@") {
                return Some(url.to_string());
            }
        }
    }
    None
}

fn find_git_dir(dir: &Path) -> Option<std::path::PathBuf> {
    let mut check_dir = Some(dir);
    while let Some(d) = check_dir {
        let git_dir = d.join(".git");
        if git_dir.exists() {
            return Some(git_dir);
        }
        check_dir = d.parent();
    }
    None
}

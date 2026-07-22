use crate::core::types::{MemoryEntry, Result};
use std::collections::HashMap;
use std::path::Path;

/// Build a reference map: for each entry name, which other entries reference it
pub fn build_reference_map(entries: &[MemoryEntry]) -> HashMap<String, Vec<String>> {
    let mut ref_map: HashMap<String, Vec<String>> = HashMap::new();

    for entry in entries {
        for referenced in &entry.references {
            ref_map
                .entry(referenced.clone())
                .or_default()
                .push(entry.name.clone());
        }
    }

    ref_map
}

/// Find orphan references — references pointing to entries that don't exist
pub fn find_orphans(entries: &[MemoryEntry]) -> Vec<String> {
    let existing_names: std::collections::HashSet<String> =
        entries.iter().map(|e| e.name.clone()).collect();

    let mut orphans = Vec::new();
    for entry in entries {
        for ref_name in &entry.references {
            if !existing_names.contains(ref_name) {
                orphans.push(format!(
                    "'{}' in '{}' references missing '{}'",
                    ref_name, entry.name, ref_name
                ));
            }
        }
    }

    orphans
}

/// Remove all references to a specific entry name from all memory files
pub fn cleanup_references(memory_dir: &Path, target_name: &str) -> Result<usize> {
    let mut cleaned_count = 0;

    let entries = walkdir::WalkDir::new(memory_dir)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_type().is_file()
                && e.path().extension().map_or(false, |ext| ext == "md")
                && e.file_name().to_string_lossy() != "MEMORY.md"
        });

    for entry in entries {
        let path = entry.path();
        let content = std::fs::read_to_string(path)?;

        // Check if this file contains a reference to target_name
        let reference_pattern = format!("[[{}", target_name);
        if content.contains(&reference_pattern) {
            // Remove [[target_name]] and [[target_name|display]] references
            let mut result = String::new();
            let mut rest = content.as_str();

            while let Some(start) = rest.find("[[") {
                result.push_str(&rest[..start]);
                rest = &rest[start + 2..];

                if let Some(end) = rest.find("]]") {
                    let link_content = &rest[..end];
                    let link_target = link_content.split('|').next().unwrap_or(link_content);

                    if link_target.trim() == target_name {
                        // Skip this reference — remove it
                        cleaned_count += 1;
                    } else {
                        // Keep the reference
                        result.push_str("[[");
                        result.push_str(link_content);
                        result.push_str("]]");
                    }
                    rest = &rest[end + 2..];
                } else {
                    result.push_str("[[");
                    result.push_str(rest);
                    break;
                }
            }

            result.push_str(rest);

            if result != content {
                std::fs::write(path, result)?;
            }
        }
    }

    Ok(cleaned_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_reference_map() {
        let entries = vec![
            MemoryEntry {
                id: "a".to_string(),
                file_path: std::path::PathBuf::from("a.md"),
                entry_type: "user".to_string(),
                name: "entry_a".to_string(),
                description: "".to_string(),
                content: "".to_string(),
                references: vec!["entry_b".to_string()],
                referenced_by: vec![],
            },
            MemoryEntry {
                id: "b".to_string(),
                file_path: std::path::PathBuf::from("b.md"),
                entry_type: "user".to_string(),
                name: "entry_b".to_string(),
                description: "".to_string(),
                content: "".to_string(),
                references: vec![],
                referenced_by: vec![],
            },
        ];

        let map = build_reference_map(&entries);
        assert_eq!(map.get("entry_b").unwrap(), &vec!["entry_a"]);
    }
}

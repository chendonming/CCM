use crate::core::types::{MemoryEntry, Result};
use std::path::Path;

/// Parse a memory file, extracting frontmatter, body, and wikilink references
pub fn parse_memory_file(path: &Path, content: &str) -> Result<MemoryEntry> {
    let content = content.trim_start();

    let (name, description, entry_type, body) = if content.starts_with("---") {
        // Has frontmatter
        let end = content[3..]
            .find("\n---")
            .map(|pos| pos + 3)
            .unwrap_or(0);

        let frontmatter_str = &content[3..end];
        let body = content[end + 4..].trim().to_string();

        let fm: serde_yaml::Value = serde_yaml::from_str(frontmatter_str)?;

        let name = fm
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let description = fm
            .get("description")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let entry_type = fm
            .get("metadata")
            .and_then(|m| m.get("type"))
            .and_then(|v| v.as_str())
            .unwrap_or("reference")
            .to_string();

        (name, description, entry_type, body)
    } else {
        // No frontmatter — use file stem as name
        let name = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let body = content.to_string();
        (name, String::new(), "reference".to_string(), body)
    };

    let references = parse_wikilinks(&body);
    let id = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(MemoryEntry {
        id,
        file_path: path.to_path_buf(),
        entry_type,
        name,
        description,
        content: body,
        references,
        referenced_by: vec![],
    })
}

/// Extract all [[wikilink]] references from text
pub fn parse_wikilinks(text: &str) -> Vec<String> {
    let mut links = Vec::new();
    let mut remaining = text;

    while let Some(start) = remaining.find("[[") {
        remaining = &remaining[start + 2..];
        if let Some(end) = remaining.find("]]") {
            let link = &remaining[..end];
            // Handle piped wikilinks: [[target|display]] -> target
            let target = link.split('|').next().unwrap_or(link).trim().to_string();
            if !target.is_empty() {
                links.push(target);
            }
            remaining = &remaining[end + 2..];
        } else {
            break;
        }
    }

    links
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_wikilinks_basic() {
        let text = "See [[user_role]] and [[feedback_testing]] for details.";
        let links = parse_wikilinks(text);
        assert_eq!(links, vec!["user_role", "feedback_testing"]);
    }

    #[test]
    fn test_parse_wikilinks_piped() {
        let text = "Check [[user|the user profile]].";
        let links = parse_wikilinks(text);
        assert_eq!(links, vec!["user"]);
    }

    #[test]
    fn test_parse_wikilinks_empty() {
        let text = "No links here.";
        let links = parse_wikilinks(text);
        assert!(links.is_empty());
    }
}

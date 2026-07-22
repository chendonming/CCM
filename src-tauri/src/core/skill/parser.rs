use crate::core::types::{ParsedSkill, Result};

/// Parse a SKILL.md file, extracting YAML frontmatter and body.
pub fn parse_skill_md(content: &str) -> Result<ParsedSkill> {
    let content = content.trim_start();

    if !content.starts_with("---") {
        // No frontmatter — treat entire content as body
        return Ok(ParsedSkill {
            name: String::new(),
            description: String::new(),
            metadata: None,
            body: content.to_string(),
        });
    }

    // Find closing ---
    let end = content[3..]
        .find("\n---")
        .map(|pos| pos + 3)
        .ok_or_else(|| crate::core::types::Error::InvalidPath(
            "Unclosed frontmatter delimiter".to_string()
        ))?;

    let frontmatter_str = &content[3..end];
    let body = content[end + 4..].trim().to_string();

    let frontmatter: serde_yaml::Value = serde_yaml::from_str(frontmatter_str)?;

    let name = frontmatter
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let description = frontmatter
        .get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let metadata = frontmatter.get("metadata").cloned();

    Ok(ParsedSkill {
        name,
        description,
        metadata,
        body,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_full_skill() {
        let content = r#"---
name: test-skill
description: A test skill
metadata:
  origin: ECC
---

# Test Skill

This is the body."#;

        let parsed = parse_skill_md(content).unwrap();
        assert_eq!(parsed.name, "test-skill");
        assert_eq!(parsed.description, "A test skill");
        assert!(parsed.body.contains("Test Skill"));
    }

    #[test]
    fn test_parse_no_frontmatter() {
        let content = "# Just body\n\nNo frontmatter here.";
        let parsed = parse_skill_md(content).unwrap();
        assert_eq!(parsed.name, "");
        assert_eq!(parsed.body, content);
    }

    #[test]
    fn test_parse_unclosed_frontmatter() {
        let content = "---\nname: broken";
        assert!(parse_skill_md(content).is_err());
    }
}

/// Generate a SKILL.md template with frontmatter
pub fn generate_skill_template(name: &str, description: &str, _category: &str) -> String {
    format!(
        r#"---
name: {name}
description: {description}
metadata:
  origin: user-created
---

# {name}

{description}

## Overview

<!-- Add your skill overview here -->

## Usage

<!-- Describe how to use this skill -->

## Examples

<!-- Add examples here -->
"#,
        name = name,
        description = description,
    )
}

/// Generate an AGENT.md template
pub fn generate_agent_template(name: &str, description: &str) -> String {
    format!(
        r#"---
name: "{name}"
description: "{description}"
metadata:
  origin: user-created
---

{description}
"#,
    )
}

/// Generate a RULE.md template
pub fn generate_rule_template(name: &str, description: &str) -> String {
    format!(
        r#"---
name: "{name}"
description: "{description}"
metadata:
  origin: user-created
---

{description}
"#,
    )
}

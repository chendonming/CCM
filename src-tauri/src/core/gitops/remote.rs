/// Parse and validate git remote URLs, especially SSH format
pub fn parse_ssh_url(url: &str) -> Option<ParsedSshUrl> {
    // git@github.com:user/repo.git
    if url.contains("git@") && url.contains(':') {
        let without_prefix = url.trim_start_matches("git@");
        let parts: Vec<&str> = without_prefix.splitn(2, ':').collect();
        if parts.len() == 2 {
            let host = parts[0].to_string();
            let path = parts[1].trim_end_matches(".git").to_string();
            return Some(ParsedSshUrl { host, path, full: url.to_string() });
        }
    }

    // https://github.com/user/repo.git
    if url.starts_with("https://") || url.starts_with("http://") {
        let path = url.trim_end_matches(".git").to_string();
        return Some(ParsedSshUrl {
            host: "remote".to_string(),
            path,
            full: url.to_string(),
        });
    }

    None
}

#[derive(Debug, Clone)]
pub struct ParsedSshUrl {
    pub host: String,
    pub path: String,
    pub full: String,
}

/// Extract a human-readable repo name from a remote URL
pub fn repo_name_from_url(url: &str) -> Option<String> {
    let parsed = parse_ssh_url(url)?;
    parsed.path.split('/').last().map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ssh_url() {
        let url = "git@github.com:user/my-skill.git";
        let parsed = parse_ssh_url(url).unwrap();
        assert_eq!(parsed.host, "github.com");
        assert_eq!(parsed.path, "user/my-skill");
        assert_eq!(repo_name_from_url(url).unwrap(), "my-skill");
    }

    #[test]
    fn test_parse_https_url() {
        let url = "https://github.com/user/my-skill.git";
        let parsed = parse_ssh_url(url).unwrap();
        assert_eq!(repo_name_from_url(url).unwrap(), "my-skill");
    }
}

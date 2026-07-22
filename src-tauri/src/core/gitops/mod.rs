pub mod remote;

use crate::core::types::{GitStatus, Result};
use std::path::Path;
use std::process::Command;

/// Clone a git repository via SSH URL into a target directory
pub fn clone_repo(url: &str, target_dir: &Path) -> Result<()> {
    let output = Command::new("git")
        .args(["clone", url])
        .arg(target_dir)
        .output()
        .map_err(|e| crate::core::types::Error::Git(format!("Failed to run git clone: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(crate::core::types::Error::Git(format!(
            "git clone failed: {}",
            stderr.trim()
        )));
    }

    Ok(())
}

/// Check if the local repo is behind its remote
pub fn check_remote_status(repo_path: &Path) -> Result<GitStatus> {
    // Fetch latest remote info
    let fetch_output = Command::new("git")
        .args(["-C"])
        .arg(repo_path)
        .args(["fetch", "--quiet"])
        .output()
        .map_err(|e| crate::core::types::Error::Git(format!("Failed to run git fetch: {}", e)))?;

    if !fetch_output.status.success() {
        return Ok(GitStatus::Unknown);
    }

    // Compare HEAD with remote HEAD
    let rev_output = match Command::new("git")
        .args(["-C"])
        .arg(repo_path)
        .args(["rev-list", "--count", "HEAD..origin/HEAD"])
        .output()
    {
        Ok(output) => output,
        Err(_) => return Ok(GitStatus::Unknown),
    };

    if rev_output.status.success() {
        let count_str = String::from_utf8_lossy(&rev_output.stdout);
        if let Ok(count) = count_str.trim().parse::<usize>() {
            if count > 0 {
                return Ok(GitStatus::Behind { commits: count });
            }
            return Ok(GitStatus::UpToDate);
        }
    }

    Ok(GitStatus::Unknown)
}

/// Pull latest changes from remote (fast-forward only)
pub fn pull_remote(repo_path: &Path) -> Result<()> {
    let output = Command::new("git")
        .args(["-C"])
        .arg(repo_path)
        .args(["pull", "--ff-only"])
        .output()
        .map_err(|e| crate::core::types::Error::Git(format!("Failed to run git pull: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(crate::core::types::Error::Git(format!(
            "git pull failed: {}",
            stderr.trim()
        )));
    }

    Ok(())
}

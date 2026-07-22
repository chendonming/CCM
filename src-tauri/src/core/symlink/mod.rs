pub mod windows;

use crate::core::types::Result;
use std::path::Path;

/// Create a symbolic link from source to target.
/// On Windows, this may require admin privileges or developer mode.
pub fn create_symlink(source: &Path, target: &Path) -> Result<()> {
    // Ensure parent directory exists
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Remove existing symlink/file at target if present
    if target.exists() || target.is_symlink() {
        remove_symlink(target)?;
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs as win_fs;
        if source.is_dir() {
            win_fs::symlink_dir(source, target)?;
        } else {
            win_fs::symlink_file(source, target)?;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::os::unix::fs::symlink(source, target)?;
    }

    Ok(())
}

/// Remove a symbolic link
pub fn remove_symlink(path: &Path) -> Result<()> {
    if path.is_symlink() || path.exists() {
        if path.is_dir() && path.is_symlink() {
            std::fs::remove_dir(path)?;
        } else {
            std::fs::remove_file(path)?;
        }
    }
    Ok(())
}

/// Check if symlink creation is possible (test by creating a temp symlink)
pub fn check_symlink_capability() -> bool {
    let temp_dir = std::env::temp_dir().join("ccm_symlink_test");
    let target = temp_dir.join("target");
    let link = temp_dir.join("link");

    let _ = std::fs::create_dir_all(&target);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs as win_fs;
        let result = win_fs::symlink_dir(&target, &link);
        let _ = std::fs::remove_file(&link);
        let _ = std::fs::remove_dir_all(&temp_dir);
        result.is_ok()
    }

    #[cfg(not(target_os = "windows"))]
    {
        let result = std::os::unix::fs::symlink(&target, &link);
        let _ = std::fs::remove_file(&link);
        let _ = std::fs::remove_dir_all(&temp_dir);
        result.is_ok()
    }
}

/// Find all symlinks in a directory pointing to a specific source path
pub fn find_symlinks_to(haystack: &Path, needle: &Path) -> Result<Vec<std::path::PathBuf>> {
    let mut results = Vec::new();

    if !haystack.exists() {
        return Ok(results);
    }

    let canonical_needle = std::fs::canonicalize(needle).unwrap_or_else(|_| needle.to_path_buf());

    let entries = walkdir::WalkDir::new(haystack)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path_is_symlink());

    for entry in entries {
        let link_path = entry.path();
        if let Ok(target) = std::fs::read_link(link_path) {
            let canonical_target =
                std::fs::canonicalize(&target).unwrap_or_else(|_| target.to_path_buf());
            if canonical_target == canonical_needle {
                results.push(link_path.to_path_buf());
            }
        }
    }

    Ok(results)
}

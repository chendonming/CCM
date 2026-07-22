pub mod graph;
pub mod parser;

use crate::core::types::{MemoryEntry, Result};
use std::path::Path;

/// Scan a memory directory and parse all memory files
pub fn scan_memory_dir(dir: &Path) -> Result<Vec<MemoryEntry>> {
    let mut entries = Vec::new();

    if !dir.exists() || !dir.is_dir() {
        return Ok(entries);
    }

    let files = walkdir::WalkDir::new(dir)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() && e.path().extension().map_or(false, |ext| ext == "md"))
        .filter(|e| {
            // Skip MEMORY.md index file, focus on individual memory files
            e.file_name().to_string_lossy() != "MEMORY.md"
        });

    for file in files {
        let path = file.path().to_path_buf();
        let content = std::fs::read_to_string(&path)?;
        let entry = parser::parse_memory_file(&path, &content)?;
        entries.push(entry);
    }

    // Resolve references — build bidirectional map
    let ref_map = graph::build_reference_map(&entries);
    for entry in &mut entries {
        entry.referenced_by = ref_map.get(&entry.id).cloned().unwrap_or_default();
    }

    Ok(entries)
}

/// Delete a memory entry and clean up references to it
pub fn delete_memory_entry(memory_dir: &Path, entry_id: &str) -> Result<usize> {
    // Find the file for this entry
    let entries = scan_memory_dir(memory_dir)?;
    let target = entries.iter().find(|e| e.id == entry_id);

    if let Some(entry) = target {
        // Remove references to this entry from other files
        let cleaned = graph::cleanup_references(memory_dir, &entry.name)?;

        // Delete the file itself
        std::fs::remove_file(&entry.file_path)?;

        Ok(cleaned)
    } else {
        Err(crate::core::types::Error::NotFound(format!(
            "Memory entry '{}' not found",
            entry_id
        )))
    }
}

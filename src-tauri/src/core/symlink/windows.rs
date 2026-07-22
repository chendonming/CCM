use crate::core::types::Result;

/// Windows-specific symlink handling
/// On Windows, creating symlinks requires either:
/// 1. Administrator privileges (SeCreateSymbolicLinkPrivilege)
/// 2. Windows 10+ Developer Mode enabled

/// Check if the current process has sufficient symlink privileges
pub fn check_windows_symlink_privilege() -> bool {
    // Try creating a test symlink — this is the most reliable check
    super::check_symlink_capability()
}

/// Get a human-readable message about symlink requirements
pub fn symlink_help_message() -> String {
    "需要在 Windows 上创建符号链接。请选择以下方式之一：

1. **启用开发者模式**（推荐）：
   设置 → 隐私和安全性 → 开发者选项 → 开发者模式

2. **以管理员身份运行此应用**

3. 或者跳过此检查，稍后在设置中重新配置。"
        .to_string()
}

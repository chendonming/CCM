# Claude Code Manager (CCM) — 需求与架构文档

> 基于 2026-07-22 的 grilling 会话输出，
> 技术栈：Rust + Tauri 2 + React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand + React Router + CodeMirror

---

## 一、应用概述

Claude Code Manager 是一个桌面应用，用于集中管理 Claude Code 的 SKILL、Memory、AGENTS、RULES 等配置实体，支持全局级和项目级的符号链接部署、远程 SKILL 导入、翻译缓存、Memory 引用图分析等功能。

**核心原则**：全局管理器，一个应用管所有。不依赖当前工作目录。

---

## 二、核心概念与数据模型

### 2.1 实体 (Entity)

SKILL、AGENT、RULE 三类实体共享同一套管理引擎，在前端通过类型标签区分。每个实体对应一个 `SKILL.md` / `AGENT.md` / `RULE.md` 文件。

```typescript
// TypeScript 表示（与 Rust 端类型一一对应）
type EntityType = 'skill' | 'agent' | 'rule';
type Language = 'zh' | 'en' | 'bilingual';
type DeployTarget = { type: 'global' } | { type: 'project'; projectRoot: string };
type GitStatus = 'up_to_date' | 'behind' | 'unknown';

interface Entity {
  id: string;                    // 唯一标识，从 resource_dir 的文件名推断
  entity_type: EntityType;
  name: string;                  // 来自 frontmatter name
  description: string;           // 来自 frontmatter description
  source_path: string;           // <resource_dir>/SKILL.md 的绝对路径
  resource_dir: string;          // SKILL.md 所在目录（用于 deploy 创建链接时的源）
  deployments: Deployment[];     // 所有部署位置（可同时部署到全局 + 多个项目）
  language: Language;            // 根据描述文字自动检测
  has_translation: boolean;      // 是否存在翻译缓存
  category: string;              // 用户手动指定，自定义 + 内置预设
  origin: string | null;         // 来源标识（如 "ECC"、"user-created"）
  updated_at: string;
  is_git_repo: boolean;          // 是否在 git 仓库中——决定编辑器只读
  remote_url: string | null;     // git remote origin URL（如有）
  body: string;                  // SKILL.md frontmatter 后的正文内容
}

interface Deployment {
  target: DeployTarget;          // 全局 或 指定项目根路径
  target_path: string;           // 符号链接的实际目标路径
  active: boolean;               // 符号链接是否存在
}
```

### 2.2 源目录 (SourceDirectory)

SKILL 文件的物理存放位置。应用扫描这些目录，发现其中的 `SKILL.md`、`AGENT.md`、`RULE.md` 文件。源目录可能是 git 仓库的一部分（如 ECC 项目的 `skills/` 目录），也可能是用户独立的收集目录。

```typescript
interface SourceDirectory {
  id: string;
  name: string;    // 显示名称，如 "ECC"
  path: string;    // 物理目录绝对路径
}
```

### 2.3 部署目标 (DeployTarget)

- **全局部署**：在 `~/.claude/skills/` 下创建符号链接
- **项目级部署**：在 `<project-root>/.claude/skills/` 下创建符号链接

```typescript
interface DeployableProject {
  name: string;        // 显示名称
  root_path: string;   // 项目根路径
}
```

### 2.4 Memory 条目

```typescript
interface MemoryEntry {
  id: string;
  file_path: string;
  entry_type: string;      // "user" | "project" | "feedback" | "reference"
  name: string;
  description: string;
  content: string;
  references: string[];    // 此文件中的 [[wikilink]] → 其他条目的 name
  referenced_by: string[]; // 其他文件中引用此条目的 [[name]]
}
```

### 2.5 应用配置 (~/.claude-ccm/config.json)

```typescript
interface AppConfig {
  version: string;
  source_directories: SourceDirectory[];
  deployable_projects: DeployableProject[];
  categories: string[];          // 内置预设 + 用户自定义分类
  ui_preferences: UiPreferences;
}
```

---

## 三、页面结构与路由

```
布局：侧边栏 + 主内容区，全屏覆盖

/                    → 重定向到 /skills
/skills              → SKILL 汇总列表（带筛选：分类/语言/搜索）
/skills/:id          → SKILL 详情（元数据、预览、翻译、部署状态、Git 状态）
/skills/:id/edit     → CodeMirror 编辑器（git 仓库中的实体只读）
/skills/new          → 新建 SKILL（表单：名称/描述/分类/类型/目标目录）
/skills/import       → 从 GitHub SSH 导入
/sources             → 源目录管理（CRUD）
/sources/:id         → 源目录详情（该源下的所有实体列表）
/memory              → Memory 列表 + 引用分析
/memory/:id          → Memory 详情 + 引用图 + 删除+自动清理
/agents              → AGENTS 管理（引导到 SKILL 页，filter 为 agent）
/rules               → RULES 管理（引导到 SKILL 页，filter 为 rule）
/settings            → 设置（符号链接检测、可部署项目管理、关于信息）
```

---

## 四、核心功能流程

### 4.1 SKILL 部署流程

1. 用户在 SKILL 详情页点击"部署"
2. 弹出对话框，选择目标类型：全局 / 项目级
3. 如果选择项目级，从已配置的项目列表中选择项目根路径
4. 确认 → Rust 后端调用 `std::os::windows::fs::symlink_*` 创建符号链接
5. 符号链接路径：
   - 全局：`~/.claude/skills/<resource-dir-name>/SKILL.md` → `<source_path>`
   - 项目：`<project-root>/.claude/skills/<resource-dir-name>/SKILL.md` → `<source_path>`
6. 前端刷新部署状态
7. 取消部署：移除符号链接（`std::fs::remove_file`/`remove_dir`）

### 4.2 导入远程 SKILL

1. 用户在导入页面输入 SSH URL（如 `git@github.com:user/repo.git`）
2. 选择目标目录
3. Rust 后端调用 `git clone <url> <target-dir>`
4. 完成后自动扫描目标目录，发现所有 SKILL.md
5. 显示结果，用户可选择部署哪些

### 4.3 检测远程更新

1. 启动时 + 手动触发
2. 对每个 `is_git_repo` 的实体，执行 `git fetch`
3. 比较 `HEAD..origin/HEAD` 的 commit 数
4. 如果落后，在 UI 展示 "有更新" 标记
5. 用户点击"同步" → 执行 `git pull --ff-only`
6. **永远以远程为主**，本地修改会被覆盖（但 git 仓库中的实体编辑器只读，所以不会有冲突）

### 4.4 翻译管理

1. 手动触发，SKILL 详情页点击"翻译为中文"
2. 读取 SKILL.md 全文，通过（待集成的）翻译引擎转换
3. 缓存到 `~/.claude-ccm/translations/<skill-id>.zh.md`
4. 展示"有翻译"标记 + 可切换查看中/英内容
5. 支持"强制重新翻译"选项

### 4.5 Memory 引用图

1. 指定 `~/.claude/memory/` 目录（或其他目录）
2. 扫描所有 `.md` 文件，跳过 `MEMORY.md` 索引
3. 解析每个文件的 frontmatter 和 `[[wikilink]]` 引用
4. 构建双向引用图：`references`（本文件→外部） + `referenced_by`（外部→本文件）
5. 孤立引用检测：引用指向不存在的条目 → 展示警告
6. **删除条目时自动清理引用**：遍历所有文件，移除包含 `[[target-name]]` 或 `[[target-name|display]]` 的行

### 4.6 Windows 符号链接权限

- 启动时检测：尝试创建临时符号链接
- 如果失败，弹窗提示：
  - "启用开发者模式"（`ms-settings:developers`）
  - "以管理员身份运行"（`tauri-plugin-process` 重启）
- 用户选择后存储偏好到 `config.ui_preferences.skip_symlink_check`

---

## 五、Rust 后端架构

### 5.1 模块结构

```
src-tauri/src/
├── main.rs              # 入口（调用 lib::run()）
├── lib.rs               # Tauri Builder + 命令注册 + AppState
├── core/                # 业务逻辑（无 Tauri 依赖，可单元测试）
│   ├── mod.rs
│   ├── types.rs         # 所有共享类型、枚举、Error 定义
│   ├── skill/
│   │   ├── mod.rs
│   │   ├── parser.rs    # SKILL.md frontmatter 解析（YAML --- 分隔符）
│   │   ├── scanner.rs   # 递归扫描源目录，检测 git 状态
│   │   ├── template.rs  # 新建实体的模板生成
│   │   └── translation.rs # 翻译缓存读写 ~/.claude-ccm/translations/
│   ├── symlink/
│   │   ├── mod.rs       # 符号链接创建/删除/检测/查找
│   │   └── windows.rs   # Windows 权限检测与帮助文案
│   ├── gitops/
│   │   ├── mod.rs       # git clone / fetch / status / pull
│   │   └── remote.rs    # SSH URL 解析
│   ├── memory/
│   │   ├── mod.rs       # 扫描目录 + 删除条目+清理引用
│   │   ├── parser.rs    # Memory 文件解析 + wikilink 提取
│   │   └── graph.rs     # 引用图构建 + 孤立引用检测
│   └── config/
│       ├── mod.rs       # ~/.claude-ccm/config.json CRUD
│       └── migration.rs # 配置版本迁移（预留）
└── commands/            # Tauri 命令桥接层
    ├── mod.rs
    ├── skills.rs        # list_skills, get_skill, deploy_skill, undeploy_skill
    ├── sources.rs       # list/add/remove_source
    ├── git_import.rs    # import_from_github, check_git_updates, pull_skill, list/add/remove_project
    ├── translation.rs   # (force_)translate_skill, get/has_translation
    ├── memory.rs        # scan_memory, get_reference_graph, delete_memory
    ├── editor.rs        # get/save_skill_content, create_new_skill
    └── config.rs        # get/update_config, check_symlink_support
```

### 5.2 技术选型

| 需求 | 选择 |
|------|------|
| 序列化 | serde + serde_json + serde_yaml |
| 错误处理 | anyhow（应用级）+ thiserror（库级） |
| 时间 | chrono |
| 目录遍历 | walkdir |
| Git 操作 | 调用系统 `git` CLI（`std::process::Command`），不内嵌 git2 |
| 异步 | tokio（Tauri 命令默认 async） |

---

## 六、React 前端架构

### 6.1 状态管理（Zustand）

四个独立的 store：
- `useSkillsStore` — 实体列表、筛选、部署操作
- `useSourcesStore` — 源目录 CRUD
- `useMemoryStore` — Memory 列表、引用图、删除
- `useConfigStore` — 应用配置读写

### 6.2 组件树

```
src/
├── main.tsx
├── App.tsx                    # TooltipProvider + RouterProvider
├── routes/index.tsx           # 路由定义
├── routes/Skills.tsx          实体列表页（含筛选/搜索/骨架屏/空状态）
├── routes/SkillDetail.tsx     实体详情（预览/翻译/部署/Git 状态）
├── routes/SkillEditor.tsx     CodeMirror 编辑器
├── routes/SkillNew.tsx        新建实体表单
├── routes/SkillImport.tsx     GitHub 导入表单
├── routes/Sources.tsx         源目录管理
├── routes/SourceDetail.tsx    源目录详情
├── routes/Memory.tsx          Memory 扫描 + 引用分析
├── routes/MemoryDetail.tsx    Memory 详情 + 引用图 + 删除
├── routes/Agents.tsx          引导至 SKILL 页
├── routes/Rules.tsx           引导至 SKILL 页
├── routes/Settings.tsx        设置（符号链接、项目、关于）
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      侧边栏 + Outlet
│   │   └── Sidebar.tsx        导航栏（含导入按钮）
│   └── ui/                    shadcn/ui 组件库
├── stores/                    Zustand stores
├── types/index.ts             前端 TypeScript 类型
├── lib/utils.ts               cn() 工具函数
└── index.css                  Tailwind CSS 入口
```

### 6.3 状态与错误处理约定

所有列表页面统一处理三种状态：
- **Loading**：使用 `<Skeleton>` 骨架屏
- **Empty**：图标 + 说明文字 + 引导操作
- **Error**：错误信息展示

---

## 七、与 grilling 核对的关键决策

| # | 决策 | 结论 |
|---|------|------|
| 1 | MVP 核心 | SKILL 管理器 |
| 2 | 部署方式 | 统一符号链接（不复制） |
| 3 | 启/禁用语义 | 启用=创建符号链接，禁用=移除符号链接 |
| 4 | 翻译触发 | 手动按钮 + 强制重新翻译选项 |
| 5 | 翻译缓存位置 | `~/.claude-ccm/translations/` |
| 6 | 分类方式 | 用户手动指定，内置预设 + 自由标签 |
| 7 | 远程 SKILL 更新 | 通知用户 + 手动同步，永远以远程为主 |
| 8 | Git 仓库中的编辑 | 只读展示，不可编辑 |
| 9 | 项目发现 | 手动添加项目根路径 |
| 10 | 源目录 vs 项目概念 | 源目录是 SKILL 物理存放位置，项目是部署目标 |
| 11 | 应用形态 | 独立窗口 + 系统托盘，非常驻 |
| 12 | 文件监听 | 不需要，手动刷新足够 |
| 13 | 符号链接权限 | 启动时弹窗让用户选择（开发者模式/管理员） |
| 14 | Memory 引用 | 完整 CRUD + 引用图 + 删除时自动清理 |
| 15 | AGENTS/RULES | 同一管理引擎，类型标签区分 |
| 16 | 构建工具 | Cargo 单 crate + Vite |
| 17 | 状态管理 | Zustand |
| 18 | React Router | 需要，支持多页面路由 |

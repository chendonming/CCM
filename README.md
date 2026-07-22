# Claude Code Manager (CCM)

> 一站式管理 Claude Code 的 SKILL、AGENT、RULE 与 Memory 配置的桌面应用

<br />

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Rust-2021-000000?logo=rust" alt="Rust 2021" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## 为什么需要这个项目？

[Claude Code](https://claude.ai/code) 通过 SKILL、AGENT、RULE 和 Memory 文件来扩展和定制 AI 助手的能力。然而，随着使用深入，管理这些配置文件会逐渐变得困难：

**分散的文件布局** — SKILL 文件可能分散在多个目录中：全局的 `~/.claude/skills/`、不同项目的 `.claude/skills/`、以及远程 Git 仓库（如 [ECC](https://github.com/tencent-ailab/ECC)）中的技能集合。手动跟踪这些文件的来源和状态几乎不可能。

**手动部署易出错** — 将一个 SKILL 从源目录"部署"到 Claude Code 需要使用正确的符号链接路径。手动创建符号链接容易出现路径错误、目标不存在、权限不足等问题。取消部署时又容易忘记清理。

**缺少可视化管理** — 没有集中的界面来浏览、搜索和筛选 SKILL 文件。你无法一目了然地看到哪些 SKILL 已部署、属于什么分类、支持哪些语言、是否来自 Git 仓库且有更新可用。

**Memory 引用难以维护** — Memory 文件之间通过 `[[wikilink]]` 相互引用。手动管理这些引用关系非常脆弱：删除一个被引用的条目时，所有指向它的链接都会变成死链，但没有任何工具能帮你发现或清理它们。

**跨语言翻译管理** — 中文和英文 SKILL 的翻译文件需要手动维护，缺乏统一的缓存和查看机制。

**导入远程 SKILL 门槛高** — 从 GitHub 等平台导入远程 SKILL 需要手动执行 `git clone`，确定仓库中的 SKILL 文件位置，再逐个部署——繁琐且容易遗漏。

---

## 项目价值

**Claude Code Manager** 正是为解决上述痛点而设计的桌面应用。作为 Claude Code 的**全局配置管理中心**，它不依赖任何特定的工作目录，一个应用管理所有配置。

### 核心能力

| 功能 | 价值 |
|------|------|
| **实体管理** | 统一发现和管理所有 SKILL、AGENT、RULE 文件，支持按分类、语言、关键词筛选 |
| **符号链接部署** | 一键部署到全局或指定项目，取消部署自动清理，避免手动操作的错误 |
| **远程 SKILL 导入** | 通过 SSH URL 从 GitHub 克隆仓库，自动扫描发现的 SKILL 文件 |
| **Git 更新检测** | 自动检测 Git 仓库中的实体是否有远程更新，一键拉取同步 |
| **翻译缓存** | 将 SKILL 翻译为中文并缓存，支持中/英内容切换查看 |
| **Memory 引用图** | 扫描 Memory 目录，解析 `[[wikilink]]` 引用关系，构建双向引用图；删除条目时自动清理死链 |
| **内置编辑器** | 基于 CodeMirror 的内置编辑器，支持 YAML/Markdown 语法高亮；Git 仓库实体只读展示，防止意外修改 |
| **多页面路由** | SKILL、AGENT、RULE 各有独立管理页面，配置管理路径清晰 |

### 适用场景

- **Claude Code 重度用户** — 积累了大量的自定义 SKILL 和 Memory，需要一套工具来管理它们
- **团队协作** — 通过共享的远程仓库管理和分发 SKILL，确保团队成员使用最新版本
- **跨项目管理** — 同时在多个项目中使用 Claude Code，需要在不同项目级别部署不同的 SKILL 组合
- **ECC 用户** — 从 ECC 等远程仓库导入 SKILL，并跟踪更新

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| [React 19](https://react.dev/) | UI 框架 |
| [TypeScript 6](https://www.typescriptlang.org/) | 类型安全 |
| [Vite 8](https://vitejs.dev/) | 构建工具 |
| [Tailwind CSS 4](https://tailwindcss.com/) | 样式系统 |
| [shadcn/ui (base-nova)](https://ui.shadcn.com/) | 组件库 |
| [Zustand](https://github.com/pmndrs/zustand) | 状态管理 |
| [React Router](https://reactrouter.com/) | 路由 |
| [CodeMirror](https://codemirror.net/) | 代码编辑器 |
| [lucide-react](https://lucide.dev/) | 图标 |

### 后端

| 技术 | 用途 |
|------|------|
| [Rust](https://www.rust-lang.org/) | 系统编程语言 |
| [Tauri 2](https://v2.tauri.app/) | 桌面应用框架 |
| [serde / serde_yaml](https://serde.rs/) | 序列化 |
| [walkdir](https://github.com/BurntSushi/walkdir) | 目录遍历 |
| [tokio](https://tokio.rs/) | 异步运行时 |
| [anyhow / thiserror](https://docs.rs/anyhow/) | 错误处理 |

---

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                   CCM Desktop App                     │
│  ┌────────────────────────────────────────────────┐  │
│  │               React Frontend                     │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │ Skills  │ │ Memory   │ │ Settings/Sources│  │  │
│  │  │ Manager │ │ Grapher  │ │ Manager         │  │  │
│  │  └────┬────┘ └────┬─────┘ └────────┬────────┘  │  │
│  │       │           │                 │            │  │
│  │  ┌────┴───────────┴─────────────────┴────────┐  │  │
│  │  │         Zustand Stores (4 stores)          │  │  │
│  │  └────────────────┬───────────────────────────┘  │  │
│  └───────────────────┼─────────────────────────────┘  │
│                      │ Tauri IPC (invoke)              │
│  ┌───────────────────┼─────────────────────────────┐  │
│  │  ┌────────────────┴───────────────────────────┐  │  │
│  │  │         Rust Backend (commands/)             │  │  │
│  │  │  skills │ sources │ git_import │ memory     │  │  │
│  │  │  translation │ editor │ config              │  │  │
│  │  └────────────────┬───────────────────────────┘  │  │
│  │  ┌────────────────┴───────────────────────────┐  │  │
│  │  │       Core Logic (core/ — no Tauri dep)     │  │  │
│  │  │  parser │ scanner │ symlink │ gitops        │  │  │
│  │  │  memory/parser │ memory/graph │ config      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

更多技术细节请参阅 [docs/requirements.md](./docs/requirements.md)。

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://www.rust-lang.org/tools/install) >= 1.77
- [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

### 开发

```bash
# 安装前端依赖
npm install

# 启动开发模式（Web 端，不启动 Tauri 窗口）
npm run dev

# 启动 Tauri 桌面应用（带 HMR）
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

### 其他命令

```bash
npm run build          # TypeScript 检查 + Vite 构建
npm run lint           # Oxlint 代码检查
npm run preview        # Vite 预览构建产物
```

---

## 页面导航

| 路径 | 页面 | 说明 |
|------|------|------|
| `/skills` | SKILL 列表 | 按分类/语言/关键词筛选 |
| `/skills/:id` | SKILL 详情 | 预览、部署、翻译、Git 状态 |
| `/skills/:id/edit` | 编辑器 | CodeMirror 编辑（Git 仓库只读） |
| `/skills/new` | 新建 SKILL | 表单创建 |
| `/skills/import` | 远程导入 | 从 GitHub SSH URL 导入 |
| `/sources` | 源目录管理 | 添加/删除源目录 |
| `/sources/:id` | 源目录详情 | 该目录下的所有实体 |
| `/memory` | Memory 列表 | 扫描 + 引用分析 |
| `/memory/:id` | Memory 详情 | 引用图 + 删除并清理 |
| `/agents` | AGENTS | 引导至 SKILL 页并过滤 |
| `/rules` | RULES | 引导至 SKILL 页并过滤 |
| `/settings` | 设置 | 符号链接检测、项目管理 |

---

## 核心概念

### 实体 (Entity)

SKILL、AGENT、RULE 三类实体共享同一套管理引擎，通过文件命名区分 (`SKILL.md` / `AGENT.md` / `RULE.md`)。每个实体包含 YAML 前置元数据（frontmatter）和 Markdown 正文。

### 源目录 (Source Directory)

SKILL 文件的物理存放位置。CCM 扫描这些目录发现实体。源目录可以是本地文件夹，也可以是 Git 仓库的一部分。

### 部署 (Deployment)

部署本质是创建符号链接，使 Claude Code 能够发现 SKILL 文件：
- **全局部署**：符号链接到 `~/.claude/skills/<name>/`
- **项目级部署**：符号链接到 `<project-root>/.claude/skills/<name>/`

### Memory 与 wikilink

Memory 文件存储在 `~/.claude/memory/` 中，通过 `[[wikilink]]` 语法相互引用。CCM 构建双向引用图，在删除条目时自动清理所有指向它的引用。

---

## 配置存储

应用配置存储于 `~/.claude-ccm/config.json`，包括：
- 源目录列表
- 可部署项目列表
- 用户自定义分类
- UI 偏好

翻译缓存存储于 `~/.claude-ccm/translations/`。

---

## 许可

本项目基于 MIT 许可证开源。

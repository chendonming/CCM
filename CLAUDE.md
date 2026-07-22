# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (port 1420)
npm run build            # TypeScript check + Vite build
npm run lint             # Oxlint (React + TypeScript + OXC rules)
npm run tauri            # Tauri CLI
npm run tauri:devtools   # Start Tauri dev (desktop app with HMR)
npm run preview          # Vite preview
```

## Tech Stack

- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, shadcn/ui (base-nova), Zustand, React Router, CodeMirror
- **Backend**: Rust + Tauri 2, serde/serde_yaml, walkdir, chrono, tokio

## Architecture

**Claude Code Manager (CCM)** is a Tauri desktop app for managing Claude Code's SKILL, AGENT, RULE, and Memory files across global and project-level installations.

### Key Concepts

- **Entity**: A SKILL.md, AGENT.md, or RULE.md file discovered by scanning source directories. All three types share the same management engine, differentiated by file name. Each entity has YAML frontmatter (name, description, metadata) and a body.
- **Source Directory**: Where entity files physically live (can be a git repo or local folder). App scans these to discover entities.
- **Deployment**: Creating a symlink from `~/.claude/skills/<name>/SKILL.md` (global) or `<project>/.claude/skills/<name>/SKILL.md` (project-level) pointing to the source file.
- **Memory**: Markdown files with frontmatter and `[[wikilink]]` cross-references, stored in `~/.claude/memory/`. Supports bidirectional reference graph analysis.

### Rust Backend (`src-tauri/src/`)

```
lib.rs                  # Tauri Builder, command registration, AppState
core/
  types.rs              # Shared types (Entity, Deployment, MemoryEntry, AppConfig, etc.)
  skill/parser.rs       # YAML frontmatter parsing (--- delimiters)
  skill/scanner.rs      # Recursive directory scan, git detection, language detection
  skill/template.rs     # New-entity template generation
  skill/translation.rs  # Translation cache in ~/.claude-ccm/translations/
  symlink/              # Symlink create/remove, Windows permission detection
  gitops/               # Git clone/fetch/status/pull, SSH URL parsing
  memory/               # Memory scanning, wikilink parsing, reference graph
  config/               # ~/.claude-ccm/config.json CRUD + version migration
commands/               # Tauri command bridge (skills, sources, git_import, translation, memory, editor, config)
```

Core modules (`core/`) have no Tauri dependency and are unit-testable.

### React Frontend (`src/`)

```
App.tsx                 # TooltipProvider + RouterProvider
routes/index.tsx        # Route definitions (all under AppLayout)
routes/*.tsx            # Page components (Skills list, detail, editor, import, sources, memory, settings)
components/layout/      # AppLayout (sidebar + Outlet), Sidebar (navigation with nav items)
components/ui/          # shadcn/ui components (button, card, dialog, table, tabs, etc.)
stores/                 # Zustand stores (useSkillsStore, useSourcesStore, useMemoryStore, useConfigStore)
types/index.ts          # Frontend TS types matching Rust backend types
lib/utils.ts            # cn() utility (clsx + tailwind-merge)
```

### State Management (Zustand)

Four independent stores, each with loading/error states:

- **useSkillsStore**: Entity list, category/language/search filtering, deploy/undeploy
- **useSourcesStore**: Source directory CRUD
- **useMemoryStore**: Memory scan, reference graph, delete with cleanup
- **useConfigStore**: App config read/write

### UI State Conventions

All list pages handle three states: Loading (Skeleton), Empty (icon + guidance), Error (error message display).

## Config Storage

App configuration lives at `~/.claude-ccm/config.json` — not environment variables or `.env` files. Config includes source directories, deployable projects, categories, and UI preferences.

## Path Aliases

`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

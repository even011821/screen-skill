# screen-skill

`screen-skill` is a portable agent skill for generating modular data-screen dashboards, command-center pages, cockpit screens, KPI dashboards, map-centric screens, and ECharts visualization pages.

The repository root is the skill package. `SKILL.md` is the entrypoint, and the bundled `kit/`, `layout/`, `runtime/`, `themes/`, and `references/` folders are loaded on demand by compatible agents.

## Install

Replace `even011821/screen-skill` only if you fork this repository.

### Codex

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- codex
```

Windows PowerShell:

```powershell
$script="$env:TEMP\install-screen-skill.ps1"
irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent codex
```

Manual path:

```text
~/.codex/skills/screen-skill
```

### Claude Code

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- claude
```

Windows PowerShell:

```powershell
$script="$env:TEMP\install-screen-skill.ps1"
irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent claude
```

Manual path:

```text
~/.claude/skills/screen-skill
```

### Hermes Agent

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- hermes
```

Windows PowerShell:

```powershell
$script="$env:TEMP\install-screen-skill.ps1"
irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent hermes
```

Manual path:

```text
~/.hermes/skills/screen-skill
```

### OpenCode

OpenCode uses Markdown agent files rather than `SKILL.md` discovery. The installer clones the full skill package and creates a small wrapper agent at `~/.config/opencode/agents/screen-skill.md`.

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- opencode
```

Windows PowerShell:

```powershell
$script="$env:TEMP\install-screen-skill.ps1"
irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent opencode
```

Manual paths:

```text
~/.config/opencode/skills/screen-skill
~/.config/opencode/agents/screen-skill.md
```

### Install Everywhere

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- all
```

Windows PowerShell:

```powershell
$script="$env:TEMP\install-screen-skill.ps1"
irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent all
```

## Update

Run the same install command again. If the target directory is already a git repository, the installer runs `git pull --ff-only`.

## Manual Download

Download a release archive:

```text
https://github.com/even011821/screen-skill/archive/refs/tags/v0.1.0.zip
```

Then unzip it into the target agent skill directory and make sure the final path contains:

```text
screen-skill/SKILL.md
```

## Usage

Codex, Claude Code, and Hermes can load the skill from its installed `SKILL.md` directory. In Hermes, installed skills are also available as slash commands in new sessions.

For OpenCode, invoke the wrapper agent with `@screen-skill`.

## Package Contents

```text
SKILL.md
agents/
kit/
layout/
references/
runtime/
themes/
adapters/
install.sh
install.ps1
```

## Safety

This repository should contain only the `screen-skill` package. Do not publish parent folders such as `.codex`, `.generated`, unrelated skills, local config files, credentials, or generated user workspaces.

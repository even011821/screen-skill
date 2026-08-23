# screen-skill

`screen-skill` is a portable agent skill for generating modular data-screen dashboards, command-center pages, cockpit screens, KPI dashboards, map-centric screens, and ECharts visualization pages.

The repository root is the skill package. `SKILL.md` is the entrypoint, and the bundled `kit/`, `layout/`, `runtime/`, `themes/`, and `references/` folders are loaded on demand by compatible agents.

中文用户可直接查看 [豆包、Kimi、WorkBuddy 与通用国产 Agent 安装说明](docs/install-cn-agents.md)。

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

### Kimi Code

Kimi Code supports directory-form Agent Skills. Install to its user-level Skills directory:

macOS, Linux, or WSL:

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- kimi

Windows PowerShell:

    $script="$env:TEMP\install-screen-skill.ps1"
    irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
    powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent kimi

Default path:

    ~/.kimi-code/skills/screen-skill

Restart the Kimi Code session, then invoke /skill:screen-skill or describe a data-screen task normally.

### WorkBuddy

The recommended method is WorkBuddy's local Skill package upload: clone or download this complete repository, then upload the screen-skill folder or ZIP from **Experts · Skills · Connectors → Add Skill → Upload Skill**.

Optional direct local-directory install:

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- workbuddy

Windows PowerShell:

    $script="$env:TEMP\install-screen-skill.ps1"
    irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
    powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent workbuddy

If the current WorkBuddy build does not discover the local directory, use the upload workflow above.

### Doubao-powered and other domestic Agents

Doubao is a model/service family rather than one fixed local Skill host. For Volcengine AgentKit or another Agent using a Doubao model, install the complete repository into a directory the host can read, then configure the host to load SKILL.md or adapters/generic/AGENTS.md.

Generic shared directory:

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- generic

Custom directory:

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- generic /absolute/path/to/screen-skill

Do not copy only SKILL.md: generation also needs layout/, kit/, themes/, runtime/, references/, and scripts/.

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
https://github.com/even011821/screen-skill/archive/refs/heads/main.zip
```

Then unzip it into the target agent skill directory and make sure the final path contains:

```text
screen-skill/SKILL.md
```

## Usage

Codex, Claude Code, Hermes, Kimi Code, and compatible domestic Agents can load the skill from its installed `SKILL.md` directory. In Hermes and Kimi Code, installed skills are also available as slash commands in new sessions.

For OpenCode, invoke the wrapper agent with `@screen-skill`.

For prompt-only or custom Agent hosts, use this bootstrap instruction:

    Treat <skill-directory> as skillRoot. Read SKILL.md completely, choose the correct mode,
    then read only the files routed by that entrypoint. If browser or screenshot capability
    is unavailable, complete static validation and report the missing higher validation levels.

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
docs/
scripts/
install.sh
install.ps1
```

## Safety

This repository should contain only the `screen-skill` package. Do not publish parent folders such as `.codex`, `.generated`, unrelated skills, local config files, credentials, or generated user workspaces.

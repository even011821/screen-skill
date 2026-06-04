param(
  [ValidateSet("codex", "claude", "claude-code", "hermes", "hermes-agent", "opencode", "open-code", "all")]
  [string]$Agent = "codex"
)

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/even011821/screen-skill.git"

function Clone-OrUpdate {
  param([Parameter(Mandatory=$true)][string]$Dest)

  $parent = Split-Path -Parent $Dest
  New-Item -ItemType Directory -Force -Path $parent | Out-Null

  if (Test-Path (Join-Path $Dest ".git")) {
    git -C $Dest pull --ff-only
  } elseif (Test-Path $Dest) {
    throw "Install path exists but is not a git repo: $Dest"
  } else {
    git clone --depth 1 $RepoUrl $Dest
  }
}

function Install-Codex {
  Clone-OrUpdate (Join-Path $HOME ".codex\skills\screen-skill")
}

function Install-Claude {
  Clone-OrUpdate (Join-Path $HOME ".claude\skills\screen-skill")
}

function Install-Hermes {
  Clone-OrUpdate (Join-Path $HOME ".hermes\skills\screen-skill")
}

function Install-OpenCode {
  $skillDir = Join-Path $HOME ".config\opencode\skills\screen-skill"
  $agentDir = Join-Path $HOME ".config\opencode\agents"
  $agentFile = Join-Path $agentDir "screen-skill.md"

  Clone-OrUpdate $skillDir
  New-Item -ItemType Directory -Force -Path $agentDir | Out-Null
  Copy-Item -LiteralPath (Join-Path $skillDir "adapters\opencode\screen-skill.md") -Destination $agentFile -Force
  Write-Host "Installed OpenCode wrapper: $agentFile"
}

switch ($Agent) {
  "codex" { Install-Codex }
  { $_ -in @("claude", "claude-code") } { Install-Claude }
  { $_ -in @("hermes", "hermes-agent") } { Install-Hermes }
  { $_ -in @("opencode", "open-code") } { Install-OpenCode }
  "all" {
    Install-Codex
    Install-Claude
    Install-Hermes
    Install-OpenCode
  }
}

Write-Host "screen-skill installed for: $Agent"

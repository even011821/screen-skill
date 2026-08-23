#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/even011821/screen-skill.git"
AGENT="${1:-codex}"
DESTINATION="${2:-}"
if [ -z "$DESTINATION" ] && [ -n "${SCREEN_SKILL_DEST:-}" ]; then
  DESTINATION="$SCREEN_SKILL_DEST"
fi

usage() {
  cat <<'USAGE'
Usage:
  install.sh codex
  install.sh claude
  install.sh hermes
  install.sh opencode
  install.sh kimi
  install.sh workbuddy
  install.sh generic [destination]
  install.sh all
USAGE
}

clone_or_update() {
  local dest="$1"
  mkdir -p "$(dirname "$dest")"
  if [ -d "$dest/.git" ]; then
    git -C "$dest" pull --ff-only
  elif [ -e "$dest" ]; then
    echo "Install path exists but is not a git repo: $dest" >&2
    exit 1
  else
    git clone --depth 1 "$REPO_URL" "$dest"
  fi
}

install_codex() {
  clone_or_update "$HOME/.codex/skills/screen-skill"
}

install_claude() {
  clone_or_update "$HOME/.claude/skills/screen-skill"
}

install_hermes() {
  clone_or_update "$HOME/.hermes/skills/screen-skill"
}

install_opencode() {
  local skill_dir="$HOME/.config/opencode/skills/screen-skill"
  local agent_dir="$HOME/.config/opencode/agents"
  local agent_file="$agent_dir/screen-skill.md"
  clone_or_update "$skill_dir"
  mkdir -p "$agent_dir"
  cp "$skill_dir/adapters/opencode/screen-skill.md" "$agent_file"
  echo "Installed OpenCode wrapper: $agent_file"
}

install_kimi() {
  local kimi_home="${KIMI_CODE_HOME:-$HOME/.kimi-code}"
  clone_or_update "$kimi_home/skills/screen-skill"
}

install_workbuddy() {
  clone_or_update "$HOME/.workbuddy/skills/screen-skill"
  echo "If WorkBuddy does not discover the folder automatically, upload this folder from its Skills UI."
}

install_generic() {
  local dest="${DESTINATION:-$HOME/.agents/skills/screen-skill}"
  clone_or_update "$dest"
  echo "Generic install ready: $dest"
  echo "Configure the host Agent to load $dest/SKILL.md or $dest/adapters/generic/AGENTS.md."
}

case "$AGENT" in
  codex) install_codex ;;
  claude|claude-code) install_claude ;;
  hermes|hermes-agent) install_hermes ;;
  opencode|open-code) install_opencode ;;
  kimi|kimi-code) install_kimi ;;
  workbuddy|work-buddy) install_workbuddy ;;
  generic|agents|portable) install_generic ;;
  all)
    install_codex
    install_claude
    install_hermes
    install_opencode
    install_kimi
    install_workbuddy
    install_generic
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac

echo "screen-skill installed for: $AGENT"

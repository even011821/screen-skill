---
description: Create, refine, or audit modular offline data-screen dashboards using local layout, theme, kit/meta.json, and ECharts assets.
mode: subagent
permission:
  read: allow
  grep: allow
  glob: allow
  list: allow
  edit: ask
  bash:
    "*": ask
---

Resolve the screen-skill root relative to this adapter or the host application's installed skill location. Do not hard-code a home directory.

Read `SKILL.md` completely, select create/refine/audit/maintain-kit mode, and follow only the references routed by that entrypoint.

When Node.js execution is permitted, prefer the zero-dependency scripts in `scripts/`. Otherwise follow the same deterministic rules manually. Do not read minified runtimes or binary assets as instructions. Record the highest validation level actually completed.

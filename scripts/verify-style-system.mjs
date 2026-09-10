#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const renderEnabled = process.argv.includes("--render");
const steps = [
  { id: "metadata-sync-before", args: ["scripts/sync-style-metadata.mjs", "--write"] },
  { id: "catalog-audit", args: ["scripts/audit-catalogs.mjs"] },
  { id: "profile-audit", args: ["scripts/audit-style-profiles.mjs"] },
  { id: "shell-runtime-audit", args: ["scripts/audit-shell-runtime.mjs", "--write-meta"] },
  { id: "metadata-sync-after", args: ["scripts/sync-style-metadata.mjs", "--write"] },
  { id: "regression", args: ["scripts/run-regression.mjs"] }
];
if (renderEnabled) steps.push({ id: "profile-previews", args: ["docs/style-profile-review/render-style-comparisons.mjs"] });

const results = [];
let failed = false;
for (const step of steps) {
  const execution = spawnSync(process.execPath, step.args, {
    cwd: skillRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
    env: process.env
  });
  const result = {
    id: step.id,
    command: `node ${step.args.join(" ")}`,
    status: execution.status === 0 ? "pass" : "fail",
    output: (execution.status === 0 ? execution.stdout : execution.stderr || execution.stdout).trim()
  };
  results.push(result);
  process.stdout.write(`${result.status.toUpperCase()} ${result.id}\n`);
  if (execution.status !== 0) {
    failed = true;
    break;
  }
}

const report = {
  schemaVersion: "1.0.0",
  generatedBy: "scripts/verify-style-system.mjs",
  renderEnabled,
  status: failed ? "fail" : "pass",
  steps: results
};
fs.writeFileSync(
  path.join(skillRoot, "references/style-system-verification.generated.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

if (failed) process.exit(1);

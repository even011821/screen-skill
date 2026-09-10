#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnabled = process.argv.includes("--runtime");
const errors = [];

function readJson(relativeOrAbsolute) {
  const target = path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.join(skillRoot, relativeOrAbsolute);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function runNode(argumentsList, label) {
  const result = spawnSync(process.execPath, argumentsList, {
    cwd: skillRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
    env: process.env
  });
  if (result.status !== 0) {
    errors.push(`${label} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
    return false;
  }
  return true;
}

for (const [script, label] of [
  [["scripts/audit-catalogs.mjs"], "catalog audit"],
  [["scripts/audit-style-profiles.mjs"], "style profile audit"],
  [["scripts/sync-style-metadata.mjs", "--check"], "style metadata sync"]
]) runNode(script, label);

if (runtimeEnabled) {
  runNode(["scripts/audit-shell-runtime.mjs", "--write-meta"], "shell runtime audit");
}

const config = readJson("references/style-profiles.json");
const expected = readJson("tests/expected/approved-profile-selections.json");
const profiles = new Map(config.profiles.map((profile) => [profile.id, profile]));
const briefDirectory = path.join(skillRoot, "tests/briefs");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "screen-regression-"));
const results = [];

try {
  for (const briefName of fs.readdirSync(briefDirectory).filter((name) => name.endsWith(".json")).sort()) {
    const briefPath = path.join(briefDirectory, briefName);
    const brief = readJson(briefPath);
    const profile = profiles.get(brief.styleProfile);
    const expectedSelection = expected[brief.styleProfile];
    if (!profile || !expectedSelection) {
      errors.push(`${briefName}: missing profile or expected selection`);
      continue;
    }
    const outputs = [1, 2].map((number) => path.join(temporaryDirectory, `${brief.styleProfile}-${number}.json`));
    for (const output of outputs) {
      runNode(["scripts/resolve-plan.mjs", "--brief", briefPath, "--output", output], `${briefName} resolve`);
    }
    if (!outputs.every((output) => fs.existsSync(output))) continue;
    const manifests = outputs.map((output) => readJson(output));
    const select = (manifest) => ({
      theme: manifest.selection.theme?.id,
      topNav: manifest.selection.topNav?.id,
      cardShellStyleLock: manifest.selection.cardShellStyleLock?.id,
      panelShell: manifest.selection.panelShell?.id,
      background: manifest.selection.background?.id
    });
    const actual = select(manifests[0]);
    const repeated = select(manifests[1]);
    if (JSON.stringify(actual) !== JSON.stringify(repeated)) errors.push(`${briefName}: repeated resolution is not deterministic`);
    if (JSON.stringify(actual) !== JSON.stringify(expectedSelection)) {
      errors.push(`${briefName}: selection drifted; expected ${JSON.stringify(expectedSelection)}, got ${JSON.stringify(actual)}`);
    }
    if (manifests[0].selection.styleProfile?.id !== profile.id) errors.push(`${briefName}: selected wrong profile`);
    const candidateChecks = [
      ["topNav", "topNavCandidates"],
      ["cardShellStyleLock", "cardShellCandidates"],
      ["panelShell", "panelShellCandidates"]
    ];
    for (const [selectedKey, candidateKey] of candidateChecks) {
      if (!profile[candidateKey].includes(actual[selectedKey])) errors.push(`${briefName}: ${actual[selectedKey]} is outside ${candidateKey}`);
    }
    if (!profile.backgroundCandidates.includes(actual.background)) errors.push(`${briefName}: background is outside approved profile`);
    if (manifests[0].fallbacks.length) errors.push(`${briefName}: unexpected fallback ${manifests[0].fallbacks.join(", ")}`);
    for (const asset of manifests[0].copyOnlyAssets) {
      if (!fs.existsSync(path.join(skillRoot, asset))) errors.push(`${briefName}: missing copy-only asset ${asset}`);
    }
    results.push({ brief: briefName, profile: profile.id, selection: actual, repeatable: JSON.stringify(actual) === JSON.stringify(repeated) });
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

const runtimeReportPath = path.join(skillRoot, "references/shell-runtime-audit.generated.json");
const runtimeReport = fs.existsSync(runtimeReportPath) ? readJson(runtimeReportPath) : null;
if (!runtimeReport) errors.push("missing references/shell-runtime-audit.generated.json");
else if (runtimeReport.summary.failedComponents !== 0) errors.push(`runtime report has ${runtimeReport.summary.failedComponents} failed components`);

const report = {
  schemaVersion: "1.0.0",
  generatedBy: "scripts/run-regression.mjs",
  runtimeExecuted: runtimeEnabled,
  summary: {
    briefs: results.length,
    expectedBriefs: Object.keys(expected).length,
    runtimeComponents: runtimeReport?.summary.components || 0,
    runtimeCases: runtimeReport?.summary.cases || 0,
    errors: errors.length,
    status: errors.length ? "fail" : "pass"
  },
  results,
  errors
};
fs.writeFileSync(path.join(skillRoot, "references/regression-report.generated.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

if (errors.length) {
  process.stderr.write(errors.map((error) => `ERROR ${error}`).join("\n") + "\n");
  process.exit(1);
}
process.stdout.write(JSON.stringify(report.summary, null, 2) + "\n");

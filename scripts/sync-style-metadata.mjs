#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
const checkMode = args.has("--check") || !writeMode;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, relativePath), "utf8"));
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function writeOrCheck(relativePath, value, errors) {
  const target = path.join(skillRoot, relativePath);
  const expected = stableJson(value);
  const actual = fs.existsSync(target) ? fs.readFileSync(target, "utf8").replaceAll("\r\n", "\n") : null;
  if (actual === expected) return false;
  if (writeMode) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, "utf8");
  } else if (checkMode) {
    errors.push(`${relativePath} is out of sync; run node scripts/sync-style-metadata.mjs --write`);
  }
  return true;
}

function catalogEntries(catalogPath, basePath, key = "items") {
  return (readJson(catalogPath)[key] || []).map((item) => ({
    item,
    metaPath: path.posix.join(basePath, item.meta || item.path)
  }));
}

function membershipMap(profiles, field) {
  const result = new Map();
  for (const profile of profiles) {
    for (const id of profile[field] || []) {
      if (!result.has(id)) result.set(id, []);
      result.get(id).push(profile.id);
    }
  }
  for (const values of result.values()) values.sort();
  return result;
}

function routeMembership(routes) {
  const result = new Map();
  for (const route of routes) {
    for (const id of route.candidates || []) {
      if (!result.has(id)) result.set(id, []);
      result.get(id).push(route.id);
    }
  }
  for (const values of result.values()) values.sort();
  return result;
}

function assetList(meta) {
  if (Array.isArray(meta.assets)) return meta.assets.map((item) => typeof item === "string" ? item : item.file).filter(Boolean);
  if (!meta.assets || typeof meta.assets !== "object") return [];
  const files = [
    ...(meta.assets.localSvg || []),
    ...(meta.assets.localRaster || []),
    ...(meta.assets.files || [])
  ];
  const directory = String(meta.assets.directory || "").replaceAll("\\", "/");
  return files.map((file) => {
    const normalized = String(file).replaceAll("\\", "/");
    return directory && !normalized.startsWith(directory) ? path.posix.join(directory, normalized) : normalized;
  });
}

function inventoryRecord(meta, metaPath, membership, extra = {}) {
  return {
    id: meta.id,
    label: meta.label || meta.id,
    status: meta.status || "unknown",
    themes: meta.theme || [],
    size: meta.size || null,
    minSize: meta.minSize || null,
    maxSize: meta.maxSize || null,
    title: meta.header || meta.titleStyle || meta.titleOverlay || null,
    contentSlot: meta.adaptation?.contentSlot || null,
    adaptationLayout: meta.adaptation?.layout || null,
    backgroundMode: meta.adaptation?.backgroundMode || null,
    code: meta.code || null,
    assets: assetList(meta),
    approvedProfiles: membership,
    runtimeAudit: meta.runtimeAudit || null,
    metaPath,
    ...extra
  };
}

const config = readJson("references/style-profiles.json");
const profiles = config.profiles || [];
const errors = [];
const definitions = [
  { name: "topNav", field: "topNavCandidates", catalog: "kit/TopNav/catalog.json", base: "kit/TopNav" },
  { name: "cardShell", field: "cardShellCandidates", catalog: "kit/Shell/CardShell/catalog.json", base: "kit/Shell/CardShell" },
  { name: "panelShell", field: "panelShellCandidates", catalog: "kit/Shell/PanelShell/catalog.json", base: "kit/Shell/PanelShell" }
];
const inventory = {};
let touched = 0;

for (const definition of definitions) {
  const membership = membershipMap(profiles, definition.field);
  inventory[definition.name] = [];
  for (const { item, metaPath } of catalogEntries(definition.catalog, definition.base)) {
    const meta = readJson(metaPath);
    const approvedProfiles = membership.get(item.id) || membership.get(meta.id) || [];
    const updated = { ...meta, approvedProfiles };
    if (writeOrCheck(metaPath, updated, errors)) touched += 1;
    inventory[definition.name].push(inventoryRecord(updated, metaPath, approvedProfiles));
  }
  inventory[definition.name].sort((a, b) => a.id.localeCompare(b.id));
}

const kpiMembership = routeMembership(config.kpiRoutingCandidates || []);
inventory.kpi = [];
for (const { item, metaPath } of catalogEntries("kit/widget/kpi-card/catalog.json", "kit/widget/kpi-card", "styles")) {
  const meta = readJson(metaPath);
  const approvedKpiRoutes = kpiMembership.get(item.id) || kpiMembership.get(meta.id) || [];
  const updated = { ...meta, approvedKpiRoutes };
  if (writeOrCheck(metaPath, updated, errors)) touched += 1;
  inventory.kpi.push(inventoryRecord(updated, metaPath, [], {
    approvedKpiRoutes,
    dataShape: updated.dataShape || updated.summary?.dataShape || null,
    visualWeight: updated.visualWeight || updated.summary?.visualWeight || null
  }));
}
inventory.kpi.sort((a, b) => a.id.localeCompare(b.id));

const backgroundMembership = membershipMap(profiles, "backgroundCandidates");
const backgroundMeta = readJson("kit/background/meta.json");
const updatedBackgroundMeta = {
  ...backgroundMeta,
  backgrounds: (backgroundMeta.backgrounds || []).map((item) => ({
    ...item,
    approvedProfiles: backgroundMembership.get(item.id) || []
  }))
};
if (writeOrCheck("kit/background/meta.json", updatedBackgroundMeta, errors)) touched += 1;
inventory.backgrounds = updatedBackgroundMeta.backgrounds
  .map((item) => ({
    id: item.id,
    status: item.status,
    themes: item.theme || [],
    file: item.file,
    cssFallback: item.cssFallback,
    approvedProfiles: item.approvedProfiles
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const report = {
  schemaVersion: "1.0.0",
  generatedBy: "scripts/sync-style-metadata.mjs",
  source: "references/style-profiles.json",
  counts: Object.fromEntries(Object.entries(inventory).map(([key, items]) => [key, items.length])),
  inventory
};
if (writeOrCheck("references/style-inventory.generated.json", report, errors)) touched += 1;

if (errors.length) {
  process.stderr.write(errors.map((error) => `ERROR ${error}`).join("\n") + "\n");
  process.exit(1);
}

process.stdout.write(JSON.stringify({
  mode: writeMode ? "write" : "check",
  touched,
  counts: report.counts,
  status: "ok"
}, null, 2) + "\n");

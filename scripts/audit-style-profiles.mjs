#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(skillRoot, relativePath), "utf8"));

function loadMetaIndex(catalogPath, basePath, key = "items") {
  const catalog = readJson(catalogPath);
  const index = new Map();
  for (const item of catalog[key] || []) {
    const metaPath = path.posix.join(basePath, item.meta || item.path);
    const meta = readJson(metaPath);
    index.set(item.id, { item, meta, metaPath });
    if (meta.id) index.set(meta.id, { item, meta, metaPath });
  }
  return index;
}

const config = readJson("references/style-profiles.json");
const indexes = {
  topNavCandidates: loadMetaIndex("kit/TopNav/catalog.json", "kit/TopNav"),
  cardShellCandidates: loadMetaIndex("kit/Shell/CardShell/catalog.json", "kit/Shell/CardShell"),
  panelShellCandidates: loadMetaIndex("kit/Shell/PanelShell/catalog.json", "kit/Shell/PanelShell")
};
const backgrounds = new Map(readJson("kit/background/meta.json").backgrounds.map((item) => [item.id, item]));
const kpi = loadMetaIndex("kit/widget/kpi-card/catalog.json", "kit/widget/kpi-card", "styles");
const errors = [];
let placements = 0;

for (const profile of config.profiles || []) {
  for (const [field, index] of Object.entries(indexes)) {
    const ids = profile[field] || [];
    placements += ids.length;
    if (new Set(ids).size !== ids.length) errors.push(`${profile.id}.${field} contains duplicates`);
    for (const id of ids) {
      const found = index.get(id);
      if (!found) {
        errors.push(`${profile.id}.${field}: missing ${id}`);
        continue;
      }
      if (found.item.status !== "ready" || !["ready", undefined].includes(found.meta.status)) {
        errors.push(`${profile.id}.${field}: ${id} is not ready`);
      }
      if (!(found.meta.theme || []).includes(profile.theme)) {
        errors.push(`${profile.id}.${field}: ${id} does not declare theme ${profile.theme}`);
      }
      if (!(found.meta.approvedProfiles || []).includes(profile.id)) {
        errors.push(`${profile.id}.${field}: ${id} meta is missing approvedProfiles membership`);
      }
    }
  }
  const backgroundIds = profile.backgroundCandidates || [];
  placements += backgroundIds.length;
  if (new Set(backgroundIds).size !== backgroundIds.length) errors.push(`${profile.id}.backgroundCandidates contains duplicates`);
  for (const id of backgroundIds) {
    const item = backgrounds.get(id);
    if (!item) errors.push(`${profile.id}.backgroundCandidates: missing ${id}`);
    else {
      if (!(item.theme || []).includes(profile.theme)) errors.push(`${profile.id}.backgroundCandidates: ${id} does not declare theme ${profile.theme}`);
      if (!(item.approvedProfiles || []).includes(profile.id)) errors.push(`${profile.id}.backgroundCandidates: ${id} is missing approvedProfiles membership`);
    }
  }
}

for (const route of config.kpiRoutingCandidates || []) {
  if (new Set(route.candidates || []).size !== (route.candidates || []).length) errors.push(`kpi route ${route.id} contains duplicates`);
  for (const id of route.candidates || []) {
    const found = kpi.get(id);
    if (!found) errors.push(`kpi route ${route.id}: missing ${id}`);
    else if (!(found.meta.approvedKpiRoutes || []).includes(route.id)) errors.push(`kpi route ${route.id}: ${id} meta is missing approvedKpiRoutes membership`);
  }
}

const uniqueComponents = new Set([
  ...(config.profiles || []).flatMap((profile) => [
    ...profile.topNavCandidates,
    ...profile.cardShellCandidates,
    ...profile.panelShellCandidates,
    ...profile.backgroundCandidates
  ])
]);
const uniqueKpi = new Set((config.kpiRoutingCandidates || []).flatMap((route) => route.candidates || []));

if (errors.length) {
  process.stderr.write(errors.map((item) => `ERROR ${item}`).join("\n") + "\n");
  process.exit(1);
}

process.stdout.write(JSON.stringify({
  profiles: config.profiles.length,
  profilePlacements: placements,
  uniqueProfileComponents: uniqueComponents.size,
  kpiRoutes: config.kpiRoutingCandidates.length,
  uniqueKpiStyles: uniqueKpi.size,
  status: "ok"
}, null, 2) + "\n");

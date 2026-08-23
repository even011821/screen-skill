#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

const skillPath = path.join(skillRoot, "SKILL.md");
const skillText = fs.readFileSync(skillPath, "utf8");
const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---\n/);
if (
  !frontmatter
  || !/^name:\s*screen-skill\s*$/m.test(frontmatter[1])
  || !/^description:\s*.+$/m.test(frontmatter[1])
) {
  errors.push("SKILL.md frontmatter 缺少有效的 name/description");
}
for (const match of skillText.matchAll(/\]\(([^)]+)\)/g)) {
  const target = match[1].split("#")[0];
  if (target && !/^(https?:|#)/.test(target)) exists(target, `SKILL.md link -> ${target}`);
}

const openaiPath = path.join(skillRoot, "agents/openai.yaml");
if (fs.existsSync(openaiPath)) {
  const yaml = fs.readFileSync(openaiPath, "utf8");
  if (!/^interface:\s*$/m.test(yaml)) errors.push("agents/openai.yaml 缺少 interface");
  if (!/^\s+display_name:\s*".+"/m.test(yaml)) errors.push("agents/openai.yaml 缺少带引号的 display_name");
  if (!/^\s+short_description:\s*".+"/m.test(yaml)) errors.push("agents/openai.yaml 缺少带引号的 short_description");
  if (!/^\s+default_prompt:\s*".*\$screen-skill.*"/m.test(yaml)) {
    errors.push("agents/openai.yaml default_prompt 必须显式包含 $screen-skill");
  }
} else {
  errors.push("缺少 agents/openai.yaml");
}

function readJson(relativePath) {
  const fullPath = path.join(skillRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function exists(relativePath, label = relativePath) {
  if (!relativePath || !fs.existsSync(path.join(skillRoot, relativePath))) {
    errors.push(`缺少文件: ${label}`);
    return false;
  }
  return true;
}

function checkCatalogItems(catalogPath, basePath, key = "items") {
  const catalog = readJson(catalogPath);
  if (!catalog) return [];
  const items = catalog[key] || [];
  for (const item of items) {
    const meta = item.meta || item.path;
    if (!meta) {
      errors.push(`${catalogPath}: ${item.id || "unknown"} 缺少 meta/path`);
      continue;
    }
    const metaPath = path.posix.join(basePath, meta);
    if (!exists(metaPath)) continue;
    const metaJson = readJson(metaPath);
    if (metaJson && item.id && metaJson.id && item.id !== metaJson.id) {
      errors.push(`${catalogPath}: item id ${item.id} 与 ${metaPath} 的 id ${metaJson.id} 不一致`);
    }
    if (!metaJson) continue;

    const metaDir = path.posix.dirname(metaPath);
    const declaredFiles = [
      metaJson.file,
      metaJson.pngFallback,
      metaJson.code?.html,
      ...(Array.isArray(metaJson.code?.css) ? metaJson.code.css : [metaJson.code?.css]),
      ...(Array.isArray(metaJson.assets)
        ? metaJson.assets.map((asset) => asset.file)
        : [])
    ].filter(Boolean);

    for (const declared of new Set(declaredFiles)) {
      exists(path.posix.normalize(path.posix.join(metaDir, declared)), `${metaPath} -> ${declared}`);
    }

    if (metaJson.assets && !Array.isArray(metaJson.assets)) {
      const directory = metaJson.assets.directory || "";
      const localFiles = [
        ...(metaJson.assets.local || []),
        metaJson.assets.runtimeGeoJson,
        metaJson.assets.sourceTopoJson
      ].filter(Boolean);
      for (const declared of localFiles) {
        const fromMeta = path.posix.normalize(path.posix.join(metaDir, directory, declared));
        const fromBranch = path.posix.normalize(path.posix.join(basePath, directory, declared));
        if (!fs.existsSync(path.join(skillRoot, fromMeta)) && !fs.existsSync(path.join(skillRoot, fromBranch))) {
          errors.push(`缺少文件: ${metaPath} -> ${declared}`);
        }
      }
    }
  }
  return items;
}

const kit = readJson("kit/catalog.json");
const topNav = checkCatalogItems("kit/TopNav/catalog.json", "kit/TopNav");
const cardShell = checkCatalogItems("kit/Shell/CardShell/catalog.json", "kit/Shell/CardShell");
const panelShell = checkCatalogItems("kit/Shell/PanelShell/catalog.json", "kit/Shell/PanelShell");
const kpi = checkCatalogItems("kit/widget/kpi-card/catalog.json", "kit/widget/kpi-card", "styles");
const maps = checkCatalogItems("kit/map/catalog.json", "kit/map");
const backgroundsMeta = readJson("kit/background/meta.json");
const backgrounds = backgroundsMeta?.backgrounds || [];

for (const background of backgrounds) {
  if (background.status === "ready") {
    exists(path.posix.join("kit/background", background.file), background.id);
  }
}

if (kit) {
  const expected = {
    TopNav: topNav.length,
    widget: kpi.length,
    map: maps.length,
    background: backgrounds.length
  };
  for (const branch of kit.branches || []) {
    if (branch.id in expected && branch.itemCount !== expected[branch.id]) {
      errors.push(`kit/catalog.json: ${branch.id}.itemCount=${branch.itemCount}，实际为 ${expected[branch.id]}`);
    }
    if (branch.id === "Shell") {
      const actual = cardShell.length + panelShell.length;
      if (branch.itemCount !== actual) {
        errors.push(`kit/catalog.json: Shell.itemCount=${branch.itemCount}，实际为 ${actual}`);
      }
    }
  }

  const instructionFiles = kit.instructionReadOrder || kit.readOrder || [];
  for (const item of instructionFiles) {
    if (/\.min\.js$|\.(png|jpe?g|gif|woff2?|ttf|geo\.json)$/i.test(item)) {
      errors.push(`instructionReadOrder 包含 copy-only 文件: ${item}`);
    }
  }
}

const layout = readJson("layout/catalog.json");
for (const item of layout?.layouts || []) {
  exists(path.posix.join("layout", item.rule));
  exists(path.posix.join("layout", item.guide));
  exists(path.posix.join("layout", item.variants));
}

const themes = readJson("themes/catalog.json");
for (const theme of themes?.themes || []) {
  exists(path.posix.join("themes", theme.file), theme.id);
}

const selectionGuide = path.join(skillRoot, "references/selection-guide.md");
if (fs.existsSync(selectionGuide) && /style01~style35/i.test(fs.readFileSync(selectionGuide, "utf8"))) {
  warnings.push("references/selection-guide.md 仍包含过期的 style01~style35 描述");
}

for (const warning of warnings) process.stdout.write(`WARN  ${warning}\n`);
for (const error of errors) process.stderr.write(`ERROR ${error}\n`);

if (errors.length) {
  process.stderr.write(`Catalog audit failed: ${errors.length} error(s), ${warnings.length} warning(s).\n`);
  process.exit(1);
}
process.stdout.write(`Catalog audit passed: ${topNav.length} TopNav, ${cardShell.length} CardShell, ${panelShell.length} PanelShell, ${kpi.length} KPI, ${backgrounds.length} backgrounds.\n`);

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screenDir = path.resolve(process.cwd(), process.argv[2] || "screen");
const errors = [];
const warnings = [];

function check(condition, message, level = "error") {
  if (condition) return;
  (level === "warning" ? warnings : errors).push(message);
}

function read(relativePath) {
  const target = path.join(screenDir, relativePath);
  try {
    return fs.readFileSync(target, "utf8");
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return "";
  }
}

function parseJsonFile(relativePath, required = true) {
  const target = path.join(screenDir, relativePath);
  if (!fs.existsSync(target)) {
    if (required) errors.push(`缺少 ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    errors.push(`${relativePath} JSON 无法解析: ${error.message}`);
    return null;
  }
}

function isRemote(value) {
  return /^(https?:)?\/\//i.test(value);
}

function localTarget(sourceFile, value) {
  const clean = value.split(/[?#]/)[0];
  if (!clean || clean.startsWith("#") || clean.startsWith("data:") || clean.startsWith("blob:")) return null;
  if (clean.startsWith("/")) return path.join(screenDir, clean.slice(1));
  return path.resolve(path.dirname(sourceFile), clean);
}

function validateReferences(sourceFile, content) {
  const refs = [];
  for (const match of content.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.push(match[1]);
  for (const match of content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.push(match[1]);
  for (const match of content.matchAll(/fetch\(\s*["']([^"']+)["']/gi)) refs.push(match[1]);

  for (const ref of refs) {
    if (isRemote(ref)) {
      errors.push(`standalone 页面包含远程运行资源: ${ref}`);
      continue;
    }
    const target = localTarget(sourceFile, ref);
    if (target && !fs.existsSync(target)) {
      errors.push(`资源不存在: ${path.relative(screenDir, sourceFile)} -> ${ref}`);
    }
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

check(fs.existsSync(screenDir), `目录不存在: ${screenDir}`);
if (!fs.existsSync(screenDir)) {
  process.stderr.write(errors.join("\n") + "\n");
  process.exit(1);
}

const indexPath = path.join(screenDir, "index.html");
check(fs.existsSync(indexPath), "缺少 index.html");
const indexHtml = fs.existsSync(indexPath) ? read("index.html") : "";
const manifest = parseJsonFile("build-manifest.json");
parseJsonFile("data/sample-data.json");

check(
  /window\.__SCREEN_DATA__|id\s*=\s*["']screen-data["']/i.test(indexHtml),
  "index.html 未内联数据，file:// 打开时可能为空"
);
check(/screen-root/i.test(indexHtml), "index.html 未找到 screen-root", "warning");

for (const file of walk(screenDir)) {
  const isInspectableText = /\.(html|css|js|mjs)$/i.test(file);
  const isCopyOnlyMinifiedRuntime = /\.min\.(js|mjs)$/i.test(file);
  if (isInspectableText && !isCopyOnlyMinifiedRuntime) {
    validateReferences(file, fs.readFileSync(file, "utf8"));
  }
}

if (manifest) {
  check(manifest.schemaVersion, "build-manifest.json 缺少 schemaVersion");
  check(manifest.selection?.layoutType, "build-manifest.json 缺少 selection.layoutType");
  check(manifest.selection?.layoutVariant, "build-manifest.json 缺少 selection.layoutVariant");
  check(Array.isArray(manifest.contentPlan), "build-manifest.json 缺少 contentPlan");

  const metaPaths = [
    manifest.selection?.topNav?.meta,
    manifest.selection?.cardShellStyleLock?.meta,
    manifest.selection?.panelShell?.meta
  ].filter(Boolean);
  for (const meta of metaPaths) {
    check(fs.existsSync(path.join(skillRoot, meta)), `manifest 引用的 kit meta 不存在: ${meta}`);
  }

  for (const resource of [
    ...(manifest.readNext || []),
    ...(manifest.runtimeFiles || []),
    ...(manifest.copyOnlyAssets || [])
  ]) {
    check(fs.existsSync(path.join(skillRoot, resource)), `manifest 引用的 Skill 资源不存在: ${resource}`);
  }
}

if (/echarts\.init\s*\(/.test(indexHtml)) {
  check(
    /initWhenReady|requestAnimationFrame/.test(indexHtml),
    "检测到直接 echarts.init，但未发现延迟初始化保护",
    "warning"
  );
}

for (const warning of warnings) process.stdout.write(`WARN  ${warning}\n`);
for (const error of errors) process.stderr.write(`ERROR ${error}\n`);

if (errors.length) {
  process.stderr.write(`Static validation failed: ${errors.length} error(s), ${warnings.length} warning(s).\n`);
  process.exit(1);
}
process.stdout.write(`Static validation passed for ${screenDir}: ${warnings.length} warning(s).\n`);

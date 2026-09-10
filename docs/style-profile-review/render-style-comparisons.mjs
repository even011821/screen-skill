#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(outputDir, "../..");
const profilePath = path.join(skillRoot, "references/style-profiles.json");
const profilesConfig = JSON.parse(fs.readFileSync(profilePath, "utf8"));
const browserPath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, relativePath), "utf8"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanGeneratedHtml(value) {
  return String(value).replace(/[ \t]+$/gm, "");
}

function portableAssetUrl(absolutePath) {
  return path.relative(outputDir, absolutePath)
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function rewriteCssUrls(css, cssPath) {
  const directory = path.dirname(cssPath);
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (match, quote, rawValue) => {
    const value = rawValue.trim();
    if (/^(data:|blob:|https?:|file:|#)/i.test(value)) return match;
    return `url("${portableAssetUrl(path.resolve(directory, value))}")`;
  });
}

function rewriteHtmlPaths(html, htmlPath) {
  const directory = path.dirname(htmlPath);
  return html.replace(/(src|href)=(['"])(?!data:|blob:|https?:|file:|#)([^'"]+)\2/gi, (match, attr, quote, value) => {
    return `${attr}=${quote}${portableAssetUrl(path.resolve(directory, value))}${quote}`;
  });
}

function catalogMetaMap(catalogPath, basePath, key = "items") {
  const result = new Map();
  for (const item of readJson(catalogPath)[key] || []) {
    const metaPath = path.posix.join(basePath, item.meta || item.path);
    result.set(item.id, { item, meta: readJson(metaPath), metaPath });
  }
  return result;
}

const maps = {
  topNav: catalogMetaMap("kit/TopNav/catalog.json", "kit/TopNav"),
  cardShell: catalogMetaMap("kit/Shell/CardShell/catalog.json", "kit/Shell/CardShell"),
  panelShell: catalogMetaMap("kit/Shell/PanelShell/catalog.json", "kit/Shell/PanelShell"),
  kpi: catalogMetaMap("kit/widget/kpi-card/catalog.json", "kit/widget/kpi-card", "styles")
};
const themes = new Map(readJson("themes/catalog.json").themes.map((item) => [item.id, item]));
const backgrounds = new Map(readJson("kit/background/meta.json").backgrounds.map((item) => [item.id, item]));

function componentSource(entry, kind) {
  const baseDirectory = path.dirname(path.join(skillRoot, entry.metaPath));
  const htmlName = entry.meta.code?.html;
  const cssNames = Array.isArray(entry.meta.code?.css) ? entry.meta.code.css : [entry.meta.code?.css];
  const htmlPath = path.resolve(baseDirectory, htmlName);
  const html = rewriteHtmlPaths(fs.readFileSync(htmlPath, "utf8"), htmlPath);
  const css = cssNames.filter(Boolean).map((name) => {
    const cssPath = path.resolve(baseDirectory, name);
    return rewriteCssUrls(fs.readFileSync(cssPath, "utf8"), cssPath);
  }).join("\n");
  return { html, css, kind };
}

function componentCard(id, map, kind) {
  const entry = map.get(id);
  if (!entry) throw new Error(`Missing component: ${id}`);
  const source = componentSource(entry, kind);
  const meta = entry.meta;
  const contentTop = meta.adaptation?.contentSlot?.top ?? meta.adaptation?.contentSlot?.y ?? 0;
  return `
    <article class="component-card">
      <div class="component-stage component-stage--${kind}">
        <style>${source.css}</style>
        ${source.html}
      </div>
      <div class="component-label"><strong>${escapeHtml(id)}</strong><span>内容起点 ${contentTop}px</span></div>
    </article>`;
}

function topNavCard(id) {
  const entry = maps.topNav.get(id);
  if (!entry) throw new Error(`Missing TopNav: ${id}`);
  const metaDirectory = path.dirname(path.join(skillRoot, entry.metaPath));
  const asset = path.resolve(metaDirectory, entry.meta.file || entry.meta.pngFallback);
  return `
    <article class="nav-card">
      <div class="nav-stage"><img src="${portableAssetUrl(asset)}" alt="${escapeHtml(id)}"></div>
      <div class="component-label"><strong>${escapeHtml(id)}</strong><span>${entry.meta.size?.w || "?"}×${entry.meta.size?.h || "?"}</span></div>
    </article>`;
}

function backgroundCard(id) {
  const item = backgrounds.get(id);
  if (!item) throw new Error(`Missing background: ${id}`);
  const asset = path.join(skillRoot, "kit/background", item.file);
  return `
    <article class="background-card">
      <img src="${portableAssetUrl(asset)}" alt="${escapeHtml(id)}">
      <div class="component-label"><strong>${escapeHtml(id)}</strong><span>${escapeHtml(item.cssFallback || "")}</span></div>
    </article>`;
}

function themeCss(themeId) {
  const theme = themes.get(themeId);
  const cssPath = path.join(skillRoot, "themes", theme.file);
  return rewriteCssUrls(fs.readFileSync(cssPath, "utf8"), cssPath);
}

function pageShell(title, subtitle, themeId, content) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${themeCss(themeId)}</style>
  <style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#030817;color:#edf8ff;font-family:"Microsoft YaHei",Arial,sans-serif}body{padding:34px;background:radial-gradient(circle at 50% -10%,color-mix(in srgb,var(--theme-primary) 20%,transparent),transparent 42%),linear-gradient(180deg,var(--bg-1,#07162d),var(--bg-0,#020817))}.page-title{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid color-mix(in srgb,var(--theme-primary) 45%,transparent)}h1{margin:0;font-size:31px;letter-spacing:2px}.page-title p{margin:0;color:var(--muted,#9eb6c8);font-size:15px}.section{margin-top:24px}.section h2{margin:0 0 12px;font-size:20px;color:var(--text,#fff)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.grid--two{grid-template-columns:repeat(2,minmax(0,1fr))}.component-card,.nav-card,.background-card{border:1px solid color-mix(in srgb,var(--theme-primary) 34%,transparent);background:rgba(2,9,22,.62);overflow:hidden;border-radius:4px}.component-stage{height:220px;padding:12px;display:grid;place-items:center;background:linear-gradient(160deg,rgba(255,255,255,.025),rgba(0,0,0,.08))}.component-stage--card>*{width:100%;height:100%}.component-stage--panel>*{width:100%;height:100%}.component-stage--kpi{height:150px}.component-stage--kpi>*{max-width:95%;max-height:130px}.component-stage .bs-card-shell__content,.component-stage .bs-panel-shell__content{position:relative}.component-stage .bs-card-shell__content:empty::after,.component-stage .bs-panel-shell__content:empty::after{content:"示例内容区  ·  趋势 / 列表 / 状态";position:absolute;inset:12px;display:grid;place-items:center;color:var(--muted,#9eb6c8);font-size:14px;border:1px dashed color-mix(in srgb,var(--theme-primary) 28%,transparent);background:linear-gradient(180deg,transparent,rgba(255,255,255,.025))}.nav-stage{height:100px;display:grid;place-items:center;background:#020817}.nav-stage img{display:block;width:100%;height:auto;max-height:100%;object-fit:fill}.background-card>img{display:block;width:100%;height:190px;object-fit:cover}.component-label{min-height:52px;padding:9px 11px;display:flex;gap:8px;flex-direction:column;border-top:1px solid rgba(255,255,255,.07)}.component-label strong{font-size:12px;word-break:break-all}.component-label span{font-size:12px;color:var(--muted,#9eb6c8)}.note{padding:12px 14px;border-left:3px solid var(--theme-primary);background:rgba(255,255,255,.035);color:var(--muted,#9eb6c8);font-size:14px}.footer{margin-top:24px;text-align:right;color:var(--dim,#72869a);font-size:12px}
  </style>
</head>
<body data-theme="${escapeHtml(themeId)}">
  <header class="page-title"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><p>真实本地组件 · 主题兼容候选</p></header>
  ${content}
  <footer class="footer">该页面展示已批准候选，并验证资源与主题匹配；规划器仍按布局和槽位确定单个组件。</footer>
</body>
</html>`;
}

function profilePage(profile) {
  const theme = themes.get(profile.theme);
  const content = `
    <div class="note">主题：${escapeHtml(theme.nameZh)} / ${escapeHtml(profile.theme)}　密度：${escapeHtml(profile.densityMode)}　当前状态：已批准候选</div>
    <section class="section"><h2>01 · TopNav 候选</h2><div class="grid">${profile.topNavCandidates.map(topNavCard).join("")}</div></section>
    <section class="section"><h2>02 · CardShell 候选</h2><div class="grid">${profile.cardShellCandidates.map((id) => componentCard(id, maps.cardShell, "card")).join("")}</div></section>
    <section class="section"><h2>03 · PanelShell 候选</h2><div class="grid">${profile.panelShellCandidates.map((id) => componentCard(id, maps.panelShell, "panel")).join("")}</div></section>
    <section class="section"><h2>04 · 背景候选</h2><div class="grid grid--two">${profile.backgroundCandidates.map(backgroundCard).join("")}</div></section>`;
  return pageShell(profile.label, profile.id, profile.theme, content);
}

function kpiPage() {
  const ids = [...new Set(profilesConfig.kpiRoutingCandidates.flatMap((rule) => rule.candidates))];
  const descriptions = new Map(profilesConfig.kpiRoutingCandidates.flatMap((rule) => rule.candidates.map((id) => [id, rule.match])));
  const cards = ids.map((id) => {
    const card = componentCard(id, maps.kpi, "kpi");
    return card.replace("</strong><span>", `</strong><span>${escapeHtml(descriptions.get(id))} · `);
  }).join("");
  const content = `<div class="note">KPI 不按主题固定，先按数据结构和槽位尺寸筛选，再做主题颜色验证。</div><section class="section"><h2>KPI 数据结构候选</h2><div class="grid">${cards}</div></section>`;
  return pageShell("KPI 组件对照", "按 dataShape 分组", "galaxy-azure", content);
}

async function render() {
  fs.mkdirSync(outputDir, { recursive: true });
  const pages = [];
  for (const profile of profilesConfig.profiles) {
    const htmlName = `${profile.id}.html`;
    const imageName = `${profile.id}.png`;
    fs.writeFileSync(path.join(outputDir, htmlName), cleanGeneratedHtml(profilePage(profile)), "utf8");
    pages.push({ label: profile.label, imageName, htmlName });
  }
  fs.writeFileSync(path.join(outputDir, "kpi-routing.html"), cleanGeneratedHtml(kpiPage()), "utf8");

  const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
  for (const item of pages) {
    await page.goto(pathToFileURL(path.join(outputDir, item.htmlName)).href, { waitUntil: "load" });
    await page.screenshot({ path: path.join(outputDir, item.imageName), fullPage: true });
  }
  await page.goto(pathToFileURL(path.join(outputDir, "kpi-routing.html")).href, { waitUntil: "load" });
  await page.screenshot({ path: path.join(outputDir, "kpi-routing.png"), fullPage: true });
  await browser.close();

  const thumbWidth = 760;
  const gap = 24;
  const titleHeight = 84;
  const images = [];
  for (const item of pages) {
    const buffer = await sharp(path.join(outputDir, item.imageName)).resize({ width: thumbWidth }).png().toBuffer();
    const metadata = await sharp(buffer).metadata();
    images.push({ ...item, buffer, width: metadata.width, height: metadata.height });
  }
  const rowHeights = [0, 1, 2].map((row) => Math.max(images[row * 2].height, images[row * 2 + 1].height));
  const canvasWidth = thumbWidth * 2 + gap * 3;
  const canvasHeight = titleHeight + rowHeights.reduce((sum, value) => sum + value, 0) + gap * 4;
  const titleSvg = Buffer.from(`<svg width="${canvasWidth}" height="${titleHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#020817"/><text x="24" y="48" fill="#f0f8ff" font-size="28" font-family="Microsoft YaHei">六套深色主题兼容候选池总览</text></svg>`);
  const composite = [{ input: titleSvg, left: 0, top: 0 }];
  let y = titleHeight + gap;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const image = images[row * 2 + column];
      composite.push({ input: image.buffer, left: gap + column * (thumbWidth + gap), top: y });
    }
    y += rowHeights[row] + gap;
  }
  await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: "#020817" } }).composite(composite).png().toFile(path.join(outputDir, "style-profile-overview.png"));

  const indexHtml = `<!doctype html><meta charset="utf-8"><title>样式候选审核</title><style>body{font-family:Microsoft YaHei;background:#08111f;color:#eef7ff;margin:28px}a{color:#69ccff}img{display:block;max-width:100%;margin:16px 0;border:1px solid #24405a}</style><h1>六套深色主题兼容候选池</h1><img src="style-profile-overview.png">${pages.map((item) => `<p><a href="${item.htmlName}">${item.label}</a> · <a href="${item.imageName}">PNG</a></p>`).join("")}<p><a href="kpi-routing.html">KPI 对照</a> · <a href="kpi-routing.png">KPI PNG</a></p>`;
  fs.writeFileSync(path.join(outputDir, "index.html"), cleanGeneratedHtml(indexHtml), "utf8");
  process.stdout.write(`Rendered ${pages.length} profile pages, KPI comparison and overview to docs/style-profile-review\n`);
}

render().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});

#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    result[key] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return result;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, relativePath), "utf8"));
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rewriteCssUrls(css, cssPath) {
  const directory = path.dirname(cssPath);
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (match, quote, rawValue) => {
    const value = rawValue.trim();
    if (/^(data:|blob:|https?:|file:|#)/i.test(value)) return match;
    return `url("${pathToFileURL(path.resolve(directory, value)).href}")`;
  });
}

function rewriteHtmlPaths(html, htmlPath) {
  const directory = path.dirname(htmlPath);
  return html.replace(/(src|href)=(["'])(?!data:|blob:|https?:|file:|#)([^"']+)\2/gi, (match, attribute, quote, value) => {
    return `${attribute}=${quote}${pathToFileURL(path.resolve(directory, value)).href}${quote}`;
  });
}

function catalogEntries(catalogPath, basePath) {
  return (readJson(catalogPath).items || []).map((item) => ({
    item,
    metaPath: path.posix.join(basePath, item.meta)
  }));
}

function uniqueSizes(meta) {
  const minimum = meta.minSize || meta.size;
  const base = meta.size || minimum;
  const maximum = meta.maxSize || { w: 1600, h: 900 };
  const stretched = {
    w: Math.min(maximum.w, Math.max(minimum.w, base.w, 640)),
    h: Math.min(maximum.h, Math.max(minimum.h, base.h, 360))
  };
  const seen = new Set();
  return [minimum, base, stretched]
    .filter(Boolean)
    .map((size) => ({ w: Number(size.w), h: Number(size.h) }))
    .filter((size) => {
      const key = `${size.w}x${size.h}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function findBrowser(explicit) {
  const candidates = [
    explicit,
    process.env.SCREEN_AUDIT_BROWSER,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/microsoft-edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function componentSource(entry) {
  const meta = readJson(entry.metaPath);
  const directory = path.dirname(path.join(skillRoot, entry.metaPath));
  const htmlPath = path.resolve(directory, meta.code.html);
  const cssNames = Array.isArray(meta.code.css) ? meta.code.css : [meta.code.css];
  const html = rewriteHtmlPaths(fs.readFileSync(htmlPath, "utf8"), htmlPath);
  const css = cssNames.filter(Boolean).map((name) => {
    const cssPath = path.resolve(directory, name);
    return rewriteCssUrls(fs.readFileSync(cssPath, "utf8"), cssPath);
  }).join("\n");
  const titleSelector = meta.slots?.find((slot) => slot.name === "title")?.selector
    || (meta.kind === "PanelShell" ? ".bs-panel-shell__title" : ".bs-card-shell__title");
  const contentSelector = meta.slots?.find((slot) => slot.name === "content")?.selector
    || (meta.kind === "PanelShell" ? ".bs-panel-shell__content" : ".bs-card-shell__content");
  return { meta, html, css, titleSelector, contentSelector };
}

function buildHarness(components) {
  const styles = components.map((component) => `<style>${component.css}</style>`).join("\n");
  const cases = components.flatMap((component) => uniqueSizes(component.meta).map((size) => `
    <div class="audit-viewport"
      data-id="${escapeHtml(component.meta.id)}"
      data-kind="${escapeHtml(component.meta.kind)}"
      data-meta="${escapeHtml(component.metaPath)}"
      data-width="${size.w}"
      data-height="${size.h}"
      data-title-selector="${escapeHtml(encodeURIComponent(component.titleSelector))}"
      data-content-selector="${escapeHtml(encodeURIComponent(component.contentSelector))}"
      data-content-slot="${escapeHtml(encodeURIComponent(JSON.stringify(component.meta.adaptation?.contentSlot || null)))}">
      ${component.html}
    </div>`)).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  ${styles}
  <style>
    *{box-sizing:border-box}html,body{margin:0;background:#07152b;color:#fff;font-family:"Alibaba PuHuiTi 2.0","Microsoft YaHei",sans-serif}.audit-viewport{position:relative;overflow:auto;contain:layout paint;margin:8px}.audit-viewport>section,.audit-viewport>div{position:relative}
  </style>
</head>
<body>${cases}
<script>
  const round = (value) => Math.round(value * 100) / 100;
  const numericZ = (element) => {
    if (!element) return 0;
    const value = Number.parseInt(getComputedStyle(element).zIndex, 10);
    return Number.isFinite(value) ? value : 0;
  };
  const capacity = (title, header, character) => {
    if (!title || !header) return null;
    let low = 0;
    let high = 128;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      title.textContent = character.repeat(middle);
      const titleRect = title.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const fits = title.scrollWidth <= title.clientWidth + 0.5
        && titleRect.right <= headerRect.right + 0.5
        && titleRect.bottom <= headerRect.bottom + 0.5;
      if (fits) low = middle;
      else high = middle - 1;
    }
    return low;
  };
  const measure = () => {
    const results = [];
    for (const viewport of document.querySelectorAll(".audit-viewport")) {
      const width = Number(viewport.dataset.width);
      const height = Number(viewport.dataset.height);
      viewport.style.width = width + "px";
      viewport.style.height = height + "px";
      const root = viewport.firstElementChild;
      viewport.replaceChildren(root);
      root.style.width = width + "px";
      root.style.height = height + "px";
      const title = root.querySelector(decodeURIComponent(viewport.dataset.titleSelector));
      const content = root.querySelector(decodeURIComponent(viewport.dataset.contentSelector));
      const header = root.querySelector(".bs-card-shell__header,.bs-panel-shell__header") || title?.parentElement;
      const frame = root.querySelector(".bs-card-shell__frame,.bs-card-shell__background,.bs-panel-shell__frame");
      const contentWrap = root.querySelector(".bs-card-shell__content-wrap,.bs-panel-shell__content-wrap,.bs-card-shell__body") || content?.parentElement;
      const expected = JSON.parse(decodeURIComponent(viewport.dataset.contentSlot));
      const originalTitle = title?.textContent || "";
      const rootRect = root.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const measured = contentRect ? {
        top: round(contentRect.top - rootRect.top),
        left: round(contentRect.left - rootRect.left),
        right: round(rootRect.right - contentRect.right),
        bottom: round(rootRect.bottom - contentRect.bottom),
        width: round(contentRect.width),
        height: round(contentRect.height)
      } : null;
      const slotDelta = expected && measured ? {
        top: round(measured.top - expected.top),
        left: round(measured.left - expected.left),
        right: round(measured.right - expected.right),
        bottom: round(measured.bottom - expected.bottom)
      } : null;
      const cjk = capacity(title, header, "中");
      const latinWide = capacity(title, header, "W");
      if (title) title.textContent = "超长标题容量与截断检查".repeat(16);
      const longTitleRect = title?.getBoundingClientRect();
      const titleOnTop = Boolean(!title || !frame
        || Math.max(numericZ(title), numericZ(header), numericZ(contentWrap)) > numericZ(frame));
      const longTitleAvailableWidth = title ? round(title.clientWidth) : null;
      const longTitleContained = !title || (
        title.scrollWidth >= title.clientWidth
        && longTitleRect.left >= rootRect.left - 1
        && longTitleRect.right <= rootRect.right + 1
        && longTitleRect.bottom <= rootRect.bottom + 1
      );
      const checks = {
        contentExists: Boolean(contentRect),
        contentPositive: Boolean(contentRect && contentRect.width > 0 && contentRect.height > 0),
        contentWithinRoot: Boolean(contentRect
          && contentRect.left >= rootRect.left - 1
          && contentRect.top >= rootRect.top - 1
          && contentRect.right <= rootRect.right + 1
          && contentRect.bottom <= rootRect.bottom + 1),
        contentSlotMatchesMeta: Boolean(slotDelta && Object.values(slotDelta).every((value) => Math.abs(value) <= 2)),
        headerSeparatedFromContent: Boolean(!headerRect || !contentRect || headerRect.bottom <= contentRect.top + 1),
        titleCapacityMeasurable: Boolean(!title || (cjk > 0 && latinWide > 0)),
        longTitleContained,
        titleNotObscured: titleOnTop,
        contentAboveFrame: Boolean(!frame || Math.max(numericZ(content), numericZ(contentWrap)) > numericZ(frame)),
        noHorizontalScrollbar: viewport.scrollWidth <= viewport.clientWidth + 2,
        noVerticalScrollbar: viewport.scrollHeight <= viewport.clientHeight + 2
      };
      if (title) title.textContent = originalTitle;
      results.push({
        id: viewport.dataset.id,
        kind: viewport.dataset.kind,
        metaPath: viewport.dataset.meta,
        size: { w: width, h: height },
        expectedContentSlot: expected,
        measuredContentSlot: measured,
        slotDelta,
        titleCapacity: {
          cjk,
          latinWide,
          recommendedMaxCjk: cjk === null ? null : Math.max(1, Math.floor(cjk * 0.85)),
          fontSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : null,
          availableWidth: longTitleAvailableWidth
        },
        viewportMetrics: {
          clientWidth: viewport.clientWidth,
          clientHeight: viewport.clientHeight,
          scrollWidth: viewport.scrollWidth,
          scrollHeight: viewport.scrollHeight
        },
        checks,
        status: Object.values(checks).every(Boolean) ? "pass" : "fail"
      });
    }
    const payload = encodeURIComponent(JSON.stringify({ userAgent: navigator.userAgent, results }));
    document.head.innerHTML = "<meta charset=\\"utf-8\\">";
    document.body.innerHTML = "<pre id=\\"audit-json\\">" + payload + "</pre>";
  };
  Promise.resolve(document.fonts?.ready).catch(() => null).then(() => requestAnimationFrame(() => setTimeout(measure, 50)));
</script>
</body>
</html>`;
}

function summarize(report) {
  const grouped = new Map();
  for (const result of report.results) {
    if (!grouped.has(result.id)) grouped.set(result.id, []);
    grouped.get(result.id).push(result);
  }
  return [...grouped.entries()].map(([id, cases]) => {
    const base = cases.find((item) => item.size.w === 400 && item.size.h === 300) || cases.at(-1);
    return {
      id,
      kind: cases[0].kind,
      metaPath: cases[0].metaPath,
      status: cases.every((item) => item.status === "pass") ? "pass" : "fail",
      testedSizes: cases.map((item) => item.size),
      baseMeasuredContentSlot: base.measuredContentSlot,
      titleCapacity: base.titleCapacity,
      failedChecks: cases.flatMap((item) => Object.entries(item.checks)
        .filter(([, passed]) => !passed)
        .map(([check]) => `${item.size.w}x${item.size.h}:${check}`))
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

const args = parseArgs(process.argv.slice(2));
const browser = findBrowser(args.browser);
if (!browser) {
  process.stderr.write("No Chromium browser found. Pass --browser <path> or set SCREEN_AUDIT_BROWSER.\n");
  process.exit(2);
}

const entries = [
  ...catalogEntries("kit/Shell/CardShell/catalog.json", "kit/Shell/CardShell"),
  ...catalogEntries("kit/Shell/PanelShell/catalog.json", "kit/Shell/PanelShell")
];
const components = entries.map((entry) => ({ ...entry, ...componentSource(entry) }));
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "screen-shell-audit-"));
const harnessPath = path.join(temporaryDirectory, "audit.html");
fs.writeFileSync(harnessPath, buildHarness(components), "utf8");

let launchedBrowser;
try {
  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (error) {
    throw new Error("Playwright is required for runtime geometry audit. Install it or expose the bundled package through NODE_PATH.", { cause: error });
  }
  launchedBrowser = await chromium.launch({
    executablePath: browser,
    headless: true,
    args: ["--allow-file-access-from-files"]
  });
  const page = await launchedBrowser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(harnessPath).href, { waitUntil: "load" });
  await page.waitForSelector("#audit-json", { timeout: 10000 });
  const encoded = await page.textContent("#audit-json");
  if (!encoded) throw new Error("Browser audit returned an empty result");
  const raw = JSON.parse(decodeURIComponent(encoded));
  const componentsSummary = summarize(raw);
  const report = {
    schemaVersion: "1.0.0",
    generatedBy: "scripts/audit-shell-runtime.mjs",
    browser: { executable: path.basename(browser), userAgent: raw.userAgent },
    standards: {
      sizes: "min, base and 640x360 capped by maxSize",
      slotTolerancePx: 2,
      titleRecommendation: "85% of measured repeated-CJK capacity",
      checks: [
        "content exists and has positive size",
        "content stays inside root and matches meta contentSlot",
        "header does not collide with content",
        "title capacity is measurable for CJK and wide Latin text",
        "long title is contained and remains above decoration",
        "content layer remains above frame",
        "component viewport has no horizontal or vertical scrollbar"
      ]
    },
    summary: {
      components: componentsSummary.length,
      cases: raw.results.length,
      passedComponents: componentsSummary.filter((item) => item.status === "pass").length,
      failedComponents: componentsSummary.filter((item) => item.status === "fail").length
    },
    components: componentsSummary,
    cases: raw.results
  };
  const outputRelative = String(args.output || "references/shell-runtime-audit.generated.json").replaceAll("\\", "/");
  const outputPath = path.isAbsolute(outputRelative) ? outputRelative : path.join(skillRoot, outputRelative);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stableJson(report), "utf8");

  if (args["write-meta"]) {
    for (const component of componentsSummary) {
      const meta = readJson(component.metaPath);
      meta.runtimeAudit = {
        status: component.status,
        report: path.relative(path.dirname(path.join(skillRoot, component.metaPath)), outputPath).replaceAll("\\", "/"),
        testedSizes: component.testedSizes,
        measuredContentSlot: component.baseMeasuredContentSlot,
        titleCapacity: component.titleCapacity,
        failedChecks: component.failedChecks
      };
      fs.writeFileSync(path.join(skillRoot, component.metaPath), stableJson(meta), "utf8");
    }
  }

  process.stdout.write(stableJson(report.summary));
  if (report.summary.failedComponents) {
    for (const component of componentsSummary.filter((item) => item.status === "fail")) {
      process.stderr.write(`FAIL ${component.id}: ${component.failedChecks.join(", ")}\n`);
    }
    process.exitCode = 1;
  }
} finally {
  if (launchedBrowser) await launchedBrowser.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, "..");

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      result[key] = value;
    }
  }
  return result;
}

function readJson(relativeOrAbsolute) {
  const target = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(skillRoot, relativeOrAbsolute);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replaceAll("×", "x");
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pickStable(candidates, seed) {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return sorted[fnv1a(seed) % sorted.length];
}

function highest(candidates, seed) {
  if (!candidates.length) return null;
  const maxScore = Math.max(...candidates.map((item) => item.score));
  return pickStable(candidates.filter((item) => item.score === maxScore), seed);
}

function parseResolution(value) {
  const match = normalize(value || "1920x1080").match(/(\d+)\s*x\s*(\d+)/);
  return match
    ? { value: `${match[1]}x${match[2]}`, w: Number(match[1]), h: Number(match[2]) }
    : { value: "1920x1080", w: 1920, h: 1080 };
}

function searchableBrief(brief) {
  return normalize([
    brief.title,
    brief.scenario,
    brief.description,
    brief.theme,
    brief.tone,
    ...(brief.keywords || []),
    ...(brief.constraints || []),
    ...(brief.contentItems || []).flatMap((item) => [item.title, item.type, item.description])
  ].join(" "));
}

function countMatches(text, terms = []) {
  return terms.reduce((score, term) => {
    const word = normalize(term);
    return score + (word && text.includes(word) ? 1 : 0);
  }, 0);
}

function normalizeContent(brief, assumptions) {
  const defaults = [
    ["核心指标", "kpi"],
    ["趋势分析", "trend"],
    ["结构占比", "composition"],
    ["业务排行", "ranking"],
    ["状态监控", "status"],
    ["告警事件", "alert"],
    ["任务进度", "process"],
    ["明细列表", "table"]
  ];
  const input = Array.isArray(brief.contentItems) ? brief.contentItems : [];
  const sourceDefault = normalize(brief.dataSource) === "real" ? "real" : "mock";
  const result = input.map((item, index) => ({
    id: item.id || `content-${index + 1}`,
    title: item.title || `内容 ${index + 1}`,
    type: item.type || "kpi",
    priority: Number(item.priority || index + 1),
    source: item.source || sourceDefault,
    ...item
  }));

  if (!result.length) {
    assumptions.push("用户未提供具体内容，已规划 8 个 source:mock 的混合业务模块。");
    return defaults.map(([title, type], index) => ({
      id: `mock-${index + 1}`,
      title,
      type,
      priority: index + 1,
      source: "mock"
    }));
  }

  if (result.length < 6 && brief.allowSupplement !== false) {
    const existing = new Set(result.map((item) => normalize(item.type)));
    for (const [title, type] of defaults) {
      if (result.length >= 8) break;
      if (!existing.has(normalize(type))) {
        result.push({
          id: `supplement-${result.length + 1}`,
          title,
          type,
          priority: result.length + 1,
          source: "inferred"
        });
        existing.add(normalize(type));
      }
    }
    assumptions.push("用户内容少于 6 项，已补充 source:inferred 的辅助模块，使信息结构完整。");
  }

  if (result.length > 15) {
    assumptions.push("内容超过 15 项；首屏只展示高优先级主题，其余进入页签、轮播、弹窗或下钻。");
  }
  return result;
}

function chooseLayout(brief, resolution, contentPlan, text) {
  const catalog = readJson("layout/catalog.json");
  const explicit = normalize(brief.layoutType);
  const exact = catalog.layouts.find((item) => normalize(item.id) === explicit);
  if (exact && (exact.id !== "ultra_wide_command_layout" || resolution.w === 3840)) {
    return { item: exact, reason: "用户明确指定 layoutType" };
  }

  const typeSignals = {
    center_scene_layout: ["scene"],
    map_command_layout: ["map"],
    kpi_focus_layout: ["kpi"],
    business_process_layout: ["process", "table"],
    equipment_monitor_layout: ["equipment"],
    content_portal_layout: ["content"]
  };

  const candidates = catalog.layouts
    .filter((item) => item.id !== "ultra_wide_command_layout" || resolution.w === 3840)
    .map((item) => {
      let score = countMatches(text, item.detect) * 4;
      const signals = typeSignals[item.id] || [];
      score += contentPlan.filter((content) => signals.includes(normalize(content.type))).length * 3;
      if (item.id === "ultra_wide_command_layout" && resolution.w === 3840) score += 2;
      if (item.id === "balanced_metrics_layout" && score === 0) score = -1;
      return { ...item, score };
    });

  const maxScore = Math.max(...candidates.map((item) => item.score));
  if (maxScore <= 0) {
    const fallback = catalog.layouts.find((item) => item.id === catalog.fallback.id);
    return { item: fallback, reason: catalog.fallback.reason };
  }
  const selected = highest(candidates, `${brief.title}|layout|${resolution.value}|${brief.variationSeed || ""}`);
  return { item: selected, reason: `data-first 匹配得分 ${selected.score}` };
}

function chooseTheme(brief, text, seed) {
  const catalog = readJson("themes/catalog.json");
  const explicit = normalize(brief.theme);
  if (explicit && explicit !== "auto") {
    const match = catalog.themes.find((theme) =>
      [theme.id, theme.nameZh, theme.nameEn, ...(theme.aliases || [])]
        .some((term) => normalize(term) === explicit || explicit.includes(normalize(term)))
    );
    if (match) return { item: match, reason: "用户明确指定主题或别名" };
  }

  const candidates = catalog.themes.map((theme) => ({
    ...theme,
    score: countMatches(text, [
      theme.nameZh,
      theme.nameEn,
      ...(theme.aliases || []),
      ...(theme.toneTags || []),
      ...(theme.preferredScenes || [])
    ])
  }));
  const maxScore = Math.max(...candidates.map((item) => item.score));
  if (maxScore === 0) {
    return {
      item: catalog.themes.find((theme) => theme.id === catalog.defaultTheme),
      reason: "未命中明确视觉线索，使用 defaultTheme"
    };
  }
  const selected = highest(candidates, seed);
  return { item: selected, reason: `主题中文别名/调性/场景匹配得分 ${selected.score}` };
}

function chooseVariant(brief, layout, contentPlan, text, seed) {
  const catalog = readJson(`layout/${layout.id}/variants/catalog.json`);
  const explicit = normalize(brief.layoutVariant);
  const exact = catalog.variants.find((item) => normalize(item.id) === explicit);
  if (exact) return { item: exact, reason: "用户明确指定 layoutVariant" };

  const count = contentPlan.length;
  const densityText = count <= 7
    ? "低密度 指标数量少 少量指标"
    : count <= 12
      ? "中等密度 中等指标"
      : "高密度 多量指标 指标多于12个 主题可合并";
  const combined = `${text} ${densityText}`;
  const candidates = catalog.variants.map((variant) => ({
    ...variant,
    score: countMatches(combined, variant.useWhen || [])
  }));
  const selected = highest(candidates, seed);
  return { item: selected, reason: `variant 条件与密度匹配得分 ${selected.score}` };
}

function loadMetaCandidates(catalogPath, basePath, itemsKey = "items") {
  const catalog = readJson(catalogPath);
  return (catalog[itemsKey] || [])
    .filter((item) => item.status === "ready")
    .map((item) => {
      const metaPath = path.posix.join(basePath, item.meta || item.path);
      return { item, metaPath, meta: readJson(metaPath) };
    })
    .filter(({ meta }) => meta.status === "ready" || meta.assetStatus === "ready");
}

function chooseMetaCandidate({ candidates, explicit, resolution, theme, seed, titlePosition }) {
  const explicitNorm = normalize(explicit);
  if (explicitNorm && explicitNorm !== "auto") {
    const match = candidates.find(({ item, meta }) =>
      [item.id, meta.id, meta.style].some((value) => {
        const normalized = normalize(value);
        return normalized === explicitNorm || explicitNorm.includes(normalized);
      })
    );
    if (match) return { ...match, score: 100, reason: "用户明确指定" };
  }

  let filtered = candidates;
  if (resolution) {
    const exactResolution = candidates.filter(({ meta }) =>
      Number(meta.size?.w || meta.resolution) === resolution.w
      || normalize(meta.resolution) === String(resolution.w)
    );
    if (exactResolution.length) filtered = exactResolution;
  }
  const scored = filtered.map((candidate) => {
    let score = 0;
    if ((candidate.meta.theme || []).includes(theme.id)) score += 8;
    if (titlePosition && normalize(candidate.meta.titlePosition) === normalize(titlePosition)) score += 3;
    return { ...candidate, score };
  });
  const selected = highest(scored, seed);
  return selected ? { ...selected, reason: `兼容条件得分 ${selected.score}` } : null;
}

function navReservedHeight(meta) {
  const values = [
    meta.size?.h,
    meta.export?.outputSize?.h,
    ...(meta.variants || []).map((variant) => variant.size?.h)
  ].filter(Number.isFinite);
  return meta.layoutMetrics?.reservedHeight || Math.max(...values, 100);
}

function assetBeside(metaPath, file) {
  return file ? path.posix.join(path.posix.dirname(metaPath), file) : null;
}

function selectionRecord(candidate, extra = {}) {
  if (!candidate) return null;
  return {
    id: candidate.meta?.id || candidate.item?.id || candidate.id,
    meta: candidate.metaPath,
    reason: candidate.reason,
    ...extra
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.brief) {
  process.stdout.write("Usage: node scripts/resolve-plan.mjs --brief <brief.json> [--output <build-manifest.json>]\n");
  process.exit(args.help ? 0 : 1);
}

const briefPath = path.resolve(process.cwd(), String(args.brief));
const brief = readJson(briefPath);
const assumptions = [];
const resolution = parseResolution(brief.resolution);
const contentPlan = normalizeContent(brief, assumptions);
const text = searchableBrief({ ...brief, contentItems: contentPlan });
const layout = chooseLayout(brief, resolution, contentPlan, text);
const theme = chooseTheme(brief, text, `${brief.title}|theme|${resolution.value}|${brief.variationSeed || ""}`);
const variant = chooseVariant(
  brief,
  layout.item,
  contentPlan,
  text,
  `${brief.title}|${layout.item.id}|${theme.item.id}|${resolution.value}|${brief.variationSeed || ""}`
);
const seed = [
  brief.title,
  layout.item.id,
  variant.item.id,
  theme.item.id,
  resolution.value,
  brief.variationSeed || ""
].join("|");

const topNavCandidates = loadMetaCandidates("kit/TopNav/catalog.json", "kit/TopNav")
  .filter(({ item }) => !normalize(item.id).includes("secondnavitem"));
const topNav = chooseMetaCandidate({
  candidates: topNavCandidates,
  explicit: brief.topNav,
  resolution,
  theme: theme.item,
  titlePosition: brief.titlePosition || "CenterTitle",
  seed: `${seed}|topnav`
});
const cardShell = chooseMetaCandidate({
  candidates: loadMetaCandidates("kit/Shell/CardShell/catalog.json", "kit/Shell/CardShell"),
  explicit: brief.cardShell,
  theme: theme.item,
  seed: `${seed}|cardshell`
});
const panelShell = chooseMetaCandidate({
  candidates: loadMetaCandidates("kit/Shell/PanelShell/catalog.json", "kit/Shell/PanelShell"),
  explicit: brief.panelShell,
  theme: theme.item,
  seed: `${seed}|panelshell`
});

const backgrounds = readJson("kit/background/meta.json").backgrounds
  .filter((item) => item.status === "ready")
  .map((item) => ({ ...item, score: (item.theme || []).includes(theme.item.id) ? 8 : 0 }));
const explicitBackground = normalize(brief.background);
const background = explicitBackground && explicitBackground !== "auto"
  ? backgrounds.find((item) => normalize(item.id) === explicitBackground)
  : highest(backgrounds, `${seed}|background`);
const backgroundReason = explicitBackground && explicitBackground !== "auto" && background
  ? "用户明确指定"
  : background
    ? `主题兼容得分 ${background.score}`
    : "无 Ready 背景，使用 CSS fallback";

const types = new Set(contentPlan.map((item) => normalize(item.type)));
const usesMap = types.has("map") || layout.item.id === "map_command_layout";
const usesCharts = usesMap || [...types].some((type) =>
  ["trend", "composition", "chart", "bar", "line", "pie", "radar", "gauge", "heatmap"].includes(type)
);
const usesLists = [...types].some((type) =>
  ["ranking", "status", "alert", "table", "task", "event", "process"].includes(type)
);
const usesKpi = types.has("kpi");

const readNext = [
  `layout/${layout.item.rule}`,
  `layout/${layout.item.variants}`,
  "layout/common/slot-schema.json",
  "layout/common/nav-height-rules.md",
  "layout/common/viewport-fit-rules.md",
  "layout/common/layout-variant-rules.md",
  "layout/common/shell-binding-rules.md",
  `themes/${theme.item.file}`,
  topNav?.metaPath,
  "kit/TopNav/overlay.css",
  cardShell?.metaPath,
  cardShell?.meta?.code?.html && assetBeside(cardShell.metaPath, cardShell.meta.code.html),
  cardShell?.meta?.code?.css && assetBeside(cardShell.metaPath, cardShell.meta.code.css),
  panelShell?.metaPath,
  panelShell?.meta?.code?.html && assetBeside(panelShell.metaPath, panelShell.meta.code.html),
  panelShell?.meta?.code?.css && assetBeside(panelShell.metaPath, panelShell.meta.code.css),
  usesKpi && "kit/widget/kpi-card/catalog.json",
  usesKpi && "references/widget-kpi-card-rules.md",
  usesMap && "kit/map/catalog.json",
  usesMap && "kit/map/china/1.6.3/meta.json",
  usesMap && "references/map-kit-rules.md",
  usesCharts && "runtime/chart-defaults.js",
  usesCharts && "runtime/chart-presets.js",
  usesLists && "runtime/table-renderers.js",
  usesLists && "runtime/table-list.css",
  "runtime/data-loader.js",
  "runtime/scale.js",
  "references/output-optimization-rules.md"
];

const copyOnlyAssets = [
  topNav && assetBeside(topNav.metaPath, topNav.meta.file || topNav.meta.pngFallback),
  background?.file && `kit/background/${background.file}`,
  usesCharts && "runtime/echarts.min.js",
  usesMap && "kit/map/china/1.6.3/china.geo.json"
];

const runtimeFiles = [
  usesCharts && "runtime/echarts.min.js",
  usesCharts && "runtime/chart-defaults.js",
  usesCharts && "runtime/chart-presets.js",
  usesLists && "runtime/table-renderers.js",
  usesLists && "runtime/table-list.css",
  "runtime/data-loader.js",
  "runtime/scale.js"
];

const manifest = {
  schemaVersion: "2.2.0",
  mode: "create",
  brief: {
    ...brief,
    resolution: resolution.value,
    dataSource: brief.dataSource || "mock-first",
    outputMode: brief.outputMode || "standalone"
  },
  selection: {
    layoutType: { id: layout.item.id, rule: `layout/${layout.item.rule}`, reason: layout.reason },
    layoutVariant: { id: variant.item.id, catalog: `layout/${layout.item.variants}`, reason: variant.reason },
    theme: { id: theme.item.id, file: `themes/${theme.item.file}`, reason: theme.reason },
    topNav: selectionRecord(topNav, topNav ? {
      asset: assetBeside(topNav.metaPath, topNav.meta.file || topNav.meta.pngFallback),
      reservedHeight: navReservedHeight(topNav.meta),
      contentGap: topNav.meta.layoutMetrics?.contentGap || 12,
      titleOverlay: topNav.meta.titleOverlay || null
    } : {}),
    cardShellStyleLock: selectionRecord(cardShell),
    panelShell: selectionRecord(panelShell),
    background: background ? {
      id: background.id,
      asset: `kit/background/${background.file}`,
      cssFallback: background.cssFallback,
      reason: backgroundReason
    } : null
  },
  contentPlan,
  readNext: unique(readNext),
  runtimeFiles: unique(runtimeFiles),
  copyOnlyAssets: unique(copyOnlyAssets),
  preserve: Array.isArray(brief.preserve) ? brief.preserve : [],
  assumptions,
  fallbacks: [
    !topNav && "未找到可用 TopNav，使用 CSS Header fallback",
    !cardShell && "未找到可用 CardShell，使用 CSS Card fallback",
    !panelShell && "未找到可用 PanelShell，PrimarySlot 使用 CSS/无外壳 fallback",
    !background && "未找到可用背景，使用纯色 CSS fallback"
  ].filter(Boolean),
  validation: {
    highestCompleted: null,
    checks: []
  }
};

const output = JSON.stringify(manifest, null, 2) + "\n";
if (args.output) {
  const outputPath = path.resolve(process.cwd(), String(args.output));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  process.stdout.write(`Created ${outputPath}\n`);
} else {
  process.stdout.write(output);
}

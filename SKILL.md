---
name: screen-skill
description: 使用 V2 kit/meta.json 工作流生成模块化数据大屏和指挥中心页面。适用于创建大屏可视化页面、运营看板、指挥中心、驾驶舱、KPI 看板、地图中心型大屏、ECharts 数据大屏；当用户提到“大屏”“看板”“驾驶舱”“指挥舱”“cockpit”“dashboard”“kit components”“theme switching”“mock data”“模拟数据”，或需要生成 1920x1080 / 3840x1080 等响应式数据大屏时使用。
---

# 数据大屏模板化生成 Skill V2

## 1. Skill 目标

基于"积木组合"架构生成数据大屏：先读 `layout/catalog.json` 判断信息架构与槽位优先级 → 读 kit 全局索引与分支 catalog 查表选积木 → 按 TopNav 实际高度计算内容区 → 绑定 Shell/KPI Widget/ECharts/DOM 表格列表/主题 → 注入数据 → 输出完整页面。

核心原则：**模型先读 `layout/catalog.json` 与目标 `layout/{layout_type}/rule.json`，再读 `kit/catalog.json`、分支 `catalog.json` 与具体 `meta.json` 查表选择，不靠记忆猜测。无匹配积木时走 CSS 降级，不假装有资源。**

## 2. 适用场景

- 数据大屏 / 可视化大屏 / 驾驶舱 / 指挥中心
- 用户提到"大屏""看板""驾驶舱""指挥舱""cockpit""dashboard"

## 3. 不适用场景

- 后台 CRUD、移动端 H5、营销落地页、静态海报

## 4. 默认输入规则

只补问三项：行业场景、目标分辨率（默认 1920x1080）、数据来源（默认 mock first）。用户要求直接生成时采用：

```json
{ "resolution": "1920x1080", "dataSource": "mock first", "chartLibrary": "ECharts", "layout_type": "auto" }
```

## 5. 架构总览

```
screen-skill-V2/
├── SKILL.md                   ← 本文件：决策逻辑 + 积木选择规则
├── kit/                       ← 视觉积木库（素材 + meta.json）
│   ├── catalog.json           ← kit 全局索引：记录 TopNav/Shell/kpi-card/background/runtime 分支
│   ├── TopNav/                ← 顶部导航背景切图，文本/时间/天气由 DOM 覆盖
│   │   ├── catalog.json
│   │   ├── overlay.css        ← 顶部导航 DOM 覆盖层样式
│   │   ├── CenterTitle/{1920,3840}/Style01~0N/
│   │   └── LeftTitle/1920/Style01~0N/
│   ├── Shell/                 ← 面板外壳代码积木，不使用切图
│   │   ├── CardShell/Style01~14/
│   │   └── PanelShell/Style01~05/
│   ├── widget/                ← 设计型业务组件，仅保留 KPI 指标卡
│   │   ├── kpi-card/
│   └── background/            ← 背景图 + meta.json
├── themes/                    ← CSS token（主题与积木解耦）
│   └── catalog.json           ← 主题索引：新版主题 id、别名与 CSS 文件
├── layout/                    ← 规则驱动布局：catalog + common + 各 layout_type 的 rule/guide
│   ├── catalog.json           ← 布局类型入口：8 类布局、检测词、公共规则索引
│   ├── common/                ← 槽位语义、导航高度、Shell 绑定、密度、适配流程
│   └── {layout_type}/          ← 每类布局的 rule.json + guide.md
├── runtime/                   ← 运行时脚本：ECharts、本地 chart presets、DOM 表格/列表 renderer、缩放与数据加载
└── references/                ← 规则文档（模型按需读取）
    └── figma-source-map.json  ← 维护用 Figma 来源索引，生成阶段禁止读取
```

## 6. 生成流程（核心）

```
Step 1: 读 layout/catalog.json → 判断 layout_type → 读 layout/common/* 与 layout/{layout_type}/rule.json
        ↓        先分析指标优先级和业务关系：主指标/主对象进 PrimarySlot，其他指标按优先级向左右、底部、页签或下钻分布
        ↓        layout_type:auto 时必须 data-first：先整理真实/模拟指标，再选布局；不能直接默认网格布局
        ↓
Step 1.5: 读 themes/catalog.json → 确定新版主题 id、兼容别名与 CSS token 文件；行业只用于数据模拟和文案，不参与 kit 选择
        ↓
Step 2: 读 kit/catalog.json → 读 kit/TopNav/catalog.json + overlay.css → 按 resolution + titlePosition + theme + status:"ready" 过滤 → 选顶部导航
        ↓        有匹配 → 用 kit 资源
        ↓        无匹配 → CSS 降级生成（记录到 change-log）
        ↓
Step 2.5: 按 layout/common/nav-height-rules.md 读取 TopNav 真实高度 → 计算 HeaderSlot 与 contentArea，不能写死 90/100/110/120
        ↓        TopNav 默认只输出主标题、日期、时间；副标题仅当 meta.titleOverlay.subtitle.enabled === true 时输出，业务页签/组织标签不得自动放入导航
        ↓
Step 3: 按 layout 槽位与 shell-binding-rules 选择 Shell → 读 kit/Shell/{CardShell,PanelShell}/catalog.json → 读 shell meta.json → 按 theme + status:"ready" 过滤，多个同主题候选随机或轮换选用
        ↓        先确定页面级 cardShellStyleLock；普通业务模块只能复用同一个 CardShell 风格
        ↓        有匹配 → 按 meta.json 的 code.html + code.css 引用；CardShell 通常使用 component.html + shell.css
        ↓        无匹配 → CSS 降级生成
        ↓
Step 4: 组件渲染：KPI 读 kit/widget/kpi-card，按 dataShape + slot size + variantRule + visualWeight 选择，不按 catalog 第一个；图表用 runtime/echarts.min.js + chart-presets.js；表格/排名/告警/任务/事件列表用 table-renderers.js
        ↓        所有 KPI/图表/列表必须按 Shell contentSlot 计算内部尺寸；放不下时调整内容密度、卡片高度或转页签，不得裁切/滚动/省略
        ↓
Step 5: 读 kit/background/meta.json → 按 theme 选背景图，无则纯色 CSS
        ↓
Step 6: 链接 themes/{主题}.css + runtime/*.js
        ↓
Step 7: 生成 data/sample-data.json
        ↓
Step 8: 输出完整 index.html → 按浏览器视口居中缩放（不限制视口分辨率，必须计算 offsetX/offsetY）→ 无横向/纵向滚动条自检
```

### 6.1 降级策略

| 积木类型 | 有匹配 kit | 无匹配 kit |
|---|---|---|
| Layout | 使用 `layout/catalog.json` + `rule.json` 的槽位/优先级规则，不读旧 HTML 占位 | 使用 `balanced_metrics_layout` 规则降级，不固定卡片数量 |
| TopNav | 使用 kit 中纯背景 `nav.png` + `overlay.css` HTML overlay | 纯 CSS 重建：深色条 + 加粗主标题 + 右侧时间 |
| Shell | 先锁定页面级 `cardShellStyleLock`，普通业务模块统一使用同一个 CardShell；注入 `meta.json > code.html` + `code.css`，内容放入 slot；`shell.html` 仅预览 | 纯 CSS：border + box-shadow + 渐变背景 |
| kpi-card | 读 `kit/widget/kpi-card/catalog.json`，按数据形态、槽位尺寸、变体、视觉权重选择；合并 `base.css` + 选中 `StyleXX/style.css`，注入 `StyleXX/component.html` | CSS 重建：flex 卡片 + 左边框强调色 |
| chart-* | 使用本地 `runtime/echarts.min.js` + `chart-presets.js` 渲染 | ECharts 不可用时用 SVG/CSS fallback |
| table/list | 使用 `runtime/table-renderers.js` + 通用 CSS 渲染排名、告警、任务、事件、表格 | CSS table/list fallback |
| big-number | 使用 DOM/CSS 渲染，不读取 Figma widget | CSS `.big-number-item` |
| map | 优先 ECharts map，但必须有本地 geoJSON/SVG；无本地地图数据时用抽象 SVG/CSS fallback | CSS/SVG 抽象态势 |
| background | 使用 kit 中的背景图 | 纯色 `#020817` + 可选网格线 |

### 6.2 meta.json 规范

```json
// kit/TopNav/CenterTitle/1920/Style01/meta.json
{
  "id": "topnav-centertitle-1920-style01",
  "category": "TopNav",
  "kind": "nav",
  "titlePosition": "CenterTitle",
  "resolution": "1920",
  "style": "Style01",
  "theme": ["galaxy-azure", "deep-tech-blue"],
  "tone": "tech",
  "size": { "w": 1920, "h": 82 },
  "layoutMetrics": {
    "renderHeight": 82,
    "reservedHeight": 100,
    "contentGap": 12
  },
  "file": "nav.png",
  "pngFallback": "nav.png",
  "assetStatus": "ready",
  "titleOverlay": {
    "css": "kit/TopNav/overlay.css",
    "htmlClass": "ds-top-nav__title",
    "fontFamilyToken": "--font-title",
    "fontSize": 44,
    "fontWeight": 400,
    "lineHeight": 1,
    "letterSpacing": 0,
    "stroke": "0px",
    "fill": "#ffffff",
    "colorMode": "fixed-white",
    "shadowToken": "--top-nav-title-shadow"
  },
  "status": "ready"
}
```

```json
// kit/Shell/CardShell/Style01/meta.json
{
  "id": "shell-cardshell-style01",
  "label": "科技斜角卡片外壳",
  "category": "Shell",
  "kind": "CardShell",
  "assetType": "code",
  "theme": ["galaxy-azure", "frost-cyan", "fresh-verdant", "deep-tech-blue"],
  "minSize": { "w": 300, "h": 180 },
  "maxSize": { "w": 1200, "h": 800 },
  "code": { "html": "component.html", "css": "shell.css", "preview": "shell.html" },
  "adaptation": {
    "layout": "stretchable-code-shell",
    "usesImage": false,
    "contentSlot": { "top": 52, "left": 20, "right": 20, "bottom": 16 }
  },
  "status": "ready"
}
```

```json
// kit/widget/kpi-card/catalog.json
{
  "id": "widget-kpi-card",
  "label": "KPI 指标卡",
  "baseCss": "base.css",
  "styles": [{ "style": "Style01", "path": "Style01/meta.json" }],
  "defaultStyle": "Style01",
  "status": "ready"
}
```

### 6.3 查表选择规则

**选布局：**
1. 先读 `layout/catalog.json`。
2. `layout_type:auto` 时必须先整理数据结构：用户有指标就分析指标，用户无指标就先 mock 8-12 个混合业务模块，再分析主对象、主指标、辅助指标和密度。
3. 按用户需求和数据结构识别主对象：场景/地图/核心指标/流程/均衡指标/设备/内容/超宽。
4. 命中后读取 `layout/common/slot-schema.json`、`nav-height-rules.md`、`shell-binding-rules.md`、`density-rules.md`、`layout-adapter.md`、`viewport-fit-rules.md`。
5. 再读取 `layout/{layout_type}/rule.json` 和 `guide.md`。
6. 槽位只表示位置意图和优先级，不固定内容类型。必须先分析指标，主指标或主对象进入 `PrimarySlot`，其他指标按优先级和业务关系分布。`PrimarySlot` 必须聚焦主视觉：主指标居中突出，辅助指标围绕主指标组织，底部能力/维度信息集中排列，避免内容过散或上下留白过多。
7. 不固定左侧、右侧、底部卡片数量；指标多时先按业务主题合并，再用页签、轮播、弹窗或下钻承载次级信息。
8. `balanced_metrics_layout` 只能作为最后兜底：没有地图、场景、设备、流程、核心 KPI、内容门户或超宽指挥信号时才使用。

**选导航：**
1. 先读 `kit/catalog.json`，确认 `TopNav` 分支可用
2. 读 `kit/TopNav/catalog.json`，再打开候选项的 `meta.json`
3. 按 `resolution`、`theme`、`status:"ready"` 过滤；
4. 需要二级导航时，优先选择同一父级下的 `SecondNavItem`，但 `SecondNavItem` 不能单独替代主 TopNav
5. 读取 `kit/TopNav/overlay.css`，并用候选 meta 的 `titleOverlay` 覆盖主标题 CSS 变量
6. 按 `layout/common/nav-height-rules.md` 读取真实高度：`layoutMetrics.reservedHeight > max(variants[].size.h, size.h, export.outputSize.h) > fallback 100`
7. 用主 TopNav 的 `reservedHeight + contentGap` 计算内容区顶部；
8. 主标题必须使用 DOM 文本渲染，不要把标题文字烘焙进 `nav.png`。`TopNav/CenterTitle/1920/` 下所有主标题字体使用 `YouSheBiaoTiHei`，`font-weight:400`，字号 `48px`；默认不加 `border` / `text-stroke`，不修改原本阴影。所有 TopNav 主标题颜色固定为 `#ffffff`，不得受主题 token、渐变填充、`fillToken` 或 `-webkit-text-fill-color: transparent` 影响。
9. 副标题默认不渲染。只有 `meta.titleOverlay.subtitle.enabled === true` 时才生成 `.ds-top-nav__subtitle`；当前只有 `TopNav/CenterTitle/1920/Style08` 允许副标题
10. TopNav 默认只生成主标题、日期、时间。不得把 mock 业务分类渲染成顶部左侧页签，也不得在右侧自动生成组织名、系统名、中心名、天气、状态标签或地点标签；如果用户明确要求业务页签，应放入内容区卡片内，除非 TopNav meta 明确提供对应 slot
11. 多个匹配时，优先 `resolution` 精确匹配 > `theme` 匹配 ；
12. **无匹配 → CSS 降级**，记录到 change-log

**选面板：**
1. 先读 `kit/catalog.json`，确认 `Shell` 分支可用
2. 读 `kit/Shell/CardShell/catalog.json` 与 `kit/Shell/PanelShell/catalog.json`
3. 打开候选项 `meta.json`，只选 `assetType:"code"`、`status:"ready"`，并排除 `adaptation.usesFullNodeScreenshot:true` 的整图拉伸实现；允许局部 SVG、局部 PNG/JPG 素材
4. `PanelShell` 一般只用于 `PrimarySlot` 中心主视觉区域背景，或不含主标题的背景框、组合底板、中心视觉承载框；中心主视觉内容必须集中排列，主指标居中突出，辅助指标围绕主指标组织，底部能力/维度信息集中排列。
5. 其他带标题、承载业务指标/图表/列表/状态/任务/明细的模块默认 `CardShell`
6. 用户显式指定 `Shell/CardShell/StyleXX` 或 `Shell/PanelShell/StyleXX` 时，以用户指定为最高优先级
7. 按 `theme` 匹配；如存在 `compatible` 字段，再按已选导航 `id` 过滤。不要依赖 `industry` 或 `tone`
8. 第一次选择普通业务 CardShell 前，先按 theme/status/size/adaptation/contentSlot 过滤候选；多个候选接近时从前 2-4 个中稳定随机选择并确定页面级 `cardShellStyleLock`；后续 KPI、图表、列表、状态、任务、明细等普通业务模块必须复用同一个 CardShell 风格
9. 主题换色时不能只改 CardShell CSS 变量；必须同步本地 SVG 角标、frame cap、tail、triangle、inner glow 等资源颜色，避免红金等主题中残留蓝色/青色角标。
10. 只有用户显式要求某个模块使用其他 CardShell 时才允许例外，并写入 change-log
11. 命中后按 `meta.json > code.html` 与 `code.css` 引用；CardShell 把业务 widget 注入 `adaptation.contentSlot` 或 `slots.content`，不要读取预览用 `shell.html`
12. 所有 Shell/面板/弹窗标题颜色固定为 `#ffffff`，不得使用主题主色、渐变填充、透明文字或半透明白色作为标题色；可以保留原本阴影、发光和装饰线。
13. 仍无匹配 → CSS 降级

**选组件：**
1. `kit/widget/kpi-card`。只有 KPI 指标卡读取 `kit/widget/kpi-card/catalog.json`，再读取选中 `StyleXX/meta.json`、`StyleXX/component.html`、`base.css` 和 `StyleXX/style.css`。
2. KPI Style 不能按 catalog 顺序或 `defaultStyle` 直接选择。必须按 `dataShape`、槽位尺寸、`variantRule`、视觉权重、是否可适配、主题兼容排序。
3. `defaultStyle` 只作为最后兜底；使用时必须写入 change-log。
4. 图表不读取 `kit/widget/chart-*`，统一使用本地 `runtime/echarts.min.js`、`chart-defaults.js`、`chart-presets.js`。
5. ECharts preset 支持 line、area-line、bar、stacked-bar、horizontal-bar、pie、donut、rose、gauge、radar、scatter、effect-scatter、heatmap、funnel、sankey、treemap、map。
6. 地图类图表必须使用本地 geoJSON/SVG 注册；没有本地地图数据时，用 CSS/SVG 抽象态势降级，不调用外部地图或 Figma。
7. 表格、排名、告警、任务、事件列表不读取 Figma widget，统一使用 `runtime/table-renderers.js` 生成 DOM，并用 `components.css/tables.css` 控制样式。
8. 大数字、普通状态条、简单标签用 DOM/CSS 渲染，不作为 widget 维护。
9. 所有组件内容仍必须注入 Shell 的 `adaptation.contentSlot` 或声明的 content slot。
10. KPI、图表、列表、排行、告警、任务等组件必须先根据 Shell content slot 计算可用宽高，再生成内部 DOM/canvas。生成后必须检查 `scrollHeight/clientHeight` 与 `scrollWidth/clientWidth`；如内容溢出，优先压缩 gap、行高、padding、图例和次级文本，其次调整卡片高度或把低优先级内容转入页签/轮播，保证 1920x1080 下不裁切、不滚动、不省略。

**选背景：**
1. 读 `kit/background/meta.json`
2. 按 theme 匹配 → 使用对应图片
3. 无匹配 → 纯色 `#020817` + 可选网格 CSS

## 7. 输出物规范

每次生成到用户项目目录 `screen/`：

```text
screen/
├── index.html
├── main.js
├── README.md
├── data-field-map.md
├── change-log.md
├── data/sample-data.json
├── styles/
│   ├── tokens.css       ← 从 themes/ 复制对应主题
│   ├── layout.css
│   ├── header.css       ← 合并 TopNav overlay.css 与导航定位样式
│   ├── panels.css
│   ├── components.css
│   ├── tables.css
│   ├── charts.css
│   └── visuals.css
├── runtime/
│   ├── echarts.min.js
│   ├── chart-defaults.js
│   ├── chart-presets.js
│   ├── table-renderers.js
│   ├── table-list.css      ← 生成时可复制为 styles/tables.css
│   ├── data-loader.js
│   └── scale.js
└── assets/              ← 从 kit 复制的实际使用的资源
    ├── background/
    ├── TopNav/
    └── Shell/           ← 仅记录/复制代码型 shell 片段，不要求图片资产
```

## 8. 数据规则

- 行业场景只用于 mock 数据、指标命名、业务分组和文案生成；不得用于 TopNav、Shell、widget、background 等 kit 组件选择
- Mock 数据标记 `source: "mock"`
- 推断字段标记 `source: "inferred"`
- 真实字段标记 `source: "real"`
- 状态枚举统一：normal / warning / danger / offline / processing / done
- 未提供指标时默认 mock 8-12 个业务模块，混合 KPI、趋势、占比、排行、状态、告警/事件等，不生成单一平铺指标墙
- 用户提供数据 ≤6 个时，除非明确禁止补充，否则补足相关 mock/inferred 辅助数据，使首屏信息量接近 8-12 个模块
- 用户提供数据 >12 个时，先按业务主题分组；首屏展示主指标和高优先级模块，次级内容进入页签、轮播、弹窗或下钻
- 数据分配服从 layout 槽位优先级：先定主指标/主对象，再按业务关系分布到左右、底部、页签或扩展区

## 9. 自检清单（P0）

1. 目标分辨率画布在浏览器视口内无滚动条
2. `.screen-root` 使用中心缩放，`scale.js` 必须计算 `offsetX/offsetY`，页面在任意宽屏视口内水平/垂直居中，`html/body` 不出现横向或纵向滚动条
3. 所有 `.module/.screen-card` 已检查矩形碰撞和最小间距；相邻模块不得共边，间距必须不小于 layout `canvas.gap`，1920x1080 默认至少 16px
4. 页面可本地打开，无语法错误
5. 已记录命中的 `layout_type`、TopNav id、TopNav 真实高度、contentArea
6. `layout_type:auto` 已执行 data-first 分析，不是直接默认网格
7. 槽位分配基于指标优先级和业务关系，不是固定卡片数量
8. `PanelShell` 只用于中心主视觉/无标题背景；普通业务模块默认 `CardShell`
9. 已记录页面级 `cardShellStyleLock`，普通业务模块没有混用多个 CardShell
10. 主题换色时已同步 CardShell 本地 SVG 角标、frame cap、tail、triangle、inner glow 等资源颜色
11. TopNav subtitle 仅在 `meta.titleOverlay.subtitle.enabled === true` 时渲染
12. TopNav 除主标题、日期、时间外没有自动生成左侧业务页签、右侧组织名/系统名/中心名、天气、状态标签或地点标签
13. `TopNav/CenterTitle/1920/` 主标题使用 `YouSheBiaoTiHei`、`font-weight:400`、`font-size:44px`，无默认 `border/text-stroke`，原本阴影未被重写，标题颜色固定为 `#ffffff` 且不受主题影响
14. `PrimarySlot` 主指标居中突出，辅助指标围绕主指标组织，底部能力/维度信息集中排列，无明显上下空白
15. KPI widget 已按数据形态、尺寸、变体、视觉权重选择，不是默认第一个
16. CardShell 内容注入 `contentSlot`，没有直接贴满外壳
17. 所有 KPI、图表、列表、排行、告警、任务等组件已按 content slot 检查 `scrollHeight/clientHeight` 和 `scrollWidth/clientWidth`，1920x1080 下不裁切、不滚动、不省略
18. 面板标题不是占位文本，标题颜色固定为 `#ffffff` 且不受主题影响
19. 所有数据来自 JSON 配置或明确绑定
20. Mock 数据已标记
21. 字段映射表存在
22. kit 使用情况记录在 change-log
23. 图表容器支持 resize

## 10. 禁止行为

- 编造不存在的 kit 资源路径
- 把 Mock 数据描述成真实数据
- 把业务模块导出成不可编辑图片
- 在目标分辨率出现滚动条
- `scale.js` 只缩放不计算 `offsetX/offsetY`，导致宽屏浏览器中画布贴左或贴上
- 保留占位标题
- 有资源不用却走降级，或该降级时假装有资源
- 直接使用旧 layout HTML 占位作为新流程骨架
- 写死 TopNav 高度或 contentArea 顶部
- 固定左侧/右侧/底部卡片数量
- 忽略 Shell 的 `adaptation.contentSlot`
- 同一页面混用多个 CardShell 风格
- 主题换色时只改 CSS 变量，却不同步 CardShell 本地 SVG 角标、frame cap、tail、triangle、inner glow 等资源颜色
- `TopNav/CenterTitle/1920/` 主标题默认加 `border/text-stroke`，或把字重改成非 400，或覆盖原本阴影，或使用主题渐变/透明文字导致标题不是纯白色
- 面板标题、弹窗标题或主视觉标题使用主题色/渐变色/半透明白色，导致标题不是固定 `#ffffff`
- `PrimarySlot` 内容分散、上下留白过多，主指标不居中突出
- 未经 `subtitle.enabled` 授权就渲染 TopNav 副标题
- 在 TopNav 左侧自动生成业务页签，或在右侧自动生成组织名、系统名、中心名、天气、状态标签、地点标签等非日期时间内容
- `layout_type:auto` 时跳过数据分析直接使用均衡网格
- KPI widget 因 catalog 顺序或 defaultStyle 直接选第一个
- 用滚动条、裁切、隐藏溢出或省略号解决内容溢出

## 11. 新增积木指南

1. 新导航放到 `kit/TopNav/{titlePosition}/{resolution}/{Style}/`，二级导航放对应 `SecondNavItem/`
2. 新外壳放到 `kit/Shell/{CardShell|PanelShell}/{Style}/`，CardShell 必须提供 `component.html`、`shell.html`、`shell.css`、`meta.json`
3. 新业务组件默认不要放入 `kit/widget`；只有有独立设计沉淀、无法由 ECharts 或 DOM/CSS 覆盖的组件才允许新增。当前 `kit/widget` 只保留 `kpi-card`。
4. 更新对应分支 `catalog.json`，并同步 `kit/catalog.json` 的统计与入口
5. `meta.json` 必须填 `theme` 与 `status`；Shell 还必须标记 `assetType:"code"`，并声明 `adaptation.renderingMode`、`contentSlot` 与是否使用局部素材。所有 kit 运行时 `meta.json` 不保留 `industry` 或 `figma` 字段，选择时不得依赖行业
6. widget 从设计稿转入 skill 后，只保留本地 HTML/CSS/图片路径，不保留运行时依赖的外部设计文件引用；图表、表格、列表不得作为 Figma widget 引入。
7. Figma 来源只允许放在 `references/figma-source-map.json`，仅用于维护和二次还原；生成阶段不得读取该文件作为组件选择依据
8. 新布局规则放到 `layout/{layout_type}/rule.json` 与 `guide.md`，并更新 `layout/catalog.json`
9. **SKILL.md 通常不需要改** — 模型通过 layout catalog、kit catalog、分支 catalog 与 meta.json 自动感知

## 12. CardShell 组件导入规范

修改或新增 `kit/Shell/CardShell/{Style}` 时，必须先读取 `references/cardshell-component-rules.md`。

核心约束：
- 运行时 HTML 使用 `component.html`，预览页使用 `shell.html`。
- `shell.html` 只能展示空卡片，不放 KPI、图表、列表或业务示例数据。
- 不使用整组件截图作为背景；复杂布尔背景、标题异形、角标和固定装饰优先转为本地 SVG。
- SVG 拉伸资产必须设置 `preserveAspectRatio="none"`、`width="100%"`、`height="100%"`。
- 所有 Figma MCP 远程素材必须落到组件本地 `assets/` 目录，运行时不得引用临时 URL。
- `meta.json > code.html` 指向 `component.html`，`meta.json > code.preview` 指向 `shell.html`。
## Map Kit Addendum

- Before adding or using map data, read `references/map-kit-rules.md`.
- `kit/map/` is the local map data branch. It provides boundary data only; map visual style is still controlled by ECharts options, theme tokens, and page CSS.
- For China map or national map requests, read `kit/map/catalog.json`, then `kit/map/china/1.6.3/meta.json`.
- Runtime ECharts map rendering must use local GeoJSON. Copy `kit/map/china/1.6.3/china.geo.json` into the generated screen `assets/map/china.geo.json`, fetch it locally, then call `echarts.registerMap("china", geoJson)`.
- `kit/map/china/1.6.3/china.topo.json` is retained as local source data. Do not register it directly unless a local TopoJSON converter is included.
- Do not fetch remote map data during generation or runtime. Remote source URLs are maintenance-only and live in `references/map-source-map.json`.
- Generated screens using map data must record the selected map id, copied asset path, and `registerName` in `change-log`.

## KPI Widget Usage Addendum

- 生成前必须把金额、数量、比例、完成率、同比、环比、告警数、在线数、库存数、项目数、状态数量、当前值、汇总值和核心经营结果纳入 `widget:kpi-card` 候选。
- 指标数量不等于组件数量：一个业务指标可以包含多条同类数据项；此时优先选择 `grouped-metrics-card` 或支持 `metrics` / `metricItem` / `repeatable` 的现有 KPI Style。
- 多个结构相似的汇总指标可以复用同一个 KPI Style 生成多个实例；不得按 catalog 顺序、`defaultStyle` 或“指标少”直接放弃 KPI。
- 图表优先用于趋势、构成、排行、分布和关系；KPI 优先用于当前值、汇总值、状态值和核心结果。
- `kit/widget/kpi-card/catalog.json` 的 `summary` 只作为轻量选择摘要使用，不替代 `StyleXX/meta.json`；命中候选后仍需读取对应 `meta.json`、`component.html`、`base.css` 和 `style.css`。
- 主题色只作用在已通过 Figma 变量确认并写入 `summary.themeColorBindings` 的 CSS 位置；没有变量标识的文字、背景、边框、SVG 和状态色不得被全局改成主题主色。
- 如果存在可转 KPI 的数值型汇总数据但最终没有使用 KPI，必须在 `change-log` 记录放弃原因。

## Layout Variant And Output Optimization Addendum

生成阶段必须执行：

```text
data analysis -> layout_type -> layoutVariant -> slot geometry -> kit candidate selection -> output pruning
```

### Layout Variant

- 选中 `layout_type` 后，必须继续读取 `layout/{layout_type}/variants/catalog.json`。
- `layout_type` 只决定信息架构类别；`layoutVariant` 决定具体空间组织方式。
- 坐标必须根据 TopNav 真实高度、contentArea、variant 比例和指标密度计算。
- 禁止 `map_command_layout`、`center_scene_layout` 默认复用同一套左 420 / 中 1000 / 右 420 的三列模板。
- 多个 variant 适配度接近时，从前 2-4 个候选中使用稳定随机选择：`hash(projectTitle + layout_type + theme + resolution)`。
- `change-log` 必须记录 `layoutVariant`、选择原因和每个主要槽位的业务主题。

### Kit Candidate Diversity

- 页面内普通业务模块必须统一 `cardShellStyleLock`。
- 跨项目不得总是命中同一个 TopNav、PanelShell、CardShell 或 background。
- 当同主题、同状态、同尺寸适配下存在多个 ready 候选时，不要选 catalog 第一个；从前 2-4 个候选中用稳定随机选择。
- 稳定随机只影响项目间差异；同一页面内已锁定的 CardShell 不再切换。

### Output Pruning

生成输出时必须读取 `references/output-optimization-rules.md`。

- 默认 `outputMode` 为 `standalone`，但只复制实际使用文件。
- 不复制 `shell.html`、`widget.html`、`meta.json`、未命中 Style 目录、未使用 assets 和维护索引。
- ECharts、table renderer、map data、scale runtime 按需复制。
- 中国地图只复制一种本地数据文件，优先 `china.geo.json`；不要同时复制 `china.js` 和 `china.geo.json`。
- 先读 catalog summary，候选命中后再读具体 `meta.json`、`component.html`、CSS 和 assets。
- `change-log` 必须记录 outputMode、复制的 runtime 和被裁剪的文件类别。

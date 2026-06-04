# 积木选择规则

## 核心流程

```
读 layout/catalog.json → 读 layout/common/* → 读 layout/{layout_type}/rule.json → 读 themes/catalog.json → 读 kit/catalog.json → 读分支 catalog.json → 读候选 meta.json → 按 layout/theme/resolution/status 过滤 → 有则用，无则 CSS 降级
```

## 全局入口

1. 先读 `layout/catalog.json`，判断 `layout_type`。
2. 读取 `layout/common/slot-schema.json`、`nav-height-rules.md`、`shell-binding-rules.md`、`density-rules.md`。
3. 读取 `layout/{layout_type}/rule.json` 和 `guide.md`。
4. 再读 `themes/catalog.json`，确认主题 id、别名和主题 CSS 文件；行业只用于 mock 数据、指标命名、业务分组和文案生成，不参与 kit 选择。
5. 再读 `kit/catalog.json`，确认当前可用视觉积木分支。
6. TopNav 读 `kit/TopNav/catalog.json` 后再读具体 `meta.json`。
7. TopNav 命中后同时读取 `kit/TopNav/overlay.css`，用 `meta.json.titleOverlay` 设置主标题覆盖层，并按 `nav-height-rules.md` 计算真实内容区；`SecondNavItem` 不能单独替代主 TopNav。
8. Shell 读 `kit/Shell/CardShell/catalog.json`、`kit/Shell/PanelShell/catalog.json` 后再读具体 `meta.json`。
9. 只有 KPI 指标卡读取 `kit/widget/kpi-card`；图表读取 runtime ECharts，表格/列表读取 DOM renderer，background 保持原路径读取。
10. widget 必须使用 skill 中已沉淀的本地 HTML/CSS/图片资产，生成阶段不访问外部设计文件。图表、表格、列表不得作为 Figma widget 读取。

## Layout 选择

1. `center_scene_layout`：园区、工厂、楼宇、建筑、3D、数字孪生、场景。
2. `map_command_layout`：地图、区域、点位、热力、轨迹、态势。
3. `kpi_focus_layout`：总额、总数、完成率、目标达成、核心指标。
4. `business_process_layout`：订单、工单、审批、流程、任务、表格、状态流转。
5. `balanced_metrics_layout`：无强主视觉但有多业务主题。
6. `equipment_monitor_layout`：设备、产线、厂站、运行状态、温度、压力、故障、维护。
7. `content_portal_layout`：资讯、视频、党建、文旅、展厅、宣传、品牌。
8. `ultra_wide_command_layout`：超宽、大屏墙、32:9、多系统综合指挥。

槽位只表示位置意图和优先级。先分析指标，主指标或主对象进入 `PrimarySlot`，其他指标按优先级和业务关系分布到左右、上下、底部、页签或下钻区域。

## 行业使用边界

行业场景只用于 mock 数据、指标命名、业务分组和文案生成。

kit 组件选择不得依赖行业：

- TopNav 按 `resolution`、`titlePosition`、`theme`、`status` 选择。
- Shell/CardShell 按 `theme`、`status`、尺寸和 `compatible` 选择。
- kpi-card 按 `dataShape`、槽位尺寸、变体、视觉权重和主题兼容选择。
- background 按 `theme` 选择。

## Shell 选择

1. 用户显式指定 Shell，例如 `Shell/CardShell/Style09`，优先服从指定样式，再用主题 tokens 控制可变色值。
2. `PanelShell` 一般只用于 `PrimarySlot` 中心主视觉区域背景，或不含主标题的背景框、组合底板、中心视觉承载框。
3. 其他带标题、承载业务指标、图表、列表、状态、任务、明细的模块默认 `CardShell`。
4. 只选 `assetType:"code"`、`status:"ready"`，并排除 `adaptation.usesFullNodeScreenshot:true` 的整图拉伸实现；允许局部 SVG、局部 PNG/JPG 素材。
5. Shell/CardShell 按 `theme` 过滤；无精确匹配时选同主题通用 Shell。第一次命中的业务 CardShell 锁定为页面级 `cardShellStyleLock`，后续普通业务模块复用同一风格；不要依赖 `industry` 或 `tone`。
6. CardShell 必须读取 `adaptation.contentSlot`，业务内容不能直接贴满外壳。
7. 仍无匹配时使用 CSS 降级，并记录到 `change-log`。

## 组件选择

| 区域功能 | 渲染方式 | 规则 | 降级 |
|---|---|---|---|
| KPI 指标卡 | `kit/widget/kpi-card` | 从本地 skill 合并 kpi-card.css，注入 style01~style35.html | CSS `.kpi-card` |
| 折线/面积/柱状/饼图 | ECharts | 使用 `runtime/echarts.min.js` + `chart-presets.js` | ECharts 不可用时 SVG/CSS fallback |
| 仪表盘/雷达/热力/漏斗/桑基/树图 | ECharts | 使用对应 preset，数据来自 JSON | SVG/CSS fallback |
| 地图 | ECharts map 或本地 SVG | 必须有本地 geoJSON/SVG；不得调用外部地图或 Figma | 抽象 SVG/CSS 态势 |
| 表格 | DOM renderer | 使用 `runtime/table-renderers.js` + `runtime/table-list.css`，生成时复制为 `styles/tables.css` | CSS table |
| 排名/告警/任务/事件列表 | DOM renderer | 使用 `runtime/table-renderers.js` + `runtime/table-list.css` | CSS list |
| 大字报/状态条/标签 | DOM/CSS | 直接生成可编辑 DOM | CSS fallback |

`kit/widget` 只保留 `kpi-card`。不得再读取 `kit/widget/chart-line`、`chart-bar`、`chart-pie`、`ranking-list`、`alert-list`、`big-number`、`map-area`。

## 降级顺序

1. KPI 查 `kit/widget/kpi-card`。
2. 图表查 runtime ECharts preset。
3. 表格/列表查 DOM renderer。
4. 主题匹配但 `status:pending` 时用 CSS 降级。
5. 完全不匹配时用 CSS/SVG 降级。
6. 记录到 `change-log`，说明未命中的 theme、component。
## Map Resource Selection

1. When the request contains national map, China map, regional distribution, province statistics, point distribution, map command, heat map, migration lines, or situation map signals, read `kit/map/catalog.json`.
2. Select map data by `scope`, `renderer`, and `status`. For China maps, use `kit/map/china/1.6.3/meta.json`.
3. ECharts map rendering must use local GeoJSON: copy `kit/map/china/1.6.3/china.geo.json` to the generated screen `assets/map/china.geo.json`, then fetch it locally and call `echarts.registerMap("china", geoJson)`.
4. Keep `china.topo.json` only as source data for maintenance. Do not register TopoJSON directly unless a local converter is included in the generated page.
5. Do not fetch remote map data during generation or runtime. Remote source URLs belong only in `references/map-source-map.json`.
6. If local map data is missing, use an abstract SVG/CSS situation map fallback and record the fallback in `change-log`.

## Variant And Candidate Selection

生成时必须把布局和视觉积木拆成两级选择。

```text
layout_type -> layoutVariant -> kit candidate
```

- 选中 `layout_type` 后，继续读取 `layout/{layout_type}/variants/catalog.json`。
- `layoutVariant` 决定空间结构，禁止直接套旧的三列固定坐标。
- TopNav、PanelShell、CardShell、background 在主题匹配后，如果有多个 ready 候选，使用稳定随机从前 2-4 个候选中选择。
- 稳定随机 seed 使用 `projectTitle + layout_type + layoutVariant + theme + resolution`。
- 页面内 CardShell 必须统一；跨项目允许不同。
- `change-log` 必须记录 `layoutVariant` 和 kit 候选选择原因。

## Output Pruning

生成输出时读取 `references/output-optimization-rules.md`。

- 只复制实际使用的 runtime、assets、CSS 和数据。
- 不复制 `shell.html`、`widget.html`、`meta.json`、未命中的 Style 目录和未使用 assets。
- 地图只复制一种本地数据文件；中国地图优先 `china.geo.json`，不要同时复制 `china.js` 和 `china.geo.json`。
- 先读 catalog summary，命中后再读具体 meta/code/assets，避免全量读取所有组件。

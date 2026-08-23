# 积木选择规则

本文件仅用于 `create` 或用户明确要求更换布局、主题、导航、外壳和组件的 `refine`。普通局部修改不重新执行候选选择。

## 轻量读取顺序

```text
ScreenBrief
-> layout/catalog.json
-> selected layout rule + variants/catalog.json
-> themes/catalog.json
-> kit/catalog.json
-> needed branch catalog
-> selected meta/code/css only
```

PNG、SVG、字体、GeoJSON 和 `runtime/echarts.min.js` 是 copy-only assets，不读取内容。禁止读取 `layout/common/*`；根据 SKILL.md 的条件表打开具体规则。

有 Node.js 时优先使用：

```bash
node scripts/resolve-plan.mjs --brief <brief.json> --output <screen/build-manifest.json>
```

## Layout

1. 用户明确指定且与画布兼容时直接使用。
2. 未指定时 data-first：先整理用户内容；缺失时规划 8–12 个混合模块。
3. 地图、场景、设备、流程、核心 KPI、内容门户和超宽画布属于强信号。
4. `balanced_metrics_layout` 仅在没有强信号时兜底。
5. `ultra_wide_command_layout` 只允许用于明确的 3840x1080/32:9 画布。
6. 选中 layout 后必须选择其 variant，再根据 TopNav 真实高度、contentArea 和 variant 比例计算坐标。
7. Slot 只描述位置和优先级，不固定卡片类型或数量。

## Theme

选择优先级：

```text
用户明确主题 id/中文名/别名
> 用户指定配色或视觉调性
> themes/catalog.json 场景匹配
> defaultTheme
```

行业只用于主题推荐、数据模拟和文案；不得直接决定具体 TopNav、Shell、KPI 或 background。

## TopNav

1. 读 `kit/TopNav/catalog.json`，按用户指定、resolution、titlePosition、theme、status 排序。
2. 只读最终候选 `meta.json` 和 `overlay.css`。
3. `SecondNavItem` 不能单独替代主 TopNav。
4. 高度按 `layoutMetrics.reservedHeight > max(variants/size/export height) > 100` 计算。
5. 主标题的字体、字号、位置、字重、颜色和阴影全部以选中 meta 的 `titleOverlay` 为准。
6. 默认 DOM 只生成主标题、实时时间和日期。副标题或其他标签必须由用户明确要求，且 meta 提供相应能力。

## Shell

1. 用户明确指定的 Shell 优先。
2. 只选 `assetType:"code"`、`status:"ready"`，排除整组件截图拉伸实现。
3. 普通带标题业务模块使用 CardShell；中心主视觉或无标题背景框可使用 PanelShell。
4. 首次选择普通 CardShell 后写入 `cardShellStyleLock`，同屏复用同一风格。
5. 内容必须注入 meta 声明的 `contentSlot`。
6. 只读取最终候选的 meta、component HTML、CSS 和被引用的局部 assets。

## KPI 与运行时组件

| 数据表达 | 实现 |
|---|---|
| 当前值、汇总值、状态值、核心结果 | `kit/widget/kpi-card` |
| 趋势、构成、排行、分布、关系 | 本地 ECharts presets |
| 表格、告警、任务、事件、状态列表 | 本地 DOM renderer |
| 地图 | 本地 GeoJSON/SVG + ECharts，或抽象 SVG/CSS 降级 |
| 简单数字、标签、状态条 | 可编辑 DOM/CSS |

KPI 按 catalog summary 初筛，再读取最终 Style 的 meta/component/base/style。当前 Ready 样式数量以 `kit/widget/kpi-card/catalog.json > styles` 为准，不使用写死的 Style 上限。

## 候选平局

默认选择最高得分。只有最高分相同才执行：

```text
sort candidates by id
index = FNV-1a(projectTitle + layout + variant + theme + resolution + variationSeed) % count
```

相同 brief 必须返回相同结果。只有需要主动变化时才设置新的 `variationSeed`。

## 降级

仅在 catalog/meta 不存在、状态不可用或尺寸不兼容时降级：

1. 先确认没有 Ready 候选。
2. 使用 CSS/SVG/DOM 降级，不编造路径。
3. 在 manifest 和 change log 记录未命中的条件及降级实现。

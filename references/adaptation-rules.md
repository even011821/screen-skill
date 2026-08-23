# 布局适配规则

## 基础分辨率

- 默认 1920x1080
- 2560x1440：等比放大，`scale.js` 自动处理
- 3840x2160：等比放大

## 适配策略

| 类型 | 策略 |
|---|---|
| 整体页面 | 单一居中缩放：`.screen-root` 使用 `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(var(--screen-scale)); transform-origin: center center;` |
| 全屏背景 | `object-fit: cover`，不破坏主体 |
| 布局规则 | 先读 `layout/catalog.json` 与 `rule.json`，按指标优先级分配槽位，不读取旧 HTML 占位 |
| 顶部导航 | `kit/TopNav` 纯背景 PNG + `overlay.css` DOM 主标题、实时时间和日期覆盖；其他内容需用户明确要求且 meta 支持 |
| 面板外壳 | `kit/Shell` 代码外壳，引用 HTML/CSS 并把内容注入 slot |
| 图表模块 | 本地 ECharts 5.6.1 + chart presets，`chart.resize()` 响应容器变化 |
| KPI 卡片 | DOM 自适应 |
| 表格/列表 | DOM renderer + `runtime/table-list.css` 数据驱动；按内容区高度计算行数，超出时分页/页签/轮播，不读取 Figma widget |

## CSS 结构约定

```css
html,
body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
.screen-root {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 1920px;
  height: 1080px;
  transform: translate(-50%, -50%) scale(var(--screen-scale, 1));
  transform-origin: center center;
  overflow: hidden;
}
```

## 顶部主标题

- 主标题必须用 DOM 文本覆盖在 TopNav 纯背景上，不写进 `nav.png`。
- 引用 `kit/TopNav/overlay.css` 的 `.ds-top-nav__title`。
- 字体、字号、位置、字重、颜色、描边和阴影以选中 `meta.json.titleOverlay` 为唯一来源，不使用固定的 38/44/48/76px 或统一加粗规则覆盖组件。
- TopNav 高度不能写死。按 `layout/common/nav-height-rules.md` 读取 `layoutMetrics.reservedHeight > max(variants[].size.h, size.h, export.outputSize.h) > fallback 100`。

## 槽位适配

- 槽位只表示位置意图和优先级，不固定内容类型。
- 主指标或主业务对象优先进入 `PrimarySlot`。
- 其他指标按优先级和业务关系分布到左右、上下、底部、页签或下钻。
- `PanelShell` 一般只用于中心主视觉区域背景，或不含主标题的背景框。
- 普通业务模块默认 `CardShell`，并必须把内容注入 Shell 声明的 content slot。
- 只有 KPI 指标卡读取 `kit/widget/kpi-card`；图表走本地 ECharts；表格、排名、告警、任务、事件列表走 DOM renderer。

## 不允许

- 目标分辨率下出现滚动条
- 同时使用居中缩放和 offset/left-top stage 两套缩放方案
- 固定像素截图式图表
- 直接使用旧 layout HTML 占位作为新流程骨架
- 写死 TopNav 高度或 contentArea 顶部
- 固定左侧、右侧、底部卡片数量
- 把 TopNav 主标题重新切进背景图
- 把 Shell 外壳重新导出成图片
- 忽略 CardShell 的 `adaptation.contentSlot`
- 从 `kit/widget` 读取 chart、table、ranking、alert、big-number、map 组件
- 运行时调用外部地图、外部图表库或 Figma 设计文件
- 面板角标随内容缩放变形

## 无截断适配

- 所有 KPI、图表、表格、排行、告警、任务和事件列表都必须在 Shell 的 content slot 内完整显示。
- 不能把 `overflow:hidden`、滚动条、文字省略或裁切当成最终适配方案。
- 图表需要按 content slot 重新计算 `grid`、legend、半径、中心点和 canvas 尺寸，并在布局完成后执行 `chart.resize()`。
- 列表/表格需要根据 content slot 高度计算可显示行数，超出数据进入分页、页签、轮播、弹窗或下钻。
- 如果内容放不下，优先减少图例、行数、间距、字号和次级文本；仍放不下时调整卡片高度或降低首屏模块密度。

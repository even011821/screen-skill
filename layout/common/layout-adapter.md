# Layout 适配流程

## 生成链路

```text
1. 读取用户需求，判断是否显式指定 layout_type。
2. 整理数据结构：用户通常提供 6–15 项内容；若缺失则先 mock 8–12 个混合业务模块；超过 15 项则先分组。
3. 分析主业务对象、主指标、辅助指标、低优先级内容、指标密度和业务关系。
4. 从 layout/catalog.json 选择 layout_type；auto 模式下必须 data-first，不能直接落到网格。
5. 读取 layout/{layout_type}/rule.json。
6. 读取 kit/TopNav/catalog.json，选择导航。
7. 根据 TopNav meta 计算 HeaderSlot 和 contentArea。
8. 按 layout rule 分配 PrimarySlot、ContextSlot、StatusSlot、DetailSlot、OverlaySlot。
9. 根据槽位职责选择 PanelShell 或 CardShell，并确定页面级 cardShellStyleLock。
10. 读取 Shell meta，获取尺寸约束和 contentSlot。
11. 将内容注入 Shell 的 contentSlot：KPI 使用 `kit/widget/kpi-card`，图表使用本地 ECharts presets，表格/列表使用 DOM renderer。
12. 绑定 theme、background、mock data。
13. 输出完整大屏页面并做无滚动条、模块碰撞和最小间距自检。
```

## 关键原则

- `layout` 管结构和信息权重。
- 槽位只管位置意图和优先级，不固定放某类内容。
- `TopNav` 管真实头部高度和标题覆盖层。
- `PanelShell` 管中心主视觉或无标题背景。
- `CardShell` 管普通业务模块。
- `widget` 只管有独立设计沉淀的 KPI 指标卡。
- ECharts 管图表；DOM renderer 管表格、排名、告警、任务和事件列表。

## 输出要求

生成页面必须记录：

- 命中的 `layout_type`
- 命中的 `TopNav` id 和读取到的导航高度
- 命中的 `Shell` id
- 每个槽位的职责和业务主题
- 图表 preset、DOM renderer、KPI widget 的使用情况
- 未命中 kit 时的 CSS 降级说明

## Layout Variant Selection

生成坐标前必须先选择 `layoutVariant`。

```text
layout/catalog.json -> layout/{layout_type}/rule.json -> layout/{layout_type}/variants/catalog.json -> panel geometry
```

- `layout_type` 决定信息架构类别，`layoutVariant` 决定空间组织方式。
- `layoutVariant` 不是 HTML 模板，不固定卡片数量，只给 PrimarySlot、辅助区域和扩展区的比例与组织方式。
- 生成器必须在 `change-log` 中记录命中的 `layoutVariant`、选择原因和主要槽位业务主题。
- 多个 variant 最高分相同时，按 id 排序并使用 `scripts/resolve-plan.mjs` 的 FNV-1a 平局规则；相同 brief 必须复现。
- 禁止所有 1920 页面默认复用左 420px、中 1000px、右 420px 的三列坐标。
- `map_command_layout` 和 `center_scene_layout` 即使都包含中心主视觉，也必须根据点位复杂度、指标密度和主视觉权重选择不同 variant。
- 所有 variant 生成的实际模块坐标必须遵守 layout `canvas.gap`；相邻 `.module/.screen-card` 不得共边或重叠。

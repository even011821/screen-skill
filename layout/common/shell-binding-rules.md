# Shell 绑定规则

`layout` 只决定槽位职责和尺寸范围，不直接决定具体外观。外观必须从 `kit/Shell` 读取。

## PanelShell 使用场景

`PanelShell` 一般用于中心主视觉区域背景，或不含主标题的背景框。

优先使用 `PanelShell` 的情况：

- `PrimarySlot` 中心主视觉区域背景
- 地图、3D、数字孪生、园区、工厂、楼宇、设备主画面容器
- 不含主标题的背景框
- 大面积组合区域底板
- 中心视觉承载框

## CardShell 使用场景

其他情况默认选择 `CardShell`：

- KPI 指标卡
- 图表卡
- 排名列表
- 告警列表
- 状态卡
- 趋势卡
- 任务、明细、表格模块
- 其他带标题栏的业务信息模块

## CardShell 页面级锁定

一次大屏生成中，普通业务模块只能使用一种 `CardShell` 风格，避免同屏混用多个卡片外壳。

选择流程：

```text
1. 先根据用户显式要求、主题、可用状态和目标槽位尺寸确定页面级 cardShellStyleLock。
2. 如果用户显式指定 Shell/CardShell/StyleXX，则 cardShellStyleLock = 指定 Style。
3. 如果用户未指定，则先按 theme/status/size/adaptation/contentSlot 过滤和评分。默认选最高分；最高分相同时按候选 id 排序并使用 `scripts/resolve-plan.mjs` 的 FNV-1a 规则确定一个 cardShellStyleLock。
4. 后续所有 KPI、图表、列表、任务、告警、明细等普通业务模块必须复用 cardShellStyleLock。
5. PanelShell 不参与 CardShell 锁定；它只用于中心主视觉或无标题背景。
6. 只有用户明确要求某个模块使用不同 CardShell，才允许例外，并必须写入 change-log。
```

记录要求：

```text
change-log 必须记录：
- cardShellStyleLock 的 id
- 锁定原因：用户指定 / 主题匹配 / 首个业务模块命中
- 任何例外模块及原因
```

## 硬规则

```text
1. 如果槽位是 PrimarySlot，且承载地图/3D/数字孪生/园区/工厂/设备主视觉，优先 PanelShell。
2. 如果区域只是无标题背景框、组合底板、中心视觉背景，优先 PanelShell。
3. 其他所有带标题、承载业务指标、图表、列表、状态信息的模块，默认 CardShell。
4. 用户显式指定 Shell/CardShell/StyleXX 或 Shell/PanelShell/StyleXX 时，以用户指定为最高优先级。
5. 页面级 cardShellStyleLock 一旦确定，后续普通业务模块不得再随机或轮换选择其他 CardShell。
```

## CardShell 注入规则

生成时必须读取选中 `CardShell` 的 `meta.json`：

```text
minSize
maxSize
header.height
adaptation.contentSlot
code.html
code.css
```

业务内容只能注入 `contentSlot`，不能直接贴满外壳。图表、列表、KPI 内容必须在 Shell 声明的内容插槽范围内渲染。

## 禁止项

- 不允许把 Shell 外壳重新切成整图背景。
- CardShell 不允许读取 `shell.html` 当业务模板；CardShell 的 `shell.html` 只用于人工预览。PanelShell 如在 meta 的 `code.html` 中明确指向 `shell.html`，则按 meta 使用。
- 不允许忽略 `contentSlot` 直接铺满卡片。
- 不允许同一页面同时混用多个 CardShell 风格，例如 `Style01` 和 `Style09` 同屏出现。

## 跨项目样式选择

同一页面内普通业务模块必须使用同一个 `cardShellStyleLock`。跨项目差异不能牺牲可复现性。

候选选择流程：

```text
theme/status/size/adaptation filter -> score by slot fit -> highest score -> deterministic tie-break -> lock cardShellStyleLock
```

- 如果用户显式指定 `Shell/CardShell/StyleXX`，直接使用指定样式。
- 如果没有显式指定，先按 `theme`、`status:"ready"`、`assetType:"code"`、槽位尺寸和 `contentSlot` 适配过滤。
- 多个候选最高分相同时，按 id 排序并使用 `FNV-1a(projectTitle + layout_type + layoutVariant + theme + resolution + variationSeed)` 计算索引。
- 页面内锁定后，后续 KPI、图表、列表、状态、任务和明细等普通业务模块继续复用该 CardShell。
- `PanelShell` 也应按同样方式在候选中选择，但不参与 `cardShellStyleLock`。
- TopNav、PanelShell 和 background 使用相同平局规则。相同 brief 必须复现；需要主动变化时才设置新的 `variationSeed`。

`change-log` 必须记录：

- 候选过滤条件。
- 选中的 CardShell、PanelShell、TopNav、background。
- 如果发生平局选择，记录 seed 字段来源和 `variationSeed`，不需要记录 hash 具体值。

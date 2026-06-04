# KPI 指标卡组件规则

本文档记录 `kit/widget/kpi-card` 的实现规则，后续新增或修复 KPI 指标卡时按此执行，避免重复说明。

## 适用范围

- `kit/widget` 只保留 `kpi-card` 这一类设计型业务组件。
- 关键指标、指标数值、同比/环比、简单趋势状态等使用 `kpi-card`。
- 图表统一使用本地 ECharts runtime 和 preset，不再为图表单独维护 Figma widget。
- 表格、排行、告警、任务、事件流等使用 DOM renderer，不额外读取 Figma widget 样式。
- 不为 chart、table、list、big-number、map 创建新的 Figma widget 目录。

## 文件结构

每个 KPI 样式必须使用以下结构：

```text
kit/widget/kpi-card/
|-- base.css
|-- catalog.json
|-- assets/common/
`-- StyleXX/
    |-- component.html
    |-- style.css
    |-- meta.json
    |-- widget.html
    `-- assets/
```

- `component.html`：生成器调用的纯组件片段，只保留组件外壳、数据插槽和必要装饰层，不放预览 wrapper。
- `widget.html`：人工预览页，只用于检查样式和适配，不作为业务模板读取。
- `style.css`：当前 Style 的原生 CSS，不使用 Tailwind。
- `meta.json`：记录尺寸、插槽、素材、适配方式和状态；不记录 Figma 来源或行业字段。
- `assets/`：只放本地素材，最终 HTML/CSS/meta 不允许长期引用 Figma MCP 临时 URL。

## 插槽规则

KPI 卡片必须保留可编辑数据插槽，不能把业务文字和数值烘焙进图片。

```html
<strong data-slot="value">89</strong>
<span data-slot="label">运行效率指数</span>
```

常用插槽包括：

- `title`
- `value`
- `unit`
- `label`
- `trend`
- `subtitle`

## Figma 素材规则

- 实现前先读取指定 Figma 节点，确认基准尺寸、图层命名、约束、素材和可编辑区域。
- 不要把整个组件截图作为可拉伸背景，除非用户明确要求做固定图片组件。
- 只能导出必要的局部图层、布尔图形、装饰层、图标或复杂光效素材。
- 所有远程素材必须下载或转换到本地 `assets/` 目录。
- 固定装饰、非标准形状、图标、圆环等必须保持原比例。
- 如果直接拉伸会变形，需要拆分为局部素材、CSS 可拉伸层和固定比例装饰层。
- Figma 中的 helper、mask、临时占位矩形不能当成最终可见层渲染。

## SVG 与 PNG 选择

- 矢量 path、布尔图形、简单描边、渐变优先使用 SVG。
- 复杂 blur、glow、filter、位图效果或 Figma 实际返回 PNG 字节时使用 PNG。
- 如果 Figma 返回的是 PNG 字节，不要强行命名成普通 SVG 假装是矢量。
- 如用户要求 SVG 包裹 PNG，可以使用本地 SVG 内嵌 data image，但必须在 `meta.json` 中注明。
- 高保真位图装饰建议导出 2x，尤其是后续可能放大的环形、底座、光效类素材。

## 适配规则

- `.kpi-card` 根节点应优先跟随父容器尺寸：`width: 100%; height: 100%;`。
- `style.css` 中仍需声明 `min-width`、`min-height`、`max-width`、`max-height`，并与 `meta.json` 保持一致。
- 预览页必须至少展示最小尺寸和最大尺寸；建议同时展示基准尺寸。
- `widget.html` 的不同尺寸必须真正改变父容器宽高，不能因为根节点固定 `width/height` 导致所有预览看起来一样。
- 文本保持 DOM 渲染，使用 `clamp()`、`max-width`、`text-overflow` 控制溢出。
- 圆环、图标、底座、异形装饰等固定比例元素使用 `aspect-ratio`、`background-size: contain` 或局部 SVG/PNG，不做非等比拉伸。

## 生成时选择规则

生成器不能默认选择 `catalog.json` 中第一个 KPI Style。必须先按数据和槽位匹配，再决定样式。

选择顺序：

```text
1. 数据形态：是否包含 title/value/unit/subtitle/label/trend，是否是百分比、数量、状态、正负变化。
2. 槽位尺寸：目标槽位是否落在 style 的 minSize/maxSize 内；固定尺寸组件必须有准确预留空间。
3. 变体需求：正负、红黄蓝、状态色等必须匹配 meta.variantRule。
4. 视觉权重：普通指标用标准/紧凑卡；中心强调指标可用装饰型或固定视觉卡。
5. 适配能力：需要拉伸时排除 fixed-size；不需要适配时允许固定尺寸。
6. 主题兼容：如果 meta 有 theme 字段，再按主题过滤。
```

`defaultStyle` 只能作为最后兜底。使用兜底时必须写入 `change-log`，说明没有命中更合适的 KPI Style。

## 渐变边框规则

简单矩形渐变边框优先使用 `border-image-source` 和 `border-image-slice: 1`：

```css
border: 1px solid;
border-image-source: linear-gradient(135deg, rgb(107, 174, 150, 1) 0%, hsla(159, 29%, 54%, 0) 20%);
border-image-slice: 1;
```

只有当边框为异形、裁切、复杂圆角或需要特殊角部行为时，才改用 SVG 或伪元素。

## 正负变体规则

当两个 Figma KPI 节点属于同一组件类型，只是正负状态不同，不要拆成两个 catalog style，应合并为一个 Style 的两个变体。

- 两个状态放在同一个 `StyleXX/` 目录。
- 保留一个 `component.html`，通过 `data-variant` 切换视觉状态。
- 如果变体由数值正负决定，增加本地 `variant.js`，并写入 `meta.json > code.js`。
- 正值使用第一个 Figma 变体，负值使用第二个 Figma 变体。
- 背景素材、文字颜色、箭头方向、图标颜色必须同步切换。
- 固定比例背景可以作为局部装饰图导出，但必须使用 `background-size: contain` 或等比容器。
- 合并后要从 `catalog.json` 删除被合并的独立 Style，避免生成器把负向变体当作单独组件选择。

示例：

```html
<section class="kpi-card kpi-card--style12" data-auto-variant="value" data-variant="positive">
  <div class="kpi-card__platform" aria-hidden="true"></div>
  <strong data-slot="value" data-value="10">10%</strong>
  <span class="kpi-card__arrow" aria-hidden="true"></span>
</section>
```

## 复杂横条类组件规则

类似 `Style16` 的横条按钮型 KPI 不能只用粗略 `clip-path + border` 近似。

- 先根据 Figma 层级拆出左侧 frame path、主体 path、中心连接、端点、小 rect、右侧箭头、图标 glow 等局部元素。
- 背景主体可以使用可拉伸 SVG 或 CSS 渐变，但两端、箭头、图标等固定装饰必须保持比例。
- 文字、数值、单位仍为 DOM 插槽，不烘焙进背景。
- 装饰层的位置按 Figma 基准尺寸转换为百分比，支持宽高变化。
- `meta.json` 必须列出所有本地素材，并说明未使用整节点截图。

## Style10 圆环规则

`Style10` 圆环 KPI 按以下方式实现：

- `.kpi-card__ring` 只是等比容器。
- `Decoration/RingBackground` 放底层，使用 PNG 2x。
- `Decoration/RingForeground` 放上层，优先 SVG；如 Figma 返回 PNG 但需要 SVG，可用本地 SVG 包裹 PNG。
- 背景环逆时针旋转：`5s linear infinite`。
- 前景环顺时针旋转：`5s linear infinite`。
- 数值和标题不参与旋转。
- 两层圆环都随容器等比缩放。

## meta.json 规则

- KPI `meta.json` 不再添加 `industry` 或 `tone`。
- 如果存在主题匹配，只依赖 `theme`，不按行业选择。
- KPI `meta.json` 不保留 `figma` 字段；Figma 来源统一迁移到 `references/figma-source-map.json`，仅用于维护。
- 只有完成校验后才标记 `assetType: "code"` 和 `status: "ready"`。
- 必须记录是否使用本地素材、是否保持比例、是否避免整图拉伸。
- 如果使用 PNG-in-SVG 包裹，必须说明该 SVG 是包装文件，不是真矢量导出。

## 常见问题记录

- 预览页只放一个固定尺寸会掩盖适配问题；必须展示 min/base/max 或至少 min/max。
- 根节点写死 `width: 200px; height: 180px;` 会导致外层尺寸变化无效，应改为跟随父容器。
- 复杂 Figma 组件不能用一个大渐变背景替代，否则会丢失边角、连接线、箭头和光效。
- 中文乱码和损坏标签会直接影响预览判断，`component.html` 和 `widget.html` 都必须清理。
- 合并变体后要同步清理 `catalog.json`，否则生成器仍可能选到已删除或不完整的 Style。
- 生成器不能因为 `defaultStyle` 或 catalog 顺序选择第一个 KPI Style；必须按数据形态、尺寸和变体需求排序。

## 校验清单

标记 KPI Style 为 ready 前必须检查：

- `catalog.json` 可解析。
- `StyleXX/meta.json` 可解析。
- CSS 中所有 `url("./assets/...")` 都指向存在的本地文件。
- SVG 文件是合法 XML。
- PNG/JPG/WebP 文件是正确二进制格式。
- `component.html` 不包含预览 wrapper，且保留 `data-slot`。
- `widget.html` 可直接打开预览，并展示最小尺寸和最大尺寸。
- 最终 HTML/CSS/meta 不残留 Figma MCP 临时 URL。
- `meta.json` 不包含 `figma` 或 `industry` 字段。
- 可见文字无乱码，HTML 标签无损坏。
- 固定比例装饰在最小、基准、最大尺寸下不明显变形。

## KPI 使用率与主题变量规则

- 业务指标数量不等于 KPI 组件数量。一个业务指标可以只有一个数值，也可以包含多条同类数值项。
- 当一个业务指标包含多条同类数据项时，优先匹配 `catalog.json` 中标记为 `grouped-metrics-card`、并支持 `metrics` / `metricItem` / `repeatable` 的现有样式，不要因为“只有一个指标名称”就放弃 KPI。
- 多个结构相似的汇总指标可以复用同一个 KPI Style 生成多个实例；禁止因为 catalog 顺序或 `defaultStyle` 默认选择第一个样式。
- 金额、数量、比例、完成率、同比、环比、告警数、在线数、库存数、项目数、状态数量、当前值、汇总值、核心经营结果等，必须先进入 `widget:kpi-card` 候选。
- 图表主要承载趋势、构成、排行、分布、关系；KPI 主要承载当前值、汇总值、状态值和核心结果。
- 如果存在可转为 KPI 的数值型汇总数据，但生成结果没有使用 KPI，必须在 `change-log` 说明原因。
- `catalog.json` 可以在每个 Style 条目的 `summary` 中记录轻量选择信息，如 `cardType`、`size`、`minSize`、`maxSize`、`slots`、`dataShape`、`repeatable`、`metricItem`、`maxRecommended`、`variantRule`，但不要复制完整 `meta.json`。
- 只有 Figma 明确标记为主题变量的颜色位置，才能映射为 `var(--theme-primary)` 或相关主题 token；没有变量标识的位置不改色。
- 状态色、正负值颜色、告警色和组件固定背景/边框/SVG 素材优先级高于主题主色，禁止全局覆盖 KPI 颜色。
- 已确认主题变量绑定时，应在对应 Style 的 `summary.themeColorBindings` 中记录 `slot`、`selector`、`property`、`figmaVariable`、`cssToken`、`fallback` 和 `nodeId`，便于生成器只在这些位置启用主题色。

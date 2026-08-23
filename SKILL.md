---
name: screen-skill
description: 使用本地 layout、theme、kit/meta.json 与 ECharts 资源创建、修改或审计数据大屏、驾驶舱和指挥中心页面。适用于 1920x1080、3840x1080 等固定画布数据大屏；不用于后台 CRUD、移动端 H5、营销落地页或静态海报。
---

# 数据大屏生成 Skill V2

## 目标

以数据和业务关系为起点，按 `layout_type -> layoutVariant -> slot geometry -> kit candidate -> output pruning` 生成可运行、可编辑、可本地打开的数据大屏。所有布局、主题和视觉积木都从本 Skill 的 catalog 与 `meta.json` 查表选择；没有资源时才降级，不靠记忆猜路径。

保留以下核心逻辑：

```text
data-first -> layout -> variant -> slots -> TopNav/Shell/KPI/runtime -> data binding -> validation
```

## 面向用户的输入

不要要求非专业用户理解 layout、slot、variant、kit 或组件编号。使用以下引导：

> 告诉我大屏主题、最重要的 6–15 项内容，以及是否有真实数据或参考图。内容通常不少于 6 项；未说明时默认使用 1920×1080，并将自动补充的数据明确标记为模拟数据。

将自然语言整理为 `ScreenBrief`。只在缺失信息会实质改变结果时追问；用户要求直接生成时，使用：

```json
{
  "resolution": "1920x1080",
  "dataSource": "mock-first",
  "layoutType": "auto",
  "outputMode": "standalone"
}
```

未提供内容时默认生成 8–12 个混合业务模块；少于 6 项时可补充相关 `inferred/mock` 内容，除非用户禁止；多于 15 项时先按业务主题分组，次级内容进入页签、轮播、弹窗或下钻。

## 事实优先级

发生冲突时严格按以下顺序处理，低优先级不得覆盖高优先级：

1. 用户当前明确要求。
2. 用户提供的数据、设计稿、图片和已有项目文件。
3. 已选组件的当前 `meta.json`、catalog 和 layout rule。
4. 本 Skill 的默认规则。
5. 推断数据和模拟数据。

保留用户已替换的图片、文字、数据和样式。无法确认的假设写入 `screen/build-manifest.json` 与 `change-log.md`，不得声称模拟、推断或过期数据是真实/实时数据。

## 运行模式

开始前先选择一种模式。详细流程读取 [references/workflow-modes.md](references/workflow-modes.md)。

| 模式 | 使用条件 | 读取范围 |
|---|---|---|
| `create` | 新建大屏，或没有可用构建清单 | 执行完整的 data-first 规划和候选选择 |
| `refine` | 修改已有页面、按截图调样式或交互 | 先读 `screen/build-manifest.json`、目标文件和相关 meta；除非用户要求，不重选 layout/theme/kit |
| `audit` | 检查问题、验收、诊断 | 只读检查；不修改页面，除非用户同时要求修复 |
| `maintain-kit` | 新增或维护 TopNav、Shell、KPI、地图、catalog | 读取对应维护规范；生成页面时禁止加载维护 source map |

若已有 `screen/build-manifest.json`，默认进入 `refine`；不要把一次颜色、边框、字体或数据修改升级为完整重建。

## 高效执行流程

### 1. 规范化需求

生成简洁 `ScreenBrief`：标题、场景、6–15 项内容、主对象、分辨率、数据来源、参考文件、明确约束、需要保留的内容。数据字段规则见 [references/data-contract.md](references/data-contract.md)。

### 2. 生成或读取构建计划

- `create`：有 Node.js 时优先运行 `node scripts/resolve-plan.mjs --brief <brief.json> --output <screen/build-manifest.json>`。无 Node.js 时按 [references/workflow-modes.md](references/workflow-modes.md) 中相同的确定性规则手工生成清单。
- `refine`：直接读取现有构建清单，只重新解析被用户明确改变的选择。
- 永远不要读取压缩运行库、PNG、SVG、字体或 GeoJSON 来帮助选择；这些属于 copy-only assets。

### 3. 只读必要文件

`create` 的轻量读取顺序：

```text
layout/catalog.json
-> selected layout rule + variants/catalog.json
-> themes/catalog.json
-> kit/catalog.json
-> needed branch catalog
-> selected meta/code/css only
```

禁止使用 `layout/common/*` 通配读取。按需读取：

| 条件 | 读取文件 |
|---|---|
| 所有 create | `layout/common/slot-schema.json`、`nav-height-rules.md`、`viewport-fit-rules.md` |
| 使用 CardShell/PanelShell | `layout/common/shell-binding-rules.md` |
| 高密度或内容数量变化 | `layout/common/density-rules.md` |
| 计算具体 variant | `layout/common/layout-variant-rules.md` |
| Node.js 不可用或需要手工重选 | `references/selection-guide.md` |
| KPI | `references/widget-kpi-card-rules.md` |
| 地图 | `references/map-kit-rules.md` |
| 用户未提供业务内容，需要行业 mock | `references/industry-prompts.md` |
| 非默认画布或多分辨率适配 | `references/adaptation-rules.md` |
| 输出交付 | `references/output-optimization-rules.md` |
| 国产/通用 Agent 或能力缺失 | `references/portable-agent-rules.md` |

### 4. 生成页面

- 先选 TopNav，并按选中 meta 的 `layoutMetrics.reservedHeight`、候选高度和 `contentGap` 计算内容区，禁止写死 Header 高度。
- 根据业务优先级分配槽位；`PrimarySlot` 聚焦主指标、地图、场景或主业务对象，其他内容按关系分布，不固定左右/底部卡片数量。
- 页面级只锁定一种 `cardShellStyleLock`。普通带标题业务模块使用 CardShell；中心主视觉或无标题背景框可用 PanelShell。
- KPI 按数据形态、槽位尺寸、视觉权重和 meta 选择；趋势、构成、排行、分布和关系使用本地 ECharts；表格/列表使用本地 DOM renderer。
- 所有组件先读取 Shell `contentSlot` 再计算内部尺寸。放不下时调整密度、卡片尺寸或信息层级，不用滚动、裁切、隐藏或省略号掩盖问题。
- 页面默认只使用主标题、实时时间和日期。副标题及其他顶部内容只有在用户要求且 TopNav meta 提供对应能力时生成。
- TopNav 字体、字号、位置、颜色和阴影以选中 `meta.json > titleOverlay` 为唯一来源；不得用 Skill 中的固定字号覆盖 meta。

### 5. 输出与记录

默认输出到用户项目的 `screen/`，并生成：

- `index.html`、实际需要的 CSS/JS/runtime/assets。
- `data/sample-data.json`，同时在 `index.html` 内联同一份数据，保证 `file://` 可打开。
- `build-manifest.json`：保存 brief、选择结果、资源、保留项、假设、降级与验证等级。
- `data-field-map.md` 与 `change-log.md`。

只复制实际使用的文件。`echarts.min.js`、地图数据、图片和字体只复制，不作为模型阅读材料。完整输出裁剪规则见 [references/output-optimization-rules.md](references/output-optimization-rules.md)。

### 6. 校验

先运行零依赖静态校验：

```bash
node scripts/validate-screen.mjs <screen-directory>
```

校验按能力分级，不因缺少浏览器或设计连接器而伪造结果：

1. `static`：JSON、路径、资源引用、构建清单、远程依赖，所有 Agent 必须完成。
2. `runtime`：有 Node.js/浏览器时检查脚本运行、容器尺寸和 ECharts 初始化。
3. `visual`：有截图能力时检查目标分辨率、溢出、碰撞、间距和视觉还原。

交付前读取 [references/checklist.md](references/checklist.md)。只声明实际完成的最高校验等级。

## 不可违反的约束

- 不编造 kit id、资源路径、真实数据、实时数据或设计稿细节。
- 不读取 `references/figma-source-map.json`、`map-source-map.json` 或外部设计文件参与普通生成选择。
- 不把业务模块导出为整图；DOM、图表和数据必须可编辑。
- 不使用 CDN 或远程地图运行时；standalone 输出必须离线可用。
- 不混用多个 CardShell，不忽略 content slot，不写死 TopNav 高度。
- 不跳过 `layoutVariant`，不把所有布局退化成同一套固定三列坐标。
- 不把 mock 业务分类放入 TopNav，不自动添加天气、组织名、系统名或未授权副标题。
- 不在容器尺寸为 0 时初始化 ECharts；缩放后初始化并绑定 resize。
- `.screen-root` 使用单一居中缩放方案；目标分辨率无页面滚动条，模块不重叠且满足 layout gap。
- 无匹配资源时使用明确降级并记录；不得“有资源不用”或“无资源假装存在”。

## 维护模式

只有 `maintain-kit` 才读取维护资料：

- CardShell：`references/cardshell-component-rules.md`
- 地图：`references/map-kit-rules.md` 与维护 source map
- Figma 来源：`references/figma-source-map.json`
- catalog 一致性：运行 `node scripts/audit-catalogs.mjs`

新增积木后更新对应分支 catalog 和统计，不需要把具体组件规则继续堆入本入口文件。

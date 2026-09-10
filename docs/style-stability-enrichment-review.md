# 样式系统稳定性维护说明

六套正式组合已写入 `references/style-profiles.json`，状态为 `approved` 且 `selectionEnabled: true`。规划脚本只会从这些组合中选择 TopNav、CardShell、PanelShell、背景和 KPI；`references/style-stability-review.draft.json` 仅作为历史草案保留，不参与选型。

## 一键验证

在 skill 根目录运行：

```powershell
node scripts/verify-style-system.mjs --render
```

命令会按固定顺序完成元数据同步、目录审计、主题兼容审计、Shell 浏览器测量、元数据回写、六套回归样例和组合预览生成。任一步失败都会返回非零退出码，阻止错误组合继续进入生成流程。

如只需检查文件是否已经同步，不写入元数据：

```powershell
node scripts/sync-style-metadata.mjs --check
```

## 自动生成的信息

- `references/style-inventory.generated.json`：TopNav、CardShell、PanelShell、KPI 和背景的统一清单，包含主题、尺寸、内容区、背景模式、资源和所属组合。
- `references/shell-runtime-audit.generated.json`：Shell 在最小尺寸、标准尺寸和 640×360 下的标题容量、内容区、层级、溢出、碰撞和滚动条检查。
- `references/regression-report.generated.json`：六套组合的确定性选型、资源路径、回退情况和运行检查结果。
- `references/style-system-verification.generated.json`：整条验证链的步骤、命令、输出和最终状态。
- `docs/style-profile-review/style-profile-overview.png`：六套已批准组合的总览图；同目录保留每套组合和 KPI 对照图。

组件 meta 中的 `approvedProfiles`、KPI meta 中的 `approvedKpiRoutes`、Shell meta 中的 `runtimeAudit` 均由脚本维护。不要手工复制这些字段；先修改 profile 或组件源信息，再运行一键验证。

## 当前验证基线

- 组件清单：24 个 TopNav、14 个 CardShell、6 个 PanelShell、15 个 KPI、9 个背景。
- 已批准组合：6 套，80 个组件位置，45 个唯一组件。
- KPI 路由：10 条，覆盖 14 个唯一 KPI 样式。
- Shell 运行检查：20 个组件、60 个尺寸用例，20 个组件通过，0 个失败。
- 回归样例：6 个业务简报全部稳定命中预期组合，0 个资源缺失，0 个非批准回退。

## 维护规则

新增或修改组件时，先完善主题、尺寸、插槽、适配方式和资源声明，再决定是否加入某个已批准 profile。调整 profile 后必须重新生成预览并运行完整验证。

PanelShell 的边框资源需要保留透明通道。`backgroundMode: transparent-border-only` 表示组件只提供边框与角饰，页面主题负责底色。CardShell 的运行审计可以回写测量结果，但不应借此改动其 HTML、CSS 或视觉资源。

选型顺序固定为：

```text
用户明确要求
-> 硬性画布与组件兼容条件
-> 已批准的 style profile
-> layout / variant / density
-> KPI dataShape 与 slot fit
-> 单组件候选平局规则
```

主题定义颜色体系，profile 定义可共同使用的组件族，组件 meta 定义几何与资源，布局规则定义坐标、尺寸和溢出策略。模型只负责读取结果和填充业务内容，不再自由拼接未审核组合。

# 验收清单

## P0（必须通过）

- [ ] 1920x1080 无页面滚动条
- [ ] 页面本地可打开，无 JS/CSS 语法错误
- [ ] 已读取 `layout/catalog.json`，并记录命中的 `layout_type`
- [ ] 已读取目标 `layout/{layout_type}/rule.json` 与 `layout/common/*`
- [ ] 槽位分配基于指标优先级和业务关系，不是固定卡片数量
- [ ] 已记录 TopNav id、真实导航高度、contentArea 计算结果
- [ ] 未写死 TopNav 高度或 contentArea 顶部
- [ ] `PanelShell` 只用于中心主视觉区域背景或无标题背景框
- [ ] 普通业务指标、图表、列表、状态模块默认使用 `CardShell`
- [ ] CardShell 内容已注入 `adaptation.contentSlot`，未直接贴满外壳
- [ ] `kit/widget` 只使用 `kpi-card`
- [ ] 图表使用本地 `runtime/echarts.min.js` + `chart-presets.js`
- [ ] 表格、排名、告警、任务、事件列表使用 DOM renderer，不读取 Figma widget
- [ ] 地图使用本地 geoJSON/SVG 或 CSS/SVG 降级，未调用外部地图资源
- [ ] 面板标题不是占位文本
- [ ] 所有指标数据来自 JSON 配置或明确绑定
- [ ] Mock 数据标记 `source: "mock"`
- [ ] 字段映射表存在（data-field-map.md）
- [ ] kit 资源使用情况记录在 change-log
- [ ] 降级内容记录在 change-log
- [ ] 图表容器支持 resize
- [ ] 没有编造不存在的 kit 资源路径
- [ ] `themes/catalog.json` 可解析，生成页使用新版主题 id

## P1（建议通过）

- [ ] 2560x1440 和 3840x2160 缩放正常
- [ ] 支持切换主题 tokens
- [ ] 支持增删 KPI 指标
- [ ] 支持无数据 fallback
- [ ] 支持图表 fallback SVG
- [ ] 支持真实接口接入预留

## 禁止项检查

- [ ] 未编造不存在的 kit 资源
- [ ] Mock 数据未伪装成真实数据
- [ ] 业务模块未导出为不可编辑图片
- [ ] 目标分辨率无滚动条
- [ ] 无占位标题
- [ ] 未直接使用旧 layout HTML 占位作为新流程骨架
- [ ] 未固定左侧、右侧、底部卡片数量
- [ ] 未忽略 Shell 的 content slot
- [ ] 未从 `kit/widget` 读取 chart/list/table/map/big-number

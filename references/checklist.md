# 验收清单

校验按能力分级。只声明实际完成的最高等级，不把缺少浏览器时的静态检查描述为“视觉已通过”。

## Static（所有 Agent 必须完成）

- [ ] `build-manifest.json`、`data/sample-data.json` 和实际使用的 JSON 可解析。
- [ ] manifest 记录 layoutType、layoutVariant、theme、TopNav、cardShellStyleLock、资源、假设和 fallback。
- [ ] 所有本地 `src/href/url()/fetch()` 路径存在，没有 CDN、远程地图或临时设计资源。
- [ ] `index.html` 内联数据，直接 `file://` 打开不会因 JSON fetch 失败而空白。
- [ ] 只复制实际使用的 runtime、CSS 和 assets；压缩库没有被当作说明读取。
- [ ] 每项数据标记 `real/inferred/mock/missing`，没有把 mock/inferred 写成真实或实时。
- [ ] TopNav 高度和内容区来自选中 meta，不是固定值。
- [ ] TopNav 字体、字号、位置、颜色和阴影来自选中 meta 的 `titleOverlay`。
- [ ] 默认 TopNav 只有主标题、日期、实时时间；无未授权副标题、天气、组织名或业务页签。
- [ ] 同一页面普通业务模块只使用一个 `cardShellStyleLock`。
- [ ] CardShell/PanelShell 内容位于其 `contentSlot`。
- [ ] 没有占位标题、编造的 kit 路径或整图业务模块。
- [ ] 字段映射和 change log 存在。

运行：

```bash
node scripts/validate-screen.mjs <screen-directory>
```

## Runtime（有 Node.js/浏览器时）

- [ ] 页面本地运行无 JS/CSS 错误。
- [ ] ECharts 在缩放完成且容器宽高非 0 后初始化。
- [ ] 图表和页面绑定 resize。
- [ ] 数据切换、页签、轮播或按钮交互可用。
- [ ] 无数据和加载失败时有明确 fallback。

## Visual（有浏览器/截图时）

- [ ] 目标画布完整居中显示，无页面滚动条。
- [ ] `.screen-root` 只使用一种居中缩放方案。
- [ ] 模块不重叠、不共边，间距不小于 layout `canvas.gap`。
- [ ] 每个组件的 `scrollWidth/clientWidth` 与 `scrollHeight/clientHeight` 通过。
- [ ] PrimarySlot 是第一视觉焦点，其他内容层级清晰。
- [ ] 图表、字体、边框、背景和素材与选中 meta 或用户参考一致。
- [ ] 1920x1080 通过；用户要求其他分辨率时同时验证该目标画布。

## Maintain Kit

- [ ] 分支 catalog、kit catalog 数量和 Ready 状态一致。
- [ ] meta 中的 code、CSS、assets 路径存在。
- [ ] 运行 `node scripts/audit-catalogs.mjs` 通过。
- [ ] 预览文件未被复制到生成页面。

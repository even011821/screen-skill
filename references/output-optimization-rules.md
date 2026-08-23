# Output Optimization Rules

生成目标是减少时间和文件冗余，同时保持页面可本地运行。

## 输出模式

- `standalone`：默认交付模式。只复制当前页面实际用到的 runtime、assets 和样式。
- `linked`：开发加速模式。允许引用 skill 内公共 runtime，不复制大体积公共库；交付前需要切回 `standalone`。
- `refine` 修改已有页面时，复用现有 manifest 和资源；只复制本次新增或被替换的文件，不重新展开完整输出。

## 必须复制

- `index.html`
- `main.js`
- `build-manifest.json`
- `data/sample-data.json`
- 实际使用的主题 CSS tokens
- 实际使用的 TopNav 背景和 overlay 样式
- 实际命中的 Shell `component.html` 片段所需 CSS 与 assets
- 实际命中的 KPI `component.html`、`base.css`、`style.css` 与所需 assets
- 实际使用的 ECharts、table renderer、map data、scale runtime

## 不复制

- `shell.html`
- `widget.html`
- `meta.json`
- 未命中的 Style 目录
- 未使用组件的 assets
- Figma 维护索引，如 `references/figma-source-map.json`
- 只供维护使用的 `china.topo.json`

## Runtime 按需规则

- 只有使用 ECharts 图表或 ECharts 地图时复制 `runtime/echarts.min.js`。
- 只有使用 DOM 表格、排行、告警、任务或事件流时复制 `runtime/table-renderers.js` 和 `runtime/table-list.css`。
- 只有使用地图时复制一个本地地图数据文件。中国地图优先复制 `china.geo.json`，不要同时复制 `china.js` 和 `china.geo.json`。
- 没有 3D 场景时不复制 Three.js；如果 skill 本地没有 Three.js runtime，不要伪造路径。
- `scale.js` 仍需复制，除非生成器将等价缩放逻辑内联到 `main.js`。

## 读取优化

生成时先读轻量 catalog summary；只有候选命中后再读取对应 `meta.json`、`component.html`、CSS 和 assets。

```text
catalog summary -> rank candidates -> read selected meta/code/assets -> generate
```

不要一开始读取所有 TopNav、Shell、KPI 的完整 HTML/CSS/assets。

以下文件只能复制或引用路径，不作为模型说明材料读取：

- `runtime/echarts.min.js`
- PNG/JPG/GIF
- 字体文件
- GeoJSON/TopoJSON
- 未被选中的 SVG 与组件 assets

`refine` 模式先读取 `build-manifest.json`，不得重新遍历所有 catalog，除非用户明确要求更换布局、主题或组件。

## 校验优化

- JSON 只校验实际读取和输出的文件。
- SVG 只校验实际复制的 SVG。
- create 的浏览器预览只验证最终页面一次；refine 先验证受影响区域，再做一次页面级检查。
- `shell.html`、`widget.html` 不参与生成阶段校验。
- `change-log` 必须记录 outputMode、复制的 runtime 和被裁剪的维护文件类别。

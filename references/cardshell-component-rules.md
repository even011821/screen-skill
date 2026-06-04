# CardShell 组件规则

在从 Figma 导入或修改 `kit/Shell/CardShell/{Style}` 组件时，遵循以下规则。

1. 先读取目标 Figma 节点，确认基准尺寸、图层名称、约束、局部资源和可编辑插槽。
2. 不要把完整组件截图作为运行时可拉伸背景使用。只导出必要的局部 SVG 图层、布尔形状和固定装饰元素。
3. 对于 `.internal/background` 或其他布尔形状，优先使用本地 SVG，以保留真实的 `path`、`fill`、`gradient`、`mask` 和边框发光效果。
4. 可拉伸 SVG 的根节点必须包含 `preserveAspectRatio="none"`、`width="100%"` 和 `height="100%"`。
5. 背景透明度必须保留在背景图层上。不要在根容器上设置透明度。

6. 不要将 Figma 辅助图层、遮罩图层或临时矩形作为最终可见图层渲染出来。

7. 标题形状、裁切线条、装饰角和固定装饰物，如果形状复杂，应使用本地导出的 SVG。简单矩形和可拉伸分段可以使用 CSS 实现。

8. 固定装饰物在可行时应使用一个本地 SVG 资源表示，不要拆成很多无关联的硬编码矩形。

9. 只使用原生 HTML 和 CSS。不要添加 Tailwind。不要在运行时文件中保留 Figma MCP 的临时 URL。

10. 下载或转换所有 Figma MCP 远程资源，并放入组件的 `assets/` 目录中。

11. 每个 CardShell 样式应包含：

    * `component.html`：供生成器使用的运行时片段；只包含 shell、标题和内容插槽。
    * `shell.html`：直接在浏览器中预览；只展示空卡片，不包含 KPI、图表、列表或业务演示数据。
    * `shell.css`：组件样式。
    * `meta.json`：尺寸、插槽、资源、适配规则、Figma 来源和状态。

12. `component.html` 必须暴露：

    ```html
    <h3 data-slot="title">...</h3>
    <div data-slot="content"></div>
    ```

13. 生成器必须读取 `meta.json > code.html` 作为运行时 HTML，并且只将 `code.preview` 视为预览内容。

14. 内容插槽必须与 Figma 节点匹配。需要在 `meta.json > adaptation.contentSlot` 中记录精确的 `top`、`left`、`right` 和 `bottom`。

15. 组件必须支持宽度和高度拉伸。需要声明合理的 `min-width`、`min-height`、`max-width` 和 `max-height`。

16. 还原 Figma 中的标题字体样式：字体、字号、字重、字间距、颜色和阴影。不要额外加粗，也不要添加英文副标题。

17. 预览页面应展示一个基准尺寸卡片和一个加宽卡片，用于检查背景、标题栏、装饰物和边框的适配效果。

18. 完成前需要验证：

    * `meta.json` 可以正常解析。
    * SVG 资源可以作为 XML 正常解析。
    * CSS 中不包含旧的辅助灰色块或完整截图背景。
    * `component.html` 中没有业务示例数据。
    * `shell.html` 可以作为独立预览页面正常打开。

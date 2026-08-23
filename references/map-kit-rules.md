# Map Kit Rules

`kit/map` 只保存本地边界数据，地图视觉仍由 ECharts options、主题 token 和页面 CSS 控制。

## 选择

1. 页面确实需要地图时才读 `kit/map/catalog.json`。
2. 按 scope、renderer、status 选择；全国地图读取 `kit/map/china/1.6.3/meta.json`。
3. 运行时使用 meta 的 `registerName`，不得从记忆编造名称或路径。
4. `china.topo.json` 只用于维护；生成页优先使用 `china.geo.json`。

## Standalone 与 file://

直接 `fetch("./assets/map/china.geo.json")` 在 `file://` 下可能被浏览器阻止。Standalone 输出必须满足以下一种方式：

1. 推荐：将所选 GeoJSON 内联到 `window.__SCREEN_MAPS__.china` 或 `<script type="application/json" id="map-geo-china">`。
2. 同时输出 GeoJSON 文件，但先读取内联数据；仅在 http/https 环境且内联数据不存在时 fetch。
3. 使用本地 JS wrapper 设置 `window.__SCREEN_MAPS__`，不得依赖远程请求。

注册示例：

```js
const geoJson = window.__SCREEN_MAPS__?.china
  ?? JSON.parse(document.querySelector("#map-geo-china")?.textContent || "null");

if (geoJson) {
  echarts.registerMap("china", geoJson);
}
```

## 维护与降级

- 远程来源 URL 只允许出现在 `references/map-source-map.json`，普通生成不得读取。
- 本地地图数据缺失时使用抽象 SVG/CSS 态势图，并在 manifest/change log 记录。
- 生成页只复制一种实际使用的地图数据，不同时复制 GeoJSON、TopoJSON 和其他重复格式。

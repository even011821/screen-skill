# Map Kit Rules

`kit/map` stores local map boundary data for generated big-screen pages.

## Runtime Use

1. Read `kit/map/catalog.json` when a page needs a map.
2. For China national maps, read `kit/map/china/1.6.3/meta.json`.
3. Copy `kit/map/china/1.6.3/china.geo.json` to the generated screen, normally `assets/map/china.geo.json`.
4. Register the map before building the ECharts option:

```js
const geoJson = await fetch("./assets/map/china.geo.json").then((res) => res.json());
echarts.registerMap("china", geoJson);
```

5. Use the local map name from `meta.json > registerName`.
6. Keep map styling in ECharts options and theme tokens; do not encode visual theme into map data.

## Source Data

- `china.topo.json` is retained as local source data.
- `china.geo.json` is the runtime asset for ECharts.
- Remote source URLs are maintenance-only and live in `references/map-source-map.json`.
- Generated pages must not fetch remote map URLs.

## Fallback

If local map data is missing, use an abstract SVG/CSS situation map fallback and record the missing map id in `change-log`.

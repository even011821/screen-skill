# 数据契约

## 数据源类型

| 来源 | 标记 | 说明 |
|---|---|---|
| real | `source: "real"` | 用户提供或 API 返回的真实字段 |
| inferred | `source: "inferred"` | 根据行业场景推断的字段 |
| mock | `source: "mock"` | 为页面演示生成的模拟数据 |
| missing | `source: "missing"` | 真实接入时缺失的字段 |

## 数据结构骨架

```json
{
  "screenMeta": { "title": "", "subtitle": "", "date": "", "time": "" },
  "layout": {
    "layout_type": "auto|center_scene_layout|map_command_layout|kpi_focus_layout|business_process_layout|balanced_metrics_layout|equipment_monitor_layout|content_portal_layout|ultra_wide_command_layout",
    "layoutVariant": "",
    "topNavId": "",
    "topNavHeight": 0,
    "contentArea": { "x": 0, "y": 0, "w": 0, "h": 0 },
    "slotAssignment": [
      { "slot": "PrimarySlot", "priority": 1, "topics": [], "shell": "" }
    ]
  },
  "theme": { "id": "galaxy-azure", "name": "星河灵蓝", "inferred": true },
  "kpiCards": [{ "id": "", "label": "", "value": 0, "unit": "", "trend": "", "direction": "up", "status": "normal", "source": "mock" }],
  "charts": [{ "id": "", "title": "", "type": "line|area-line|bar|stacked-bar|horizontal-bar|pie|donut|rose|gauge|radar|heatmap|funnel|sankey|treemap|map", "source": "mock", "xAxis": [], "series": [{ "name": "", "data": [] }] }],
  "tables": [{ "id": "", "title": "", "source": "mock", "columns": [{ "key": "name", "label": "名称" }], "rows": [] }],
  "lists": [{ "id": "", "title": "", "type": "ranking-list|alert-list|task-list|event-list|status-list", "source": "mock", "items": [] }],
  "map": { "type": "echarts-map|local-svg|abstract-css", "mapName": "", "geoJson": "local path only", "points": [] },
  "bigNumbers": [{ "id": "", "label": "", "value": 0, "unit": "", "source": "mock", "render": "dom-css" }]
}
```

`screenMeta.weather` 不作为默认字段生成。只有用户明确提供天气数据并要求展示，且所选 TopNav 有对应能力时才扩展。

## 状态枚举

```json
{ "normal": "正常", "warning": "预警", "danger": "严重", "offline": "离线", "processing": "处理中", "done": "已处理" }
```

不得在不同模块混用"异常/告警/报警/严重/高危"等未定义状态。

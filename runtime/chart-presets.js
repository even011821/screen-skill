/* chart-presets.js — ECharts runtime presets for Screen Skill V2 */
var ChartPresets = (function () {
  var DEFAULT_PALETTE = [
    "#18e7ff",
    "#36a3ff",
    "#ffd166",
    "#6fffb0",
    "#ff7a90",
    "#b58cff",
    "#ff9f43",
    "#7bdff2",
  ];

  function cssVar(name, fallback) {
    if (typeof window === "undefined" || !window.getComputedStyle) return fallback;
    var value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value ? value.trim() : fallback;
  }

  function palette() {
    return [
      cssVar("--chart-1", DEFAULT_PALETTE[0]),
      cssVar("--chart-2", DEFAULT_PALETTE[1]),
      cssVar("--chart-3", DEFAULT_PALETTE[2]),
      cssVar("--chart-4", DEFAULT_PALETTE[3]),
      cssVar("--chart-5", DEFAULT_PALETTE[4]),
      cssVar("--chart-6", DEFAULT_PALETTE[5]),
      DEFAULT_PALETTE[6],
      DEFAULT_PALETTE[7],
    ];
  }

  function baseTooltip(trigger) {
    return Object.assign({ trigger: trigger || "axis" }, ChartDefaults.TOOLTIP_STYLE);
  }

  function normalizeSeries(series, defaultName) {
    if (!Array.isArray(series)) return [];
    return series.map(function (s, index) {
      if (Array.isArray(s)) return { name: defaultName || "series" + (index + 1), data: s };
      return Object.assign({ name: defaultName || "series" + (index + 1), data: [] }, s);
    });
  }

  function line(data, opts) {
    opts = opts || {};
    var colors = palette();
    var series = normalizeSeries(data.series, "趋势").map(function (s, index) {
      return Object.assign({}, s, { color: s.color || colors[index % colors.length], noArea: opts.noArea });
    });
    return ChartDefaults.makeLineOption(data.xAxis || data.labels || [], series, opts);
  }

  function bar(data, opts) {
    opts = opts || {};
    var colors = palette();
    var horizontal = opts.horizontal || data.horizontal;
    var stacked = opts.stacked || data.stacked;
    var series = normalizeSeries(data.series, "数据").map(function (s, index) {
      return Object.assign({}, s, {
        type: "bar",
        stack: stacked ? "total" : undefined,
        color: s.color || colors[index % colors.length],
        barWidth: s.barWidth || opts.barWidth || 16,
      });
    });
    var option = ChartDefaults.makeBarOption(data.xAxis || data.labels || [], series, opts);
    if (horizontal) {
      var xAxis = option.xAxis;
      option.xAxis = Object.assign({}, option.yAxis, { type: "value" });
      option.yAxis = Object.assign({}, xAxis, { type: "category" });
    }
    return option;
  }

  function pie(data, opts) {
    opts = opts || {};
    var colors = palette();
    var items = (data.items || data.data || []).map(function (item, index) {
      return Object.assign({}, item, { color: item.color || colors[index % colors.length] });
    });
    return ChartDefaults.makePieOption(items, {
      radius: opts.radius || (opts.donut ? ["52%", "74%"] : ["0%", "72%"]),
    });
  }

  function rose(data, opts) {
    var option = pie(data, Object.assign({ donut: true }, opts || {}));
    option.series[0].roseType = "radius";
    return option;
  }

  function gauge(data, opts) {
    opts = opts || {};
    var value = data.value == null ? 0 : data.value;
    return {
      tooltip: baseTooltip("item"),
      series: [{
        type: "gauge",
        min: opts.min == null ? 0 : opts.min,
        max: opts.max == null ? 100 : opts.max,
        radius: opts.radius || "88%",
        center: opts.center || ["50%", "55%"],
        progress: { show: true, width: opts.progressWidth || 12, itemStyle: { color: opts.color || cssVar("--accent", "#18e7ff") } },
        axisLine: { lineStyle: { width: opts.progressWidth || 12, color: [[1, "rgba(120,190,255,0.16)"]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: opts.pointer !== false },
        detail: {
          valueAnimation: true,
          formatter: opts.formatter || "{value}%",
          color: cssVar("--text", "#fff"),
          fontSize: opts.fontSize || 22,
          offsetCenter: [0, "55%"],
        },
        title: { color: cssVar("--muted", "rgba(220,240,255,0.72)"), fontSize: 12, offsetCenter: [0, "82%"] },
        data: [{ value: value, name: data.name || data.label || "" }],
      }],
    };
  }

  function radar(data, opts) {
    opts = opts || {};
    var colors = palette();
    return {
      tooltip: baseTooltip("item"),
      radar: {
        indicator: data.indicator || [],
        radius: opts.radius || "62%",
        axisName: { color: cssVar("--muted", "rgba(220,240,255,0.72)") },
        splitLine: { lineStyle: { color: "rgba(120,190,255,0.18)" } },
        splitArea: { show: true, areaStyle: { color: ["rgba(30,120,220,0.04)", "rgba(30,120,220,0.1)"] } },
        axisLine: { lineStyle: { color: "rgba(120,190,255,0.18)" } },
      },
      series: normalizeSeries(data.series, "雷达").map(function (s, index) {
        return {
          type: "radar",
          name: s.name,
          data: [{ name: s.name, value: s.data || s.value || [] }],
          areaStyle: { opacity: 0.18 },
          lineStyle: { width: 2 },
          itemStyle: { color: s.color || colors[index % colors.length] },
        };
      }),
    };
  }

  function scatter(data, opts) {
    opts = opts || {};
    var type = opts.effect ? "effectScatter" : "scatter";
    return {
      grid: opts.grid || ChartDefaults.GRID,
      tooltip: baseTooltip("item"),
      xAxis: { type: "value", axisLine: ChartDefaults.AXIS_STYLE.axisLine, axisLabel: ChartDefaults.AXIS_STYLE.axisLabel, splitLine: ChartDefaults.AXIS_STYLE.splitLine },
      yAxis: { type: "value", axisLine: ChartDefaults.AXIS_STYLE.axisLine, axisLabel: ChartDefaults.AXIS_STYLE.axisLabel, splitLine: ChartDefaults.AXIS_STYLE.splitLine },
      series: normalizeSeries(data.series || [{ data: data.data || [] }], "散点").map(function (s) {
        return { type: type, name: s.name, data: s.data, symbolSize: s.symbolSize || opts.symbolSize || 10, rippleEffect: { brushType: "stroke" } };
      }),
    };
  }

  function heatmap(data, opts) {
    opts = opts || {};
    return {
      tooltip: baseTooltip("item"),
      grid: opts.grid || ChartDefaults.GRID,
      xAxis: { type: "category", data: data.xAxis || [], splitArea: { show: true }, axisLabel: ChartDefaults.AXIS_STYLE.axisLabel },
      yAxis: { type: "category", data: data.yAxis || [], splitArea: { show: true }, axisLabel: ChartDefaults.AXIS_STYLE.axisLabel },
      visualMap: { min: data.min || 0, max: data.max || 100, show: opts.showVisualMap !== false, calculable: true, orient: "horizontal", left: "center", bottom: 0, textStyle: { color: cssVar("--muted", "#b8d8ff") } },
      series: [{ type: "heatmap", data: data.data || [], label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.45)" } } }],
    };
  }

  function funnel(data, opts) {
    opts = opts || {};
    return {
      tooltip: baseTooltip("item"),
      series: [{
        type: "funnel",
        left: opts.left || "10%",
        top: opts.top || 16,
        bottom: opts.bottom || 16,
        width: opts.width || "80%",
        label: { color: cssVar("--text", "#fff") },
        data: data.items || data.data || [],
      }],
    };
  }

  function treeLike(type, data, opts) {
    opts = opts || {};
    return {
      tooltip: baseTooltip("item"),
      series: [Object.assign({
        type: type,
        data: data.items || data.data || [],
        label: { color: cssVar("--text", "#fff") },
      }, opts.series || {})],
    };
  }

  function map(data, opts) {
    opts = opts || {};
    return {
      tooltip: baseTooltip("item"),
      visualMap: opts.visualMap || { show: false },
      geo: {
        map: data.mapName || opts.mapName || "custom-map",
        roam: opts.roam !== false,
        label: { show: !!opts.showLabel, color: cssVar("--muted", "#b8d8ff") },
        itemStyle: { areaColor: "rgba(30,120,220,0.2)", borderColor: "rgba(120,220,255,0.55)" },
        emphasis: { itemStyle: { areaColor: "rgba(24,231,255,0.28)" } },
      },
      series: [{
        type: "effectScatter",
        coordinateSystem: "geo",
        data: data.points || [],
        symbolSize: opts.symbolSize || 8,
        rippleEffect: { brushType: "stroke" },
      }],
    };
  }

  function makeOption(type, data, opts) {
    type = type || "line";
    data = data || {};
    opts = opts || {};
    if (type === "line" || type === "area-line") return line(data, Object.assign({ noArea: type === "line" }, opts));
    if (type === "bar") return bar(data, opts);
    if (type === "stacked-bar") return bar(data, Object.assign({ stacked: true }, opts));
    if (type === "horizontal-bar") return bar(data, Object.assign({ horizontal: true }, opts));
    if (type === "pie") return pie(data, opts);
    if (type === "donut") return pie(data, Object.assign({ donut: true }, opts));
    if (type === "rose") return rose(data, opts);
    if (type === "gauge") return gauge(data, opts);
    if (type === "radar") return radar(data, opts);
    if (type === "scatter") return scatter(data, opts);
    if (type === "effect-scatter") return scatter(data, Object.assign({ effect: true }, opts));
    if (type === "heatmap") return heatmap(data, opts);
    if (type === "funnel") return funnel(data, opts);
    if (type === "sankey") return treeLike("sankey", data, opts);
    if (type === "treemap") return treeLike("treemap", data, opts);
    if (type === "map") return map(data, opts);
    return line(data, opts);
  }

  function render(el, config) {
    if (!el || typeof echarts === "undefined") return null;
    config = config || {};
    var chart = echarts.init(el);
    chart.setOption(makeOption(config.type, config.data, config.options));
    return chart;
  }

  return {
    makeOption: makeOption,
    render: render,
    palette: palette,
  };
})();

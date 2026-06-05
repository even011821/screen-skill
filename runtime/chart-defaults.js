/* chart-defaults.js — ECharts 全局默认配置 */
var ChartDefaults = (function () {
  var AXIS_STYLE = {
    axisLine: { lineStyle: { color: "rgba(120, 190, 255, 0.35)" } },
    axisTick: { show: false },
    axisLabel: { color: "rgba(202, 232, 255, 0.82)", fontSize: 10 },
    splitLine: { lineStyle: { color: "rgba(120, 190, 255, 0.16)", type: "dashed" } },
  };

  var TOOLTIP_STYLE = {
    backgroundColor: "rgba(7, 28, 58, 0.9)",
    borderColor: "#1bd6ff",
    textStyle: { color: "#fff" },
  };

  var GRID = { left: 40, right: 16, top: 18, bottom: 28, containLabel: true };

  function gradient(topColor, bottomColor) {
    if (typeof echarts === "undefined") return bottomColor;
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: topColor },
      { offset: 1, color: bottomColor },
    ]);
  }

  function makeLineOption(xData, seriesArr, opts) {
    opts = opts || {};
    return {
      grid: opts.grid || GRID,
      tooltip: Object.assign({ trigger: "axis" }, TOOLTIP_STYLE),
      xAxis: { type: "category", data: xData, axisLine: AXIS_STYLE.axisLine, axisTick: AXIS_STYLE.axisTick, axisLabel: AXIS_STYLE.axisLabel, splitLine: AXIS_STYLE.splitLine },
      yAxis: { type: "value", axisLine: AXIS_STYLE.axisLine, axisTick: AXIS_STYLE.axisTick, axisLabel: Object.assign({}, AXIS_STYLE.axisLabel, opts.yLabel || {}), splitLine: AXIS_STYLE.splitLine },
      series: seriesArr.map(function (s) {
        return {
          type: "line", smooth: true, symbol: "circle", symbolSize: 6, data: s.data,
          lineStyle: { color: s.color || "#24caff", width: 2 },
          itemStyle: { color: s.color || "#24caff" },
          areaStyle: s.noArea ? undefined : { color: (s.color || "#24caff").replace(")", ", 0.08)").replace("rgb", "rgba") },
        };
      }),
    };
  }

  function makeBarOption(xData, seriesArr, opts) {
    opts = opts || {};
    return {
      grid: opts.grid || GRID,
      tooltip: Object.assign({ trigger: "axis" }, TOOLTIP_STYLE),
      xAxis: { type: "category", data: xData, axisLine: AXIS_STYLE.axisLine, axisTick: AXIS_STYLE.axisTick, axisLabel: AXIS_STYLE.axisLabel, splitLine: AXIS_STYLE.splitLine },
      yAxis: { type: "value", axisLine: AXIS_STYLE.axisLine, axisTick: AXIS_STYLE.axisTick, axisLabel: AXIS_STYLE.axisLabel, splitLine: AXIS_STYLE.splitLine },
      series: seriesArr.map(function (s) {
        return {
          type: s.type || "bar", barWidth: s.barWidth || 22, data: s.data,
          itemStyle: { color: s.color || gradient("#ffe64a", "#13d5ff") },
        };
      }),
    };
  }

  function makePieOption(dataArr, opts) {
    opts = opts || {};
    return {
      tooltip: Object.assign({ trigger: "item", formatter: "{b}: {c}%" }, TOOLTIP_STYLE),
      series: [{
        type: "pie",
        radius: opts.radius || ["55%", "78%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: { show: true, position: "outside", color: "rgba(202, 232, 255, 0.85)", fontSize: 11, formatter: "{b}\n{d}%" },
        labelLine: { lineStyle: { color: "rgba(120, 190, 255, 0.4)" } },
        emphasis: { label: { fontSize: 14, fontWeight: "bold" } },
        data: dataArr.map(function (d) {
          return { name: d.name, value: d.value, itemStyle: { color: d.color } };
        }),
      }],
    };
  }

  function getElement(elOrId) {
    return typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
  }

  function waitForSize(el, maxFrames) {
    maxFrames = maxFrames || 12;
    return new Promise(function (resolve) {
      var frame = 0;
      function check() {
        if (!el || frame >= maxFrames || (el.clientWidth > 0 && el.clientHeight > 0)) {
          resolve(el);
          return;
        }
        frame += 1;
        requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
  }

  function bindResize(chart, el) {
    if (!chart || !el) return chart;
    if (typeof ResizeObserver !== "undefined") {
      var observer = new ResizeObserver(function () {
        chart.resize();
      });
      observer.observe(el);
      chart.__screenResizeObserver = observer;
    }
    window.addEventListener("resize", function () { chart.resize(); }, { passive: true });
    return chart;
  }

  async function initWhenReady(elOrId, option, opts) {
    opts = opts || {};
    var el = getElement(elOrId);
    await waitForSize(el, opts.maxFrames || 12);
    if (!el || typeof echarts === "undefined") return null;
    var chart = echarts.init(el, opts.theme || null, opts.initOptions || undefined);
    chart.setOption(option || {});
    requestAnimationFrame(function () { chart.resize(); });
    return bindResize(chart, el);
  }

  return {
    AXIS_STYLE: AXIS_STYLE,
    TOOLTIP_STYLE: TOOLTIP_STYLE,
    GRID: GRID,
    gradient: gradient,
    makeLineOption: makeLineOption,
    makeBarOption: makeBarOption,
    makePieOption: makePieOption,
    waitForSize: waitForSize,
    initWhenReady: initWhenReady,
    bindResize: bindResize,
  };
})();

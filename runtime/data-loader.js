/* data-loader.js — 通用数据加载 + DOM 绑定 */
const DataLoader = (function () {
  const DEFAULT_DATA = {
    screenMeta: { title: "数据大屏", subtitle: "Data Screen" },
    date: new Date().toISOString().slice(0, 10),
    weather: "--",
  };

  function getInlineData() {
    if (window.__SCREEN_DATA__ && typeof window.__SCREEN_DATA__ === "object") {
      return window.__SCREEN_DATA__;
    }

    var node = document.getElementById("screen-data");
    if (!node) return null;

    try {
      return JSON.parse(node.textContent || "{}");
    } catch {
      console.warn("DataLoader: 内联数据解析失败");
      return null;
    }
  }

  async function load(url) {
    var inlineData = getInlineData();
    if (inlineData) return { ...DEFAULT_DATA, ...inlineData };

    try {
      const res = await fetch(url || "./data/sample-data.json");
      if (!res.ok) return DEFAULT_DATA;
      return { ...DEFAULT_DATA, ...(await res.json()) };
    } catch {
      inlineData = getInlineData();
      if (inlineData) return { ...DEFAULT_DATA, ...inlineData };
      console.warn("DataLoader: 无法加载数据且没有内联数据，使用默认值");
      return { ...DEFAULT_DATA };
    }
  }

  function bindText(selector, value) {
    document.querySelectorAll('[data-bind="' + selector + '"]').forEach(function (el) {
      el.textContent = value != null ? value : el.textContent;
    });
  }

  function tickClock() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    bindText("time", pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()));
  }

  function formatNum(n, decimals) {
    if (n == null) return "";
    if (n >= 10000) return (n / 10000).toFixed(decimals || 1) + "万";
    if (n >= 1000) return n.toLocaleString("zh-CN", { maximumFractionDigits: decimals || 1 });
    return String(n);
  }

  return { load: load, bindText: bindText, tickClock: tickClock, formatNum: formatNum, getInlineData: getInlineData, DEFAULT_DATA: DEFAULT_DATA };
})();

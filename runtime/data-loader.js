/* data-loader.js — 通用数据加载 + DOM 绑定 */
const DataLoader = (function () {
  const DEFAULT_DATA = {
    screenMeta: { title: "数据大屏", subtitle: "Data Screen" },
    date: new Date().toISOString().slice(0, 10),
    weather: "--",
  };

  async function load(url) {
    try {
      const res = await fetch(url || "./data/sample-data.json");
      if (!res.ok) return DEFAULT_DATA;
      return { ...DEFAULT_DATA, ...(await res.json()) };
    } catch {
      console.warn("DataLoader: 无法加载数据，使用默认值");
      return DEFAULT_DATA;
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

  return { load: load, bindText: bindText, tickClock: tickClock, formatNum: formatNum, DEFAULT_DATA: DEFAULT_DATA };
})();

/* table-renderers.js — DOM table/list renderers for Screen Skill V2 */
var TableRenderers = (function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(status) {
    if (!status) return "";
    return " status--" + String(status).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function trendClass(direction) {
    if (!direction) return "";
    return " trend-tag--" + String(direction).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function renderTable(el, config) {
    if (!el) return;
    config = config || {};
    var columns = config.columns || [];
    var rows = config.rows || [];
    var head = columns.map(function (col) {
      return "<th>" + escapeHtml(col.label || col.key) + "</th>";
    }).join("");
    var body = rows.map(function (row, rowIndex) {
      var cells = columns.map(function (col) {
        var value = col.key === "$index" ? rowIndex + 1 : row[col.key];
        var className = col.className ? " class=\"" + escapeHtml(col.className) + "\"" : "";
        if (col.type === "status") {
          return "<td" + className + "><span class=\"status-pill" + statusClass(value) + "\">" + escapeHtml(row[col.labelKey] || value) + "</span></td>";
        }
        if (col.type === "trend") {
          var direction = row[col.directionKey || "direction"] || value;
          return "<td" + className + "><span class=\"trend-tag" + trendClass(direction) + "\">" + escapeHtml(value) + "</span></td>";
        }
        if (col.type === "rank") {
          return "<td" + className + "><span class=\"rank-num\">" + escapeHtml(value) + "</span></td>";
        }
        return "<td" + className + ">" + escapeHtml(value) + "</td>";
      }).join("");
      return "<tr>" + cells + "</tr>";
    }).join("");
    el.innerHTML = "<div class=\"data-table-wrap\"><table class=\"data-table\"><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function renderList(el, config) {
    if (!el) return;
    config = config || {};
    var type = config.type || "list";
    var items = config.items || [];
    var html = items.map(function (item, index) {
      var status = item.status || item.level || "";
      var rank = item.rank || index + 1;
      if (type === "ranking-list") {
        return "<li class=\"data-list__item\"><span class=\"rank-num\">" + escapeHtml(rank) + "</span><span class=\"data-list__main\">" + escapeHtml(item.name || item.title || item.label) + "</span><span class=\"data-list__value\">" + escapeHtml(item.value) + "</span></li>";
      }
      if (type === "alert-list" || type === "event-list") {
        return "<li class=\"data-list__item" + statusClass(status) + "\"><span class=\"status-pill" + statusClass(status) + "\">" + escapeHtml(item.levelLabel || status || "info") + "</span><span class=\"data-list__main\">" + escapeHtml(item.title || item.text || item.name) + "</span><span class=\"data-list__time\">" + escapeHtml(item.time || "") + "</span></li>";
      }
      return "<li class=\"data-list__item\"><span class=\"data-list__main\">" + escapeHtml(item.title || item.name || item.label) + "</span><span class=\"data-list__value\">" + escapeHtml(item.value || "") + "</span></li>";
    }).join("");
    el.innerHTML = "<ul class=\"data-list data-list--" + escapeHtml(type) + "\">" + html + "</ul>";
  }

  function render(el, config) {
    config = config || {};
    if (config.type === "table") return renderTable(el, config);
    return renderList(el, config);
  }

  return {
    render: render,
    renderTable: renderTable,
    renderList: renderList,
  };
})();

(function () {
  function parseValue(card) {
    var valueEl = card.querySelector('[data-slot="value"]');
    var raw = card.getAttribute('data-value') || (valueEl && valueEl.getAttribute('data-value')) || (valueEl && valueEl.textContent) || '';
    var normalized = String(raw).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return normalized ? Number(normalized[0]) : 0;
  }

  function applyVariant(card) {
    card.setAttribute('data-variant', parseValue(card) < 0 ? 'negative' : 'positive');
  }

  function init() {
    document.querySelectorAll('.kpi-card--style12[data-auto-variant="value"]').forEach(applyVariant);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.KpiCardStyle12 = { applyVariant: applyVariant };
})();

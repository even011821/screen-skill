/* scale.js — 单一居中缩放方案：fixed center + translate(-50%, -50%) + scale */
(function () {
  var rootStyle = document.documentElement.style;
  var DESIGN_WIDTH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--screen-w")) || 1920;
  var DESIGN_HEIGHT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--screen-h")) || 1080;

  function fitScreen() {
    var scale = Math.min(
      window.innerWidth / DESIGN_WIDTH,
      window.innerHeight / DESIGN_HEIGHT
    );

    rootStyle.setProperty("--screen-scale", scale.toFixed(6));
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  window.assertScreenNoScroll = function assertScreenNoScroll() {
    return document.documentElement.scrollWidth <= window.innerWidth &&
      document.documentElement.scrollHeight <= window.innerHeight &&
      document.body.scrollWidth <= window.innerWidth &&
      document.body.scrollHeight <= window.innerHeight;
  };

  fitScreen();
  window.addEventListener("resize", fitScreen, { passive: true });
  window.addEventListener("orientationchange", fitScreen, { passive: true });
})();

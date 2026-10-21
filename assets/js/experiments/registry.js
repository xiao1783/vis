/* ============================================================
 * registry.js — 实验注册表 window.Demos
 * 各 demo 模块通过 Demos.register(id, renderFn) 注册
 * 宽度变化使用 onResize 更新图形坐标，保留已有参数与数据。
 * renderFn(container, ctx) 中可使用全局 d3
 * ============================================================ */
(function () {
  const map = {};   // id -> fn
  window.Demos = {
    register(id, fn) {
      map[id] = fn;
    },
    render(id, container, ctx) {
      const fn = map[id];
      if (!fn) {
        container.innerHTML = '<div class="note warn">' + Common.L("实验「", "Experiment “") + id + Common.L("」尚未实现。", "” is not implemented yet.") + "</div>";
        return;
      }
      container.innerHTML = "";
      LabWorkbench.mount(id, container, ctx || {}, fn);
    },
    has(id) { return !!map[id]; },
    onResize(container, fn) {
      if (!container.__resizeAbort) container.__resizeAbort = new AbortController();
      window.addEventListener("resize", () => {
        if (container.isConnected) fn();
      }, { signal: container.__resizeAbort.signal });
    },
  };

  /* SVG viewBox handles resizing without discarding the user's experiment state. */

  /* 通用：在容器中创建一个响应式 SVG（宽度跟随容器） */
  window.makeSvg = function (container, height) {
    const W = Math.max(280, container.clientWidth || 380);
    const H = height || 300;
    d3.select(container).selectAll("svg").remove();
    const svg = d3.select(container).append("svg")
      .attr("width", "100%").attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("preserveAspectRatio", "xMidYMid meet");
    svg.node().__W = W;
    svg.node().__H = H;
    return svg;
  };
})();

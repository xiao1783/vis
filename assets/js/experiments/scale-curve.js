/* ============================================================
 * scale-curve.js — 比例尺与曲线实验（重点，双标签页）
 * 比例尺：线性 vs 对数；曲线：插值 vs 拟合，始终保留原始点
 * ============================================================ */
(function () {
  function render(container, ctx) {
    let curveState;
    const startTab = ctx.ls && ctx.ls.l === 3 ? "curve" : "scale";
    container.innerHTML =
      '<div class="exp-tabs">' +
      '<button data-tab="scale" class="' + (startTab === "scale" ? "active" : "") + '">' + Common.L("比例尺：线性 vs 对数（4.2）", "Scales: linear vs log (4.2)") + '</button>' +
      '<button data-tab="curve" class="' + (startTab === "curve" ? "active" : "") + '">' + Common.L("曲线：插值 vs 拟合（4.3）", "Curves: interpolation vs fitting (4.3)") + '</button>' +
      "</div>" +
      '<div id="tab-scale"' + (startTab === "curve" ? ' class="hide"' : "") + "></div>" +
      '<div id="tab-curve"' + (startTab === "scale" ? ' class="hide"' : "") + "></div>";

    container.querySelectorAll(".exp-tabs button").forEach((b) => {
      b.addEventListener("click", () => {
        container.querySelectorAll(".exp-tabs button").forEach((x) => x.classList.toggle("active", x === b));
        container.querySelector("#tab-scale").classList.toggle("hide", b.dataset.tab !== "scale");
        container.querySelector("#tab-curve").classList.toggle("hide", b.dataset.tab !== "curve");
        window.dispatchEvent(new Event("resize"));
      });
    });

    /* ================= 比例尺 ================= */
    function renderScale() {
      const host = container.querySelector("#tab-scale");
      host.innerHTML =
        '<div class="lab-controls"><label for="sc-slider">' + Common.L("高亮某州人口（万）：", "Highlight a state's population (10k):") + '</label>' +
        '<input type="range" id="sc-slider" min="1" max="4000" value="534" step="1">' +
        '<span class="readout" id="sc-val">534</span></div>' +
        '<div class="demo-detail" style="margin-bottom:8px">' + Common.L("5 个州人口（万）：<b>53、300、800、2000、4000</b>，相差约 75 倍。", "Populations of 5 states (10k): <b>53, 300, 800, 2000, 4000</b> — a range of about 75×.") + '</div>' +
        '<div class="scale-compare">' +
        '<div class="ctrl-group"><div class="cg-title">' + Common.L("线性比例尺 scaleLinear", "Linear scale scaleLinear") + '</div><div class="scale-track" id="lin-track"></div>' +
        '<div class="muted" style="font-size:12px">' + Common.L("等距=等值；小州挤在左侧。", "Equal distance = equal value; small states crowd the left.") + '</div></div>' +
        '<div class="ctrl-group"><div class="cg-title">' + Common.L("对数比例尺 scaleLog", "Log scale scaleLog") + '</div><div class="scale-track" id="log-track"></div>' +
        '<div class="muted" style="font-size:12px">' + Common.L("等距=等比；小州也能看清（仅正数）。", "Equal distance = equal ratio; small states stay readable (positive values only).") + '</div></div>' +
        "</div>" +
        '<div class="demo-detail" id="sc-readout" role="status"></div><pre class="scale-code" id="sc-code"></pre>' +
        '<div class="note warn" style="margin-top:10px"><span class="ni">' + Common.icon("warn", 15) + '</span><p>' + Common.L("scaleLog 的 domain 必须严格为正，<b>不能包含 0 或负数</b>，否则 log(0)=−∞ 无意义。", "A scaleLog domain must be strictly positive and <b>must not include 0 or negative numbers</b>, otherwise log(0)=−∞ is meaningless.") + '</p></div>';

      const data = [53, 300, 800, 2000, 4000];
      const slider = host.querySelector("#sc-slider");
      function draw() {
        const v = +slider.value;
        host.querySelector("#sc-val").textContent = v;
        drawTrack("#lin-track", d3.scaleLinear().domain([0, 4000]).range([0, 100]), data, v, false);
        drawTrack("#log-track", d3.scaleLog().domain([1, 4000]).range([0, 100]), data, v, true);
        const linPos = d3.scaleLinear().domain([0, 4000]).range([0, 100])(v);
        const logPos = d3.scaleLog().domain([1, 4000]).range([0, 100])(v);
        host.querySelector("#sc-readout").innerHTML =
          Common.L("输入 <b>", "Input <b>") + v + Common.L(" 万</b>：线性轴位置 <b>", " (10k)</b>: linear-axis position <b>") + linPos.toFixed(1) + Common.L("%</b>，对数轴位置 <b>", "%</b>, log-axis position <b>") + logPos.toFixed(1) +
          Common.L("%</b>。", "%</b>.") + "<br><span style='font-size:12.5px' class='muted'>" + Common.L("拖动滑块，小数值在对数轴上位置变化明显、在线性轴上几乎不动。", "Drag the slider: small values move a lot on the log axis but barely on the linear axis.") + "</span>";
        host.querySelector("#sc-code").textContent = "scaleLinear([0, 4000], [0, 100])(" + v + ") → " + linPos.toFixed(1) + "%\nscaleLog([1, 4000], [0, 100])(" + v + ") → " + logPos.toFixed(1) + "%";
      }
      function drawTrack(sel, scale, data, hl, isLog) {
        const el = host.querySelector(sel);
        el.innerHTML = '<div class="axis-line"></div>';
        data.forEach((d) => {
          const p = scale(d);
          const m = document.createElement("button"); m.type = "button";
          m.setAttribute("aria-label", Common.L("选择人口 ", "Select population ") + d + Common.L(" 万", " (10k)"));
          m.addEventListener("click", () => { slider.value = d; slider.dispatchEvent(new Event("input", {bubbles:true})); });
          m.className = "scale-marker";
          m.style.left = p + "%";
          m.style.background = d === hl ? "#ef4444" : "#2563eb";
          m.style.top = "14px";
          const s = document.createElement("span");
          s.className = "scale-tick";
          s.style.left = p + "%";
          s.style.top = "26px";
          s.style.height = "8px";
          s.innerHTML = '<span style="top:8px">' + d + "</span>";
          el.appendChild(m); el.appendChild(s);
        });
        const selected = document.createElement("div");
        selected.className = "scale-marker";
        selected.style.cssText = "left:" + scale(hl) + "%;top:0;background:#de6b70;width:15px;height:15px;box-shadow:0 0 0 5px #de6b7017";
        selected.setAttribute("aria-label", Common.L("当前输入 ", "Current input ") + hl + Common.L(" 万，位置 ", " (10k), position ") + scale(hl).toFixed(1) + "%");
        el.appendChild(selected);
      }
      slider.addEventListener("input", draw);
      ["#lin-track", "#log-track"].forEach((selector, index) => {
        const track = host.querySelector(selector);
        track.setAttribute("role", "slider"); track.tabIndex = 0;
        track.setAttribute("aria-label", (index ? Common.L("对数", "log") : Common.L("线性", "linear")) + Common.L("轴输入值，左右键调整", "-axis input; use the left/right arrow keys"));
        track.setAttribute("aria-valuemin", "1"); track.setAttribute("aria-valuemax", "4000");
        function pick(event) {
          const box = track.getBoundingClientRect();
          const fraction = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
          const scale = index ? d3.scaleLog().domain([1,4000]) : d3.scaleLinear().domain([0,4000]);
          slider.value = Math.max(1, Math.round(scale.invert(fraction)));
          slider.dispatchEvent(new Event("input", {bubbles:true}));
        }
        track.addEventListener("pointerdown", event => { if (event.target.closest("button")) return; track.setPointerCapture(event.pointerId); pick(event); });
        track.addEventListener("pointermove", event => { if (track.hasPointerCapture(event.pointerId)) pick(event); });
        track.addEventListener("pointerup", () => slider.dispatchEvent(new Event("change", {bubbles:true})));
        track.addEventListener("keydown", event => {
          if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
          event.preventDefault();
          slider.value = event.key === "Home" ? 1 : event.key === "End" ? 4000 : +slider.value + (event.key === "ArrowLeft" ? -10 : 10);
          slider.dispatchEvent(new Event("input", {bubbles:true}));
        });
      });
      slider.addEventListener("input", () => host.querySelectorAll('.scale-track').forEach(track => track.setAttribute("aria-valuenow", slider.value)));
      draw();
      host.querySelectorAll('.scale-track').forEach(track => track.setAttribute("aria-valuenow", slider.value));
    }

    /* ================= 曲线 ================= */
    function renderCurve() {
      const host = container.querySelector("#tab-curve");
      host.innerHTML =
        '<div class="lab-controls"><span style="font-size:13.5px">' + Common.L("曲线类型：", "Curve type:") + '</span>' +
        ['<button class="demo-btn secondary" data-c="linear">' + Common.L("linear 直线", "linear (straight)") + '</button>',
         '<button class="demo-btn secondary" data-c="monotoneX">monotoneX</button>',
         '<button class="demo-btn" data-c="natural">natural</button>',
         '<button class="demo-btn secondary" data-c="basis">basis</button>',
         '<button class="demo-btn secondary" data-c="step">step</button>'].join("") +
        "</div>" +
        '<div class="lab-controls"><label><input type="checkbox" id="cv-fit"> ' + Common.L("显示线性回归拟合线", "Show the linear regression fit") + '</label>' +
        '<label>' + Common.L("采样点", "Sample point") + ' <select id="cv-point">' + d3.range(8).map(i => '<option value="' + i + '">' + Common.L("点 ", "Point ") + i + '</option>').join("") + '</select></label>' +
        '<label>' + Common.L("数值", "Value") + ' <input type="range" id="cv-value" min="5" max="65" value="30"></label></div>' +
        '<div class="lab-svg-wrap" id="cv-svg"></div>' +
        '<div class="lab-chart-readout" id="cv-selection" role="status"></div>' +
        '<div class="note info" id="cv-note" style="margin-top:8px"></div>';

      // 采样点：先升后降再升，natural 会在某段产生过冲
      const pts = [
        { x: 0, y: 30 }, { x: 1, y: 34 }, { x: 2, y: 48 }, { x: 3, y: 46 },
        { x: 4, y: 30 }, { x: 5, y: 26 }, { x: 6, y: 34 }, { x: 7, y: 52 },
      ];
      const editor = host.querySelector("#cv-value");
      host.querySelector("#cv-point").addEventListener("change", event => {
        editor.value = pts[+event.target.value].y;
        editor.dispatchEvent(new Event("input", {bubbles: true}));
      });
      editor.addEventListener("input", () => {
        pts[+host.querySelector("#cv-point").value].y = +editor.value;
        draw();
      });
      const curves = {
        linear: d3.curveLinear, monotoneX: d3.curveMonotoneX,
        natural: d3.curveNatural, basis: d3.curveBasis, step: d3.curveStep,
      };
      let cur = "natural";
      curveState = {get: () => ({pts: pts.map(d => ({...d})), cur, point: +host.querySelector("#cv-point").value, fit: host.querySelector("#cv-fit").checked}),
        set: s => { pts.splice(0, pts.length, ...s.pts); cur = s.cur; host.querySelector("#cv-point").value = s.point; editor.value = pts[s.point].y; host.querySelector("#cv-fit").checked = s.fit; host.querySelectorAll("[data-c]").forEach(b => b.classList.toggle("secondary", b.dataset.c !== cur)); draw(); }};

      function draw() {
        const wrap = host.querySelector("#cv-svg");
        const W = Math.max(300, wrap.clientWidth || 380), H = 260;
        d3.select(wrap).selectAll("*").remove();
        const svg = d3.select(wrap).append("svg").attr("width", "100%").attr("height", H)
          .attr("viewBox", "0 0 " + W + " " + H);
        const M = { l: 40, r: 16, t: 14, b: 30 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
        const x = d3.scaleLinear().domain(d3.extent(pts, (d) => d.x)).range([0, iw]);
        const y = d3.scaleLinear().domain([0, 70]).range([ih, 0]);
        const g = svg.append("g").attr("transform", "translate(" + M.l + "," + M.t + ")");
        g.append("g").attr("transform", "translate(0," + ih + ")").call(d3.axisBottom(x).ticks(8)).selectAll("text").attr("font-size", 10);
        g.append("g").call(d3.axisLeft(y).ticks(6)).selectAll("text").attr("font-size", 10);

        // 插值曲线（过采样点）
        const line = d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(curves[cur]);
        g.append("path").datum(pts).attr("d", line)
          .attr("fill", "none").attr("stroke", "#2563eb").attr("stroke-width", 2.4);

        // 拟合线（最小二乘）
        if (host.querySelector("#cv-fit").checked) {
          const n = pts.length;
          const sx = d3.sum(pts, (d) => d.x), sy = d3.sum(pts, (d) => d.y);
          const sxx = d3.sum(pts, (d) => d.x * d.x), sxy = d3.sum(pts, (d) => d.x * d.y);
          const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
          const b = (sy - a * sx) / n;
          const fit = d3.extent(pts, (d) => d.x).map((xv) => ({ x: xv, y: a * xv + b }));
          g.append("path").datum(fit)
            .attr("d", d3.line().x((d) => x(d.x)).y((d) => y(d.y)))
            .attr("stroke", "#ef4444").attr("stroke-width", 2).attr("stroke-dasharray", "6 4")
            .attr("fill", "none");
        }

        // 始终保留原始点
        g.selectAll("circle.pt").data(pts).join("circle").attr("class", "pt")
          .attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", matchMedia("(pointer: coarse)").matches ? 7 : 4.5)
          .attr("fill", "#fff").attr("stroke", "#5068cf").attr("stroke-width", 2)
          .attr("role", "slider").attr("tabindex", 0)
          .attr("aria-label", d => Common.L("采样点 ", "Sample point ") + d.x + Common.L("，上下键修改数值", "; press up/down to change the value"))
          .attr("aria-valuemin", 5).attr("aria-valuemax", 65).attr("aria-valuenow", d => d.y)
          .attr("fill", d => d.x === +host.querySelector("#cv-point").value ? "#dce6ff" : "#fff")
          .on("click", (event, d) => { host.querySelector("#cv-point").value = d.x; editor.value = d.y; draw(); })
          .on("keydown", (event, d) => {
            if (!["ArrowUp","ArrowDown"].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            host.querySelector("#cv-point").value = d.x;
            editor.value = Math.max(5,Math.min(65,d.y + (event.key === "ArrowUp" ? 1 : -1)));
            editor.dispatchEvent(new Event("input", {bubbles:true}));
            host.querySelectorAll("circle.pt")[d.x].focus();
          })
          .style("cursor", "ns-resize")
          .style("touch-action", "none")
          .call(d3.drag().container(wrap).on("drag", (event, d) => {
            // The wrapper survives redraws; convert the pointer from the current SVG.
            const source = event.sourceEvent.changedTouches?.[0] || event.sourceEvent;
            const pointer = d3.pointer(source, wrap.querySelector("svg"));
            d.y = Math.round(Math.max(5, Math.min(65, y.invert(pointer[1] - M.t))));
            host.querySelector("#cv-point").value = pts.indexOf(d);
            editor.value = d.y;
            draw();
            editor.dispatchEvent(new Event("change", {bubbles: true}));
          }));

        const note = host.querySelector("#cv-note");
        const point = pts[+host.querySelector("#cv-point").value];
        host.querySelector("#cv-selection").textContent = Common.L("选中原始点（", "Selected raw point (") + point.x + Common.L("，", ", ") + point.y + Common.L("）→ 蓝线按 ", ") → the blue line is recomputed with ") + cur + Common.L(" 重新计算；拟合线使用全部 8 个点。", "; the fit line uses all 8 points.");
        if (cur === "natural") {
          note.innerHTML = '<span class="ni">' + Common.icon("info", 15) + '</span><span>' + Common.L("<b>natural</b> 使用平滑样条连接采样点，但可能过冲，在点间形成原始观测中没有的峰谷。", "<b>natural</b> connects the sample points with a smooth spline but can overshoot, creating peaks and valleys that never existed in the raw observations.") + '</span>';
          note.className = "note warn";
        } else if (cur === "basis") {
          note.innerHTML = '<span class="ni">' + Common.icon("info", 15) + '</span><span>' + Common.L("<b>basis</b> 使用 B 样条平滑，通常不穿过全部采样点，可能削弱局部极值；它与统计回归拟合不同。", "<b>basis</b> smooths with a B-spline, usually does not pass through every sample point, and can flatten local extremes; it is not the same as a statistical regression fit.") + '</span>';
          note.className = "note info";
        } else if (cur === "monotoneX") {
          note.innerHTML = '<span class="ni">' + Common.icon("bulb", 15) + '</span><span>' + Common.L("<b>monotoneX</b> 在保持单调性的前提下平滑，不易制造虚假峰谷，是较稳妥的选择。", "<b>monotoneX</b> smooths while preserving monotonicity and rarely creates fake peaks or valleys — a safe choice.") + '</span>';
          note.className = "note tip";
        } else if (cur === "step") {
          note.innerHTML = '<span class="ni">' + Common.icon("info", 15) + '</span><span>' + Common.L("<b>step</b> 用阶梯表达离散跳变，不暗示点间的连续变化。", "<b>step</b> shows discrete jumps as stairs and implies no continuous change between points.") + '</span>';
          note.className = "note info";
        } else {
          note.innerHTML = '<span class="ni">' + Common.icon("bulb", 15) + '</span><span>' + Common.L("<b>linear</b> 直线连接最忠实，不添加任何点间形态，但在趋势明显时显得生硬。", "<b>linear</b> connects points with straight lines — the most faithful choice, adding no shape between points, but it can look stiff when trends are clear.") + '</span>';
          note.className = "note tip";
        }
        const legend = document.createElement("small");
        legend.className = "curve-caption";
        legend.textContent = Common.L("圆点：原始采样（x，y） · 蓝线：", "Dots: raw samples (x, y) · blue line: ") + cur +
          (host.querySelector("#cv-fit").checked ? Common.L(" · 红色虚线：线性回归拟合", " · red dashed line: linear regression fit") : Common.L(" · 回归拟合线已关闭", " · the regression fit line is off"));
        note.querySelector("span:last-child").append(legend);
      }
      host.querySelectorAll("[data-c]").forEach((b) => {
        b.addEventListener("click", () => {
          cur = b.dataset.c;
          host.querySelectorAll("[data-c]").forEach((x) => {
            const on = x === b;
            x.classList.toggle("secondary", !on);
          });
          draw();
        });
      });
      host.querySelector("#cv-fit").addEventListener("change", draw);
      Demos.onResize(container, debounce(draw));
      draw();
    }
    function debounce(fn) { let t; return function () { clearTimeout(t); t = setTimeout(fn, 250); }; }

    renderScale();
    renderCurve();
    LabWorkbench.connect(container, "scale-curve", {
      get: () => ({value: +container.querySelector("#sc-slider").value, tab: container.querySelector(".exp-tabs .active").dataset.tab, ...curveState.get()}),
      valid: s => Number.isFinite(s.value) && s.value >= 1 && s.value <= 4000 && ["scale","curve"].includes(s.tab) && ["linear","natural","basis","step","monotoneX"].includes(s.cur) && Number.isInteger(s.point) && s.point >= 0 && s.point < 8 && Array.isArray(s.pts) && s.pts.length === 8 && s.pts.every((p,i) => p.x === i && Number.isFinite(p.y) && p.y >= 5 && p.y <= 65),
      set: s => { container.querySelector("#sc-slider").value = s.value; container.querySelector("#sc-slider").dispatchEvent(new Event("input", {bubbles:true})); container.querySelector('[data-tab="' + s.tab + '"]').click(); curveState.set(s); },
      steps: [Common.L("预测：同一个小数值在线性轴与对数轴上，哪一种更靠近中间？", "Predict: for the same small value, which axis places it closer to the middle — linear or log?"), Common.L("直接拖动两条轴，或点击人口标记；切换曲线并拖动原始采样点。", "Drag the two axes directly or click the population markers; switch curves and drag the raw sample points."), Common.L("核对输入值、轴位置和代码输出；开启拟合线，解释平滑插值与统计拟合的区别。", "Check the input value, the axis positions, and the code output; turn on the fit line and explain how smooth interpolation differs from statistical fitting.")],
      question: () => { const v = +container.querySelector("#sc-slider").value; const curve = container.querySelector(".exp-tabs .active").dataset.tab === "curve"; return curve ? {text: Common.L("当前 ", "The current ") + curveState.get().cur + Common.L(" 蓝线更平滑，能否据此认为预测更准确？", " blue line is smoother — can you conclude that predictions are more accurate?"), options: [Common.L("能，平滑程度就是准确率", "Yes — smoothness is accuracy"), Common.L("不能，需要独立验证", "No — independent validation is needed")], correct: 1, explain: Common.L("插值形状由曲线算法决定，平滑程度不能代替预测误差或验证数据。", "The interpolated shape is decided by the curve algorithm; smoothness cannot replace prediction error or validation data.")} : {text: Common.L("当前输入 ", "Current input ") + v + Common.L(" 万。若比较等距离的刻度，对数轴表达什么？", " (10k). For equally spaced ticks, what does a log axis represent?"), options: [Common.L("相同差值", "Equal differences"), Common.L("相同倍数", "Equal ratios")], correct: 1, explain: Common.L("对数轴等距对应相同倍数；线性轴等距对应相同差值。请对照上方两种位置。", "Equal distances on a log axis mean equal ratios; on a linear axis they mean equal differences. Compare the two positions above.")}; }
    });
  }

  window.Demos.register("scale-curve", render, { selfResize: true });
})();

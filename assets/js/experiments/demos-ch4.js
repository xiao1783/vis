/* ============================================================
 * demos-ch4.js — 第四章：wide-long / slope / contour
 * ============================================================ */

/* ---------- 4.1 宽表 → 长表 ---------- */
(function () {
  const METRICS = ["murder", "robbery", "burglary"];
  function render(container) {
    container.innerHTML =
      '<div class="demo-detail" id="wl-status">正在加载 data/crime.csv…</div>' +
      '<div class="lab-controls"><button class="demo-btn" id="wl-go">执行 flatMap：宽表 → 长表</button>' +
      '<button class="demo-btn secondary" id="wl-back">回到宽表</button></div>' +
      '<div class="lab-controls"><label>示例州数 <input type="range" id="wl-count" min="1" max="10" value="3"></label>' +
      METRICS.map(metric => '<label><input type="checkbox" data-metric="' + metric + '" checked> ' + metric + '</label>').join("") + '</div>' +
      '<div id="wl-table"></div>' +
      '<div class="console" id="wl-console" style="max-height:170px"></div>';
    d3.csv("data/crime.csv", d3.autoType).then(function (raw) {
      if (!container.isConnected) return;
      const w = container.querySelector("#wl-status");
      w.textContent = "加载成功：" + raw.length + " 个州。调整州数和指标，比较宽表与长表的记录数。";
      let mode = "wide";
      const selectedMetrics = () => [...container.querySelectorAll("[data-metric]:checked")].map(input => input.dataset.metric);
      function wide() {
        mode = "wide";
        const metrics = selectedMetrics();
        const rows = raw.slice(0, +container.querySelector("#wl-count").value);
        container.querySelector("#wl-table").innerHTML =
          '<div class="ctrl-group"><div class="cg-title">宽表（每州一行，指标各占一列）</div>' +
          '<table class="data-table"><thead><tr><th>state</th><th>population</th>' +
          metrics.map((m) => "<th>" + m + "</th>").join("") + "</tr></thead><tbody>" +
          rows.map((r) => "<tr><td>" + r.state + "</td><td>" + r.population + "</td>" +
            metrics.map((m) => "<td>" + r[m] + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>";
        container.querySelector("#wl-console").textContent =
          "宽表 " + rows.length + " 行；新增一个指标就要新增一列，难以按指标分组。";
      }
      function long() {
        mode = "long";
        const metrics = selectedMetrics(), count = +container.querySelector("#wl-count").value;
        const rows = raw.slice(0, count).flatMap((d) =>
          metrics.map((k) => ({ state: d.state, metric: k, value: d[k] })));
        container.querySelector("#wl-table").innerHTML =
          '<div class="ctrl-group"><div class="cg-title">长表（每行 = 一个州 × 一个指标）</div>' +
          '<table class="data-table"><thead><tr><th>state</th><th>metric</th><th>value</th></tr></thead><tbody>' +
          rows.map((r) => "<tr><td>" + r.state + "</td><td><b>" + r.metric + "</b></td><td>" + r.value + "</td></tr>").join("") +
          "</tbody></table></div>";
        container.querySelector("#wl-console").textContent =
          "长表：" + count + " 个州 × " + metrics.length + " 个指标 = " + rows.length + ' 行。\n现在可直接 d3.group(long, d => d.metric) 按指标分组/着色/分面。';
      }
      wide();
      container.querySelector("#wl-go").addEventListener("click", long);
      container.querySelector("#wl-back").addEventListener("click", wide);
      container.querySelectorAll("input").forEach(input => input.addEventListener("input", () => mode === "wide" ? wide() : long()));
    }).catch(function (e) {
      container.querySelector("#wl-status").innerHTML =
        '<span class="demo-error">数据加载失败：' + window.esc(e.message) + "，请用本地服务器访问。</span>";
    });
  }
  window.Demos.register("wide-long", render);
})();

/* ---------- 4.4 倾角感知 ---------- */
(function () {
  const DATA = [
    { x: 0, y: 10 }, { x: 1, y: 13 }, { x: 2, y: 15 }, { x: 3, y: 20 },
    { x: 4, y: 22 }, { x: 5, y: 27 }, { x: 6, y: 30 },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>显示高度：</label>' +
      '<button class="demo-btn secondary" data-ratio="0.4">压扁</button>' +
      '<button class="demo-btn" data-ratio="1">正常</button>' +
      '<button class="demo-btn secondary" data-ratio="2">拉高</button>' +
      '<label style="margin-left:6px">参考线角度：<input type="range" id="sl-angle" min="0" max="90" value="45"></label></div>' +
      '<div class="lab-svg-wrap" id="sl-svg"></div>' +
      '<div class="demo-detail" id="sl-detail"></div>' +
      '<div class="note warn" style="margin-top:8px"><span class="ni">' + Common.icon("warn", 15) + '</span><p>数据完全相同，仅改变显示比例，趋势的视觉陡峭程度就会改变。</p></div>';
    let ratio = 1;
    function draw() {
      const host = container.querySelector("#sl-svg");
      const W = Math.max(300, host.clientWidth || 380);
      const H = 150 * ratio;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      const M = { l: 36, r: 16, t: 14, b: 26 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
      const x = d3.scaleLinear().domain([0, 6]).range([0, iw]);
      const y = d3.scaleLinear().domain([0, 34]).range([ih, 0]);
      const g = svg.append("g").attr("transform", "translate(" + M.l + "," + M.t + ")");
      g.append("g").attr("transform","translate(0," + ih + ")").call(d3.axisBottom(x).ticks(6));
      if (ih > 45) g.append("g").call(d3.axisLeft(y).ticks(4));
      g.append("path").datum(DATA).attr("d",
        d3.line().x((d) => x(d.x)).y((d) => y(d.y)))
        .attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 2.5);
      g.selectAll("circle").data(DATA).join("circle").attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 4).attr("fill", "#fff").attr("stroke", "#f59e0b")
        .on("click", (event,d) => {
          container.querySelector("#sl-detail").textContent = "第 " + (d.x + 1) + " 个采样点：x=" + d.x + "，y=" + d.y + "。切换宽高比，这个真实数值保持不变。";
        });
      // 参考角度线（按数据坐标计算 45° 视觉）
      const angle = +container.querySelector("#sl-angle").value;
      const rad = (angle * Math.PI) / 180;
      const L = Math.min(iw, ih) * 0.9;
      g.append("line").attr("x1", 0).attr("y1", ih).attr("x2", L * Math.cos(rad)).attr("y2", ih - L * Math.sin(rad))
        .attr("stroke", "#94a3b8").attr("stroke-dasharray", "4 3");
      g.append("text").attr("x", L * Math.cos(rad) + 4).attr("y", ih - L * Math.sin(rad)).attr("font-size", 10).attr("fill", "#64748b").text(angle + "°");
      // 计算数据线整体斜率角（视觉）
      const dxPx = x(6) - x(0);
      const dyPx = y(30) - y(10);
      const visualAngle = Math.atan2(Math.abs(dyPx), dxPx) * 180 / Math.PI;
      container.querySelector("#sl-detail").innerHTML =
        "显示高度为标准的 <b>" + ratio + " 倍</b>，首尾视觉倾角约 <b>" + visualAngle.toFixed(0) + "°</b>。<br>" +
        '<span class="muted" style="font-size:12.5px">Cleveland：30°–60° 附近判读较稳定，接近 0°/90° 误差最大。</span>';
    }
    container.querySelectorAll("[data-ratio]").forEach((b) => {
      b.addEventListener("click", () => {
        ratio = +b.dataset.ratio;
        container.querySelectorAll("[data-ratio]").forEach((x) => x.classList.toggle("secondary", x !== b));
        draw();
      });
    });
    container.querySelector("#sl-angle").addEventListener("input", draw);
    Demos.onResize(container, draw);
    draw();
  }
  window.Demos.register("slope", render);
})();

/* ---------- 4.5 Marching Squares 等值线 ---------- */
(function () {
  const EDGE_TABLE = [
    [], [[0,1]], [[1,2]], [[0,2]],
    [[2,3]], [[0,1],[2,3]], [[1,3]], [[0,3]],
    [[0,3]], [[1,3]], [[0,3],[1,2]], [[2,3]],
    [[0,2]], [[1,2]], [[0,1]], [],
  ];
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>阈值：<input type="range" id="ct-th" min="0" max="100" value="50"></label>' +
      '<span class="readout" id="ct-thv">50</span></div>' +
      '<div class="lab-controls">' + ["TL","TR","BR","BL"].map((key,i) => '<label>' + key + '<input type="range" data-corner="' + key + '" min="0" max="100" value="' + [70,20,80,30][i] + '"></label>').join("") + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:14px">' +
      '<div class="ctrl-group"><div class="cg-title">单个网格单元：四角值 → case</div><div class="lab-svg-wrap" id="ct-cell"></div><div id="ct-case" class="demo-detail"></div></div>' +
      '<div class="ctrl-group"><div class="cg-title">整体标量场（阈值等值线）</div><div class="lab-svg-wrap" id="ct-field"></div></div>' +
      "</div>";
    // 单个单元四角（TL TR BR BL）
    const corners = [
      { key: "TL", x: 0, y: 0 }, { key: "TR", x: 1, y: 0 },
      { key: "BR", x: 1, y: 1 }, { key: "BL", x: 0, y: 1 },
    ];
    // 固定的一个可产生鞍点的示例场（可随阈值变化）
    const N = 12, M = 10;
    function field(i, j) {
      // 两个高斯峰
      const v1 = 80 * Math.exp(-((i - 3) ** 2 + (j - 3) ** 2) / 8);
      const v2 = 60 * Math.exp(-((i - 9) ** 2 + (j - 6) ** 2) / 7);
      return Math.round(15 + v1 + v2 + 6 * Math.sin(i * 0.9) * Math.cos(j * 0.8));
    }
    function cornerVal(th, i, j) { return field(i, j); }
    function drawCell(th) {
      const host = container.querySelector("#ct-cell");
      const S = 200;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", 240).attr("viewBox", "0 0 " + S + " " + 240);
      const g = svg.append("g").attr("transform", "translate(" + (S / 2 - 80) + ",30)");
      const cs = 160;
      // 取第一行第一列单元
      const vals = {
        TL: field(0, 0), TR: field(1, 0), BR: field(1, 1), BL: field(0, 1),
      };
      // 为了让阈值能改变 case，用单元四角相对滑块的映射：构造一个随阈值变化的固定单元
      const demo = [...container.querySelectorAll("[data-corner]")].map(input => ({p:input.dataset.corner,v:+input.value}));
      const pos = { TL: [0, 0], TR: [cs, 0], BR: [cs, cs], BL: [0, cs] };
      const big = (v) => v > th;
      demo.forEach((d) => {
        const [x, y] = pos[d.p];
        g.append("circle").attr("cx", x).attr("cy", y).attr("r", 16)
          .attr("fill", big(d.v) ? "#2563eb" : "#cbd5e1").attr("stroke", "#fff").attr("stroke-width", 2);
        g.append("text").attr("x", x).attr("y", y + 4).attr("text-anchor", "middle").attr("font-size", 11)
          .attr("fill", big(d.v) ? "#fff" : "#475569").text(d.v);
      });
      g.append("rect").attr("width", cs).attr("height", cs).attr("fill", "none").attr("stroke", "#94a3b8").attr("stroke-width", 1.5);
      // 计算 case
      const code =
        (big(demo[3].v) ? 1 : 0) | (big(demo[2].v) ? 2 : 0) |
        (big(demo[1].v) ? 4 : 0) | (big(demo[0].v) ? 8 : 0);
      // 边中点位置（0左中 1下中 2右中 3上中）
      const pairs = [[0,3],[3,2],[1,2],[0,1]];
      const edge = pairs.map(([a,b]) => {
        const va=demo[a],vb=demo[b],t=va.v===vb.v?.5:(th-va.v)/(vb.v-va.v);
        return [pos[va.p][0]+t*(pos[vb.p][0]-pos[va.p][0]),pos[va.p][1]+t*(pos[vb.p][1]-pos[va.p][1])];
      });
      const lines = EDGE_TABLE[code];
      lines.forEach(([a, b]) => {
        g.append("line").attr("x1", edge[a][0]).attr("y1", edge[a][1]).attr("x2", edge[b][0]).attr("y2", edge[b][1])
          .attr("stroke", "#ef4444").attr("stroke-width", 3);
      });
      const isSaddle = code === 5 || code === 10;
      container.querySelector("#ct-case").innerHTML =
        "四角（TL/TR/BR/BL）与阈值 " + th + " 比较 → 二进制 <code>" +
        ((big(demo[0].v) ? 1 : 0) + "" + (big(demo[1].v) ? 1 : 0) + "" + (big(demo[2].v) ? 1 : 0) + "" + (big(demo[3].v) ? 1 : 0)) +
        "</code> → <b>case " + code + "</b>，查表画 " + lines.length + " 条线段。" +
        (isSaddle ? '<div class="note warn" style="margin:6px 0">这是<b>鞍点（saddle）</b>，有两种连接方式，需要额外消歧。</div>' : "");
    }
    function drawField(th) {
      const host = container.querySelector("#ct-field");
      const W = Math.max(320, host.clientWidth || 400), H = 260;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      const vals = [];
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) vals.push(field(i, j));
      const x = d3.scaleLinear().domain([0, N - 1]).range([30, W - 14]);
      const y = d3.scaleLinear().domain([0, M - 1]).range([14, H - 30]);
      const cs = (W - 44) / N, cellH = (H - 44) / M;
      // 热力背景
      const g = svg.append("g");
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        g.append("rect").attr("x", 30 + i * cs).attr("y", 14 + j * cellH).attr("width", cs + 0.5).attr("height", cellH + 0.5)
          .attr("fill", d3.interpolateBlues(0.15 + field(i, j) / 100 * 0.8));
      }
      // 用 d3.contours 生成等值线
      const grid = [];
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) grid.push(field(i, j));
      const contours = d3.contours().size([N, M]).thresholds([th]);
      g.selectAll("path.contour").data(contours(grid)).join("path")
        .attr("d", d3.geoPath(d3.geoIdentity()))
        .attr("transform", "translate(30,14) scale(" + cs + "," + cellH + ")")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-width", 2);
    }
    function draw() {
      const th = +container.querySelector("#ct-th").value;
      container.querySelector("#ct-thv").textContent = th;
      drawCell(th); drawField(th);
    }
    container.querySelector("#ct-th").addEventListener("input", draw);
    container.querySelectorAll("[data-corner]").forEach(input => input.addEventListener("input", draw));
    Demos.onResize(container, draw);
    draw();
  }
  window.Demos.register("contour", render);
})();

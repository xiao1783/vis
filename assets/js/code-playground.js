/* ============================================================
 * code-playground.js — 代码参数即实验
 * 在特定小节的讲解区，把关键 D3 代码参数变成可交互控件
 * ============================================================ */
(function () {
  const PLAYGROUNDS = {
    /* 1.4 数据映射：scaleLinear / scaleBand / scaleOrdinal */
    "1-4": function (host) {
      host.innerHTML =
        '<div class="pg-tabs">' +
        '<button class="active" data-t="linear">scaleLinear</button>' +
        '<button data-t="band">scaleBand</button>' +
        '<button data-t="ordinal">scaleOrdinal</button>' +
        "</div>" +
        '<div class="pg-body" id="pg-body"></div>';

      const body = host.querySelector("#pg-body");
      host.querySelectorAll(".pg-tabs button").forEach((b) => {
        b.addEventListener("click", () => {
          host.querySelectorAll(".pg-tabs button").forEach((x) => x.classList.toggle("active", x === b));
          render(b.dataset.t);
        });
      });

      function render(type) {
        if (type === "linear") {
          body.innerHTML =
            '<div class="lab-controls"><label>' + Common.L("domain 上限：", "domain max: ") + '</label><input type="range" id="pg-dmax" min="50" max="200" value="100"><span class="readout" id="pg-dmax-v">100</span></div>' +
            '<div class="lab-controls"><label>' + Common.L("range 上限：", "range max: ") + '</label><input type="range" id="pg-rmax" min="100" max="400" value="300"><span class="readout" id="pg-rmax-v">300</span></div>' +
            '<div class="lab-controls"><label>' + Common.L("输入值：", "Input value: ") + '</label><input type="range" id="pg-input" min="0" max="200" value="50"><span class="readout" id="pg-input-v">50</span></div>' +
            '<div class="pg-canvas" id="pg-canvas"></div>' +
            '<div class="demo-detail" id="pg-result"></div>';

          const dmax = body.querySelector("#pg-dmax"), rmax = body.querySelector("#pg-rmax"), inp = body.querySelector("#pg-input");
          function draw() {
            const d = +dmax.value, r = +rmax.value, v = +inp.value;
            body.querySelector("#pg-dmax-v").textContent = d;
            body.querySelector("#pg-rmax-v").textContent = r;
            body.querySelector("#pg-input-v").textContent = v;
            const scale = d3.scaleLinear().domain([0, d]).range([0, r]);
            const out = scale(v);
            body.querySelector("#pg-result").innerHTML = "d3.scaleLinear().domain([0, " + d + "]).range([0, " + r + "])(" + v + ") = <b>" + out.toFixed(1) + "</b>";
            const svg = body.querySelector("#pg-canvas");
            svg.innerHTML = '<svg width="100%" height="60" viewBox="0 0 320 60">' +
              '<line x1="20" y1="40" x2="300" y2="40" stroke="#cbd5e1" stroke-width="2"/>' +
              '<circle cx="20" cy="40" r="4" fill="#2563eb"/>' +
              '<circle cx="300" cy="40" r="4" fill="#2563eb"/>' +
              '<circle cx="' + (20 + (out / r) * 280) + '" cy="40" r="6" fill="#ef4444"/>' +
              '<text x="20" y="56" font-size="10" fill="#64748b">0</text>' +
              '<text x="290" y="56" font-size="10" fill="#64748b">' + r + '</text>' +
              '<text x="' + (20 + (out / r) * 280) + '" y="20" font-size="11" fill="#ef4444" text-anchor="middle">' + out.toFixed(0) + "</text></svg>";
          }
          [dmax, rmax, inp].forEach((el) => el.addEventListener("input", draw));
          draw();
        } else if (type === "band") {
          body.innerHTML =
            '<div class="lab-controls"><label>' + Common.L("range 宽度：", "range width: ") + '</label><input type="range" id="pg-bw" min="100" max="400" value="300"><span class="readout" id="pg-bw-v">300</span></div>' +
            '<div class="pg-canvas" id="pg-canvas"></div>' +
            '<div class="demo-detail" id="pg-result"></div>';

          const bw = body.querySelector("#pg-bw");
          const bandDomain = [Common.L("软件1班", "SE Class 1"), Common.L("软件2班", "SE Class 2"), Common.L("软件3班", "SE Class 3")];
          function draw() {
            const w = +bw.value;
            body.querySelector("#pg-bw-v").textContent = w;
            const scale = d3.scaleBand().domain(bandDomain).range([0, w]).padding(0.1);
            const bwVal = scale.bandwidth();
            const positions = scale.domain().map((d) => scale(d));
            body.querySelector("#pg-result").innerHTML = "d3.scaleBand().domain([...]).range([0, " + w + "]) → bandwidth = <b>" + bwVal.toFixed(1) + "px</b>" + Common.L("，共 ", ", ") + scale.domain().length + Common.L(" 个柱位", " bar slots");
            const svg = body.querySelector("#pg-canvas");
            svg.innerHTML = '<svg width="100%" height="80" viewBox="0 0 320 80">' +
              scale.domain().map((d, i) =>
                '<rect x="' + positions[i] + '" y="20" width="' + bwVal + '" height="30" fill="#2563eb" rx="2"/>' +
                '<text x="' + (positions[i] + bwVal / 2) + '" y="68" font-size="10" fill="#64748b" text-anchor="middle">' + d + "</text>"
              ).join("") + "</svg>";
          }
          bw.addEventListener("input", draw);
          draw();
        } else if (type === "ordinal") {
          body.innerHTML =
            '<div class="lab-controls"><label>' + Common.L("选择配色方案：", "Color scheme: ") + '<select id="pg-scheme">' +
            '<option value="Tableau10">Tableau10</option>' +
            '<option value="Category10">Category10</option>' +
            '<option value="Set2">Set2</option>' +
            '<option value="Dark2">Dark2</option>' +
            "</select></div>" +
            '<div class="pg-canvas" id="pg-canvas"></div>' +
            '<div class="demo-detail" id="pg-result"></div>';

          const scheme = body.querySelector("#pg-scheme");
          function draw() {
            const s = scheme.value;
            const colors = d3["scheme" + s];
            body.querySelector("#pg-result").innerHTML = "d3.scaleOrdinal().range(d3.scheme" + s + ")";
            const svg = body.querySelector("#pg-canvas");
            svg.innerHTML = '<svg width="100%" height="70" viewBox="0 0 320 70">' +
              colors.map((c, i) =>
                '<circle cx="' + (30 + i * 28) + '" cy="30" r="10" fill="' + c + '"/>' +
                '<text x="' + (30 + i * 28) + '" y="52" font-size="9" fill="#64748b" text-anchor="middle">' + i + "</text>"
              ).join("") + "</svg>";
          }
          scheme.addEventListener("change", draw);
          draw();
        }
      }
      render("linear");
    },

    /* 4.2 比例尺：scaleLinear vs scaleLog（支持并排对比） */
    "4-2": function (host) {
      host.innerHTML =
        '<div class="pg-mode"><label class="pg-mode-toggle"><input type="checkbox" id="pg42-side"> ' + Common.L("并排对比", "Side-by-side") + '</label></div>' +
        '<div class="lab-controls"><label>' + Common.L("domain 上限：", "domain max: ") + '</label><input type="range" id="pg42-dmax" min="100" max="10000" value="4000" step="100"><span class="readout" id="pg42-dmax-v">4000</span></div>' +
        '<div class="lab-controls"><label>' + Common.L("输入值：", "Input value: ") + '</label><input type="range" id="pg42-input" min="1" max="10000" value="534" step="1"><span class="readout" id="pg42-input-v">534</span></div>' +
        '<div class="pg-canvas" id="pg42-canvas"></div>' +
        '<div class="demo-detail" id="pg42-result"></div>';

      const dmax = host.querySelector("#pg42-dmax"), inp = host.querySelector("#pg42-input");
      const sideToggle = host.querySelector("#pg42-side");
      function draw() {
        const d = +dmax.value, v = +inp.value, side = sideToggle.checked;
        host.querySelector("#pg42-dmax-v").textContent = d;
        host.querySelector("#pg42-input-v").textContent = v;
        const lin = d3.scaleLinear().domain([0, d]).range([0, 100]);
        const log = d3.scaleLog().domain([1, d]).range([0, 100]);
        const linOut = lin(v), logOut = log(Math.max(1, v));
        host.querySelector("#pg42-result").innerHTML =
          "scaleLinear(" + v + ") = <b>" + linOut.toFixed(1) + "%</b>　|　" +
          "scaleLog(" + v + ") = <b>" + logOut.toFixed(1) + "%</b>";
        const svg = host.querySelector("#pg42-canvas");
        if (side) {
          svg.innerHTML = '<div class="pg-side-by-side">' +
            '<div class="pg-side"><div class="pg-side-title">' + Common.L("线性 scaleLinear", "Linear scaleLinear") + '</div>' +
            '<svg width="100%" height="70" viewBox="0 0 320 70">' +
            '<line x1="20" y1="40" x2="300" y2="40" stroke="#cbd5e1" stroke-width="2"/>' +
            '<circle cx="' + (20 + (linOut / 100) * 280) + '" cy="40" r="7" fill="#2563eb"/>' +
            '<text x="20" y="62" font-size="10" fill="#64748b">0%</text><text x="290" y="62" font-size="10" fill="#64748b" text-anchor="end">100%</text>' +
            '<text x="' + (20 + (linOut / 100) * 280) + '" y="24" font-size="11" fill="#2563eb" text-anchor="middle">' + linOut.toFixed(1) + '%</text></svg></div>' +
            '<div class="pg-side"><div class="pg-side-title">' + Common.L("对数 scaleLog", "Log scaleLog") + '</div>' +
            '<svg width="100%" height="70" viewBox="0 0 320 70">' +
            '<line x1="20" y1="40" x2="300" y2="40" stroke="#cbd5e1" stroke-width="2"/>' +
            '<circle cx="' + (20 + (logOut / 100) * 280) + '" cy="40" r="7" fill="#f59e0b"/>' +
            '<text x="20" y="62" font-size="10" fill="#64748b">0%</text><text x="290" y="62" font-size="10" fill="#64748b" text-anchor="end">100%</text>' +
            '<text x="' + (20 + (logOut / 100) * 280) + '" y="24" font-size="11" fill="#f59e0b" text-anchor="middle">' + logOut.toFixed(1) + '%</text></svg></div>' +
            "</div>";
        } else {
          svg.innerHTML = '<svg width="100%" height="120" viewBox="0 0 320 120">' +
            '<text x="20" y="18" font-size="11" fill="#64748b">' + Common.L("线性 scaleLinear", "Linear scaleLinear") + '</text>' +
            '<line x1="20" y1="30" x2="300" y2="30" stroke="#cbd5e1" stroke-width="2"/>' +
            '<circle cx="' + (20 + (linOut / 100) * 280) + '" cy="30" r="6" fill="#2563eb"/>' +
            '<text x="20" y="58" font-size="11" fill="#64748b">' + Common.L("对数 scaleLog", "Log scaleLog") + '</text>' +
            '<line x1="20" y1="70" x2="300" y2="70" stroke="#cbd5e1" stroke-width="2"/>' +
            '<circle cx="' + (20 + (logOut / 100) * 280) + '" cy="70" r="6" fill="#f59e0b"/>' +
            '<text x="20" y="102" font-size="10" fill="#64748b">' + Common.L("输入值：", "Input: ") + v + "</text></svg>";
        }
      }
      [dmax, inp].forEach((el) => el.addEventListener("input", draw));
      sideToggle.addEventListener("change", draw);
      draw();
    },

    /* 4.3 曲线：插值类型 */
    "4-3": function (host) {
      host.innerHTML =
        '<div class="lab-controls"><span style="font-size:13.5px">' + Common.L("曲线类型：", "Curve type: ") + '</span>' +
        '<select id="pg43-curve">' +
        '<option value="linear">' + Common.L("linear 直线", "linear (straight)") + '</option>' +
        '<option value="monotoneX">monotoneX</option>' +
        '<option value="natural">natural</option>' +
        '<option value="basis">basis</option>' +
        '<option value="step">step</option>' +
        "</select></div>" +
        '<div class="pg-canvas" id="pg43-canvas"></div>' +
        '<div class="demo-detail" id="pg43-result"></div>';

      const curveSel = host.querySelector("#pg43-curve");
      const pts = [{ x: 0, y: 30 }, { x: 1, y: 34 }, { x: 2, y: 48 }, { x: 3, y: 46 }, { x: 4, y: 30 }, { x: 5, y: 26 }, { x: 6, y: 34 }, { x: 7, y: 52 }];
      const curves = { linear: d3.curveLinear, monotoneX: d3.curveMonotoneX, natural: d3.curveNatural, basis: d3.curveBasis, step: d3.curveStep };
      function draw() {
        const cur = curveSel.value;
        const W = 320, H = 200, M = { l: 30, r: 10, t: 10, b: 20 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
        const x = d3.scaleLinear().domain(d3.extent(pts, (d) => d.x)).range([0, iw]);
        const y = d3.scaleLinear().domain([0, 70]).range([ih, 0]);
        const line = d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(curves[cur]);
        const svg = host.querySelector("#pg43-canvas");
        svg.innerHTML = '<svg width="100%" height="200" viewBox="0 0 ' + W + " " + H + '">' +
          '<g transform="translate(' + M.l + "," + M.t + ')">' +
          '<path d="' + line(pts) + '" fill="none" stroke="#2563eb" stroke-width="2.4"/>' +
          pts.map((d) => '<circle cx="' + x(d.x) + '" cy="' + y(d.y) + '" r="4.5" fill="#fff" stroke="#1e293b" stroke-width="2"/>').join("") +
          "</g></svg>";
        host.querySelector("#pg43-result").innerHTML = "d3.line().curve(d3.curve" + cur.charAt(0).toUpperCase() + cur.slice(1) + ")";
      }
      curveSel.addEventListener("change", draw);
      draw();
    },

    /* 2.1 聚合：按维度分组计数 */
    "2-1": function (host) {
      host.innerHTML =
        '<div class="lab-controls"><label>' + Common.L("选择分组维度：", "Group by: ") + '<select id="pg21-dim">' +
        '<option value="major">' + Common.L("按专业", "Major") + '</option>' +
        '<option value="gender">' + Common.L("按性别", "Gender") + '</option>' +
        "</select></div>" +
        '<div class="pg-canvas" id="pg21-canvas"></div>' +
        '<div class="demo-detail" id="pg21-result"></div>';

      const rows = [
        { major: Common.L("计算机", "CS"), gender: Common.L("男", "M") }, { major: Common.L("计算机", "CS"), gender: Common.L("女", "F") },
        { major: Common.L("软件工程", "SE"), gender: Common.L("男", "M") }, { major: Common.L("软件工程", "SE"), gender: Common.L("男", "M") },
        { major: Common.L("软件工程", "SE"), gender: Common.L("女", "F") }, { major: Common.L("网络工程", "NE"), gender: Common.L("男", "M") },
        { major: Common.L("网络工程", "NE"), gender: Common.L("女", "F") }, { major: Common.L("信息安全", "InfoSec"), gender: Common.L("男", "M") },
      ];
      function draw() {
        const dim = host.querySelector("#pg21-dim").value;
        const grouped = d3.rollups(rows, (v) => v.length, (d) => d[dim]).sort((a, b) => b[1] - a[1]);
        host.querySelector("#pg21-result").innerHTML =
          "d3.rollups " + Common.L("按 <b>", "groups by <b>") + (dim === "major" ? Common.L("专业", "major") : Common.L("性别", "gender")) + Common.L("</b> 分组 → 共 <b>", "</b> → <b>") + grouped.length + Common.L("</b> 组", "</b> groups");
        const svg = host.querySelector("#pg21-canvas");
        const max = d3.max(grouped, (d) => d[1]);
        const barW = 28, gap = 16, startX = 20, baseY = 82;
        const w = Math.max(320, startX + grouped.length * (barW + gap) + 20);
        svg.innerHTML = '<svg width="100%" height="100" viewBox="0 0 ' + w + ' 100">' +
          grouped.map((g, i) => {
            const h = (g[1] / max) * 50;
            const x = startX + i * (barW + gap);
            return '<rect x="' + x + '" y="' + (baseY - h) + '" width="' + barW + '" height="' + h + '" fill="#2563eb" rx="2"/>' +
              '<text x="' + (x + barW / 2) + '" y="' + (baseY - h - 6) + '" font-size="10" fill="#1e293b" text-anchor="middle">' + g[1] + "</text>" +
              '<text x="' + (x + barW / 2) + '" y="' + (baseY + 16) + '" font-size="10" fill="#64748b" text-anchor="middle">' + g[0] + "</text>";
          }).join("") + "</svg>";
      }
      host.querySelector("#pg21-dim").addEventListener("change", draw);
      draw();
    },

    /* 3.2 配色语义：场景 × 配色方案（支持并排对比） */
    "3-2": function (host) {
      host.innerHTML =
        '<div class="pg-mode"><label class="pg-mode-toggle"><input type="checkbox" id="pg32-side"> ' + Common.L("并排对比", "Side-by-side") + '</label></div>' +
        '<div class="pg-panels" id="pg32-panels"></div>';

      const schemes = {
        cat: ["Category10", "Tableau10", "Set2", "Dark2"],
        seq: ["Blues", "Greens", "Oranges", "Purples"],
        div: ["RdBu", "PiYG", "PuOr", "BrBG"],
      };
      const sceneNames = { cat: Common.L("类别型", "Categorical"), seq: Common.L("顺序型", "Sequential"), div: Common.L("偏差型", "Diverging") };
      const sideToggle = host.querySelector("#pg32-side");
      const panels = host.querySelector("#pg32-panels");

      function renderPanel(container, suffix, defaultScene, defaultScheme) {
        container.innerHTML =
          '<div class="lab-controls"><label>' + Common.L("数据场景：", "Data scenario: ") + '</label><select id="pg32-scene' + suffix + '">' +
          Object.keys(sceneNames).map((k) => '<option value="' + k + '"' + (k === defaultScene ? " selected" : "") + ">" + sceneNames[k] + "</option>").join("") +
          "</select></div>" +
          '<div class="lab-controls"><label>' + Common.L("配色方案：", "Color scheme: ") + '</label><select id="pg32-scheme' + suffix + '"></select></div>' +
          '<div class="pg-canvas" id="pg32-canvas' + suffix + '"></div>' +
          '<div class="demo-detail" id="pg32-result' + suffix + '"></div>';

        const sceneSel = container.querySelector("#pg32-scene" + suffix);
        const schemeSel = container.querySelector("#pg32-scheme" + suffix);
        function populateSchemes() {
          const s = sceneSel.value;
          schemeSel.innerHTML = schemes[s].map((k) => '<option value="' + k + '"' + (k === defaultScheme ? " selected" : "") + ">" + k + "</option>").join("");
        }
        populateSchemes();
        sceneSel.addEventListener("change", () => { populateSchemes(); draw(); });
        schemeSel.addEventListener("change", draw);
        function draw() {
          const s = schemeSel.value;
          const colors = d3["scheme" + s] || d3.schemeCategory10;
          const count = Math.min(6, colors.length);
          container.querySelector("#pg32-result" + suffix).innerHTML = "d3.scaleOrdinal().range(d3.scheme" + s + ")";
          const svg = container.querySelector("#pg32-canvas" + suffix);
          svg.innerHTML = '<svg width="100%" height="60" viewBox="0 0 320 60">' +
            colors.slice(0, count).map((c, i) =>
              '<circle cx="' + (34 + i * 48) + '" cy="22" r="14" fill="' + c + '"/>' +
              '<text x="' + (34 + i * 48) + '" y="52" font-size="9" fill="#64748b" text-anchor="middle">' + (i + 1) + "</text>"
            ).join("") + "</svg>";
        }
        draw();
      }

      function render() {
        if (sideToggle.checked) {
          panels.innerHTML = '<div class="pg-side-by-side">' +
            '<div class="pg-side" id="pg32-panelA"></div>' +
            '<div class="pg-side" id="pg32-panelB"></div>' +
            "</div>";
          renderPanel(panels.querySelector("#pg32-panelA"), "A", "cat", "Category10");
          renderPanel(panels.querySelector("#pg32-panelB"), "B", "seq", "Blues");
        } else {
          panels.innerHTML = '<div id="pg32-single"></div>';
          renderPanel(panels.querySelector("#pg32-single"), "", "cat", "Category10");
        }
      }
      sideToggle.addEventListener("change", render);
      render();
    },

    /* 5.1 时间比例尺：scaleTime */
    "5-1": function (host) {
      host.innerHTML =
        '<div class="lab-controls"><label>' + Common.L("domain 开始年：", "domain start year: ") + '<select id="pg51-start">' +
        "<option>1990</option><option selected>2000</option><option>2010</option><option>2020</option>" +
        "</select></div>" +
        '<div class="lab-controls"><label>' + Common.L("domain 结束年：", "domain end year: ") + '<select id="pg51-end">' +
        "<option>2020</option><option selected>2024</option><option>2026</option><option>2030</option>" +
        "</select></div>" +
        '<div class="pg-canvas" id="pg51-canvas"></div>' +
        '<div class="demo-detail" id="pg51-result"></div>';

      const startSel = host.querySelector("#pg51-start"), endSel = host.querySelector("#pg51-end");
      function draw() {
        const s = +startSel.value, e = +endSel.value;
        const scale = d3.scaleTime().domain([new Date(s, 0, 1), new Date(e, 11, 31)]).range([0, 300]);
        const mid = new Date((s + e) / 2, 6, 15);
        const pos = scale(mid);
        host.querySelector("#pg51-result").innerHTML =
          "d3.scaleTime().domain([" + s + ", " + e + "]) → " + Common.L("中点 ", "midpoint ") + (s + e) / 2 + Common.L(" 年位于 ", " maps to ") + "<b>" + pos.toFixed(0) + "px</b>";
        const svg = host.querySelector("#pg51-canvas");
        const years = [];
        for (let y = s; y <= e; y += Math.max(1, Math.round((e - s) / 6))) years.push(y);
        svg.innerHTML = '<svg width="100%" height="80" viewBox="0 0 320 80">' +
          '<line x1="20" y1="40" x2="300" y2="40" stroke="#cbd5e1" stroke-width="2"/>' +
          years.map((y) => {
            const x = 20 + scale(new Date(y, 0, 1));
            return '<line x1="' + x + '" y1="36" x2="' + x + '" y2="44" stroke="#94a3b8" stroke-width="1.5"/>' +
              '<text x="' + x + '" y="62" font-size="9" fill="#64748b" text-anchor="middle">' + y + "</text>";
          }).join("") +
          '<circle cx="' + (20 + pos) + '" cy="40" r="6" fill="#2563eb"/>' +
          '<text x="' + (20 + pos) + '" y="20" font-size="10" fill="#2563eb" text-anchor="middle">' + Common.L("中点", "mid") + '</text></svg>';
      }
      [startSel, endSel].forEach((el) => el.addEventListener("change", draw));
      draw();
    },
  };

  function mount(lessonId, host) {
    const fn = PLAYGROUNDS[lessonId];
    if (!fn) return false;
    const wrap = document.createElement("div");
    wrap.className = "content-card pg-card";
    wrap.innerHTML = '<h2><span class="h-ico">' + Common.icon("target", 15) + "</span>" + Common.L("参数实验室 · 代码变互动", "Parameter lab · code becomes interaction") + "</h2>" +
      '<p class="muted" style="font-size:13px;margin-bottom:14px">' + Common.L("上方代码中的关键参数已变成可交互控件，调整后下方实时重绘。", "Key parameters in the code above are now interactive controls — adjust them and the chart redraws live.") + "</p>" +
      '<div id="pg-host"></div>';
    host.appendChild(wrap);
    fn(wrap.querySelector("#pg-host"));
    return true;
  }

  window.CodePlayground = { mount };
})();

/* ============================================================
 * color-semantics.js — 配色语义实验（重点）
 * 三类数据场景 × 三类配色，选对/选错都给出原因
 * ============================================================ */
(function () {
  const CAT = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#b07aa1", "#76b7b2"];
  const SEQ = (v) => d3.interpolateBlues(0.25 + v * 0.7);
  const DIV = (v) => d3.interpolateRdBu(1 - v); // v≈0.5 中性

  const SCENARIOS = {
    cat: {
      name: Common.L("专业类别（无顺序）", "Majors (unordered categories)"),
      correctType: "categorical",
      question: Common.L("6 个专业是<b>无顺序的类别</b>，只需彼此区分，没有高低之分。", "The 6 majors are <b>unordered categories</b>: they only need to be told apart, with no ranking."),
      data: [
        { label: "软件工程", value: 6 }, { label: "数据科学", value: 5 },
        { label: "人工智能", value: 4 }, { label: "网络工程", value: 3 },
        { label: "信息安全", value: 4 }, { label: "数字媒体", value: 3 },
      ],
      explain: {
        categorical: { good: true,
          text: Common.L("正确：离散类别色让 6 个专业彼此区分，且不暗示顺序。类别数在 7–8 个以内，区分度足够。", "Correct: discrete categorical colors tell the 6 majors apart without implying any order. With 7–8 categories or fewer, distinctness is sufficient.") },
        sequential: { good: false,
          text: Common.L("不合适：蓝色深浅会被误读为“某专业人数/等级更高”，凭空制造了顺序；相邻类别也难区分。", "Not suitable: shades of blue would be misread as “this major has more students / ranks higher”, inventing an order; neighboring categories are also hard to tell apart.") },
        diverging: { good: false,
          text: Common.L("不合适：发散色强调“相对中性中点的偏离”，但专业没有一个有意义的中点。", "Not suitable: diverging colors emphasize “deviation from a neutral midpoint”, but majors have no meaningful midpoint.") },
      },
    },
    seq: {
      name: Common.L("城市气温高低（单向顺序）", "City temperatures (one-way order)"),
      correctType: "sequential",
      question: Common.L("城市气温从 12℃ 到 34℃，是<b>单向的高低顺序</b>，希望越热越“深/暖”。", "Temperatures run from 12℃ to 34℃ — a <b>one-way low-to-high order</b>; hotter should look “darker/warmer”."),
      data: [
        { label: "哈尔滨", value: 12 }, { label: "北京", value: 22 },
        { label: "上海", value: 26 }, { label: "广州", value: 30 },
        { label: "武汉", value: 28 }, { label: "海口", value: 34 },
      ],
      explain: {
        categorical: { good: false,
          text: Common.L("不合适：类别色能区分城市，但看不出气温的高低顺序，丢掉了最关键的数量信息。", "Not suitable: categorical colors can tell cities apart but hide the temperature order, losing the key quantitative information.") },
        sequential: { good: true,
          text: Common.L("正确：单色（或 Viridis）渐变按明度单调变化，越热越深/越亮，顺序一目了然。", "Correct: a single-hue (or Viridis) gradient changes monotonically in lightness — hotter is darker/brighter, so the order is obvious.") },
        diverging: { good: false,
          text: Common.L("不合适：气温这里没有有意义的“零点”，发散色会让人误判哪里是中性。", "Not suitable: temperature here has no meaningful “zero point”; a diverging palette makes the neutral point ambiguous.") },
      },
    },
    div: {
      name: Common.L("相对均值的偏差（有正有负）", "Deviation from the mean (positive and negative)"),
      correctType: "diverging",
      question: Common.L("各省 GDP 增速相对全国均值的<b>偏差</b>，有正有负，均值是有意义的中性零点。", "GDP growth deviations from the national average are <b>positive and negative</b>; the average is a meaningful neutral zero."),
      data: [
        { label: "甲省", value: -8 }, { label: "乙省", value: -4 }, { label: "丙省", value: -1 },
        { label: "丁省", value: 2 }, { label: "戊省", value: 5 }, { label: "己省", value: 9 },
      ],
      explain: {
        categorical: { good: false,
          text: Common.L("不合适：类别色无法表达正负，也看不出谁偏离均值更多。", "Not suitable: categorical colors cannot express sign, nor show which province deviates more from the mean.") },
        sequential: { good: false,
          text: Common.L("不合适：单向蓝色深浅表达不出正负——负值和正值都用同一方向的颜色，语义不清。", "Not suitable: one-way blue shades cannot express sign — negative and positive values get colors from the same direction, so the semantics are unclear.") },
        diverging: { good: true,
          text: Common.L("正确：RdBu 以中性色（白）为中点，蓝/红分别表示负/正，颜色深浅表示偏离程度。", "Correct: RdBu centers on a neutral color (white), blue/red map to negative/positive, and darker shades mean larger deviations.") },
      },
    },
  };

  const PALETTES = [
    { type: "categorical", label: Common.L("类别配色（离散）", "Categorical (discrete)") },
    { type: "sequential", label: Common.L("顺序配色（渐变）", "Sequential (gradient)") },
    { type: "diverging", label: Common.L("发散配色（中点）", "Diverging (midpoint)") },
  ];

  function colorFor(type, d, data, key) {
    const vals = data.map((x) => x.value);
    if (type === "categorical") return CAT[key % CAT.length];
    if (type === "sequential") {
      const t = d3.scaleLinear().domain(d3.extent(vals)).range([0, 1])(d.value);
      return SEQ(t);
    }
    const t = d3.scaleLinear().domain([-Math.max(...vals.map(Math.abs)), Math.max(...vals.map(Math.abs))]).range([0, 1])(d.value);
    return DIV(t);
  }

  function render(container) {
    container.innerHTML =
      '<div class="experiment-options"><label><input type="checkbox" id="sem-practice">' + Common.L("练习模式：先判断，再揭晓", "Practice mode: guess first, then reveal") + '</label></div>' +
      '<div class="sem-scenario">' +
      Object.keys(SCENARIOS).map((k, i) =>
        '<button class="sem-btn" data-sc="' + k + '">' + SCENARIOS[k].name + "</button>").join("") +
      "</div>" +
      '<div class="demo-detail" id="sem-question"></div>' +
      '<div class="lab-controls" style="margin-top:12px"><span style="font-size:13.5px;color:var(--text-2)">' + Common.L("选择一种配色：", "Pick a palette:") + '</span>' +
      PALETTES.map((p) => '<button class="sem-btn" data-pal="' + p.type + '">' + p.label + "</button>").join("") +
      "</div>" +
      '<div class="sem-palette-row" id="sem-strip"></div>' +
      '<div id="sem-chart"></div>' +
      '<div id="sem-verdict" role="status"></div>' +
      '<div class="lab-controls" style="margin-top:12px"><button class="demo-btn" id="sem-check" hidden>' + Common.L("确认选择并揭晓", "Confirm and reveal") + '</button><button class="demo-btn secondary" id="sem-retry" hidden>' + Common.L("重新练习", "Practice again") + '</button></div><div class="experiment-feedback" id="sem-score" hidden></div>';

    let sc = "cat";
    let chosen = null;
    let revealed = false;
    const firstAnswers = {};

    function drawChart() {
      const data = SCENARIOS[sc].data;
      const isDiv = sc === "div";
      const host = container.querySelector("#sem-chart");
      const W = Math.max(300, host.clientWidth || 380), H = 260;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H)
        .attr("viewBox", "0 0 " + W + " " + H);
      const M = { l: 64, r: 20, t: 14, b: 30 };
      const iw = W - M.l - M.r, ih = H - M.t - M.b;
      const y = d3.scaleBand().domain(data.map((d) => d.label)).range([0, ih]).padding(0.25);
      const maxV = d3.max(data, (d) => Math.abs(d.value));
      let x;
      if (isDiv) x = d3.scaleLinear().domain([-maxV, maxV]).range([0, iw]);
      else x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) * 1.1]).range([0, iw]);
      const g = svg.append("g").attr("transform", "translate(" + M.l + "," + M.t + ")");

      if (isDiv) {
        g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", ih)
          .attr("stroke", "#1e293b").attr("stroke-width", 1.5);
      }
      g.selectAll("rect").data(data).join("rect")
        .attr("y", (d) => y(d.label)).attr("height", y.bandwidth())
        .attr("x", (d) => isDiv ? (d.value >= 0 ? x(0) : x(d.value)) : 0)
        .attr("width", (d) => Math.abs(x(d.value) - x(0)))
        .attr("rx", 3)
        .attr("fill", (d, i) => chosen ? colorFor(chosen, d, data, i) : "#cbd5e1");
      g.selectAll("text.val").data(data).join("text")
        .attr("class", "val").attr("font-size", 11).attr("fill", "#475569")
        .attr("y", (d) => y(d.label) + y.bandwidth() / 2 + 4)
        .attr("x", (d) => isDiv ? (d.value >= 0 ? x(d.value) + 4 : x(d.value) - 6) : x(d.value) + 4)
        .attr("text-anchor", (d) => isDiv ? (d.value >= 0 ? "start" : "end") : "start")
        .text((d) => d.value);
      g.append("g").attr("transform", "translate(0," + ih + ")").call(d3.axisBottom(isDiv ? x : x).ticks(6)).selectAll("text").attr("font-size", 10);
      g.append("g").call(d3.axisLeft(y)).selectAll("text").attr("font-size", 11);
    }

    function drawStrip() {
      const strip = container.querySelector("#sem-strip");
      if (!chosen) { strip.innerHTML = "<i style='flex:1;background:#eef2f7'></i>"; return; }
      const data = SCENARIOS[sc].data;
      if (chosen === "categorical") {
        strip.innerHTML = CAT.map((c) => "<i style='background:" + c + "'></i>").join("");
      } else if (chosen === "sequential") {
        strip.innerHTML = d3.range(0, 1.01, 0.1).map((t) =>
          "<i style='background:" + SEQ(t) + "'></i>").join("");
      } else {
        strip.innerHTML = d3.range(0, 1.01, 0.05).map((t) =>
          "<i style='background:" + DIV(t) + "'></i>").join("");
      }
    }

    function render() {
      const s = SCENARIOS[sc];
      container.querySelector("#sem-question").innerHTML =
        "<b>" + s.name + "</b><br><span style='font-size:13px;color:var(--text-2)'>" + s.question + "</span>";
      container.querySelectorAll(".sem-scenario .sem-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.sc === sc));
      container.querySelectorAll("[data-pal]").forEach((b) =>
        b.classList.toggle("active", chosen && b.dataset.pal === chosen));
      const v = container.querySelector("#sem-verdict");
      const practice = container.querySelector("#sem-practice").checked;
      container.querySelector("#sem-check").hidden = !practice;
      container.querySelector("#sem-check").disabled = !chosen || revealed;
      container.querySelector("#sem-retry").hidden = !practice;
      const score = container.querySelector("#sem-score");
      score.hidden = !practice;
      const answers = Object.values(firstAnswers);
      score.textContent = Common.L("本轮首答：", "First attempts: ") + answers.filter(Boolean).length + " / " + answers.length + Common.L(" 个已答场景正确（共 3 场景）；仅用于本次练习。", " scenario(s) answered correctly (3 scenarios in total); for this practice session only.");
      if (chosen && (!practice || revealed)) {
        const r = s.explain[chosen];
        v.innerHTML = '<div class="sem-verdict ' + (r.good ? "good" : "bad") + '">' +
          (r.good ? Common.L("✓ 合理选择", "✓ Semantically sound") : Common.L("✗ 语义不符", "✗ Mismatched semantics")) + "<br>" + r.text + "</div>";
      } else {
        v.innerHTML = '<div class="note info" style="margin:0">' + (practice ? Common.L('先选择配色观察图形，再点击确认揭晓判断；也可切换方案进行比较。', 'Pick a palette and watch the chart, then click confirm to reveal the verdict; you can also switch palettes to compare.') : Common.L('请选择一种配色，观察图形并阅读它是否适合当前数据的解释。', 'Pick a palette, watch the chart, and read whether it fits the current data.')) + '</div>';
      }
      drawStrip();
      drawChart();
    }

    container.querySelectorAll("[data-sc]").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.sc) { sc = b.dataset.sc; chosen = null; revealed = false; render(); }
      });
    });
    container.querySelectorAll("[data-pal]").forEach((b) => {
      b.addEventListener("click", () => { chosen = b.dataset.pal; revealed = false; render(); });
    });

    container.querySelector("#sem-practice").addEventListener("change", () => { revealed = false; render(); });
    container.querySelector("#sem-check").addEventListener("click", () => {
      if (!chosen) return;
      if (!(sc in firstAnswers)) firstAnswers[sc] = SCENARIOS[sc].explain[chosen].good;
      revealed = true; render();
    });
    container.querySelector("#sem-retry").addEventListener("click", () => {
      Object.keys(firstAnswers).forEach(key => delete firstAnswers[key]);
      chosen = null; revealed = false; render();
    });
    Demos.onResize(container, debounce(render));
    function debounce(fn) { let t; return function () { clearTimeout(t); t = setTimeout(fn, 220); }; }
    render();
    LabWorkbench.connect(container, "color-semantics", {
      get: () => ({sc, chosen, revealed, practice: container.querySelector("#sem-practice").checked, firstAnswers: {...firstAnswers}}),
      valid: s => Object.hasOwn(SCENARIOS, s.sc) && (s.chosen === null || PALETTES.some(p => p.type === s.chosen)) && typeof s.practice === "boolean" && typeof s.revealed === "boolean" && s.firstAnswers && typeof s.firstAnswers === "object" && Object.entries(s.firstAnswers).every(([key,value]) => Object.hasOwn(SCENARIOS,key) && typeof value === "boolean"),
      set: s => { sc = s.sc; chosen = s.chosen; revealed = s.revealed; container.querySelector("#sem-practice").checked = s.practice; Object.keys(firstAnswers).forEach(key => delete firstAnswers[key]); Object.assign(firstAnswers, s.firstAnswers); render(); },
      steps: [Common.L("先判断当前数据是类别、顺序还是围绕中点的偏差，再预测适合的配色。", "First decide whether the data is categorical, ordinal, or a deviation around a midpoint, then predict a fitting palette."), Common.L("切换数据场景与配色，保存对照；开启判断练习，先选方案再揭晓。", "Switch scenarios and palettes to compare; turn on practice mode to guess before the reveal."), Common.L("核对颜色是否暗示了数据并不存在的顺序或中点，再撤销比较。", "Check whether the colors imply an order or midpoint the data does not have, then undo to compare.")],
      question: () => ({text: Common.L("当前场景：“", "Current scenario: “") + SCENARIOS[sc].name + Common.L("”。应优先使用哪类配色？", "”. Which type of palette fits best?"), options: PALETTES.map(p => p.label), correct: PALETTES.findIndex(p => p.type === SCENARIOS[sc].correctType), explain: SCENARIOS[sc].explain[SCENARIOS[sc].correctType].text})
    });
  }

  window.Demos.register("color-semantics", render, { selfResize: true });
})();

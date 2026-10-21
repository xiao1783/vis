/* ============================================================
 * demos-ch1.js — 第一章：csv-loader / dikw / attribute
 * ============================================================ */

/* ---------- 1.1 CSV 加载与类型转换 ---------- */
(function () {
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><button class="demo-btn" id="csv-load">' + Common.L("加载 newstudent.csv", "Load newstudent.csv") + '</button>' +
      '<span class="muted" style="font-size:12.5px">' + Common.L("合成教学数据", "Synthetic teaching data") + ' <span class="synth-tag">' + Common.L("AI 合成", "AI-generated") + '</span></span></div>' +
      '<div class="demo-detail" id="csv-status">' + Common.L("点击按钮，从 data/newstudent.csv 加载并执行转换。", "Click the button to load data/newstudent.csv and run the conversion.") + '</div>' +
      '<div class="console" id="csv-console" style="max-height:200px"></div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:10px" id="csv-tables"></div>' +
      '<div id="csv-pager" class="lab-controls" style="display:none"></div>';

    container.querySelector("#csv-load").addEventListener("click", async () => {
      const button = container.querySelector("#csv-load");
      if (button.disabled) return;
      button.disabled = true;
      const status = container.querySelector("#csv-status");
      status.innerHTML = Common.L("加载中…", "Loading…");
      try {
        const text = await d3.text("data/newstudent.csv");
        if (!container.isConnected) return;
        const raw = d3.csvParseRows(text);
        const lines = text.trim().split("\n");
        const rawText = lines.slice(0, 3).join("\n");

        function transformRow(d) {
          return {
            id: +d["序号"], name: d["姓名"].trim(), gender: d["性别"],
            birthday: new Date(d["生日"]), age: +d["年龄"], cls: d["班级"].trim(),
          };
        }
        const data = d3.csvParse(text, transformRow);
        const total = data.length;
        let idx = 0;

        container.querySelector("#csv-console").textContent =
          Common.L("原始文本前 3 行（所有值都是字符串）：\n", "First 3 lines of the raw text (all values are strings):\n") + rawText +
          Common.L("\n\n类型验证：\n", "\n\nType verification:\n") +
          'typeof data[0].age = "' + typeof data[0].age + '"\n' +
          'data[0].birthday instanceof Date = ' + (data[0].birthday instanceof Date) +
          Common.L("\n总行数（不含表头）：", "\nTotal rows (excluding header): ") + total;

        function showRow() {
          const d = data[idx];
          const rawObj = raw[idx + 1];
          const headers = raw[0];
          const rows = [
            { head: Common.L("原始 CSV 行（值类型都是 string）", "Raw CSV row (all values are string)"),
              body: headers.map((h, i) => ({ field: h, value: String(rawObj[i]), type: "string" })) },
            { head: Common.L("转换后对象（row 回调返回）", "Converted object (returned by the row callback)"),
              body: [
                { field: "id", value: d.id, type: typeof d.id },
                { field: "name", value: d.name, type: typeof d.name },
                { field: "gender", value: d.gender, type: typeof d.gender },
                { field: "birthday", value: d3.timeFormat("%Y-%m-%d")(d.birthday), type: "Date" },
                { field: "age", value: d.age, type: typeof d.age },
                { field: "cls", value: d.cls, type: typeof d.cls },
              ] },
          ];
          container.querySelector("#csv-tables").innerHTML = rows.map((r) =>
            '<div class="ctrl-group"><div class="cg-title">' + r.head + "</div>" +
            '<table class="data-table"><thead><tr><th>' + Common.L("字段", "Field") + '</th><th>' + Common.L("值", "Value") + '</th><th>' + Common.L("类型", "Type") + '</th></tr></thead><tbody>' +
            r.body.map((c) => "<tr><td>" + c.field + "</td><td>" + window.esc(c.value) +
              '</td><td class="' + (c.type !== "string" ? "derived-cell" : "") + '"><code>' + c.type + "</code></td></tr>").join("") +
            "</tbody></table></div>").join("");
          status.innerHTML = Common.L("共 <b>" + total + '</b> 条记录，当前第 <b>' + (idx + 1) + "</b> 条。", "Total <b>" + total + '</b> records, now showing record <b>' + (idx + 1) + "</b>.");
        }
        showRow();
        const pager = container.querySelector("#csv-pager");
        pager.style.display = "flex";
        pager.innerHTML =
          '<button class="demo-btn secondary" id="csv-prev">' + Common.L("← 上一条", "← Previous") + '</button>' +
          '<span class="readout" id="csv-idx"></span>' +
          '<button class="demo-btn secondary" id="csv-next">' + Common.L("下一条 →", "Next →") + '</button>' +
          '<label>' + Common.L("跳到记录 ", "Jump to record ") + '<input type="number" id="csv-jump" min="1" max="' + total + '" value="1" style="width:70px"></label>';
        pager.querySelector("#csv-jump").addEventListener("change", event => {
          const target = +event.target.value;
          if (!Number.isInteger(target) || target < 1 || target > total) { event.target.value = idx + 1; return; }
          idx = target - 1; showRow(); pager.querySelector("#csv-idx").textContent = (idx + 1) + " / " + total;
        });
        pager.querySelector("#csv-idx").textContent = (idx + 1) + " / " + total;
        pager.querySelector("#csv-prev").addEventListener("click", () => {
          idx = (idx - 1 + total) % total; showRow(); pager.querySelector("#csv-idx").textContent = (idx + 1) + " / " + total; pager.querySelector("#csv-jump").value = idx + 1;
        });
        pager.querySelector("#csv-next").addEventListener("click", () => {
          idx = (idx + 1) % total; showRow(); pager.querySelector("#csv-idx").textContent = (idx + 1) + " / " + total; pager.querySelector("#csv-jump").value = idx + 1;
        });
      } catch (e) {
        status.innerHTML = '<span class="demo-error">' + Common.L("加载失败：", "Load failed: ") + window.esc(e.message) +
          Common.L("。请用本地服务器访问。", " Please access the site through a local server.") + '</span>';
      } finally {
        button.disabled = false;
      }
    });
  }
  window.Demos.register("csv-loader", render, { selfResize: true });
})();

/* ---------- 1.2 DIKW 金字塔 ---------- */
(function () {
  const LAYERS = [
    { key: "Data", cn: Common.L("数据", "Data"), color: "#94a3b8",
      example: Common.L("17、女、软件工程1班", "17, Female, Software Engineering Class 1"),
      desc: Common.L("原始、离散的符号。只有数值与类别，没有上下文。", "Raw, discrete symbols. Only values and categories, with no context.") },
    { key: "Information", cn: Common.L("信息", "Information"), color: "#06b6d4",
      example: Common.L("李华，17岁，软件工程1班女生", "Li Hua, 17, female, Software Engineering Class 1"),
      desc: Common.L("赋予数据上下文与结构，可回答“是谁、是什么”。", "Data given context and structure, answering 'who and what'.") },
    { key: "Knowledge", cn: Common.L("知识", "Knowledge"), color: "#2563eb",
      example: Common.L("软件工程1班平均 18.2 岁，17 岁属低龄新生", "Class 1 averages 18.2 years; 17-year-olds are young freshmen"),
      desc: Common.L("从多条信息归纳出模式、规则，可回答“是怎样的”。", "Patterns and rules summarized from many facts, answering 'how is it'.") },
    { key: "Wisdom", cn: Common.L("智慧", "Wisdom"), color: "#1d4ed8",
      example: Common.L("对低龄新生给予更多入学适应关注", "Give younger freshmen more support for school adaptation"),
      desc: Common.L("结合领域知识做出判断与行动，可视化主要帮到下两层。", "Judgment and action combining domain knowledge; visualization mainly helps the two lower layers.") },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="lab-svg-wrap" id="dikw-svg"></div>' +
      '<div class="demo-detail" id="dikw-detail">点击或悬停金字塔各层，查看同一班级示例在不同层次的表达。</div>';
    const host = container.querySelector("#dikw-svg");
    const W = Math.max(300, host.clientWidth || 360), H = 320;
    const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H);
    const cx = W / 2;
    const topW = 70, botW = 300, h = 60, gap = 6, y0 = 20;
    function trapezoid(i) {
      const yTop = y0 + i * (h + gap);
      const wTop = topW + (botW - topW) * (i / 4);
      const wBot = topW + (botW - topW) * ((i + 1) / 4);
      return "M " + (cx - wTop / 2) + " " + yTop + " L " + (cx + wTop / 2) + " " + yTop +
        " L " + (cx + wBot / 2) + " " + (yTop + h) + " L " + (cx - wBot / 2) + " " + (yTop + h) + " Z";
    }
    function show(i) {
      const d = LAYERS[i];
      container.querySelector("#dikw-detail").innerHTML =
        "<h4 style='color:" + d.color + "'>" + d.cn + "</h4>" +
        "<p style='margin:4px 0'>" + d.desc + "</p>" +
        '<div class="example-box" style="margin:6px 0"><div class="eb-title">班级示例</div>' + d.example + "</div>";
    }
    svg.selectAll("g.layer").data([...LAYERS].reverse()).join("g")
      .attr("class", "layer").style("cursor", "pointer")
      .each(function (d, i) {
        d3.select(this).append("path").attr("d", trapezoid(i)).attr("fill", d.color)
          .attr("opacity", 0.9).attr("stroke", "#fff").attr("stroke-width", 2);
        d3.select(this).append("text").attr("x", cx).attr("y", y0 + i * (h + gap) + h / 2 + 4)
          .attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", 14).attr("font-weight", 700)
          .text(d.cn);
      })
      .on("mouseover", function (e, d) {
        show(LAYERS.indexOf(d));
        d3.select(this).select("path").transition().duration(150).attr("opacity", 1)
          .attr("fill", d3.color(d.color).brighter(0.6));
      })
      .on("mouseout", function (e, d) {
        d3.select(this).select("path").transition().duration(150).attr("opacity", 0.9).attr("fill", d.color);
      })
      .on("click", (e, d) => show(LAYERS.indexOf(d)));
    show(2);
  }
  window.Demos.register("dikw", render);
})();

/* ---------- 1.3 属性 × 视觉通道 ---------- */
(function () {
  const FIELDS = [
    { name: "姓名", scale: "名义 Nominal",
      good: "色相 / 形状 / 分类位置", bad: "颜色明度、长度",
      desc: "无顺序的类别，只需要区分相等与否。" },
    { name: "年龄", scale: "比率 Ratio",
      good: "位置 / 长度 / 角度", bad: "纯色相、面积",
      desc: "有绝对零点、可比较倍数，定量通道最准确。" },
    { name: "性别", scale: "名义 Nominal",
      good: "色相（少量类别）/ 形状", bad: "连续渐变、明度",
      desc: "类别变量，不应有高低顺序。" },
    { name: "学历", scale: "序数 Ordinal",
      good: "明度 / 位置（有顺序）", bad: "任意色相",
      desc: "有顺序但差值无意义，用能体现顺序的通道。" },
    { name: "摄氏温度", scale: "区间 Interval",
      good: "位置 / 长度", bad: "面积倍数、比值",
      desc: "差值有意义但没有绝对零点，不能说两倍热。" },
    { name: "班级人数", scale: "比率 Ratio",
      good: "长度（条形）/ 位置", bad: "饼图角度、面积",
      desc: "可计数的比率量，长度比较最精确。" },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="mini-grid" id="attr-fields"></div>' +
      '<div class="demo-detail" id="attr-detail" style="margin-top:12px"></div>' +
      '<div class="lab-svg-wrap" id="attr-chart" style="margin-top:10px"></div>' +
      '<div class="lab-controls"><label><input type="checkbox" id="attr-bad"> 使用错误编码（演示误导）</label></div>';
    const grid = container.querySelector("#attr-fields");
    FIELDS.forEach((f, i) => {
      const b = document.createElement("div");
      b.className = "mini-card"; b.dataset.i = i;
      b.innerHTML = '<div class="mc-name">' + f.name + "</div><div class='mc-key'>" + f.scale + "</div>";
      b.addEventListener("click", () => select(i));
      grid.appendChild(b);
    });
    let cur = 0, bad = false;
    function select(i) {
      cur = i; draw();
      container.querySelectorAll(".mini-card").forEach((b, j) => b.classList.toggle("active", j === i));
    }
    function draw() {
      const f = FIELDS[cur];
      container.querySelector("#attr-detail").innerHTML =
        "<h4>" + f.name + " <span class='badge chip'>" + f.scale + "</span></h4>" +
        "<p>" + f.desc + "</p>" +
        '<div class="note tip" style="margin:6px 0"><span class="ni">' + Common.icon("check", 15) + '</span><p>推荐通道：<b>' + f.good + "</b></p></div>" +
        '<div class="note danger" style="margin:6px 0"><span class="ni">' + Common.icon("x", 15) + '</span><p>不建议：<b>' + f.bad + "</b></p></div>";
      // 简单示意：同类别数据，正确用离散色，错误用渐变
      const host = container.querySelector("#attr-chart");
      const W = Math.max(300, host.clientWidth || 360), H = 130;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      const cats = ["A", "B", "C", "D", "E", "F"];
      const bw = (W - 60) / 6;
      const isCat = f.scale.indexOf("名义") >= 0;
      const useBad = bad;
      svg.selectAll("rect").data(cats).join("rect")
        .attr("x", (d, i) => 30 + i * bw).attr("y", (d,i) => !isCat && !useBad ? 80-i*9 : 30).attr("width", bw - 8).attr("height", (d,i) => !isCat && !useBad ? 15+i*9 : 60).attr("rx", 5)
        .attr("fill", (d, i) => {
          if (!useBad) {
            if (isCat) return d3.schemeTableau10[i];
            return d3.interpolateBlues(0.3 + i * 0.13);
          } else {
            if (isCat) return d3.interpolateBlues(.2+i*.14); // 无序类别不应暗示明度顺序
            return d3.schemeTableau10[i];                    // 错误：定量用类别色
          }
        });
      svg.selectAll("text").data(cats).join("text").attr("x", (d, i) => 30 + i * bw + (bw - 8) / 2)
        .attr("y", 105).attr("text-anchor", "middle").attr("font-size", 12).text((d) => "类" + d);
      svg.append("text").attr("x", 30).attr("y", 20).attr("font-size", 11).attr("fill", "#64748b")
        .text(useBad ? "⚠️ 当前为错误编码示意" : "✓ 当前为推荐编码");
    }
    container.querySelector("#attr-bad").addEventListener("change", function () {
      bad = this.checked; draw();
    });
    select(0);
    Demos.onResize(container, draw);
  }
  window.Demos.register("attribute", render);
})();

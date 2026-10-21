/* ============================================================
 * data-transform.js — 数据变换流水线（重点）
 * 小数据集依次：filter 筛选 → map 派生 → rollup 分组
 * ============================================================ */
(function () {
  /* 合成教学数据（小样本） */
  const RAW = [
    { name: "张明", gender: "男", major: "软件工程", age: 18 },
    { name: "李华", gender: "女", major: "软件工程", age: 17 },
    { name: "王芳", gender: "女", major: "软件工程", age: 18 },
    { name: "赵强", gender: "男", major: "软件工程", age: 19 },
    { name: "陈静", gender: "女", major: "数据科学", age: 18 },
    { name: "刘洋", gender: "男", major: "数据科学", age: 18 },
    { name: "孙敏", gender: "女", major: "数据科学", age: 17 },
    { name: "周磊", gender: "男", major: "软件工程", age: 20 },
    { name: "吴婷", gender: "女", major: "软件工程", age: 18 },
    { name: "郑昊", gender: "男", major: "数据科学", age: 19 },
    { name: "冯雪", gender: "女", major: "数据科学", age: 18 },
    { name: "何军", gender: "男", major: "软件工程", age: 18 },
  ];

  const STEPS = [
    { key: "filter", note: Common.L("筛选改变<b>记录数量</b>，但保留下来的记录字段不变。", "Filtering changes the <b>number of records</b>, but the records that stay keep their original fields.") },
    { key: "map", label: Common.L("② 派生字段 map：增加年龄段", "② Derive with map: add an age group"), note: Common.L("派生不改变记录数，而是为每条记录<b>增加/改写字段</b>。", "Mapping does not change the record count; instead it <b>adds or overwrites a field</b> on every record.") },
    { key: "rollup", note: Common.L("聚合把多行<b>折叠</b>为每组一个值（这里是人数）。", "Aggregation <b>folds</b> many rows into a single value per group (here: a count).") },
  ];

  function render(container) {
    const steps = STEPS.map(step => ({ ...step }));
    container.innerHTML =
      '<div class="experiment-options"><label>' + Common.L("筛选性别", "Filter gender") + ' <select id="t-gender"><option value="女">' + Common.L("女生", "Female") + '</option><option value="男">' + Common.L("男生", "Male") + '</option><option value="all">' + Common.L("不限", "Any") + '</option></select></label><label>' + Common.L("年龄分界", "Age cutoff") + ' <select id="t-age"><option>18</option><option>19</option><option>20</option></select></label><label>' + Common.L("聚合维度", "Group by") + ' <select id="t-group"><option value="major">' + Common.L("专业", "Major") + '</option><option value="gender">' + Common.L("性别", "Gender") + '</option><option value="ageGroup">' + Common.L("年龄段", "Age group") + '</option></select></label></div>' +
      '<div class="experiment-feedback" id="t-feedback" role="status"></div>' +
      '<button class="demo-btn secondary" id="t-back" type="button" style="margin-bottom:10px">' + Common.L("← 撤销上一步", "← Undo last step") + '</button>' +
      '<div class="step-list" style="margin-bottom:12px">' +
      steps.map((s, i) => '<button class="step-btn" data-step="' + i + '" disabled>' + (s.label || "") + "</button>").join("") +
      '<button class="step-btn" data-step="reset" style="text-align:center">' + Common.L("↺ 重置，从头开始", "↺ Reset and start over") + '</button></div>' +
      '<div class="pipe-flow">' +
      '<div class="pipe-col"><h5>' + Common.L("输入", "Input") + '</h5><div class="pipe-box" id="t-input"></div></div>' +
      '<div class="pipe-arrow">→</div>' +
      '<div class="pipe-col"><h5>' + Common.L("当前操作", "Current step") + '</h5><div class="pipe-box" id="t-op"></div></div>' +
      '<div class="pipe-arrow">→</div>' +
      '<div class="pipe-col"><h5>' + Common.L("输出", "Output") + '</h5><div class="pipe-box" id="t-output"></div></div>' +
      "</div>" +
      '<div class="lab-svg-wrap" id="t-summary" hidden></div><div class="console" id="t-console"></div>';

    let stage = 0; // 0=原始；1=filter后；2=map后；3=rollup后
    let snapshots = [RAW.map((d) => ({ ...d }))];
    // 仅用于显示的分组键映射（数据值本身不变）
    const keyText = (v) => v === "女" ? Common.L("女", "Female") : v === "男" ? Common.L("男", "Male") : v === "软件工程" ? Common.L("软件工程", "Software Eng.") : v === "数据科学" ? Common.L("数据科学", "Data Science") : v;

    function tableHtml(data, fields) {
      if (!data.length) return '<div class="muted">' + Common.L("（空）", "(empty)") + '</div>';
      const cols = fields || Object.keys(data[0]);
      return '<table class="data-table"><thead><tr>' +
        cols.map((c) => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>" +
        data.map((row) => "<tr>" + cols.map((c) => '<td' + (c === 'ageGroup' ? ' class="derived-cell"' : '') + '>' + (row[c] == null ? "—" : row[c]) + "</td>").join("") + "</tr>").join("") +
        "</tbody></table>";
    }

    const consoleEl = container.querySelector("#t-console");
    function configure() {
      const gender = container.querySelector("#t-gender").value;
      const age = +container.querySelector("#t-age").value;
      const field = container.querySelector("#t-group").value;
      const fieldName = {major: Common.L("专业", "Major"), gender: Common.L("性别", "Gender"), ageGroup: Common.L("年龄段", "Age group")}[field];
      steps[0].label = Common.L("① 筛选 filter：", "① Filter: ") + (gender === "all" ? Common.L("保留全部记录", "keep all records") : (gender === "女" ? Common.L("只保留女生", "keep only female students") : Common.L("只保留男生", "keep only male students")));
      steps[0].op = gender === "all" ? "filter(() => true)" : "filter(d => d.gender === '" + gender + "')";
      steps[0].apply = data => data.filter(d => gender === "all" || d.gender === gender);
      steps[1].op = "map(d => ({ ...d, ageGroup: d.age >= " + age + " ? '≥" + age + "' : '<" + age + "' }))";
      steps[1].apply = data => data.map(d => ({...d, ageGroup: d.age >= age ? "≥" + age : "<" + age}));
      steps[2].label = Common.L("③ 分组聚合 rollup：按", "③ Roll up: count by ") + fieldName + Common.L("计数", "");
      steps[2].op = "rollup(data, v => v.length, d => d." + field + ")";
      steps[2].apply = data => Array.from(d3.rollup(data, v => v.length, d => d[field]), ([key,count]) => ({[field]:key,count}));
      container.querySelectorAll("[data-step]").forEach(button => {
        if (button.dataset.step !== "reset") button.textContent = steps[+button.dataset.step].label;
      });
    }
    container.querySelectorAll(".experiment-options select").forEach(select => select.addEventListener("change", () => {
      stage = 0; snapshots = [RAW.map(d => ({...d}))]; consoleEl.textContent = "";
      configure(); renderView(); log(Common.L("● 条件已改变，请重新执行流水线，对比新的结果。", "● Conditions changed. Run the pipeline again and compare the new result."));
    }));
    container.querySelector("#t-back").addEventListener("click", () => {
      if (!stage) return;
      snapshots.pop(); stage--; log(Common.L("↶ 已撤销，返回第 ", "↶ Undone, back to step ") + stage + Common.L(" 步。", ".")); renderView();
    });
    configure();
    function log(msg) { consoleEl.textContent += msg + "\n"; }

    function renderView() {
      const inp = snapshots[stage - 1] || snapshots[0];
      const out = snapshots[stage];
      const inputFields = Object.keys(inp[0] || {});
      const outFields = Object.keys(out[0] || {});
      const summary = container.querySelector("#t-summary");
      summary.hidden = stage === 0;
      d3.select(summary).selectAll("*").remove();
      if (stage) {
        const values = stage === 3 ? out.map(row => ({label:keyText(row[outFields[0]]), value:row.count})) :
          [{label:Common.L("输入记录", "Input rows"), value:inp.length}, {label:Common.L("输出记录", "Output rows"), value:out.length}];
        const svg = d3.select(summary).append("svg").attr("viewBox","0 0 360 " + (values.length*36+28));
        const scale = d3.scaleLinear().domain([0,Math.max(1,d3.max(values,d=>d.value))]).range([0,210]);
        const rows = svg.selectAll("g").data(values).join("g").attr("transform",(d,i)=>"translate(96,"+(18+i*36)+")");
        rows.append("rect").attr("width",d=>scale(d.value)).attr("height",20).attr("rx",4).attr("fill",(d,i)=>i%2?"#56a798":"#667edb");
        rows.append("text").attr("x",-8).attr("y",14).attr("text-anchor","end").attr("font-size",11).attr("fill","#637793").text(d=>d.label);
        rows.append("text").attr("x",d=>scale(d.value)+6).attr("y",14).attr("font-size",11).attr("fill","#526bc1").text(d=>d.value);
      }

      container.querySelector("#t-input").innerHTML =
        '<div class="muted" style="font-size:11.5px;margin-bottom:4px">' + inp.length + Common.L(" 条记录", " records") + '</div>' +
        tableHtml(inp, inputFields);

      if (stage === 0) {
        container.querySelector("#t-op").innerHTML = '<div class="muted" style="font-size:12.5px">' + Common.L("点击左侧步骤 ①，开始把原始数据一步步变换。", "Click step ① on the left to transform the raw data one step at a time.") + '</div>';
        container.querySelector("#t-output").innerHTML =
          '<div class="muted" style="font-size:12.5px">' + Common.L("等待输出…", "Waiting for output…") + '</div>';
      } else {
        const s = steps[stage - 1];
        container.querySelector("#t-op").innerHTML =
          '<div style="font-family:var(--mono);font-size:11.5px;background:#f0f5fc;color:#3f5a7b;border:1px solid #dce5f2;border-radius:6px;padding:8px;margin-bottom:6px">' +
          s.op + "</div>" +
          '<div style="font-size:12px">' + s.note + "</div>";
        container.querySelector("#t-output").innerHTML =
          '<div class="muted" style="font-size:11.5px;margin-bottom:4px">' + out.length + Common.L(" 条结果", " results") + '</div>' +
          tableHtml(out, outFields);
      }

      container.querySelector("#t-back").disabled = stage === 0;
      container.querySelector("#t-feedback").textContent = stage === 0 ? Common.L("先选条件，再依次执行三个步骤。修改条件会重新开始，撤销可回看上一步。", "Pick the conditions first, then run the three steps in order. Changing conditions restarts; Undo looks back one step.") :
        (stage === 1 ? Common.L("筛选：", "Filter: ") + inp.length + " → " + out.length + Common.L(" 条，移除 ", " rows, removed ") + (inp.length - out.length) + Common.L(" 条记录。", " records.") : stage === 2 ? Common.L("派生：仍为 ", "Map: still ") + out.length + Common.L(" 条记录，新增 ageGroup 字段（高亮列）。", " records; the ageGroup field was added (highlighted column).") : Common.L("聚合：", "Roll up: ") + inp.length + Common.L(" 条记录 → ", " records → ") + out.length + Common.L(" 个组，计数之和为 ", " groups; the counts add up to ") + d3.sum(out, d => d.count) + Common.L("。", "."));
      // 按钮状态
      container.querySelectorAll(".step-btn").forEach((b) => {
        const i = b.dataset.step;
        if (i === "reset") { b.disabled = false; return; }
        b.disabled = !(+i === stage);
        b.classList.toggle("active", +i === stage);
      });
    }

    container.querySelectorAll(".step-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const i = b.dataset.step;
        if (i === "reset") {
          stage = 0;
          snapshots = [RAW.map((d) => ({ ...d }))];
          consoleEl.textContent = "";
          log(Common.L("● 原始数据：12 条合成学生记录。", "● Raw data: 12 synthetic student records.") + "\n");
        } else {
          const s = steps[+i];
          const before = snapshots[snapshots.length - 1];
          const after = s.apply(before);
          snapshots.push(after);
          stage = +i + 1;
          log("● " + s.label.split(/：|: /)[0]);
          log(Common.L("  输入 ", "  Input ") + before.length + Common.L(" 条 → 输出 ", " rows → output ") + after.length + Common.L(" 条", " rows"));
          if (s.key === "filter")
            log(Common.L("  filter 改变记录数，保留记录的字段不变。", "  filter changes the record count; the records that stay keep their fields.") + "\n");
          else if (s.key === "map")
            log(Common.L("  map 记录数不变，新增 ageGroup 字段。", "  map keeps the record count and adds the ageGroup field.") + "\n");
          else if (s.key === "rollup")
            log(Common.L("  rollup 把多行折叠为每组一个计数值。", "  rollup folds rows into one count per group.") + "\n");
        }
        renderView();
      });
    });

    log(Common.L("● 原始数据：12 条合成学生记录（仅用于教学）。", "● Raw data: 12 synthetic student records (for teaching only).") + "\n");
    renderView();
    LabWorkbench.connect(container, "data-transform", {
      get: () => ({stage, gender: container.querySelector("#t-gender").value, age: container.querySelector("#t-age").value, field: container.querySelector("#t-group").value}),
      valid: s => Number.isInteger(s.stage) && s.stage >= 0 && s.stage <= 3 && ["女","男","all"].includes(s.gender) && ["18","19","20"].includes(s.age) && ["major","gender","ageGroup"].includes(s.field),
      set: s => { container.querySelector("#t-gender").value = s.gender; container.querySelector("#t-age").value = s.age; container.querySelector("#t-group").value = s.field; configure(); stage = s.stage; snapshots = [RAW.map(d => ({...d}))]; for (let i = 0; i < stage; i++) snapshots.push(steps[i].apply(snapshots[i])); consoleEl.textContent = Common.L("已恢复至第 ", "Restored to step ") + stage + Common.L(" 步。", "."); renderView(); },
      steps: [Common.L("预测：筛选、派生、聚合中，哪些操作会改变记录数量？", "Predict: among filter, map, and rollup, which ones change the number of records?"), Common.L("依次执行三个步骤，核对输入表、操作和输出表；切换条件重新比较。", "Run the three steps in order and check the input table, the operation, and the output table; change conditions to compare again."), Common.L("观察派生字段高亮及聚合计数，用撤销回看变化发生在哪一步。", "Watch the highlighted derived field and the aggregated counts; use Undo to see which step caused each change.")],
      question: () => ({text: Common.L("当前处于第 ", "You are at step ") + stage + Common.L(" 步。如果只执行 map 增加 ageGroup 字段，记录数会怎样？", ". If you only run map to add the ageGroup field, what happens to the record count?"), options: [Common.L("保持不变", "It stays the same"), Common.L("变为年龄段的数量", "It becomes the number of age groups")], correct: 0, explain: Common.L("map 对每条输入生成一条输出；按年龄段折叠为组发生在 rollup 阶段。", "map produces one output record per input; folding rows into age groups happens at the rollup stage.")})
    });
  }

  window.Demos.register("data-transform", render, { selfResize: true });
})();

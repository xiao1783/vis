/* ============================================================
 * pipeline.js — 可视化流程联动实验（重点）
 * 五个流程节点可点击；切换聚合维度，汇总与树图同步变化
 * ============================================================ */
(function () {
  const RAW = [
    { name: "张明", major: "软件工程", cls: "软件工程1班" },
    { name: "李华", major: "软件工程", cls: "软件工程1班" },
    { name: "王芳", major: "软件工程", cls: "软件工程1班" },
    { name: "赵强", major: "软件工程", cls: "软件工程2班" },
    { name: "周磊", major: "软件工程", cls: "软件工程2班" },
    { name: "吴婷", major: "软件工程", cls: "软件工程2班" },
    { name: "何军", major: "软件工程", cls: "软件工程1班" },
    { name: "陈静", major: "数据科学", cls: "数据科学1班" },
    { name: "刘洋", major: "数据科学", cls: "数据科学1班" },
    { name: "孙敏", major: "数据科学", cls: "数据科学1班" },
    { name: "郑昊", major: "数据科学", cls: "数据科学2班" },
    { name: "冯雪", major: "数据科学", cls: "数据科学2班" },
  ];

  const NODES = [
    { id: "raw", name: Common.L("① 原始数据", "① Raw data"), color: "#64748b",
      op: Common.L("d3.csv 加载、解析", "d3.csv load & parse"),
      detail: Common.L("输入：磁盘上的 CSV 文本。<br>操作：加载、解析为对象数组。<br>输出：<b>12 条学生记录</b>（name、major、class）。", "Input: CSV text on disk.<br>Operation: load and parse into an array of objects.<br>Output: <b>12 student records</b> (name, major, class).") },
    { id: "transform", name: Common.L("② 数据变换", "② Transform"), color: "#0891b2",
      op: Common.L("rollup 分组聚合（维度可变）", "rollup grouping (dimension selectable)"),
      detail: Common.L("按所选维度 rollup 计数，得到嵌套/分组结构。<br>改变聚合维度，输出与后续图形都会变。", "rollup counts by the chosen dimension, giving a nested/grouped structure.<br>Changing the dimension changes the output and every downstream view.") },
    { id: "map", name: Common.L("③ 视觉映射", "③ Visual mapping"), color: "#2563eb",
      op: Common.L("hierarchy + tree，确定位置/颜色", "hierarchy + tree: compute positions/colors"),
      detail: Common.L("把层级数据交给 d3.hierarchy 计算关系、d3.tree 计算坐标；节点用颜色区分类别。", "Feed the hierarchy into d3.hierarchy for structure and d3.tree for coordinates; node colors tell categories apart.") },
    { id: "render", name: Common.L("④ 渲染", "④ Render"), color: "#8b5cf6",
      op: Common.L("Data Join 生成 SVG", "Data Join builds the SVG"),
      detail: Common.L("用 enter/update/exit 把节点和连线画成屏幕上的树。", "Use enter/update/exit to draw the nodes and links as an on-screen tree.") },
    { id: "interact", name: Common.L("⑤ 交互", "⑤ Interact"), color: "#f59e0b",
      op: Common.L("点击节点 → 视图更新", "click a node → view updates"),
      detail: Common.L("点击树节点可折叠/展开（视图变换）。<br>交互改变的是<b>展示状态</b>，底层数据不变。", "Click a tree node to collapse/expand it (a view transform).<br>Interaction only changes the <b>display state</b>; the underlying data stays the same.") },
  ];

  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>' + Common.L("聚合维度：", "Group by:") + '</label>' +
      '<button class="demo-btn" data-dim="major">' + Common.L("按专业", "By major") + '</button>' +
      '<button class="demo-btn secondary" data-dim="cls">' + Common.L("按班级", "By class") + '</button></div>' +
      '<div class="lab-svg-wrap" id="pl-flow"></div>' +
      '<div class="demo-detail" id="pl-detail" style="margin-bottom:12px"></div>' +
      '<div class="lab-svg-wrap" id="pl-tree"></div>' +
      '<div class="note tip" style="margin-top:10px"><span class="ni">' + Common.icon("bulb", 15) + '</span><p id="pl-note"></p></div>';

    let dim = "major";
    let selected = 0;
    let collapsed = false;
    // 仅用于显示的分组键映射（数据值本身不变）
    const keyText = (v) => v === "软件工程" ? Common.L("软件工程", "Software Eng.") : v === "数据科学" ? Common.L("数据科学", "Data Science") : v === "软件工程1班" ? Common.L("软件工程1班", "SW Eng. Class 1") : v === "软件工程2班" ? Common.L("软件工程2班", "SW Eng. Class 2") : v === "数据科学1班" ? Common.L("数据科学1班", "DS Class 1") : v === "数据科学2班" ? Common.L("数据科学2班", "DS Class 2") : v;

    function drawFlow() {
      const host = container.querySelector("#pl-flow");
      const W = Math.max(320, host.clientWidth || 400), H = 96;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H)
        .attr("viewBox", "0 0 " + W + " " + H);
      const n = NODES.length;
      const pad = 16, gap = 10;
      const bw = (W - pad * 2 - gap * (n - 1)) / n;
      const g = svg.append("g");
      g.selectAll("line").data(NODES.slice(0, -1)).join("line")
        .attr("x1", (d, i) => pad + i * (bw + gap) + bw)
        .attr("x2", (d, i) => pad + (i + 1) * (bw + gap))
        .attr("y1", 44).attr("y2", 44)
        .attr("stroke", "#cbd5e1").attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");
      svg.append("defs").append("marker").attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("markerWidth", 6)
        .attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#94a3b8");

      const node = g.selectAll("g.flow-node").data(NODES).join("g")
        .attr("class", "flow-node").style("cursor", "pointer")
        .attr("transform", (d, i) => "translate(" + (pad + i * (bw + gap)) + ",20)")
        .on("click", (e, d) => { selected = NODES.indexOf(d); update(); });
      node.append("rect").attr("width", bw).attr("height", 48).attr("rx", 8)
        .attr("fill", (d) => d.color + "18").attr("stroke", (d) => d.color).attr("stroke-width", 1.5);
      node.append("text").attr("x", bw / 2).attr("y", 29).attr("text-anchor", "middle")
        .attr("font-size", 10.5).attr("fill", "#1e293b").text((d) => d.name.slice(2));
    }

    function buildHierarchy() {
      const nested = d3.rollup(RAW, (v) => v.length, (d) => d[dim]);
      const root = { name: Common.L("全部新生", "All students"), children: [] };
      nested.forEach((count, key) => {
        root.children.push({ name: keyText(key) + Common.L("（", " (") + count + Common.L("）", ")"), count });
      });
      return root;
    }

    function drawTree() {
      const host = container.querySelector("#pl-tree");
      const W = Math.max(320, host.clientWidth || 400), H = 230;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H)
        .attr("viewBox", "0 0 " + W + " " + H);
      const data = buildHierarchy();
      const root = d3.hierarchy(data);
      if (collapsed) root.children = null;
      const nLeaves = root.leaves().length;
      const layout = d3.tree().size([180, Math.max(80, W - 210)]);
      layout(root);
      const g = svg.append("g").attr("transform", "translate(60,18)");

      g.selectAll("path.link").data(root.links()).join("path")
        .attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 1.6)
        .attr("d", d3.linkHorizontal().x((d) => d.y).y((d) => d.x));

      const node = g.selectAll("g.node").data(root.descendants()).join("g")
        .attr("transform", (d) => "translate(" + d.y + "," + d.x + ")")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (d.depth === 0) { collapsed = !collapsed; drawTree(); }
          else {
            node.selectAll("circle").attr("r", 6);
            d3.select(event.currentTarget).select("circle").attr("r", 9);
          }
          container.querySelector("#pl-note").textContent = d.depth === 0 ?
            (collapsed ? Common.L("已收起全部分组。再点根节点展开；12 条原始记录保持不变。", "All groups are collapsed. Click the root again to expand; the 12 raw records are untouched.") : Common.L("已展开全部分组，底层数据保持不变。", "All groups are expanded; the underlying data stays the same.")) :
            Common.L("选中 ", "Selected ") + d.data.name + Common.L("。这是分组计数结果；切换上方维度可重新组织同一批记录。", ". This is a grouped count; switch the dimension above to reorganize the same records.");
        });
      node.append("circle").attr("r", 6)
        .attr("fill", (d) => d.depth === 0 ? "#0891b2" : "#2563eb");
      node.append("text").attr("dx", (d) => (d.children ? -10 : 10))
        .attr("dy", 4).attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .attr("font-size", 13).attr("fill", "#1e293b").text((d) => d.data.name);
    }

    function update() {
      drawFlow();
      // 高亮当前节点
      const host = container.querySelector("#pl-flow");
      d3.select(host).selectAll(".flow-node rect").classed("selected", false);
      const nodes = d3.select(host).selectAll(".flow-node");
      nodes.each(function (d, i) {
        if (i === selected) {
          d3.select(this).select("rect").attr("stroke-width", 3.5);
        }
      });
      const node = NODES[selected];
      let detail = node.detail;
      if (node.id === "transform") {
        const groups = Array.from(d3.rollup(RAW, (v) => v.length, (d) => d[dim]).entries());
        detail = Common.L("输入：12 条记录。<br>操作：<code>", "Input: 12 records.<br>Operation: <code>") + node.op + Common.L("</code>（当前：<b>", "</code> (currently: <b>") + (dim === "major" ? Common.L("专业", "majors") : Common.L("班级", "classes")) + Common.L("</b>）。<br>输出：", "</b>).<br>Output: ") +
          groups.map(([k, v]) => keyText(k) + "=" + v + Common.L("人", " students")).join(Common.L("，", ", ")) + Common.L("。", ".");
      }
      if (node.id === "map") {
        detail += Common.L("<br>当前聚合产生 <b>", "<br>The current aggregation produces <b>") + buildHierarchy().children.length + Common.L("</b> 个分组，树的一级分支数随之变化。", "</b> groups; the first level of the tree changes accordingly.");
      }
      container.querySelector("#pl-detail").innerHTML =
        "<h4>" + node.name + "　<span class='muted' style='font-size:12.5px;font-weight:400'>" + node.op + "</span></h4>" +
        "<div style='font-size:13.5px;line-height:1.8'>" + detail + "</div>";
      drawTree();
      container.querySelector("#pl-note").innerHTML =
        Common.L("切换聚合维度会同时改变 <b>② 变换</b> 的分组结果、<b>③ 映射</b> 的树结构与 <b>④ 渲染</b> 的图形——流程各环节是串联的；点击树节点折叠属于 <b>⑤ 交互</b>，不改变底层数据。", "Switching the dimension changes the grouping in <b>② Transform</b>, the tree in <b>③ Mapping</b>, and the graphic in <b>④ Render</b> — the pipeline stages are chained; collapsing tree nodes belongs to <b>⑤ Interact</b> and never changes the underlying data.");
    }

    container.querySelectorAll(".demo-btn").forEach((b) => {
      b.addEventListener("click", () => {
        dim = b.dataset.dim;
        collapsed = false;
        container.querySelectorAll(".demo-btn").forEach((x) => {
          x.classList.toggle("secondary", x !== b);
        });
        update();
      });
    });

    Demos.onResize(container, debounce(update));
    function debounce(fn) { let t; return function () { clearTimeout(t); t = setTimeout(fn, 200); }; }

    update();
    LabWorkbench.connect(container, "pipeline", {
      get: () => ({dim, selected, collapsed}),
      valid: s => ["major","cls"].includes(s.dim) && Number.isInteger(s.selected) && s.selected >= 0 && s.selected < 5 && typeof s.collapsed === "boolean",
      set: s => { dim = s.dim; selected = s.selected; collapsed = s.collapsed; container.querySelectorAll("[data-dim]").forEach(b => b.classList.toggle("secondary", b.dataset.dim !== dim)); update(); },
      steps: [Common.L("预测：从按专业切换为按班级，会影响哪些流程环节？", "Predict: switching from majors to classes affects which pipeline stages?"), Common.L("切换聚合维度并点击五个流程节点；点击树根折叠和展开。", "Switch the dimension and click the five pipeline nodes; click the tree root to collapse and expand it."), Common.L("对照分组结果与树结构：改变维度会改变聚合，折叠只改变展示。", "Compare the grouped result with the tree: changing the dimension changes the aggregation; collapsing only changes the display.")],
      question: () => ({text: Common.L("当前按", "Currently grouping by ") + (dim === "major" ? Common.L("专业", "majors") : Common.L("班级", "classes")) + Common.L("分组，树", "; the tree is ") + (collapsed ? Common.L("已收起", "collapsed") : Common.L("已展开", "expanded")) + Common.L("。折叠树会减少原始学生记录吗？", ". Does collapsing the tree reduce the original student records?"), options: [Common.L("会，隐藏项被删除", "Yes — hidden items are deleted"), Common.L("不会，只改变展示状态", "No — only the display state changes")], correct: 1, explain: Common.L("原始数据始终为 12 条；折叠只隐藏分组的可视元素。", "There are always 12 raw records; collapsing only hides the visual elements of groups.")})
    });
  }

  window.Demos.register("pipeline", render, { selfResize: true });
})();

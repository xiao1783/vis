/* ============================================================
 * demos-ch2.js — 第二章：rollup / tree / treelist
 * ============================================================ */

/* ---------- 2.2 多层聚合 ---------- */
(function () {
  const DATA = [
    { major: "软件工程", cls: "软件工程1班", gender: "男" },
    { major: "软件工程", cls: "软件工程1班", gender: "女" },
    { major: "软件工程", cls: "软件工程1班", gender: "女" },
    { major: "软件工程", cls: "软件工程2班", gender: "男" },
    { major: "软件工程", cls: "软件工程2班", gender: "男" },
    { major: "软件工程", cls: "软件工程2班", gender: "女" },
    { major: "数据科学", cls: "数据科学1班", gender: "男" },
    { major: "数据科学", cls: "数据科学1班", gender: "女" },
    { major: "数据科学", cls: "数据科学1班", gender: "女" },
    { major: "数据科学", cls: "数据科学2班", gender: "男" },
    { major: "数据科学", cls: "数据科学2班", gender: "女" },
    { major: "数据科学", cls: "数据科学2班", gender: "女" },
  ];
  const DIMS = [
    { key: "major", label: "按专业（1 层）" },
    { key: "cls", label: "按班级（1 层）" },
    { key: "major,cls", label: "专业 → 班级（2 层）" },
    { key: "gender,major", label: "性别 → 专业（2 层）" },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls">' + DIMS.map((d, i) =>
        '<button class="demo-btn ' + (i === 0 ? "" : "secondary") + '" data-d="' + d.key + '">' + d.label + "</button>").join("") +
      "</div>" +
      '<div class="demo-detail" id="rl-detail"></div>' +
      '<div class="lab-svg-wrap" id="rl-tree"></div>' +
      '<div class="console" id="rl-console" style="max-height:180px"></div>';
    function agg(key) {
      const keys = key.split(",");
      if (keys.length === 1) {
        return { map: d3.rollup(DATA, (v) => v.length, (d) => d[keys[0]]), depth: 1 };
      }
      return { map: d3.rollup(DATA, (v) => v.length, (d) => d[keys[0]], (d) => d[keys[1]]), depth: 2 };
    }
    function toHierarchy(map, rootName) {
      const root = { name: rootName, children: [] };
      map.forEach((v, k) => {
        if (v instanceof Map) {
          root.children.push(toHierarchy(v, k));
        } else {
          root.children.push({ name: k + "（" + v + "）", count: v });
        }
      });
      return root;
    }
    let currentKey = "major";
    function draw(key) {
      currentKey = key;
      const { map, depth } = agg(key);
      const data = toHierarchy(map, "全部新生（12）");
      const host = container.querySelector("#rl-tree");
      const W = Math.max(320, host.clientWidth || 400), H = depth === 2 ? 300 : 190;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      const root = d3.hierarchy(data);
      const layout = d3.tree().size([H - 45, Math.max(80, W - 210)]);
      layout(root);
      const g = svg.append("g").attr("transform", "translate(70,16)");
      g.selectAll("path").data(root.links()).join("path")
        .attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 1.6)
        .attr("d", d3.linkHorizontal().x((d) => d.y).y((d) => d.x));
      const ng = g.selectAll("g").data(root.descendants()).join("g")
        .attr("transform", (d) => "translate(" + d.y + "," + d.x + ")")
        .on("click", (event, d) => {
          ng.selectAll("circle").attr("r", 5);
          d3.select(event.currentTarget).select("circle").attr("r", 8);
          container.querySelector("#rl-detail").textContent = "选中路径：" + d.ancestors().reverse().map(n => n.data.name).join(" → ") +
            "。包含 " + d.leaves().reduce((sum, n) => sum + (n.data.count || 0), 0) + " 条记录。";
        });
      ng.append("circle").attr("r", 5).attr("fill", (d) => d.children ? "#0891b2" : "#0891b2");
      ng.append("text").attr("dx", (d) => d.depth === 0 ? 0 : d.children ? -8 : 8).attr("dy", d => d.depth === 0 ? -12 : 4)
        .attr("text-anchor", (d) => d.depth === 0 ? "middle" : d.children ? "end" : "start").attr("font-size", 12)
        .text((d) => d.data.name);
      // 控制台
      const lines = [];
      function walk(m, indent) {
        m.forEach((v, k) => {
          if (v instanceof Map) { lines.push("  ".repeat(indent) + k + ":"); walk(v, indent + 1); }
          else lines.push("  ".repeat(indent) + k + " → " + v + " 人");
        });
      }
      walk(map, 0);
      container.querySelector("#rl-console").textContent = "d3.rollup 嵌套 Map：\n" + lines.join("\n");
      container.querySelector("#rl-detail").innerHTML =
        "当前为 <b>" + (depth === 1 ? "1 层" : "2 层") + "聚合</b>：每增加一个 key 函数，Map 就多一层嵌套，叶子是 reducer（计数）结果。";
    }
    container.querySelectorAll("[data-d]").forEach((b) => {
      b.addEventListener("click", () => {
        container.querySelectorAll("[data-d]").forEach((x) => x.classList.toggle("secondary", x !== b));
        draw(b.dataset.d);
      });
    });
    draw("major");
    Demos.onResize(container, () => draw(currentKey));
  }
  window.Demos.register("rollup", render);
})();

/* ---------- 2.3 树布局 ---------- */
(function () {
  function makeData() {
    return {
      name: "新生",
      children: [
        { name: "软件工程", children: [
          { name: "软件工程1班" }, { name: "软件工程2班" },
        ] },
        { name: "数据科学", children: [
          { name: "数据科学1班" }, { name: "数据科学2班" },
        ] },
      ],
    };
  }
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>方向：</label>' +
      '<button class="demo-btn" data-dir="h">横向</button>' +
      '<button class="demo-btn secondary" data-dir="v">纵向</button>' +
      '<label style="margin-left:8px"><input type="checkbox" id="tr-collapse"> 收起“软件工程”</label></div>' +
      '<div class="lab-svg-wrap" id="tr-svg"></div>' +
      '<div class="demo-detail">d3.hierarchy 负责父子关系，d3.tree 负责坐标；折叠后布局自动重算。</div>';
    const collapsedNames = new Set();
    function draw() {
      const data = makeData();
      const collapse = container.querySelector("#tr-collapse").checked;
      const host = container.querySelector("#tr-svg");
      const W = Math.max(320, host.clientWidth || 400), H = 260;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      const root = d3.hierarchy(data);
      root.descendants().forEach(node => {
        if (collapsedNames.has(node.data.name) || (collapse && node.data.name === "软件工程")) node.children = null;
      });
      const horizontal = container.querySelector('[data-dir="h"]').classList.contains("demo-btn") &&
        !container.querySelector('[data-dir="h"]').classList.contains("secondary");
      const layout = d3.tree().size(horizontal ? [H - 40, Math.max(80, W - 190)] : [W - 70, H - 120]);
      layout(root);
      const g = svg.append("g").attr("transform", horizontal ? "translate(60,20)" : "translate(20,40)");
      if (horizontal) {
        g.selectAll("path").data(root.links()).join("path").attr("fill", "none")
          .attr("stroke", "#cbd5e1").attr("stroke-width", 1.6)
          .attr("d", d3.linkHorizontal().x((d) => d.y).y((d) => d.x));
        g.selectAll("g").data(root.descendants()).join("g")
          .attr("transform", (d) => "translate(" + d.y + "," + d.x + ")")
          .call((s) => {
            s.append("circle").attr("r", 5).attr("fill", "#2563eb");
            s.append("text").attr("dx", (d) => d.children ? -8 : 8).attr("dy", 4)
              .attr("text-anchor", (d) => d.children ? "end" : "start").attr("font-size", 12).text((d) => d.data.name);
          });
      } else {
        g.selectAll("path").data(root.links()).join("path").attr("fill", "none")
          .attr("stroke", "#cbd5e1").attr("stroke-width", 1.6)
          .attr("d", d3.linkVertical().x((d) => d.x).y((d) => d.y));
        g.selectAll("g").data(root.descendants()).join("g")
          .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
          .call((s) => {
            s.append("circle").attr("r", 5).attr("fill", "#2563eb");
            s.append("text").attr("dy", -9).attr("text-anchor", "middle").attr("font-size", 12).text((d) => d.data.name);
          });
      }
      g.selectAll("g").filter(d => d && d.data).on("click", (event, d) => {
        const name = d.data.name;
        if (d.data.children) {
          if (collapsedNames.has(name)) collapsedNames.delete(name); else collapsedNames.add(name);
          if (name === "软件工程") container.querySelector("#tr-collapse").checked = collapsedNames.has(name);
          draw();
        }
        container.querySelector(".demo-detail").textContent = "节点路径：" + d.ancestors().reverse().map(n => n.data.name).join(" → ") +
          (d.data.children ? "。点击分支可折叠或展开。" : "。这是叶节点。");
      });
    }
    container.querySelectorAll("[data-dir]").forEach((b) => {
      b.addEventListener("click", () => {
        container.querySelectorAll("[data-dir]").forEach((x) => x.classList.toggle("secondary", x !== b));
        draw();
      });
    });
    container.querySelector("#tr-collapse").addEventListener("change", event => {
      if (event.target.checked) collapsedNames.add("软件工程"); else collapsedNames.delete("软件工程");
      draw();
    });
    draw();
    Demos.onResize(container, draw);
  }
  window.Demos.register("tree", render);
})();

/* ---------- 2.4 可折叠树形列表（事件委托） ---------- */
(function () {
  function makeData() {
    return {
      name: "新生", children: [
        { name: "软件工程", children: [{ name: "软件工程1班（3 人）" }, { name: "软件工程2班（3 人）" }] },
        { name: "数据科学", children: [{ name: "数据科学1班（3 人）" }, { name: "数据科学2班（3 人）" }] },
      ],
    };
  }
  function render(container) {
    container.innerHTML =
      '<div class="demo-detail">整棵树只在最外层绑定一次 click（事件委托）。点三角折叠/展开，点名称选中。</div>' +
      '<div class="lab-controls"><button class="demo-btn secondary" id="tl-expand">全部展开</button><button class="demo-btn secondary" id="tl-collapse">全部收起</button></div>' +
      '<div class="tree-list" id="tl-tree"></div><div class="lab-chart-readout" id="tl-path">选择节点，追踪它在层级中的路径。</div>' +
      '<div class="lab-controls"><label for="tl-dur">动画时长：</label><input type="range" id="tl-dur" min="0" max="800" step="50" value="200"><span class="readout" id="tl-durv">200ms</span></div>';
    let root = d3.hierarchy(makeData());
    let selected = null;
    root.descendants().forEach((n) => { n._collapsed = false; });
    function visibleNodes() {
      const out = [];
      function walk(n) {
        out.push(n);
        if (!n._collapsed && n.children) n.children.forEach(walk);
      }
      walk(root);
      return out;
    }
    function build(parent, nodes) {
      const ul = parent.append("ul");
      nodes.forEach((n) => {
        const li = ul.append("li").classed("selected", n === selected);
        const label = li.append("span").datum(n).attr("class", "label")
          .attr("aria-pressed", String(n === selected));
        if (n.children && n.children.length) {
          label.attr("aria-expanded", String(!n._collapsed));
          label.append("span").attr("class", "toggle").style("display", "inline-grid")
            .attr("role", "button").attr("aria-label", (n._collapsed ? "展开 " : "收起 ") + n.data.name)
            .text(n._collapsed ? "▶" : "▼");
        } else {
          label.append("span").attr("class", "toggle").text("");
        }
        label.append("span").text(n.data.name);
        if (n.children && n.children.length) {
          const leafCount = n.leaves ? n.leaves().length : 0;
          if (!n._collapsed) build(li, n.children);
        }
      });
    }
    function renderList() {
      const host = d3.select(container.querySelector("#tl-tree"));
      host.node().getAnimations().forEach(animation => animation.cancel());
      host.selectAll("*").remove();
      build(host, [root]);
      const duration = Store.getReduceMotion() ? 0 : +container.querySelector("#tl-dur").value;
      if (duration) host.node().animate([{opacity: .4, transform: "translateY(-3px)"}, {opacity: 1, transform: "translateY(0)"}], {duration});
    }
    container.querySelector("#tl-tree").addEventListener("click", event => {
      const label = event.target.closest(".label");
      if (!label) return;
      const node = d3.select(label).datum();
      if (event.target.closest(".toggle") && node.children?.length) {
        node._collapsed = !node._collapsed; renderList();
        return;
      }
      selected = node;
      container.querySelectorAll(".tree-list li").forEach(item => item.classList.remove("selected"));
      container.querySelectorAll(".tree-list .label").forEach(item => item.setAttribute("aria-pressed", "false"));
      label.closest("li").classList.add("selected"); label.setAttribute("aria-pressed", "true");
      container.querySelector("#tl-path").textContent = node.ancestors().reverse().map(item => item.data.name).join(" → ");
    });
    container.querySelector("#tl-expand").addEventListener("click", () => { root.descendants().forEach(n => n._collapsed = false); renderList(); });
    container.querySelector("#tl-collapse").addEventListener("click", () => { root.descendants().forEach(n => n._collapsed = true); renderList(); });
    renderList();
    container.querySelector("#tl-dur").addEventListener("input", function () {
      container.querySelector("#tl-durv").textContent = this.value + "ms";
    });
  }
  window.Demos.register("treelist", render);
})();

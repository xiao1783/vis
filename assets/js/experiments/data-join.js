/* ============================================================
 * data-join.js — Data Join 三态实验（重点）
 * 旧/新数组按 key(id) 匹配，enter/update/exit 同时用颜色与文字标注
 * ============================================================ */
(function () {
  const ENTER = "#10b981", UPDATE = "#2563eb", EXIT = "#ef4444";

  function render(container, ctx) {
    container.classList.add("join-lab");
    const base = [
      { id: "A", value: 28 },
      { id: "B", value: 36 },
      { id: "C", value: 24 },
    ];
    let prev = null;
    let curr = base.map((d) => ({ ...d }));
    let selectedId = "A", phase = 4, playTimer;

    container.innerHTML =
      '<div class="join-intro"><span>KEYED DATA JOIN</span><h4>' + Common.L("身份相同，就能找到彼此。", "Same identity, so they find each other.") + '</h4><p>' + Common.L("改变数据，观察图形如何进入、更新与退出。先试试“替换身份”。", "Change the data and watch marks enter, update, and exit. Try “Replace identity” first.") + '</p></div>' +
      '<div class="join-workspace"><aside class="join-controls"><div class="join-section-heading"><span>01</span><h5>' + Common.L("改变数据", "Change the data") + '</h5></div><div class="lab-controls join-arrows">' +
      '<button class="demo-btn" data-act="replace">' + Common.L("⇄ 替换身份 A → D", "⇄ Replace identity A → D") + '</button>' +
      '<button class="demo-btn" data-act="add">' + Common.L("＋ 新增一项", "＋ Add an item") + '</button>' +
      '<button class="demo-btn danger" data-act="remove">' + Common.L("－ 删除末项", "－ Remove the last item") + '</button>' +
      '<button class="demo-btn secondary" data-act="modify">' + Common.icon("edit", 12) + Common.L(" B 改为 44", " Set B to 44") + '</button>' +
      '<button class="demo-btn secondary" data-act="reorder">' + Common.L("↔ 调整顺序", "↔ Reorder") + '</button>' +
      "</div>" +
      '<details class="join-fine-controls"><summary>' + Common.L("数值调整与分步播放", "Fine-tune values & step playback") + ' <span>' + Common.L("展开精确操作", "open the precise controls") + '</span></summary><div class="join-editor"><div class="join-section-caption">' + Common.L("精确调整", "Precise adjustments") + '</div><div class="experiment-options"><label>' + Common.L("编辑对象", "Edit item") + ' <select id="j-edit-id"></select></label><label>' + Common.L("数值", "Value") + ' <input id="j-edit-value" type="range" min="15" max="45" step="1"><output id="j-edit-readout"></output></label></div><p id="j-selection" role="status"></p></div>' +
      '<div class="join-playback lab-controls"><div class="join-section-caption">' + Common.L("逐步看清匹配过程", "Watch the matching step by step") + '</div><div class="join-playback-buttons"><button type="button" id="j-play">' + Common.L("播放全过程", "Play all") + '</button><button type="button" id="j-pause">' + Common.L("暂停", "Pause") + '</button><button type="button" id="j-step">' + Common.L("单步", "Step") + '</button></div><ol class="join-phases" aria-label="' + Common.L("匹配过程", "Matching process") + '">' + [Common.L("匹配","Match"), Common.L("退出","Exit"), Common.L("更新","Update"), Common.L("进入","Enter"), Common.L("完成","Done")].map((name,i) => '<li data-phase="' + i + '"><b>' + (i+1) + '</b>' + name + '</li>').join('') + '</ol><span id="j-phase" role="status"></span></div></details></aside>' +
      '<section class="join-canvas" aria-label="' + Common.L("数据与图形对照", "Data vs. marks") + '"><div class="join-section-heading"><span>02</span><h5>' + Common.L("观察匹配", "Watch the matching") + '</h5><small>' + Common.L("点击数据项或圆点选择", "Click a data item or a dot to select") + '</small></div>' +
      '<div class="experiment-feedback" id="j-counts" role="status"></div>' +
      '<div class="join-legend">' +
      '<span><i style="border-color:' + ENTER + ';background:' + ENTER + '22"></i>' + Common.L("enter 进入（新建）", "enter · newly created") + '</span>' +
      '<span><i style="border-color:' + UPDATE + ';background:' + UPDATE + '22"></i>' + Common.L("update 更新（身份仍在）", "update · identity kept") + '</span>' +
      '<span><i style="border-color:' + EXIT + ';background:' + EXIT + '22"></i>' + Common.L("exit 退出（移除）", "exit · removed") + '</span>' +
      "</div>" +
      '<div class="join-stage"><div class="join-array-label">' + Common.L("上一步数据（旧）", "Previous data (old)") + '</div><div class="join-array" id="j-prev"></div></div>' +
      '<div class="join-stage"><div class="join-array-label">' + Common.L("当前数据（新）", "Current data (new)") + '</div><div class="join-array" id="j-curr"></div></div>' +
      '<div class="lab-svg-wrap" id="j-svg"></div>' +
      '<div class="demo-detail" id="j-detail"></div></section></div>' +
      '<details class="join-code-details"><summary>' + Common.icon("code", 13) + Common.L(" 查看对应代码 ", " View the code ") + '<span>' + Common.L("选中数据后高亮处理分支", "highlights the branch for the selected data") + '</span></summary><div class="code-block"><div class="cb-head"><span>' + Common.icon("code", 13) + Common.L(" 对应代码", " Corresponding code") + '</span>' +
      '<button class="cb-copy">' + Common.L("复制代码", "Copy code") + '</button></div>' +
      '<pre><code class="language-javascript" id="j-code"></code></pre></div></details>';

    const codeText =
      "svg.selectAll(\"circle\")\n" +
      "  .data(curr, d => d.id)          " + Common.L("// key 函数：按身份匹配\n", "// key function: match by identity\n") +
      "  .join(\n" +
      "    enter  => enter.append(\"circle\").attr(\"fill\", \"#10b981\"),\n" +
      "    update => update.attr(\"fill\", \"#2563eb\"),\n" +
      "    exit   => exit.attr(\"fill\", \"#ef4444\").remove()\n" +
      "  )\n" +
      "  .attr(\"cx\", d => x(d.id))\n" +
      "  .attr(\"r\",  d => r(d.value));";
    container.querySelector("#j-code").innerHTML = Prism.highlight(codeText, Prism.languages.javascript, "javascript");
    container.querySelector(".cb-copy").addEventListener("click", function () {
      Common.copyText(codeText, this);
    });

    function states(oldArr, newArr) {
      const oldMap = new Map((oldArr || []).map((d) => [d.id, d]));
      const newMap = new Map(newArr.map((d) => [d.id, d]));
      const enter = [], update = [], exit = [], changed = [];
      newArr.forEach((d) => {
        if (!oldMap.has(d.id)) enter.push(d.id);
        else {
          update.push(d.id);
          if (oldMap.get(d.id).value !== d.value) changed.push(d.id);
        }
      });
      (oldArr || []).forEach((d) => { if (!newMap.has(d.id)) exit.push(d.id); });
      return { enter, update, exit, changed };
    }

    function chipHtml(arr, st) {
      if (!arr || !arr.length) return '<span class="join-empty">' + (arr ? Common.L("数组为空，没有数据项", "The array is empty; no items") : Common.L("首次绑定，尚无上一步数据", "First bind; no previous data yet")) + '</span>';
      return arr.map((d) => {
        let cls = "update", label = "update";
        if (st.enter.includes(d.id)) { cls = "enter"; label = "enter"; }
        else if (st.exit.includes(d.id)) { cls = "exit"; label = "exit"; }
        else if (st.changed.includes(d.id)) { cls = "update"; label = Common.L("改值", "changed"); }
        return '<button type="button" data-join-id="' + d.id + '" class="join-chip ' + cls + (d.id === selectedId ? ' join-selected' : '') + '" aria-pressed="' + (d.id === selectedId) + '">' + d.id + ' · ' + d.value +
          '<span class="jc-state">' + label + "</span></button>";
      }).join("");
    }

    const diagram = d3.select(container.querySelector("#j-svg")).append("svg").attr("width", "100%").attr("height", 190);
    const circleLayer = diagram.append("g").attr("transform", "translate(0,20)");
    function drawCircles() {
      const host = container.querySelector("#j-svg");
      const ids = Array.from(new Set([...(prev || []).map((d) => d.id), ...curr.map((d) => d.id)]));
      const minWidth = Math.max(260, ids.length * 64 + 40);
      const W = Math.max(minWidth, host.clientWidth || 360), H = 190;
      diagram.attr("viewBox", "0 0 " + W + " " + H).style("min-width", minWidth + "px");
      const g = circleLayer;
      const duration = Store.getReduceMotion() ? 0 : 350;

      const x = d3.scalePoint().domain(ids).range(ids.length > 1 ? [40, W - 40] : [W / 2, W / 2]);
      const st = states(prev, curr);
      const r = d3.scaleLinear().domain([15, 45]).range([12, 30]);

      g.selectAll("circle.cid,text.cid").interrupt();
      const visible = phase < 2 ? (prev || curr) : phase === 2 ? curr.filter(d => st.update.includes(d.id)) : curr;
      const sel = g.selectAll("circle.cid").data(visible, (d) => d.id);
      sel.enter().append("circle")
        .attr("class", "cid")
        .attr("cx", (d) => x(d.id))
        .attr("cy", 70)
        .attr("r", 0)
        .attr("fill", ENTER)
        .attr("stroke", "#fff").attr("stroke-width", 2)
        .merge(sel)
        .attr("role", "button").attr("tabindex", 0)
        .attr("aria-label", d => Common.L("选择 ", "Select ") + d.id + Common.L("，数值 ", ", value ") + d.value)
        .attr("aria-pressed", d => String(d.id === selectedId))
        .attr("stroke", d => d.id === selectedId ? "#617bc8" : "#fff")
        .attr("stroke-width", d => d.id === selectedId ? 3 : 2)
        .on("click", (event, d) => choose(d.id))
        .attr("opacity", 1)
        .transition().duration(duration)
        .attr("cx", (d) => x(d.id))
        .attr("cy", 70)
        .attr("r", (d) => r(d.value))
        .attr("fill", (d) => (phase === 1 && st.exit.includes(d.id) ? EXIT : st.enter.includes(d.id) ? ENTER : st.changed.includes(d.id) ? "#f59e0b" : UPDATE));

      sel.exit()
        .transition().duration(duration).attr("r", 4).attr("fill", EXIT).attr("opacity", .5)
        .remove();

      // 标签：独立 data join，按 id 正确进入/更新/退出
      const lab = g.selectAll("text.cid").data(visible, (d) => d.id);
      lab.enter().append("text")
        .attr("class", "cid")
        .attr("text-anchor", "middle").attr("y", 75)
        .attr("x", (d) => x(d.id)).attr("fill", "#fff").attr("font-weight", 700).attr("font-size", 14)
        .attr("pointer-events", "none").attr("opacity", 0)
        .merge(lab)
        .transition().duration(duration)
        .attr("x", (d) => x(d.id)).attr("opacity", 1)
        .text((d) => d.id);
      lab.exit().transition().duration(duration).attr("opacity", 0).remove();

      // 旧数据中退出项的标签（始终在下方给出文字说明）
      g.selectAll(".state-tag").data(ids).join("text")
        .attr("class", "state-tag")
        .attr("x", (id) => x(id)).attr("y", 130)
        .attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 700)
        .text((id) => {
          if (st.enter.includes(id)) return "enter";
          if (st.exit.includes(id)) return "exit";
          if (st.changed.includes(id)) return Common.L("update(改值)", "update(changed)");
          if (prev) return "update";
          return "";
        })
        .attr("fill", (id) => {
          if (st.enter.includes(id)) return ENTER;
          if (st.exit.includes(id)) return EXIT;
          if (prev) return UPDATE;
          return "transparent";
        });
    }

    function render() {
      const st = states(prev, curr);
      if (![...curr, ...(prev || [])].some(d => d.id === selectedId)) selectedId = curr[0]?.id || null;
      container.querySelector("#j-prev").innerHTML = chipHtml(prev, st);
      container.querySelector("#j-prev").closest(".join-stage").classList.toggle("is-empty", !prev || !prev.length);
      container.querySelector("#j-curr").innerHTML = chipHtml(curr, st);

      const equalLen = prev && prev.length === curr.length;
      const detail = container.querySelector("#j-detail");
      let parts = [];
      if (!prev) {
        detail.innerHTML = "<b>" + Common.L("初始数据：", "Initial data:") + "</b>" + Common.L("当前有 A、B、C 三个图形。使用操作区的按钮改变数据，观察三态。", " Three marks A, B, C. Use the buttons to change the data and watch the three states.");
      } else {
        if (st.enter.length) parts.push('<b style="color:' + ENTER + '">' + Common.L("enter：", "enter: ") + '</b>' + st.enter.join(Common.L("、", ", ")));
        if (st.update.length) parts.push('<b style="color:' + UPDATE + '">' + Common.L("update：", "update: ") + '</b>' + st.update.join(Common.L("、", ", ")) +
          (st.changed.length ? Common.L("（其中 ", " (") + st.changed.join(Common.L("、", ", ")) + Common.L(" 数值改变）", ": value changed)") : ""));
        if (st.exit.length) parts.push('<b style="color:' + EXIT + '">' + Common.L("exit：", "exit: ") + '</b>' + st.exit.join(Common.L("、", ", ")));
        detail.innerHTML =
          parts.join("　") +
          (equalLen && (st.enter.length || st.exit.length)
            ? '<div class="note warn" style="margin:10px 0 0"><span class="ni">' + Common.icon("warn", 14) + '</span><p>' + Common.L("新旧数组<b>长度都为 ", "Both arrays have <b>length ") + curr.length +
              Common.L("</b>，但因为身份（id）发生替换，仍然同时出现 enter 和 exit —— 三态由身份决定，与数量无关。", "</b>, but identities (ids) were replaced, so enter and exit still appear together — the three states depend on identity, not on count.") + '</p></div>'
            : '<div class="note info" style="margin:10px 0 0"><p>' + Common.L("匹配依据是 key（id），不是数组长度或下标。", "Matching is by key (id), not by array length or index.") + '</p></div>');
      }
      container.querySelector("#j-counts").textContent = "enter " + st.enter.length + " · update " + st.update.length + " · exit " + st.exit.length + (prev ? Common.L("；旧 ", "; old ") + prev.length + Common.L(" 项 → 新 ", " items → new ") + curr.length + Common.L(" 项", " items") : Common.L("；首次绑定，全部为进入项", "; first bind, all items are enter"));
      const edit = container.querySelector("#j-edit-id");
      const chosen = edit.value;
      edit.innerHTML = curr.map(d => '<option value="' + d.id + '">' + d.id + '</option>').join('');
      if (st.exit.includes(selectedId)) edit.innerHTML += '<option value="' + selectedId + '">' + selectedId + Common.L("（已退出）", " (exited)") + '</option>';
      if (!edit.options.length) edit.innerHTML = '<option value="">' + Common.L("暂无数据", "No data yet") + '</option>';
      if (curr.some(d => d.id === chosen)) edit.value = chosen;
      syncEditor();
      syncPlayback();
      container.querySelector("#j-phase").textContent = [Common.L("① 按 key 匹配身份", "① Match identities by key"), Common.L("② 标出 exit，下一步移除", "② Mark exit; remove next"), Common.L("③ 更新保留项的位置与数值", "③ Update position and value of kept items"), Common.L("④ 创建 enter 项", "④ Create the enter items"), Common.L("⑤ 完成：对照新旧数据", "⑤ Done: compare old and new data")][phase];
      const selectedState = st.enter.includes(selectedId) ? "enter" : st.exit.includes(selectedId) ? "exit" : "update";
      container.querySelectorAll("#j-code .join-code-line").forEach(line => line.classList.toggle("join-code-active", line.dataset.state === selectedState));
      const disabled = {add:curr.length >= 12, remove:!curr.length, modify:!curr.some(d=>d.id==='B'&&d.value!==44), replace:!curr.some(d=>d.id==='A'), reorder:curr.length<2};
      const hints = {add:Common.L("最多保留 12 项，新增一个未占用的 ID", "Keep at most 12 items; add an unused ID"), remove:Common.L("删除当前数组的最后一项", "Remove the last item of the current array"), modify:Common.L("把 B 的数值改为 44，保留它的身份", "Change B's value to 44, keeping its identity"), replace:Common.L("移除 A，加入 D，保持数组长度不变", "Remove A and add D, keeping the array length unchanged"), reorder:Common.L("翻转当前数组顺序，所有 ID 保持不变", "Reverse the current array; all IDs stay the same")};
      container.querySelectorAll("[data-act]").forEach(button => { button.disabled = !!disabled[button.dataset.act]; button.title = button.disabled ? ({add:Common.L("已达到 12 项上限", "The 12-item limit is reached"), remove:Common.L("当前没有可删除的数据", "No data to remove right now"), modify:Common.L("B 不存在或数值已经是 44", "B does not exist or its value is already 44"), replace:Common.L("A 已被移除，重新开始后可再次替换", "A was removed; reset to replace again"), reorder:Common.L("至少需要两项才能调整顺序", "Need at least two items to reorder")}[button.dataset.act]) : hints[button.dataset.act]; });
      drawCircles();
    }
    function syncEditor() {
      container.querySelector("#j-edit-id").value = selectedId || "";
      const item = curr.find(d => d.id === container.querySelector("#j-edit-id").value);
      const slider = container.querySelector("#j-edit-value");
      slider.disabled = !item;
      slider.value = item ? item.value : 15;
      container.querySelector("#j-edit-readout").textContent = item ? item.value : "—";
      container.querySelector("#j-selection").textContent = item ? Common.L("已选 ", "Selected ") + item.id + Common.L(" · 拖动数值只改变大小，身份保持不变。", " · dragging the value only changes its size; the identity stays.") : selectedId ? selectedId + Common.L(" 已退出当前数组，仅供对照；选择现有项可编辑。", " has exited the current array (for reference only); select an existing item to edit.") : Common.L("当前数组为空，点击“新增一项”开始。", "The array is empty; click “Add an item” to begin.");
    }
    function choose(id) {
      const focused = document.activeElement;
      const row = focused?.closest("#j-prev") ? "#j-prev" : "#j-curr";
      const keepFocus = focused?.matches("[data-join-id]");
      selectedId = id; render();
      if (keepFocus) container.querySelector(row + ' [data-join-id="' + id + '"]')?.focus({preventScroll:true});
    }
    container.querySelector("#j-edit-id").addEventListener("change", event => choose(event.target.value));
    container.addEventListener("click", event => { const chip = event.target.closest("[data-join-id]"); if (chip) choose(chip.dataset.joinId); });
    const code = container.querySelector("#j-code");
    code.innerHTML = codeText.split("\n").map(line => '<span class="join-code-line" data-state="' + (line.includes("enter ") ? "enter" : line.includes("exit ") ? "exit" : line.includes("update ") ? "update" : "") + '">' + Prism.highlight(line, Prism.languages.javascript, "javascript") + '</span>').join("\n");
    function syncPlayback() {
      container.querySelector("#j-pause").disabled = !playTimer;
      container.querySelector("#j-play").disabled = !!playTimer;
      container.querySelector("#j-play").textContent = playTimer ? Common.L("播放中…", "Playing…") : phase < 4 ? Common.L("继续播放", "Resume") : Common.L("播放全过程", "Play all");
      container.querySelectorAll("[data-phase]").forEach(node => {
        const current = +node.dataset.phase === phase;
        node.classList.toggle("is-current", current);
        node.classList.toggle("is-done", +node.dataset.phase < phase);
        if (current) node.setAttribute("aria-current", "step"); else node.removeAttribute("aria-current");
      });
    }
    function stop() { clearInterval(playTimer); playTimer = null; syncPlayback(); }
    function advance() { phase = phase >= 4 ? 0 : phase + 1; render(); if (phase === 4) stop(); }
    container.querySelector("#j-step").addEventListener("click", () => { stop(); advance(); });
    container.querySelector("#j-pause").addEventListener("click", stop);
    container.querySelector("#j-play").addEventListener("click", () => { stop(); if (phase >= 4) phase = 0; playTimer = setInterval(advance, 1100); render(); });
    container.__dispose = stop;
    container.querySelector("#j-edit-value").addEventListener("input", event => {
      const id = container.querySelector("#j-edit-id").value;
      const value = +event.target.value;
      const item = curr.find(d=>d.id===id);
      if (!item || item.value === value) return;
      prev = curr.map(d=>({...d}));
      stop(); phase = 4;
      curr = curr.map(d=>d.id===id ? {...d,value} : d);
      render();
    });

    container.querySelectorAll(".demo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        stop(); phase = 4;
        prev = curr.map((d) => ({ ...d }));
        let next = curr.map((d) => ({ ...d }));
        if (act === "add") {
          const nextId = "EFGHIJKLMNOPQRSTUVWXYZ".split("").find(id => !next.some(d => d.id === id));
          if (nextId) next.push({ id: nextId, value: 32 });
        } else if (act === "remove") {
          next.pop();
        } else if (act === "modify") {
          const b = next.find((d) => d.id === "B");
          if (b) b.value = 44;
        } else if (act === "replace") {
          // 关键场景 [A,B,C] → [B,C,D]
          next = next.filter((d) => d.id !== "A");
          if (!next.find((d) => d.id === "D")) next.push({ id: "D", value: 30 });
        } else if (act === "reorder") {
          next.reverse();
        }
        curr = next;
        render();
      });
    });

    Demos.onResize(container, debounce(drawCirclesStatic));
    function debounce(fn) { let t; return function () { clearTimeout(t); t = setTimeout(fn, 200); }; }
    function drawCirclesStatic() { if (container.isConnected) drawCircles(); }

    render();
    LabWorkbench.connect(container, "data-join", {
      get: () => ({prev, curr, selectedId}),
      valid: s => Array.isArray(s.curr) && s.curr.length <= 12 && (s.prev === null || Array.isArray(s.prev)) && [s.curr, s.prev || []].every(arr => arr.length <= 12 && new Set(arr.map(d => d.id)).size === arr.length && arr.every(d => /^[A-Z]$/.test(d.id) && Number.isFinite(d.value) && d.value >= 15 && d.value <= 45)),
      set: s => { stop(); phase = 4; prev = s.prev; curr = s.curr; selectedId = s.selectedId; render(); },
      steps: [Common.L("预测：A、B、C 替换为 B、C、D，enter 与 exit 各有几项？", "Predict: replacing A, B, C with B, C, D — how many enter and exit items are there?"), Common.L("点击“替换身份”，再用单步或播放追踪匹配、退出、更新、进入。", "Click “Replace identity”, then use Step or Play to trace matching, exit, update, and enter."), Common.L("点击数据项或圆点，核对对应代码；用撤销与对照解释为什么等长数组仍有进入与退出。", "Click data items or dots to check the corresponding code; use undo and comparison to explain why equal-length arrays still have enter and exit.")],
      question: () => { const st = states(prev, curr); return {text: Common.L("当前新旧数据按 ID 匹配，enter / update / exit 分别是多少？", "Matching old and new data by ID — how many are enter / update / exit?"), options: [st.enter.length + " / " + st.update.length + " / " + st.exit.length, (st.enter.length + 1) + " / " + st.update.length + " / " + st.exit.length], correct: 0, explain: Common.L("身份匹配结果：进入 ", "Identity matching: enter ") + (st.enter.join(Common.L("、", ", ")) || Common.L("无", "none")) + Common.L("；保留 ", "; update ") + (st.update.join(Common.L("、", ", ")) || Common.L("无", "none")) + Common.L("；退出 ", "; exit ") + (st.exit.join(Common.L("、", ", ")) || Common.L("无", "none")) + Common.L("。数量相同并不保证身份相同。", ". Equal counts do not guarantee equal identities.")}; }
    });
    const learning = container.querySelector(".lab-learning");
    learning.querySelector(".lab-learning-content").open = false;
    container.querySelector(".join-fine-controls").before(learning);
    container.querySelector(".join-fine-controls").open = matchMedia("(min-width:900px)").matches;
  }

  window.Demos.register("data-join", render, { selfResize: true });
})();

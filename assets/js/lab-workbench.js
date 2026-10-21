/* Shared experiment workspace: real presets, frozen comparisons and keyboard access. */
(function () {
  const PRESETS = {
    "csv-loader": [[Common.L("查看类型转换", "See type conversion"), "#csv-load"]],
    dikw: [[Common.L("从原始数据开始", "Start from raw data"), ".layer:nth-child(4)"], [Common.L("跳到行动判断", "Jump to wisdom"), ".layer:nth-child(1)"]],
    attribute: [[Common.L("类别为何不能排高低", "Why categories can't be ranked"), ".mini-card:nth-child(1)", {"#attr-bad": true}], [Common.L("比较年龄编码", "Compare age encodings"), ".mini-card:nth-child(2)", {"#attr-bad": false}]],
    "data-transform": [[Common.L("女生数据完整变换", "Full transform (female rows)"), ['[data-step="0"]','[data-step="1"]','[data-step="2"]'], {"#t-gender": "女"}], [Common.L("按年龄组聚合", "Aggregate by age group"), ['[data-step="0"]','[data-step="1"]','[data-step="2"]'], {"#t-group": "ageGroup"}]],
    "data-join": [[Common.L("新增身份", "Add identity"), '[data-act="add"]'], [Common.L("身份替换", "Replace identity"), '[data-act="replace"]'], [Common.L("只改顺序", "Reorder only"), '[data-act="reorder"]']],
    pipeline: [[Common.L("按班级追踪流程", "Trace by class"), '[data-dim="cls"]'], [Common.L("观察视觉映射", "Watch visual mapping"), ".flow-node:nth-of-type(3)"]],
    rollup: [[Common.L("两层聚合", "Two-level rollup"), '[data-d="major,cls"]'], [Common.L("交换分析维度", "Swap dimensions"), '[data-d="gender,major"]']],
    tree: [[Common.L("纵向布局", "Vertical layout"), '[data-dir="v"]'], [Common.L("收起一个分支", "Collapse a branch"), null, {"#tr-collapse": true}]],
    treelist: [[Common.L("收起根节点", "Collapse root"), ".toggle"], [Common.L("慢速观察展开", "Slow-motion expand"), null, {"#tl-dur": 650}]],
    "color-models": [[Common.L("比较红色盲视图", "Compare protanopia view"), null, {"#cm-r": 210, "#cm-g": 75, "#cm-b": 85, "#cm-cvd": "protanopia"}], [Common.L("恢复正常视觉", "Restore normal vision"), null, {"#cm-cvd": ""}]],
    "color-semantics": [[Common.L("切换数据场景", "Switch data scenario"), '.sem-scenario button:nth-child(2)'], [Common.L("先判断再揭晓", "Guess, then reveal"), null, {"#sem-practice": true}]],
    "lab-gamut": [[Common.L("低明度色域", "Low-lightness gamut"), null, {"#lab-l": 20}], [Common.L("高明度色域", "High-lightness gamut"), null, {"#lab-l": 85}]],
    harmony: [[Common.L("互补色对照", "Complementary pair"), '[data-r="complementary"]'], [Common.L("三角色搭配", "Triadic scheme"), '[data-r="triadic"]']],
    palettes: [[Common.L("灰度检查", "Grayscale check"), null, {"#pl-mode": "gray"}], [Common.L("绿色盲模拟", "Deuteranopia sim"), null, {"#pl-mode": "color", "#pl-cvd": "deuteranopia"}]],
    "good-bad": [[Common.L("比较类别配色", "Compare categorical palettes"), ".mini-card:nth-child(1)"], [Common.L("比较偏差配色", "Compare diverging palettes"), ".mini-card:nth-child(3)"]],
    philosophy: [[Common.L("柔和配色", "Softer palette"), null, {"#ph-s": 40, "#ph-l": 65}], [Common.L("灰度下能否区分", "Distinguishable in gray?"), null, {"#ph-gray": true}]],
    cvd: [[Common.L("颜色失效时", "When color fails"), null, {"#cv-cvd": "deuteranopia", "#cv-shape": false}], [Common.L("加上冗余编码", "Add redundant encoding"), null, {"#cv-shape": true}]],
    "wide-long": [[Common.L("展开为长表", "Unpivot to long"), "#wl-go"], [Common.L("还原为宽表", "Back to wide"), "#wl-back"]],
    "scale-curve": [[Common.L("观察小值位置", "Where small values land"), '[data-tab="scale"]', {"#sc-slider": 53}], [Common.L("平滑与真实采样", "Smoothing vs real samples"), '[data-tab="curve"]', {"#cv-fit": true}]],
    slope: [[Common.L("压扁后的趋势", "Flattened trend"), '[data-ratio="0.4"]'], [Common.L("拉高后的趋势", "Stretched trend"), '[data-ratio="2"]']],
    contour: [[Common.L("观察鞍点", "Find the saddle point"), null, {"#ct-th": 50}], [Common.L("只保留高值区", "Keep only high values"), null, {"#ct-th": 75}]],
    "time-attr": [[Common.L("观察周期性", "See periodicity"), ".mini-card:nth-child(3)"], [Common.L("观察时间结构", "See temporal structure"), ".mini-card:nth-child(5)"]],
    "french-names": [[Common.L("聚焦近代趋势", "Focus on recent trends"), null, {"#fn-from": 1980}], [Common.L("完整历史范围", "Full historical range"), null, {"#fn-from": 1900}]],
    "time-views": [[Common.L("定位夏季一天", "Locate a summer day"), null, {"#tv-date": "2024-07-15"}], [Common.L("向后比较一天", "Compare the next day"), "#tv-next"]],
    spiral: [[Common.L("查看月份边界", "Show month boundaries"), null, {"#sp-lines": true}], [Common.L("聚焦盛夏", "Focus on midsummer"), null, {"#sp-month": "6"}]],
    storyline: [[Common.L("跳到 T-REX 事件", "Jump to T-REX event"), null, {"#st-time": 78}], [Common.L("跳到追逐事件", "Jump to chase event"), null, {"#st-time": 95}]]
  };

  function labelOf(node) {
    const d = node.__data__;
    if (d == null) return node.textContent.trim().slice(0, 100) || "图形节点";
    if (typeof d !== "object") return String(d);
    if (d.data && d.data.name) return d.data.name;
    return Object.entries(d).filter(([key, value]) => !["children", "parent"].includes(key) &&
      (value == null || typeof value !== "object" || value instanceof Date)).slice(0, 6)
      .map(([key, value]) => key + ": " + (value instanceof Date ? d3.timeFormat("%Y-%m-%d")(value) : value)).join(" · ") || "图形节点";
  }

  function mount(id, container, ctx, render) {
    container.innerHTML = '<section class="lab-workbench"><div class="lw-toolbar"><span class="lw-status"><i></i> ' + Common.L("实时实验台", "Live lab bench") + '</span>' +
      '<div class="lw-tools"><button type="button" data-tool="capture">' + Common.L("保存对照", "Snapshot") + '</button><button type="button" data-tool="reset">' + Common.L("重新开始", "Restart") + '</button><button type="button" data-tool="focus">' + Common.L("展开实验", "Expand lab") + '</button></div></div>' +
      '<div class="lw-presets"><span>' + Common.L("试试看", "Try this") + '</span></div><div class="lw-live"></div>' +
      '<details class="lw-comparison" hidden><summary>' + Common.L("操作前的对照 · 静态记录", "Before-and-after comparison · static record") + '</summary><div class="lw-snapshot"></div><button type="button" data-tool="clear">' + Common.L("移除对照", "Remove snapshot") + '</button></details>' +
      '<div class="lw-message" role="status" aria-live="polite">' + Common.L("调整参数，观察图形与数值的变化。", "Adjust the parameters and watch the graphics and values change.") + '</div></section>';
    const workspace = container.firstElementChild;
    const presets = workspace.querySelector(".lw-presets");
    const message = workspace.querySelector(".lw-message");
    let stage, observer, enhanceFrame = 0;
    function scheduleEnhance() {
      if (enhanceFrame) return;
      enhanceFrame = requestAnimationFrame(() => { enhanceFrame = 0; enhance(); });
    }
    function describeChange(event) {
      const control = event.target;
      if (!control.matches("input,select,textarea")) return;
      const label = control.labels?.[0]?.cloneNode(true);
      label?.querySelectorAll("input,select,textarea,output,.readout,.lw-range-value").forEach(node => node.remove());
      const name = label?.textContent.trim().replace(/[:：]\s*$/, "") || control.getAttribute("aria-label") || Common.L("参数", "Parameter");
      const value = control.type === "checkbox" ? (control.checked ? Common.L("开启", "on") : Common.L("关闭", "off")) :
        control.tagName === "SELECT" ? control.selectedOptions[0]?.textContent : control.value;
      message.textContent = Common.L("当前参数：", "Current: ") + name + " · " + value;
    }
    function enhance() {
      stage.querySelectorAll('input[type="range"]').forEach(input => {
        let output = input.nextElementSibling;
        if (output?.matches("output:not(.lw-range-value),.readout") ||
          (input.parentElement.tagName === "LABEL" && input.parentElement.nextElementSibling?.matches(".readout"))) return;
        if (!output || !output.classList.contains("lw-range-value")) {
          output = document.createElement("output"); output.className = "lw-range-value";
          input.after(output);
        }
        if (output.value !== input.value) output.value = input.value;
      });
      stage.querySelectorAll("[data-dir],[data-r],[data-c],[data-tab],[data-pal],[data-sc],[data-ratio],[data-dim],[data-d]").forEach(button => {
        const selected = button.classList.contains("active") || (button.classList.contains("demo-btn") && !button.classList.contains("secondary"));
        button.setAttribute("aria-pressed", String(selected));
      });
      stage.querySelectorAll('.mini-card, .tree-list .label, .tree-list .toggle, svg [role="button"], svg g, svg rect, svg circle, svg path').forEach(node => {
        if (node.getAttribute("role") === "slider") return;
        const clickable = node.matches('.mini-card,.tree-list .label,.tree-list .toggle[role="button"]') || (node.__data__ != null && (node.__on || []).some(listener => listener.type === "click"));
        if (!clickable || node.dataset.keyboardReady) return;
        node.dataset.keyboardReady = "true";
        node.setAttribute("role", "button"); node.setAttribute("tabindex", "0");
        if (!node.hasAttribute("aria-label")) node.setAttribute("aria-label", labelOf(node));
        node.addEventListener("keydown", event => {
          if (event.target !== node || !["Enter", " "].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          node.dispatchEvent(new MouseEvent("click", {bubbles: true}));
          if (!node.isConnected) queueMicrotask(() => {
            enhance();
            [...stage.querySelectorAll('[role="button"]')].find(el =>
              el.getAttribute("aria-label") === node.getAttribute("aria-label") ||
              (node.classList.contains("toggle") && el.classList.contains("toggle") && el.__data__ === node.__data__))?.focus();
          });
        });
      });
      // Dense daily views use one tab stop; arrows navigate and select neighbouring dates.
      [".tv-cell", "#sp-svg circle[role=button]"].forEach(selector => {
        const cells = [...stage.querySelectorAll(selector)];
        const selected = cells.find(cell => cell === document.activeElement) || cells.find(cell => cell.classList.contains("sel")) || cells[0];
        cells.forEach((cell, index) => {
          cell.setAttribute("tabindex", cell === selected ? "0" : "-1");
          if (cell.dataset.dateKeys) return;
          cell.dataset.dateKeys = "true";
          cell.addEventListener("keydown", event => {
            const verticalCalendar = selector === ".tv-cell";
            const offsets = {ArrowLeft: verticalCalendar ? -7 : -1, ArrowRight: verticalCalendar ? 7 : 1, ArrowUp: verticalCalendar ? -1 : -7, ArrowDown: verticalCalendar ? 1 : 7};
            const target = event.key === "Home" ? 0 : event.key === "End" ? cells.length-1 : event.key in offsets ? Math.max(0,Math.min(cells.length-1,index+offsets[event.key])) : null;
            if (target === null) return;
            event.preventDefault(); event.stopPropagation();
            cells.forEach((item,i) => item.setAttribute("tabindex", i === target ? "0" : "-1"));
            cells[target].focus(); cells[target].dispatchEvent(new MouseEvent("click", {bubbles:true}));
          });
        });
      });
      presets.querySelectorAll("button").forEach((button, i) => {
        const preset = PRESETS[id][i];
        const selectors = Array.isArray(preset[1]) ? preset[1] : preset[1] ? [preset[1]] : [];
        button.disabled = selectors.some(selector => !stage.querySelector(selector) ||
          (!Array.isArray(preset[1]) && stage.querySelector(selector).disabled)) ||
          Object.keys(preset[2] || {}).some(selector => !stage.querySelector(selector));
      });
    }
    function start() {
      if (observer) observer.disconnect();
      cancelAnimationFrame(enhanceFrame); enhanceFrame = 0;
      if (stage) {
        stage.__resizeAbort?.abort();
        stage.__dispose?.();
        stage.remove();
      }
      stage = document.createElement("div"); stage.className = "lw-stage";
      workspace.querySelector(".lw-live").append(stage);
      render(stage, ctx);
      enhance();
      observer = new MutationObserver(scheduleEnhance);
      observer.observe(stage, {childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled"]});
      stage.addEventListener("input", scheduleEnhance);
      stage.addEventListener("change", scheduleEnhance);
      stage.addEventListener("input", describeChange);
      stage.addEventListener("change", describeChange);
    }
    (PRESETS[id] || []).forEach(preset => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = preset[0];
      button.addEventListener("click", () => {
        for (const [selector, value] of Object.entries(preset[2] || {})) {
          const control = stage.querySelector(selector);
          if (control.type === "checkbox") control.checked = value;
          else control.value = value;
          control.dispatchEvent(new Event(control.matches('input[type="range"]') ? "input" : "change", {bubbles: true}));
        }
        const selectors = Array.isArray(preset[1]) ? preset[1] : preset[1] ? [preset[1]] : [];
        selectors.forEach(selector => stage.querySelector(selector).dispatchEvent(new MouseEvent("click", {bubbles: true})));
        message.textContent = Common.L("当前场景：", "Scenario: ") + preset[0] + Common.L("。", ".");
      });
      presets.append(button);
    });
    workspace.querySelector('[data-tool="reset"]').addEventListener("click", () => {
      if (stage.__resetLab) stage.__resetLab(); else start();
      message.textContent = Common.L("已恢复初始数据与参数，对照记录仍保留。", "Initial data and parameters restored; the snapshot is kept.");
    });
    const comparison = workspace.querySelector(".lw-comparison");
    workspace.querySelector('[data-tool="capture"]').addEventListener("click", () => {
      const clone = stage.cloneNode(true);
      clone.querySelector(".lab-learning")?.remove();
      const originals = stage.querySelectorAll("input,select,textarea");
      const originalControls = [...originals].filter(control => !control.closest(".lab-learning"));
      clone.querySelectorAll("input,select,textarea").forEach((control, i) => {
        const original = originalControls[i];
        const label = document.createElement("span"); label.className = "readout";
        label.textContent = original.type === "checkbox" ? (original.checked ? Common.L("已开启", "on") : Common.L("已关闭", "off")) :
          original.tagName === "SELECT" ? original.selectedOptions[0]?.textContent || "" : original.value;
        control.replaceWith(label);
      });
      // Prefix SVG definitions as well as references, so gradients remain self-contained.
      const ids = new Map([...clone.querySelectorAll("[id]")].map(el => [el.id, "snapshot-" + el.id]));
      clone.querySelectorAll("*").forEach(el => {
        if (el.id) el.id = ids.get(el.id);
        el.removeAttribute("tabindex"); el.removeAttribute("role");
        if (el.tagName === "BUTTON") el.disabled = true;
        for (const attr of [...el.attributes]) {
          let value = attr.value;
          for (const [oldId, newId] of ids) value = value.replaceAll("url(#" + oldId + ")", "url(#" + newId + ")");
          if (attr.name === "href" && value.startsWith("#") && ids.has(value.slice(1))) value = "#" + ids.get(value.slice(1));
          if (value !== attr.value) el.setAttribute(attr.name, value);
        }
      });
      clone.inert = true;
      workspace.querySelector(".lw-snapshot").replaceChildren(clone);
      comparison.hidden = false; comparison.open = true;
      message.textContent = Common.L("已保存当前参数与画面。继续操作实验，再展开对照比较差异。", "Current parameters and view captured. Keep experimenting, then expand the comparison to spot differences.");
    });
    workspace.querySelector('[data-tool="clear"]').addEventListener("click", () => {
      comparison.hidden = true; workspace.querySelector(".lw-snapshot").replaceChildren();
      message.textContent = Common.L("对照记录已移除。", "Snapshot removed.");
    });
    workspace.querySelector('[data-tool="focus"]').addEventListener("click", event => {
      const pane = container.closest(".lab-pane"), button = event.currentTarget;
      if (!pane) return;
      const placeholder = document.createComment("experiment location"); pane.before(placeholder);
      const dialog = document.createElement("dialog"); dialog.className = "lab-focus-dialog";
      dialog.setAttribute("aria-label", ctx.ls.demo.title + " · " + Common.L("专注实验", "focused lab"));
      const close = document.createElement("button"); close.className = "lw-close"; close.textContent = Common.L("收起实验 Esc", "Collapse lab (Esc)");
      pane.querySelector(".lab-head").append(close);
      dialog.append(pane); document.body.append(dialog); document.body.classList.add("lab-dialog-open");
      button.disabled = true;
      dialog.addEventListener("close", () => {
        close.remove();
        placeholder.replaceWith(pane); dialog.remove(); button.disabled = false;
        document.body.classList.remove("lab-dialog-open"); window.dispatchEvent(new Event("resize")); button.focus();
      }, {once: true});
      close.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
      dialog.showModal(); close.focus(); window.dispatchEvent(new Event("resize"));
    });
    start();
  }
  function swatches(container, colors, display = color => color) {
    container.replaceChildren();
    colors.forEach(color => {
      const button = document.createElement("button"); button.type = "button"; button.className = "lab-color-copy";
      button.setAttribute("aria-label", Common.L("复制色值 ", "Copy color ") + color);
      const sample = document.createElement("i"); sample.style.background = display(color);
      const label = document.createElement("span"); label.textContent = color;
      button.append(sample, label); button.addEventListener("click", () => Common.copyText(color, null, Common.L("色值已复制", "Color copied")));
      container.append(button);
    });
  }
  // Each experiment owns its data; history stores real states, never replays DOM clicks.
  function connect(stage, id, adapter) {
    const key = "vll.lab.v1." + id;
    const clone = value => JSON.parse(JSON.stringify(value));
    const initial = clone(adapter.get());
    let history = [initial], cursor = 0, timer, restoring = false, dragging = false;
    const panel = document.createElement("section"); panel.className = "lab-learning";
    panel.innerHTML = '<div class="lab-learning-tools"><button type="button" data-history="undo">' + Common.L("撤销", "Undo") + '</button><button type="button" data-history="redo">' + Common.L("重做", "Redo") + '</button><button type="button" data-history="initial">' + Common.L("恢复初始参数", "Reset parameters") + '</button></div>' +
      '<div class="lab-guide"><strong>' + Common.L("先预测 → 动手操作 → 核对解释", "Predict → experiment → check the explanation") + '</strong><p class="lab-guide-step"></p><button type="button" data-guide-next>' + Common.L("下一步", "Next step") + '</button></div>' +
      '<details class="lab-context-quiz"><summary>' + Common.L("情境自测 · 根据当前实验判断", "Context quiz · judge from the current experiment") + '</summary><p data-question></p><div data-answers></div><p data-result role="status"></p></details><p class="lab-history-status" role="status"></p>';
    stage.prepend(panel);
    const learning = document.createElement("details"); learning.className = "lab-learning-content";
    const heading = document.createElement("summary"); heading.textContent = Common.L("学习引导与情境自测", "Guided exploration & context quiz");
    learning.append(heading, panel.querySelector(".lab-guide"), panel.querySelector(".lab-context-quiz"));
    learning.open = !matchMedia("(max-width:600px)").matches;
    panel.querySelector(".lab-learning-tools").after(learning);
    const status = panel.querySelector(".lab-history-status");
    const steps = adapter.steps;
    let step = 0, questionKey;
    function guide() {
      panel.querySelector(".lab-guide-step").textContent = (step + 1) + "/3 · " + steps[step];
      panel.querySelector("[data-guide-next]").textContent = step === 2 ? Common.L("重新引导", "Restart guide") : Common.L("下一步", "Next step");
    }
    function sync() {
      panel.querySelector('[data-history="undo"]').disabled = cursor === 0;
      panel.querySelector('[data-history="redo"]').disabled = cursor === history.length - 1;
      const q = adapter.question();
      const signature = JSON.stringify(q);
      if (signature !== questionKey) {
        questionKey = signature;
        panel.querySelector("[data-question]").textContent = q.text;
        panel.querySelector("[data-result]").textContent = "";
        const answers = panel.querySelector("[data-answers]"); answers.replaceChildren();
        q.options.forEach((label, index) => {
          const button = document.createElement("button"); button.type = "button"; button.textContent = label;
          button.addEventListener("click", () => {
            panel.querySelector("[data-result]").textContent = (index === q.correct ? Common.L("判断正确。", "Correct. ") : Common.L("再想一想。", "Not quite. ")) + q.explain;
            button.setAttribute("aria-pressed", String(index === q.correct));
          });
          answers.append(button);
        });
      }
    }
    function persist(value) {
      try { localStorage.setItem(key, JSON.stringify(value)); status.textContent = Common.L("参数已保存在当前浏览器，可撤销或恢复初始状态。", "Parameters saved in this browser; undo or reset anytime."); }
      catch { status.textContent = Common.L("当前浏览器无法保存参数；本次仍可继续操作与撤销。", "This browser can't save parameters; you can still experiment and undo in this session."); }
    }
    function commit() {
      clearTimeout(timer);
      if (restoring) return;
      const value = clone(adapter.get());
      if (JSON.stringify(value) !== JSON.stringify(history[cursor])) {
        history = history.slice(0, cursor + 1); history.push(value);
        if (history.length > 40) history.shift();
        cursor = history.length - 1; persist(value);
      }
      sync();
    }
    function restore(value) {
      restoring = true;
      try { adapter.set(clone(value)); } finally { restoring = false; }
      sync(); persist(adapter.get());
    }
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && adapter.valid(saved)) { adapter.set(saved); history = [clone(adapter.get())]; status.textContent = Common.L("已恢复上次实验参数。", "Previous parameters restored."); }
    } catch { status.textContent = Common.L("未恢复旧参数，已使用初始状态。", "Previous parameters not restored; starting from defaults."); }
    panel.addEventListener("click", event => {
      const action = event.target.dataset.history;
      if (!action) return;
      commit();
      if (action === "initial") { restore(initial); commit(); }
      else if (action === "undo" && cursor > 0) restore(history[--cursor]);
      else if (action === "redo" && cursor < history.length - 1) restore(history[++cursor]);
    });
    stage.__resetLab = () => { commit(); restore(initial); commit(); };
    panel.querySelector("[data-guide-next]").addEventListener("click", () => { step = (step + 1) % 3; guide(); });
    const abort = new AbortController(), options = {signal: abort.signal};
    stage.addEventListener("pointerdown", event => { if (!panel.contains(event.target)) { commit(); dragging = true; } }, {...options, capture:true});
    window.addEventListener("pointerup", () => { if (dragging) { dragging = false; commit(); } }, options);
    window.addEventListener("pointercancel", () => { if (dragging) { dragging = false; commit(); } }, options);
    ["input", "change", "click", "lab:change"].forEach(type => stage.addEventListener(type, event => {
      if (panel.contains(event.target) || restoring) return;
      clearTimeout(timer);
      if (dragging) return;
      if (type === "input") timer = setTimeout(commit, 250);
      else queueMicrotask(commit);
    }, options));
    window.addEventListener("pagehide", commit, options);
    const dispose = stage.__dispose;
    stage.__dispose = () => { clearTimeout(timer); abort.abort(); dispose?.(); };
    guide(); sync();
  }
  window.LabWorkbench = {mount, swatches, connect};
})();

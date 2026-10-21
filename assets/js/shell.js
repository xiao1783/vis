/* ============================================================
 * shell.js — 公共顶部导航 / 搜索 / 移动端抽屉
 * 依赖：course-meta.js, course-c1..c5.js, store.js, search.js
 * ============================================================ */
(function () {
  /* ---------- 搜索索引（懒构建） ---------- */
  let searchIndex = null;
  function buildIndex() {
    if (searchIndex) return searchIndex;
    searchIndex = [];
    window.COURSE.chapters.forEach((ch) => {
      ch.lessons.forEach((ls) => {
        searchIndex.push({
          id: ls.id,
          c: ch.id,
          l: ls.l,
          chapter: ch,
          lesson: ls,
          hay: [
            ls.title, ls.subtitle, ls.question, ls.keyPoint,
            (ls.keywords || []).join(" "),
            (ls.goal || []).join(" "),
            (ls.pitfalls || []).join(" "),
            window.I18N ? window.I18N.lessonHayExtra(ls) : "",
          ].join(" ").toLowerCase(),
        });
      });
    });
    return searchIndex;
  }

  function doSearch(q) {
    q = (q || "").trim().toLowerCase();
    const idx = buildIndex();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return idx
      .filter(item => terms.every(term => item.hay.includes(term)))
      .map((item) => {
        let score = 0;
        const t = item.lesson.title.toLowerCase();
        const kws = (item.lesson.keywords || []).map((k) => k.toLowerCase());
        terms.forEach((term) => {
          if (t === term) score += 10;
          if (t.includes(term)) score += 6;
          if (kws.some((k) => k === term)) score += 5;
          if (kws.some((k) => k.includes(term) || term.includes(k)) && term.length > 1) score += 3;
          if (item.hay.includes(term)) score += 1;
        });
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.item);
  }

  function highlightMatch(text, q) {
    const source = String(text);
    const terms = [...new Set(q.trim().toLowerCase().split(/\s+/).filter(Boolean))];
    const lower = source.toLowerCase();
    let result = "", start = 0;
    while (start < source.length) {
      const matches = terms.map(term => ({ at: lower.indexOf(term, start), term })).filter(x => x.at >= 0);
      if (!matches.length) { result += window.esc(source.slice(start)); break; }
      matches.sort((a, b) => a.at - b.at || b.term.length - a.term.length);
      const match = matches[0];
      result += window.esc(source.slice(start, match.at)) + '<mark>' + window.esc(source.slice(match.at, match.at + match.term.length)) + '</mark>';
      start = match.at + match.term.length;
    }
    return result;
  }

  function bindSearchKeyboard(input, box) {
    input.setAttribute("aria-controls", box.id);
    box.setAttribute("aria-label", Common.L("课程搜索结果", "Course search results"));
    box.setAttribute("role", "region");
    function close(event) {
      event.preventDefault();
      event.stopPropagation();
      input.focus();
      box.classList.remove("open");
    }
    input.addEventListener("keydown", event => {
      if (!box.classList.contains("open")) return;
      const links = [...box.querySelectorAll(".search-item")];
      if (event.key === "Escape") { close(event); return; }
      if (!links.length) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
      } else if (event.key === "Enter") { event.preventDefault(); links[0].click(); }
    });
    box.addEventListener("keydown", event => {
      if (event.key === "Escape") { close(event); return; }
      const links = [...box.querySelectorAll(".search-item")];
      const index = links.indexOf(document.activeElement);
      if (index < 0) return;
      if (event.key === "ArrowDown") { event.preventDefault(); links[(index + 1) % links.length].focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); (index ? links[index - 1] : input).focus(); }
    });
  }

  function renderSearchResults(box, q, input) {
    const results = doSearch(q);
    if (!q.trim()) { box.classList.remove("open"); return; }
    if (!results.length) {
      box.innerHTML = '<div class="search-empty">' + Common.L("没有找到与“", "Nothing matches “") + window.esc(q) +
        Common.L("”相关的内容", "”") + '<br><span class="muted">' + Common.L("试试章节名、术语或英文缩写，如 Data Join、colormap、scaleTime", "Try a chapter name, a term or a keyword like Data Join, colormap, scaleTime") + '</span></div>';
      box.classList.add("open");
      return;
    }
    box.innerHTML = '<div class="search-result-heading"><span>' + (results.length === 10 ? Common.L("显示前 10 项结果", "Showing first 10 results") : Common.L("找到 " + results.length + " 个小节", results.length + " lessons found")) + '</span><small>' + Common.L("↑↓ 选择 · Enter 打开", "↑↓ select · Enter open") + '</small></div>' + results.map((r) => {
      const lsV = window.I18N.lessonObj(r.lesson);
      const status = window.Store.isCompleted(r.id)
        ? '<span class="ch-status done">' + Common.L("已完成", "Completed") + '</span>'
        : window.Store.isVisited(r.id) ? '<span class="ch-status started">' + Common.L("已访问", "Visited") + '</span>' : "";
      return '<a class="search-item" href="lesson.html?c=' + r.c + "&l=" + r.l + '">' +
        '<div class="si-top">' + Common.L(r.chapter.num, "Ch." + r.c) + " · " + Common.L("小节 ", "Lesson ") + r.c + "." + r.l + " " + status + "</div>" +
        '<div class="si-title">' + highlightMatch(lsV.title, q) + "</div>" +
        '<div class="si-desc">' + highlightMatch(lsV.keyPoint, q) + "</div></a>";
    }).join("");
    box.classList.add("open");
  }

  const studyTools = [
    { id: "notes", title: Common.L("我的笔记", "My Notes"), desc: Common.L("整理要点与学习标签", "Organize key points and tags"), icon: "edit" },
    { id: "review", title: Common.L("错题重做", "Review Mistakes"), desc: Common.L("回到需要巩固的问题", "Return to what needs consolidating"), icon: "quiz" },
    { id: "stats", title: Common.L("学习统计", "Learning Stats"), desc: Common.L("查看进度与备份记录", "Track progress and back up records"), icon: "book" }
  ];

  function setDrawer(open) {
    const drawer = document.getElementById("drawer");
    drawer.classList.toggle("open", open);
    drawer.inert = !open;
    document.getElementById("drawer-mask").classList.toggle("open", open);
    document.getElementById("menu-btn").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
    if (open) drawer.querySelector("button").focus();
    else document.getElementById("menu-btn").focus();
  }

  /* ---------- 渲染顶部 ---------- */
  function initHeader(active) {
    const header = document.getElementById("site-header");
    if (!header) return;
    header.innerHTML =
      '<div class="bar">' +
      '<a class="brand" href="index.html"><span class="logo" aria-hidden="true"><img src="assets/images/logo.png" alt="" width="44" height="44"></span>' +
      "<span>" + Common.L("可视化学习实验室", "Visualization Learning Lab") + "<small>" + Common.L("《可视化导论》", "Intro. to Data Visualization") + "</small></span></a>" +
      '<div class="header-spacer"></div>' +
      '<nav class="nav-links">' +
      '<a href="index.html" data-nav="home">' + Common.L("首页", "Home") + '</a>' +
      '<a href="chapter.html?c=1" data-nav="ch1">' + Common.L("第一章", "Ch. 1") + '</a>' +
      '<a href="chapter.html?c=2" data-nav="ch2">' + Common.L("第二章", "Ch. 2") + '</a>' +
      '<a href="chapter.html?c=3" data-nav="ch3">' + Common.L("第三章", "Ch. 3") + '</a>' +
      '<a href="chapter.html?c=4" data-nav="ch4">' + Common.L("第四章", "Ch. 4") + '</a>' +
      '<a href="chapter.html?c=5" data-nav="ch5">' + Common.L("第五章", "Ch. 5") + '</a>' +
      '<a href="experiments.html" data-nav="exp">' + Common.L("实验中心", "Experiments") + '</a>' +
      "</nav>" +
      '<details class="study-tools' + (studyTools.some(t => t.id === active) ? ' active' : '') + '" id="study-tools"><summary>' + Common.L("学习工具 ", "Study tools ") + Common.icon("chevron-down", 12) + '</summary><nav aria-label="' + Common.L("学习工具", "Study tools") + '">' +
      studyTools.map(t => '<a href="' + t.id + '.html"' + (active === t.id ? ' aria-current="page"' : '') + '><span class="tool-icon">' + Common.icon(t.icon, 17) + '</span><span><b>' + t.title + '</b><small>' + t.desc + '</small></span></a>').join('') + '</nav></details>' +
      '<div class="search-wrap"><span class="search-ico" aria-hidden="true">' + Common.icon("search", 14) + '</span>' +
      '<input type="search" id="global-search" aria-label="' + Common.L("搜索课程小节或术语", "Search course lessons or terms") + '" placeholder="' + Common.L("搜索小节 / 术语，如 Data Join…", "Search lessons / terms, e.g. Data Join…") + '" autocomplete="off">' +
      '<div class="search-results" id="search-results"></div></div>' +
      I18N.toggleBtn() +
      '<button class="icon-btn menu-btn" id="menu-btn" aria-label="' + Common.L("菜单", "Menu") + '" aria-expanded="false" aria-controls="drawer">' + Common.icon("menu", 18) + '</button>' +
      "</div>";

    const activeEl = header.querySelector('[data-nav="' + active + '"]');
    if (activeEl) { activeEl.classList.add("active"); activeEl.setAttribute("aria-current", "page"); }

    const input = document.getElementById("global-search");
    const box = document.getElementById("search-results");
    bindSearchKeyboard(input, box);
    input.addEventListener("input", () => renderSearchResults(box, input.value, input));
    input.addEventListener("focus", () => { if (input.value) renderSearchResults(box, input.value, input); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrap")) box.classList.remove("open");
      if (!e.target.closest(".study-tools")) document.getElementById("study-tools").open = false;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input && !(e.target && e.target.matches && e.target.matches("input,textarea"))) {
        e.preventDefault();
        if (input.getClientRects().length) input.focus();
        else { setDrawer(true); document.getElementById("drawer-search").focus(); }
      }
      if (e.key === "Escape") {
        box.classList.remove("open");
        const tools = document.getElementById("study-tools");
        if (tools.open) { tools.open = false; tools.querySelector("summary").focus(); }
        else if (document.activeElement === input) input.blur();
      }
    });

    /* 移动端抽屉 */
    document.getElementById("menu-btn").addEventListener("click", () => {
      setDrawer(true);
    });
  }

  function initDrawer() {
    let mask = document.getElementById("drawer-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.className = "drawer-mask";
      mask.id = "drawer-mask";
      const drawer = document.createElement("div");
      drawer.className = "drawer";
      drawer.id = "drawer";
      drawer.inert = true;
      drawer.setAttribute("aria-label", Common.L("网站导航", "Site navigation"));
      drawer.innerHTML =
        '<div class="drawer-heading"><b>' + Common.L("探索与学习", "Explore & Learn") + '</b><button class="icon-btn" id="drawer-close" aria-label="' + Common.L("关闭菜单", "Close menu") + '">' + Common.icon("x", 17) + '</button></div>' +
        '<div class="search-wrap" style="width:100%">' +
        '<span class="search-ico" aria-hidden="true">' + Common.icon("search", 14) + '</span>' +
        '<input type="search" id="drawer-search" aria-label="' + Common.L("搜索课程小节或术语", "Search course lessons or terms") + '" placeholder="' + Common.L("搜索小节 / 术语…", "Search lessons / terms…") + '">' +
        '<div class="search-results" id="drawer-search-results"></div></div>' +
        '<div style="margin-top:10px">' +
        '<a href="index.html">' + Common.L("首页", "Home") + '</a>' +
        '<a href="experiments.html">' + Common.L("实验中心", "Experiments") + '</a>' +
        '<div class="drawer-group-label">' + Common.L("学习工具", "Study tools") + '</div>' +
        studyTools.map(t => '<a href="' + t.id + '.html">' + Common.icon(t.icon, 14) + ' ' + t.title + '</a>').join('') +
        '<div class="drawer-group-label">' + Common.L("五章课程", "Five chapters") + '</div>' +
        window.COURSE.chapters.map((ch) => {
          const chV = I18N.chapterObj(ch);
          return '<a href="chapter.html?c=' + ch.id + '">' + Common.L(ch.num, "Ch. " + ch.id) + " · " + chV.title + "</a>";
        }).join("") +
        "</div>";
      document.body.appendChild(mask);
      document.body.appendChild(drawer);
      mask.addEventListener("click", () => setDrawer(false));
      drawer.querySelector("#drawer-close").addEventListener("click", () => setDrawer(false));
      document.addEventListener("keydown", event => {
        if (!drawer.classList.contains("open")) return;
        if (event.key === "Escape") { setDrawer(false); return; }
        if (event.key !== "Tab") return;
        const items = [...drawer.querySelectorAll("a,button,input")];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      const dInput = drawer.querySelector("#drawer-search");
      const dBox = drawer.querySelector("#drawer-search-results");
      bindSearchKeyboard(dInput, dBox);
      dInput.addEventListener("input", () => renderSearchResults(dBox, dInput.value, dInput));
      dInput.addEventListener("focus", () => {
        dBox.style.position = "static";
        if (dInput.value) renderSearchResults(dBox, dInput.value, dInput);
      });
    }
  }

  /* 减少动效 */
  function applyMotion() {
    document.body.classList.toggle("reduce-motion", !!window.Store.getReduceMotion());
  }

  /* ---------- 全局命令面板（Cmd+K / Ctrl+K） ---------- */
  let cmdPalette = null;
  let cmdSelected = 0;
  let cmdItems = [];

  function cmdActions() {
    const p = Common.params();
    const onLesson = !!(document.getElementById("learn-main") && p.c && p.l);
    const acts = [];
    if (onLesson) {
      acts.push({ name: Common.L("标记本节已掌握", "Mark this lesson as mastered"), kw: "掌握 完成 done mastered", icon: "check", run: () => fireCmd("toggle-done") });
      acts.push({ name: Common.L("重置本节自测", "Reset this lesson's quiz"), kw: "重置 自测 quiz reset", icon: "refresh", run: () => fireCmd("reset-quiz") });
      acts.push({ name: Common.L("记笔记（展开并聚焦）", "Take a note (expand & focus)"), kw: "笔记 note", icon: "edit", run: () => fireCmd("focus-note") });
    }
    acts.push({ name: Common.L("去错题重做", "Go to mistake review"), kw: "错题 重做 review mistakes", icon: "quiz", href: "review.html" });
    acts.push({ name: Common.L("去学习统计", "Go to learning stats"), kw: "统计 进度 stats progress", icon: "book", href: "stats.html" });
    acts.push({ name: Common.L("去我的笔记", "Go to my notes"), kw: "笔记 notes", icon: "edit", href: "notes.html" });
    acts.push({ name: Common.L("去实验中心", "Go to experiment center"), kw: "实验 experiments", icon: "flask", href: "experiments.html" });
    acts.push({ name: Common.L("导出学习数据 JSON", "Export learning data (JSON)"), kw: "导出 备份 export backup", icon: "info", run: () => Common.exportData() });
    acts.push({ name: Common.L("导入学习数据 JSON…", "Import learning data (JSON)…"), kw: "导入 恢复 import restore", icon: "info", run: () => Common.importData() });
    acts.push({ name: Common.L("清除全部学习数据…", "Clear all learning data…"), kw: "清除 重置 reset clear", icon: "warn", run: () => Common.resetData() });
    return acts;
  }
  function fireCmd(name) {
    window.dispatchEvent(new CustomEvent("vll:cmd", { detail: name }));
  }

  function initCmdPalette() {
    if (cmdPalette) return;
    cmdPalette = document.createElement("div");
    cmdPalette.id = "cmd-palette";
    cmdPalette.innerHTML =
      '<div class="cmd-mask" id="cmd-mask"></div>' +
      '<div class="cmd-panel">' +
      '<div class="cmd-input-wrap">' +
      '<span class="search-ico" aria-hidden="true">' + Common.icon("search", 16) + '</span>' +
      '<input type="text" id="cmd-input" placeholder="' + Common.L("搜索命令或小节、术语、实验…（↑↓ 选择，Enter 执行，Esc 关闭）", "Search commands, lessons, terms, experiments… (↑↓ select, Enter run, Esc close)") + '" autocomplete="off">' +
      '<kbd class="cmd-kbd">Esc</kbd>' +
      "</div>" +
      '<div class="cmd-results" id="cmd-results"></div>' +
      "</div>";
    document.body.appendChild(cmdPalette);

    const mask = document.getElementById("cmd-mask");
    const input = document.getElementById("cmd-input");
    const results = document.getElementById("cmd-results");

    function open() {
      cmdPalette.classList.add("open");
      input.value = "";
      renderCmdResults("");
      setTimeout(() => input.focus(), 10);
    }
    function close() {
      cmdPalette.classList.remove("open");
      cmdSelected = 0;
    }
    function renderCmdResults(q) {
      q = (q || "").trim().toLowerCase();
      const acts = cmdActions().filter((a) => !q || a.name.toLowerCase().includes(q) || a.kw.includes(q));
      const lessons = doSearch(q);
      cmdItems = [];
      let h = "";
      if (acts.length) {
        h += '<div class="cmd-group">' + Common.L("命令", "Commands") + "</div>";
        acts.forEach((a) => {
          const i = cmdItems.length;
          cmdItems.push({ type: "act", act: a });
          h += '<div class="cmd-item cmd-act' + (i === 0 ? " selected" : "") + '" data-i="' + i + '">' +
            '<span class="cmd-ico">' + Common.icon(a.icon, 14) + "</span>" +
            '<span class="cmd-body"><span class="cmd-title">' + a.name + "</span></span></div>";
        });
      }
      if (lessons.length) {
        h += '<div class="cmd-group">' + Common.L("小节", "Lessons") + "</div>";
        lessons.forEach((r) => {
          const i = cmdItems.length;
          const status = window.Store.isCompleted(r.id) ? "done" : window.Store.isVisited(r.id) ? "seen" : "";
          cmdItems.push({ type: "go", c: r.c, l: r.l, href: "lesson.html?c=" + r.c + "&l=" + r.l });
          h += '<div class="cmd-item' + (i === 0 && !acts.length ? " selected" : "") + '" data-i="' + i + '">' +
            '<span class="cmd-idx">' + (i + 1 - acts.length) + "</span>" +
            '<span class="cmd-body"><span class="cmd-title">' + window.esc(I18N.lessonObj(r.lesson).title) + "</span>" +
            '<span class="cmd-meta">' + Common.L(r.chapter.num, "Ch. " + r.c) + " · " + Common.L("小节 ", "Lesson ") + r.c + "." + r.l +
            (status === "done" ? ' <span class="ch-status done">' + Common.L("已完成", "Completed") + '</span>' : status === "seen" ? ' <span class="ch-status started">' + Common.L("已访问", "Visited") + '</span>' : "") +
            "</span></span></div>";
        });
      }
      if (!cmdItems.length) h = '<div class="cmd-empty">' + Common.L("没有找到相关内容", "No matching content") + "</div>";
      results.innerHTML = h;
      results.querySelectorAll(".cmd-item").forEach((el) => {
        el.addEventListener("click", () => { go(+el.dataset.i); });
      });
      cmdSelected = 0;
      results.querySelectorAll(".cmd-item").forEach((el, idx) => el.classList.toggle("selected", idx === 0));
    }
    function select(i) {
      cmdSelected = Math.max(0, Math.min(i, cmdItems.length - 1));
      results.querySelectorAll(".cmd-item").forEach((el, idx) => el.classList.toggle("selected", idx === cmdSelected));
      const sel = results.querySelectorAll(".cmd-item")[cmdSelected];
      if (sel) sel.scrollIntoView({ block: "nearest" });
    }
    function go(i) {
      const item = cmdItems[i];
      if (!item) return;
      if (item.type === "act") {
        close();
        if (item.act.href) location.href = item.act.href;
        else if (item.act.run) item.act.run();
      } else {
        location.href = item.href;
      }
    }

    input.addEventListener("input", () => { cmdSelected = 0; renderCmdResults(input.value); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); select(cmdSelected + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); select(cmdSelected - 1); }
      else if (e.key === "Enter") { e.preventDefault(); go(cmdSelected); }
      else if (e.key === "Escape") close();
    });
    mask.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "k") { e.preventDefault(); open(); }
      else if (e.key === "Escape" && cmdPalette.classList.contains("open")) close();
    });
  }

  window.Shell = {
    init(active) {
      initHeader(active);
      initDrawer();
      applyMotion();
      initCmdPalette();
      window.Store.onChange(applyMotion);
    },
    doSearch,
  };
})();

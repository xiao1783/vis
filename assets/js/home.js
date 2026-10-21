/* ============================================================
 * home.js — 首页渲染
 * ============================================================ */
(function () {
  Shell.init("home");
  Common.renderFooter();

  const KEY_EXPS = [
    { id: "data-transform", c: 1, l: 4, name: "数据变换实验", nameEn: "Data Transform",
      goal: "筛选 / 派生 / 分组，看输入一步步变成输出", goalEn: "Filter / derive / group — watch input become output step by step",
      params: "筛选条件、字段派生、分组计数", paramsEn: "Filters, derived fields, group counts" },
    { id: "data-join", c: 1, l: 5, name: "Data Join 三态实验", nameEn: "Data Join Three States",
      goal: "增删、替换、重排数据，看清 enter/update/exit", goalEn: "Add, remove, replace and reorder data to see enter/update/exit",
      params: "新增、删除、改值、替换 ID、重排", paramsEn: "Add, remove, change value, replace ID, reorder" },
    { id: "pipeline", c: 2, l: 1, name: "可视化流程实验", nameEn: "Visualization Pipeline",
      goal: "切换流程节点与聚合维度，理解各环节如何衔接", goalEn: "Switch pipeline stages and aggregation dimensions to see how they connect",
      params: "流程节点、聚合维度", paramsEn: "Pipeline stage, aggregation dimension" },
    { id: "color-semantics", c: 3, l: 2, name: "配色语义实验", nameEn: "Color Semantics",
      goal: "为类别/顺序/偏差数据选择配色并解释", goalEn: "Choose and explain palettes for categorical / ordinal / diverging data",
      params: "数据场景、配色方案、对错对比", paramsEn: "Data scenario, palette, right-vs-wrong" },
    { id: "scale-curve", c: 4, l: 2, name: "比例尺与曲线实验", nameEn: "Scales & Curves",
      goal: "线性/对数映射 + 曲线插值与拟合的区别", goalEn: "Linear vs log mapping + interpolation and fitting curves",
      params: "映射方式、曲线类型、拟合线", paramsEn: "Mapping type, curve type, fitted line" },
    { id: "time-views", c: 5, l: 3, name: "时序多视图实验", nameEn: "Temporal Multi-View",
      goal: "同一日度数据在折线/日历/周期视图中联动", goalEn: "Link one daily series across line / calendar / weekday views",
      params: "视图切换、日期选择与区间高亮", paramsEn: "View switch, date pick, range highlight" },
  ];

  /* Layered SVG showcase. A single clock drives the progress rail and autoplay. */
  const carousel = document.querySelector(".hero-carousel");
  const slides = [...carousel.querySelectorAll(".hero-slide")];
  const dots = [...carousel.querySelectorAll("[data-slide]")];
  const playButton = carousel.querySelector('[data-carousel="play"]');
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => motion.matches || document.body.classList.contains("reduce-motion");
  const interval = 4000, rail = carousel.querySelector(".carousel-progress i");
  let current = 0, timer, paused = reduced(), remaining = interval, started = null;
  let progress, transitions = [], generation = 0, inView = true, hover = false, focus = false;
  function holdClock() {
    clearTimeout(timer);
    if (started !== null) remaining = Math.max(0, remaining - (performance.now() - started));
    started = null;
    progress?.cancel();
    rail.style.transform = "scaleX(" + (1 - remaining / interval) + ")";
  }
  function schedule(reset = false) {
    holdClock();
    if (reset) { remaining = interval; rail.style.transform = "scaleX(0)"; }
    const running = !paused && !reduced() && !document.hidden && inView && !hover && !focus;
    carousel.classList.toggle("is-motion-paused", !running);
    if (!running) return;
    started = performance.now();
    progress = rail.animate([{transform:"scaleX(" + (1 - remaining / interval) + ")"},{transform:"scaleX(1)"}],{duration:remaining,easing:"linear",fill:"forwards"});
    timer = setTimeout(() => show(current + 1), remaining);
  }
  function setPaused(value) {
    paused = value;
    playButton.textContent = paused ? "▷" : "Ⅱ";
    playButton.setAttribute("aria-label", paused ? Common.L("开始自动轮播", "Start auto play") : Common.L("暂停自动轮播", "Pause auto play"));
    playButton.setAttribute("aria-pressed", String(!paused));
    schedule();
  }
  function show(index, manual = false, direction = 1) {
    const target = (index + slides.length) % slides.length;
    if (manual) setPaused(true);
    if (target === current) return;
    const previous = current, token = ++generation;
    transitions.forEach(animation => animation.cancel()); transitions = [];
    current = target;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current && i !== previous;
      slide.inert = i !== current;
      slide.setAttribute("aria-hidden", String(i !== current));
      slide.classList.toggle("is-current", i === current);
    });
    if (!reduced()) {
      const options = {duration:850,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"};
      transitions = [
        slides[previous].animate([{opacity:1,transform:"translateX(0) scale(1)",filter:"blur(0px)"},{opacity:0,transform:"translateX(" + (-direction * 14) + "%) scale(.91)",filter:"blur(8px)"}], options),
        slides[current].animate([{opacity:0,transform:"perspective(1200px) translateX(" + (direction * 18) + "%) rotateY(" + (direction * 9) + "deg) scale(1.05)",filter:"blur(8px)"},{opacity:1,transform:"perspective(1200px) translateX(0) rotateY(0deg) scale(1)",filter:"blur(0px)"}], options)
      ];
      Promise.all(transitions.map(animation => animation.finished)).then(() => {
        if (token !== generation) return;
        slides.forEach((slide,i) => { slide.hidden = i !== current; });
        transitions.forEach(animation => animation.cancel()); transitions = [];
      }).catch(() => {}); // A newer navigation deliberately cancels the previous transition.
    } else slides.forEach((slide,i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    document.getElementById("hero-slide-count").textContent = String(current + 1).padStart(2,"0") + " / " + String(slides.length).padStart(2,"0");
    carousel.dataset.scene = String(current);
    if (manual) {
      document.getElementById("hero-carousel-status").textContent = slides[current].getAttribute("aria-label");
    }
    schedule(true);
  }
  carousel.querySelector('[data-carousel="prev"]').addEventListener("click", () => show(current - 1, true, -1));
  carousel.querySelector('[data-carousel="next"]').addEventListener("click", () => show(current + 1, true));
  dots.forEach((dot, index) => dot.addEventListener("click", () => show(index, true, index < current ? -1 : 1)));
  playButton.addEventListener("click", () => { hover = false; focus = false; setPaused(!paused); });
  carousel.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault(); const direction = event.key === "ArrowRight" ? 1 : -1; show(current + direction, true, direction);
  });
  carousel.addEventListener("mouseenter", () => { hover = true; schedule(); });
  carousel.addEventListener("mouseleave", () => { hover = false; schedule(); cancelAnimationFrame(tiltFrame); tiltFrame = null; carousel.style.setProperty("--tilt-x","0deg"); carousel.style.setProperty("--tilt-y","0deg"); });
  carousel.addEventListener("focusin", () => { focus = true; schedule(); });
  carousel.addEventListener("focusout", () => requestAnimationFrame(() => { focus = carousel.contains(document.activeElement); schedule(); }));
  document.addEventListener("visibilitychange", () => schedule());
  function syncMotion() {
    carousel.classList.toggle("has-reduced-motion", reduced());
    if (reduced()) {
      ++generation; transitions.forEach(animation => animation.cancel()); transitions = [];
      slides.forEach((slide,i) => { slide.hidden = i !== current; });
      carousel.style.setProperty("--tilt-x","0deg"); carousel.style.setProperty("--tilt-y","0deg");
      setPaused(true);
    }
  }
  motion.addEventListener("change", syncMotion);
  Store.onChange(syncMotion);
  const visibility = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) carousel.classList.add("has-been-visible"); schedule(); },{threshold:.15});
  visibility.observe(carousel);
  let pointerStart, swipedAt = -Infinity;
  const viewport = carousel.querySelector(".hero-slides");
  viewport.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse") pointerStart = {x:event.clientX,y:event.clientY}; });
  viewport.addEventListener("pointerup", event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y; pointerStart = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const direction = dx < 0 ? 1 : -1; show(current + direction, true, direction);
    swipedAt = performance.now();
  });
  viewport.addEventListener("click", event => { if (performance.now() - swipedAt < 350) { event.preventDefault(); event.stopPropagation(); } },{capture:true});
  viewport.addEventListener("pointercancel", () => { pointerStart = null; });
  let tiltFrame;
  carousel.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || reduced() || tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      tiltFrame = null;
      const box = carousel.getBoundingClientRect();
      carousel.style.setProperty("--tilt-x", ((event.clientY - box.top) / box.height * -3 + 1.5) + "deg");
      carousel.style.setProperty("--tilt-y", ((event.clientX - box.left) / box.width * 4 - 2) + "deg");
    });
  });
  slides[0].classList.add("is-current");
  slides.forEach((slide,i) => { slide.inert = i !== 0; slide.setAttribute("aria-hidden", String(i !== 0)); });
  syncMotion();
  setPaused(paused);
  window.addEventListener("pagehide", holdClock);
  window.addEventListener("pageshow", () => schedule());

  /* 学习路线索引（压缩为目录上方的一行） */
  const routeIdx = d3.select("#route-index");
  window.COURSE.chapters.forEach((ch, i) => {
    const chV = I18N.chapterObj(ch);
    const p = Store.chapterProgress(ch);
    const done = p.done === p.total;
    routeIdx.append("a")
      .attr("class", "route-idx-step " + (done ? "done" : ""))
      .attr("href", "chapter.html?c=" + ch.id)
      .html(
        '<span class="ri-num">0' + (i + 1) + '</span>' +
        '<span class="ri-title">' + chV.route + '</span>' +
        '<span class="ri-meta">' + ch.lessons.length + Common.L(' 节', ' lessons') + (done ? Common.L(' · 已完成', ' · completed') : '') + '</span>');
  });

  /* 总进度 */
  const ov = Store.overallProgress();
  document.getElementById("overall-bar").style.width = ov.pct + "%";
  document.getElementById("overall-text").innerHTML =
    Common.L("总进度：", "Overall: ") + "<b>" + ov.done + "</b>/" + ov.total + Common.L(" 节已完成（", " lessons completed (") + ov.pct + Common.L("%）", "%)");

  /* 今日复习建议：待巩固错题优先，其次超过 3 天未回访且未掌握的小节 */
  (function () {
    const host = document.getElementById("review-suggest");
    if (!host) return;
    const out = [];
    const now = Date.now();
    window.COURSE.chapters.forEach((ch) => ch.lessons.forEach((ls) => {
      const weakN = (Store.getLessonWeakPoints(ls.id) || []).length;
      if (weakN) { out.push({ ch, ls, pr: 0, reason: weakN + Common.L(" 道错题待巩固", " mistake(s) to consolidate"), cls: "warn" }); return; }
      const vd = Store.lastVisitDate(ls.id);
      if (vd && !Store.isCompleted(ls.id)) {
        const days = Math.floor((now - new Date(vd).getTime()) / 86400000);
        if (days >= 3) out.push({ ch, ls, pr: 1, reason: Common.L(days + " 天前学过，还未标记掌握", "Learned " + days + " days ago, not yet mastered"), cls: "" });
      }
    }));
    const top = out.sort((a, b) => a.pr - b.pr).slice(0, 3);
    if (!top.length) return;
    host.innerHTML = '<div class="suggest-card">' +
      '<div class="suggest-head">' + Common.icon("bulb", 14) + Common.L(" 今日复习建议", " Today's review suggestions") + "</div>" +
      top.map((s) =>
        '<a class="suggest-item ' + s.cls + '" href="' + Common.lessonLink(s.ch.id, s.ls.l) + '">' +
        '<span class="suggest-name">' + s.ch.id + "." + s.ls.l + " " + window.esc(I18N.lessonObj(s.ls).title) + "</span>" +
        '<span class="suggest-reason">' + s.reason + "</span></a>").join("") +
      "</div>";
  })();

  /* 章节卡片 */
  const grid = d3.select("#chapter-grid");
  window.COURSE.chapters.forEach((ch, i) => {
    const chV = I18N.chapterObj(ch);
    const p = Store.chapterProgress(ch);
    let statusCls = "", statusText = Common.L("未开始", "Not started");
    if (p.done === p.total) { statusCls = "done"; statusText = Common.L("已完成", "Completed"); }
    else if (p.done > 0 || p.seen > 0) { statusCls = "started"; statusText = Common.L("学习中", "In progress"); }
    const card = grid.append("a").attr("class", "ch-card").style("--accent", ch.accent)
      .attr("href", "chapter.html?c=" + ch.id);
    const topics = [...new Set(ch.lessons.flatMap(ls => (ls.keywords || []).slice(0, 1)))].slice(0, 3);
    card.html(
      '<span class="chapter-index"><small>CHAPTER</small>0' + (i + 1) + '</span>' +
      '<div class="chapter-body"><div class="ch-top"><span class="ch-num">' + chV.num + ' · ' + chV.route + '</span>' +
      '<span class="ch-status ' + statusCls + '">' + statusText + '</span></div>' +
      '<h3>' + chV.title + '</h3><div class="ch-one">' + chV.question + '</div>' +
      '<div class="chapter-topics">' + topics.map(topic => '<span>' + window.esc(topic) + '</span>').join('') + '</div></div>' +
      '<div class="chapter-side"><span class="chapter-count"><b>' + String(ch.lessons.length).padStart(2, '0') + '</b>' + Common.L(' 小节', ' lessons') + '</span>' +
      '<span class="chapter-progress">' + Common.L("已掌握 ", "Mastered ") + p.done + ' / ' + p.total + '</span>' +
      '<span class="chapter-meter"><i style="width:' + p.pct + '%"></i></span>' +
      '<span class="chapter-entry">' + Common.L("进入章节 ", "Open chapter ") + '<span aria-hidden="true">↗</span></span></div>');
  });

  /* 重点实验 */
  const kx = d3.select("#key-exps");
  KEY_EXPS.forEach((e, i) => {
    const card = kx.append("div").attr("class", "exp-card key with-preview");
    card.html(
      Common.experimentPreview(e.id) + '<div class="exp-card-body"><div class="exp-card-top">' +
      '<span class="experiment-number">' + Common.L("实验 0", "Experiment 0") + (i + 1) + '</span>' +
      '<span class="badge key">' + Common.L("重点实验", "Key experiment") + '</span></div>' +
      "<h4>" + Common.L(e.name, e.nameEn) + "</h4>" +
      '<div class="exp-meta">' + Common.L("对应 ", "Chapter ") + Common.L("第" + ["一","二","三","四","五"][e.c-1] + "章", String(e.c)) + " " + e.c + "." + e.l + "</div>" +
      "<p>" + Common.L(e.goal, e.goalEn) + "</p>" +
      '<div class="params">' + Common.L("可操作：", "Controls: ") + "<b>" + Common.L(e.params, e.paramsEn) + "</b></div>" +
      '<a class="btn btn-primary btn-sm" href="lesson.html?c=' + e.c + "&l=" + e.l + '">' + Common.L("进入实验 ↗", "Open experiment ↗") + '</a></div>');
  });

  /* 继续学习 */
  const last = Store.lastLessonRef();
  const contBtn = document.getElementById("continue-btn");
  if (last) {
    contBtn.href = Common.lessonLink(last.ch.id, last.ls.l);
    contBtn.innerHTML = Common.L("继续上次学习 ↗", "Continue where I left off ↗");
    contBtn.title = I18N.lessonObj(last.ls).title;
  } else {
    contBtn.classList.add("hide");
    document.getElementById("start-btn").innerHTML = Common.L("开始学习 ↗", "Start Learning ↗");
  }

  /* 真实学习记录的快捷入口，不把访问记录视为已经掌握。 */
  const resume = last || { ch: COURSE.chapters[0], ls: COURSE.chapters[0].lessons[0] };
  const resumeProgress = Store.chapterProgress(resume.ch);
  const weakCount = Store.getAllWeakPoints().reduce((n, x) => n + x.mistakes.length, 0);
  const shortcuts = [
    { title: Common.L("我的笔记", "My Notes"), value: Store.getAllNotes().length, unit: Common.L("篇笔记", "notes"), icon: "edit", href: "notes.html" },
    { title: Common.L("错题重做", "Review Mistakes"), value: weakCount, unit: Common.L("题待巩固", "to consolidate"), icon: "quiz", href: "review.html" },
    { title: Common.L("收藏小节", "Saved lessons"), value: Store.bookmarksList().length, unit: Common.L("节已收藏", "bookmarked"), icon: "star", href: "stats.html#saved-lessons" }
  ];
  document.getElementById("learning-workbench").innerHTML =
    '<div class="workbench-heading"><div><span class="workspace-kicker">YOUR LEARNING SPACE</span><h2 id="workbench-title">' + (last ? Common.L('接着上次，继续探索', 'Pick up where you left off') : Common.L('从这里，开启你的学习', 'Start your journey here')) + '</h2></div><a href="stats.html">' + Common.L("查看学习统计 ↗", "View learning stats ↗") + '</a></div>' +
    '<div class="workbench-grid"><a class="resume-card" href="' + Common.lessonLink(resume.ch.id, resume.ls.l) + '"><div class="resume-top"><span>' + (last ? Common.L('上次学习', 'Last visited') : Common.L('推荐起点', 'Recommended start')) + '</span><span>' + resume.ch.num + '</span></div><h3>' + resume.ch.id + '.' + resume.ls.l + ' ' + window.esc(I18N.lessonObj(resume.ls).title) + '</h3><p>' + window.esc(I18N.lessonObj(resume.ls).subtitle) + '</p><div class="resume-bottom"><span>' + Common.L("本章已掌握 ", "Mastered ") + resumeProgress.done + '/' + resumeProgress.total + Common.L(' 节', ' lessons') + '</span><b>' + (last ? Common.L('继续学习', 'Continue') : Common.L('开始学习', 'Start')) + ' ↗</b></div></a>' +
    '<div class="workbench-shortcuts">' + shortcuts.map(item => '<a href="' + item.href + '"><span class="tool-icon">' + Common.icon(item.icon, 17) + '</span><span class="shortcut-label">' + item.title + '<small><b>' + item.value + '</b> ' + item.unit + '</small></span><span aria-hidden="true">↗</span></a>').join('') + '</div></div>';

  /* 固定网格让章节、概念和连线在各屏幕尺寸保持可读。 */
  const mapTopics = [
    [{text: "数据类型", en: "Data types", l: 1}, {text: "测量尺度", en: "Measurement scales", l: 3}, {text: "数据变换", en: "Data transform", l: 4}, {text: "Data Join", en: "Data Join", l: 5}],
    [{text: "数据组织", en: "Data organization", l: 2}, {text: "层次结构", en: "Hierarchy", l: 3}, {text: "可视化流程", en: "Pipeline", l: 1}],
    [{text: "颜色模型", en: "Color models", l: 1}, {text: "配色语义", en: "Color semantics", l: 2}, {text: "色觉友好", en: "Color-vision friendly", l: 8}],
    [{text: "比例尺", en: "Scales", l: 2}, {text: "曲线表达", en: "Curves", l: 3}, {text: "等值线", en: "Contours", l: 5}],
    [{text: "时间属性", en: "Time attribute", l: 1}, {text: "趋势", en: "Trends", l: 2}, {text: "周期", en: "Periodicity", l: 4}, {text: "多视图", en: "Multi-view", l: 3}],
  ];
  const mapIcons = [
    '<path d="M7 34h36M7 34V6"/><g fill="currentColor" stroke="none"><circle cx="15" cy="26" r="3"/><circle cx="23" cy="19" r="3"/><circle cx="29" cy="24" r="2"/><circle cx="37" cy="10" r="3"/></g>',
    '<path d="M25 12v8M10 20h30M10 20v9M25 20v9M40 20v9"/><rect x="18" y="4" width="14" height="9" rx="3"/><rect x="4" y="29" width="12" height="9" rx="3"/><rect x="19" y="29" width="12" height="9" rx="3"/><rect x="34" y="29" width="12" height="9" rx="3"/>',
    '<rect x="5" y="8" width="8" height="27" rx="3" fill="currentColor" opacity=".2"/><rect x="16" y="8" width="8" height="27" rx="3" fill="currentColor" opacity=".4"/><rect x="27" y="8" width="8" height="27" rx="3" fill="currentColor" opacity=".65"/><rect x="38" y="8" width="8" height="27" rx="3" fill="currentColor"/>',
    '<path d="M5 36h40M5 36V5M9 29C17 30 16 11 25 19S36 23 44 8"/><circle cx="9" cy="29" r="2" fill="currentColor"/><circle cx="25" cy="19" r="2" fill="currentColor"/><circle cx="44" cy="8" r="2" fill="currentColor"/>',
    Array.from({length:20}, (_,i) => '<rect x="' + (5+i%5*8) + '" y="' + (6+Math.floor(i/5)*8) + '" width="6" height="6" rx="1.5" fill="currentColor" stroke="none" opacity="' + (.2+(i*3%7)/9) + '"/>').join(''),
  ];
  const lastMapLesson = Store.lastLessonRef();
  // 初次访问从第一章开始；有记录时精确标记上次学习的小节。
  const currentChapter = lastMapLesson ? lastMapLesson.ch.id : 1;
  const currentLesson = lastMapLesson ? lastMapLesson.ls.id : "1-1";
  document.getElementById("km-stage").innerHTML = window.COURSE.chapters.map((ch,i) => {
    const chV = I18N.chapterObj(ch);
    const progress = Store.chapterProgress(ch);
    const complete = progress.done === progress.total;
    const current = ch.id === currentChapter;
    const status = complete ? Common.L("已完成", "Completed") : current ? Common.L("当前学习", "Current") : (progress.seen || progress.done) ? Common.L("学习中", "In progress") : Common.L("待探索", "To explore");
    const topics = mapTopics[i].map(topic => {
      const id = Store.lessonId(ch.id, topic.l);
      const done = Store.isCompleted(id);
      const weak = (Store.getLessonWeakPoints(id) || []).length;
      const active = id === currentLesson;
      const label = done ? Common.L("已掌握", "Mastered") : active ? Common.L("当前学习", "Current") : "";
      return '<li><a class="km-topic' + (done ? ' is-done' : '') + (active ? ' is-current' : '') + (weak ? ' is-weak' : '') + '" href="' + Common.lessonLink(ch.id,topic.l) + '"' + (active ? ' aria-current="location"' : '') + '><span class="km-topic-dot" aria-hidden="true">' + (done ? '✓' : '') + '</span><span>' + Common.L(topic.text, topic.en) + '</span><small>' + (weak ? Common.L('待巩固', 'To consolidate') : label || ch.id+'.'+topic.l) + '</small></a></li>';
    }).join('');
    return '<article class="km-cluster' + (i%2===0 ? ' km-upper' : ' km-lower') + (current ? ' is-current' : '') + '" style="--km-color:' + ch.accent + '"><a class="km-chapter' + (complete ? ' is-done' : '') + '" href="chapter.html?c=' + ch.id + '" aria-label="' + chV.num + '，' + chV.route + '，' + status + '"><div class="km-chapter-top"><span>CHAPTER 0' + ch.id + '</span><span class="km-status">' + status + '</span></div><div class="km-chapter-main"><svg viewBox="0 0 50 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">' + mapIcons[i] + '</svg><h3>' + chV.route + '</h3></div><div class="km-chapter-bottom"><span>' + ch.lessons.length + Common.L(' 小节 · 已掌握 ', ' lessons · ') + progress.done + '</span><span aria-hidden="true">↗</span></div></a><ul class="km-topics" aria-label="' + chV.num + Common.L('核心概念', ' core concepts') + '">' + topics + '</ul></article>';
  }).join('');
})();

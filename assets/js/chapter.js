/* ============================================================
 * chapter.js — 章节总览页
 * ============================================================ */
(function () {
  const { c: cid } = Common.params();
  const chRaw = window.COURSE.chapters.find((x) => x.id === cid);
  const ch = chRaw ? window.I18N.chapterObj(chRaw) : null;
  const root = document.getElementById("chapter-root");

  if (!ch) {
    root.innerHTML = '<div class="wrap section"><div class="note warn">' + Common.L("未找到该章节。", "Chapter not found. ") + '<a href="index.html">' + Common.L("返回首页", "Back to home") + "</a></div></div>";
    Shell.init("home");
    Common.renderFooter();
    return;
  }

  Shell.init("ch" + ch.id);
  document.title = ch.num + " · " + ch.title + " — " + Common.L("可视化学习实验室", "Visualization Learning Lab");

  const prog = Store.chapterProgress(ch);
  const next = ch.lessons.find((ls) => !Store.isCompleted(ls.id)) || ch.lessons[0];
  const keyDemos = ["data-transform", "pipeline", "color-semantics", "scale-curve", "time-views"];
  const feature = ch.lessons.find(x => x.demo && keyDemos.includes(x.demo.id)) || ch.lessons.find(x => x.demo);
  const experimentCount = new Set(ch.lessons.filter(x => x.demo).map(x => x.demo.id)).size;

  const nextView = I18N.lessonObj(next);
  root.innerHTML =
    /* 章节头 */
    '<section class="chapter-hero" style="--accent:' + ch.accent + ";--ah1:" + ch.accent + 'cc;--ah2:' + ch.accent + '99">' +
    '<div class="wrap chapter-hero-grid"><div class="chapter-intro">' +
    '<div class="ch-kicker">' + ch.num + " · " + ch.lessons.length + Common.L(" 小节", " lessons") + "</div>" +
    "<h1>" + ch.title + "</h1>" +
    "<p>" + ch.question + "</p>" +
    '<div class="ch-actions">' +
    '<a class="btn btn-primary" href="' + Common.lessonLink(ch.id, next.l) + '">' +
    Common.icon(prog.done ? "refresh" : "play", 14) + " " +
    (prog.done ? Common.L("复习本章", "Review this chapter") : Common.L("从 ", "Start from ") + next.l + " " + nextView.title + Common.L(" 开始", "")) + "</a>" +
    '<a class="btn btn-ghost-l" href="index.html">← ' + Common.L("返回首页", "Back to home") + "</a>" +
    '</div><div class="chapter-facts"><span><b>' + ch.lessons.length + '</b>' + Common.L(" 学习小节", " lessons") + '</span><span><b>' + experimentCount + '</b>' + Common.L(" 交互实验", " experiments") + '</span><span><b>' + prog.done + '</b>' + Common.L(" 已掌握", " mastered") + '</span></div></div>' +
    '<a class="chapter-feature" href="' + Common.lessonLink(ch.id, feature.l) + '"><div class="chapter-feature-top"><span>' + Common.L("本章实验预览", "Chapter experiment preview") + '</span><span>' + String(ch.id).padStart(2, "0") + ' / LAB</span></div>' +
    Common.experimentPreview(feature.demo.id) + '<div class="chapter-feature-bottom"><b>' + I18N.lessonObj(feature).demo.title + '</b><span>' + Common.L("动手探索 ↗", "Explore ↗") + '</span></div></a></div></section>' +

    '<div class="wrap chapter-body">' +
    '<div class="progress-bar" style="height:9px"><i style="width:' + prog.pct + '%;background:' + ch.accent + '"></i></div>' +
    '<div class="muted" style="margin:6px 0 24px">' + Common.L("本章进度：已完成 ", "Chapter progress: ") + prog.done + "/" + prog.total +
    Common.L(" 节（", " lessons (") + prog.pct + Common.L("%）", "%)") + "</div>" +

    '<div class="ch-goal-grid">' +
      '<div class="content-card">' +
        '<h2><span class="h-ico">' + Common.icon("target", 15) + '</span>' + Common.L("本章目标", "Chapter goals") + '</h2>' +
        '<p style="color:var(--text-2)">' + ch.outcome + "</p>" +
      "</div>" +
      '<div class="content-card">' +
        '<h2><span class="h-ico">' + Common.icon("compass", 15) + '</span>' + Common.L("学习前需要", "Before you start") + '</h2>' +
        '<div>' + ch.prereq.map((p) => '<span class="ptag">' + p + "</span>").join("") + "</div>" +
      "</div>" +
    "</div>" +

    /* 小节列表 */
    '<h2 class="ch-sec-h">' + Common.L("小节学习路径", "Lesson path") + '</h2>' +
    '<div id="lesson-list" style="display:grid;gap:10px"></div>' +

    /* 本章实验 */
    '<h2 class="ch-sec-h">' + Common.L("本章交互实验", "Interactive experiments") + '</h2>' +
    '<div class="exp-grid" id="chapter-exps"></div>' +
    "</div>";

  /* 小节行 */
  const list = d3.select("#lesson-list");
  ch.lessons.forEach((lsRaw) => {
    const ls = I18N.lessonObj(lsRaw);
    const done = Store.isCompleted(ls.id);
    const seen = Store.isVisited(ls.id);
    const quiz = Store.getQuiz(ls.id);
    const weak = Store.getLessonWeakPoints(ls.id);
    const row = list.append("a").attr("class", "lesson-row")
      .style("--accent", ch.accent)
      .attr("href", Common.lessonLink(ch.id, ls.l));
    row.classed("is-complete", done);
    const dotCls = done ? " done" : seen ? " seen" : "";
    row.html(
      '<div class="lr-dot' + dotCls + '">' + (done ? "✓" : seen ? "•" : ls.l) + "</div>" +
      '<div class="lr-body">' +
      '<div class="lr-title">' + ch.id + "." + ls.l + " " + ls.title + "</div>" +
      '<div class="lr-sub">' + ls.subtitle + "</div>" +
      "</div>" +
      '<div class="lr-side">' +
      '<span class="lesson-status' + (done ? ' complete' : seen ? ' visited' : '') + '">' + (done ? Common.L('已掌握', 'Mastered') : seen ? Common.L('已浏览', 'Visited') : Common.L('未开始', 'Not started')) + '</span>' +
      (weak && weak.length ? '<span class="badge chip" style="background:var(--amber-soft);color:#92400e;border-color:#fcd34d">' + Common.L('待巩固 ', 'To consolidate ') + weak.length + Common.L(' 题', '') + '</span>' : "") +
      (quiz ? '<span class="badge chip quiz-ok">' + Common.L('自测 ', 'Quiz ') + quiz.correct + "/" + quiz.total + "</span>" : "") +
      (Store.isBookmarked(ls.id) ? '<span class="badge chip">' + Common.icon("star-fill", 11) + ' ' + Common.L("已收藏", "Saved") + '</span>' : "") +
      '<span class="btn btn-ghost btn-sm" style="pointer-events:none">' + Common.L("进入 →", "Open →") + '</span>' +
      "</div>");
  });

  /* 本章实验卡 */
  const expBox = d3.select("#chapter-exps");
  const KEY = { "data-transform":1,"data-join":1,"pipeline":1,"color-semantics":1,"scale-curve":1,"time-views":1 };
  ch.lessons.forEach((ls) => {
    if (!ls.demo) return;
    const isKey = KEY[ls.demo.id] ? 1 : 0;
    const card = expBox.append("div").attr("class", "exp-card with-preview" + (isKey ? " key" : ""));
    card.html(
      Common.experimentPreview(ls.demo.id) +
      '<div class="exp-card-body">' +
      '<div class="exp-card-top">' +
      '<h4 style="margin:0">' + ls.demo.title + "</h4>" +
      (isKey ? '<span class="badge key">' + Common.L("重点", "Key") + '</span>' : "") + "</div>" +
      '<div class="exp-meta">' + ch.id + "." + ls.l + " " + ls.title + "</div>" +
      "<p>" + ls.demo.task + "</p>" +
      '<a class="btn btn-soft btn-sm" href="' + Common.lessonLink(ch.id, ls.l) + '">' + Common.L("在小节中打开", "Open in lesson") + '</a></div>');
  });

  Common.renderFooter();
})();

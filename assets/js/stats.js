/* ============================================================
 * stats.js — 学习统计仪表盘 + 学习数据导出/导入/清除
 * ============================================================ */
(function () {
  Shell.init("stats");
  Common.renderFooter();

  document.getElementById("ico-chapter").innerHTML = Common.icon("book", 15);
  document.getElementById("ico-quiz").innerHTML = Common.icon("quiz", 15);
  document.getElementById("ico-data").innerHTML = Common.icon("info", 15);

  /* ---------- 总览卡片 ---------- */
  const ov = Store.overallProgress();
  const weak = Store.getAllWeakPoints();
  const weakQ = weak.reduce((n, w) => n + w.mistakes.length, 0);
  const noteCount = Store.getAllNotes().length;
  const favCount = Store.bookmarksList().length;
  document.getElementById("stat-cards").innerHTML =
    '<div class="stat-card"><div class="stat-num">' + ov.pct + '%</div><div class="stat-label">' + Common.L("总进度（", "Overall progress (") + ov.done + "/" + ov.total + Common.L(" 节）", " lessons)") + '</div></div>' +
    '<div class="stat-card"><div class="stat-num">' + weakQ + '</div><div class="stat-label">' + Common.L("待巩固错题", "Mistakes to consolidate") + '<a class="stat-link" href="review.html">' + Common.L("去重做 ↗", "Redo ↗") + '</a></div></div>' +
    '<div class="stat-card"><div class="stat-num">' + noteCount + '</div><div class="stat-label">' + Common.L("学习笔记", "Notes") + '<a class="stat-link" href="notes.html">' + Common.L("查看 ↗", "View ↗") + '</a></div></div>' +
    '<div class="stat-card"><div class="stat-num">' + favCount + '</div><div class="stat-label">' + Common.L("收藏小节", "Saved lessons") + '<a class="stat-link" href="#saved-lessons">' + Common.L("查看 ↗", "View ↗") + '</a></div></div>';

  /* ---------- 章节完成度 ---------- */
  const chHost = document.getElementById("stat-chapters");
  chHost.innerHTML = window.COURSE.chapters.map((chRaw) => {
    const ch = I18N.chapterObj(chRaw);
    const p = Store.chapterProgress(chRaw);
    return '<div class="stat-row">' +
      '<a class="stat-row-name" href="chapter.html?c=' + ch.id + '">' + ch.num + " " + ch.title + "</a>" +
      '<div class="stat-row-bar"><div class="progress-bar"><i style="width:' + p.pct + "%;background:" + ch.accent + '"></i></div></div>' +
      '<div class="stat-row-val">' + p.done + "/" + p.total + "</div></div>";
  }).join("");

  /* ---------- 自测正确率 ---------- */
  const quizHost = document.getElementById("stat-quiz");
  const rows = [];
  window.COURSE.chapters.forEach((chRaw) => {
    chRaw.lessons.forEach((lsRaw) => {
      const s = Store.getQuiz(lsRaw.id);
      if (s && s.total) rows.push({ ch: I18N.chapterObj(chRaw), ls: I18N.lessonObj(lsRaw), correct: s.correct, total: s.total });
    });
  });
  if (!rows.length) {
    quizHost.innerHTML = '<p class="muted">' + Common.L("还没有自测记录。每个小节底部都有 2–3 道自测题，做完会记录在这里。", "No quiz records yet. Each lesson ends with 2–3 questions; results are recorded here.") + "</p>";
  } else {
    rows.sort((a, b) => a.correct / a.total - b.correct / b.total);
    quizHost.innerHTML =
      '<p class="muted" style="font-size:13.5px;margin-bottom:12px">' + Common.L("按正确率从低到高排列，优先关注排名靠前的小节。", "Sorted by accuracy (low first) — focus on the lessons at the top.") + "</p>" +
      rows.map((r) => {
        const pct = Math.round((r.correct / r.total) * 100);
        const weakN = (Store.getLessonWeakPoints(r.ls.id) || []).length;
        return '<div class="stat-row">' +
          '<a class="stat-row-name" href="' + Common.lessonLink(r.ch.id, r.ls.l) + '">' +
          r.ch.id + "." + r.ls.l + " " + r.ls.title + "</a>" +
          '<div class="stat-row-bar"><div class="progress-bar"><i style="width:' + pct + '%;background:' +
          (pct === 100 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626") + '"></i></div></div>' +
          '<div class="stat-row-val">' + r.correct + "/" + r.total +
          (weakN ? ' <span class="rv-weak-tag">' + Common.L("待巩固 ", "To fix ") + weakN + "</span>" : "") + "</div></div>";
      }).join("");
  }

  document.getElementById("ico-saved").innerHTML = Common.icon("star", 15);
  const saved = Store.bookmarksList();
  document.getElementById("saved-lessons-list").innerHTML = saved.length
    ? saved.map(({ch, ls}) => { const chV = I18N.chapterObj(ch), lsV = I18N.lessonObj(ls); return '<a class="saved-lesson" href="' + Common.lessonLink(ch.id, ls.l) + '"><span class="saved-number">' + ch.id + '.' + ls.l + '</span><span><b>' + window.esc(lsV.title) + '</b><small>' + chV.num + ' · ' + window.esc(chV.title) + '</small></span><span aria-hidden="true">↗</span></a>'; }).join('')
    : '<div class="saved-empty">' + Common.L("还没有收藏。学习时点击小节底部的「收藏」，就能在这里快速回看。", "No saved lessons yet. Click “Save” at the bottom of a lesson to pin it here.") + '<a href="index.html#route-index">' + Common.L("浏览课程 →", "Browse the course →") + "</a></div>";

  /* ---------- 数据导出 / 导入 / 清除（逻辑在 common.js，与命令面板共用） ---------- */
  document.getElementById("btn-export").addEventListener("click", () => Common.exportData());
  document.getElementById("btn-import").addEventListener("click", () => Common.importData());
  document.getElementById("btn-reset").addEventListener("click", () => Common.resetData());
})();

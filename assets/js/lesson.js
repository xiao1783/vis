/* ============================================================
 * lesson.js — 小节学习页（目录 / 讲解 / 实验三栏）
 * ============================================================ */
(function () {
  const { c: cid, l: lid } = Common.params();
  const found = Common.findLesson(cid, lid);
  const main = document.getElementById("learn-main");

  if (!found) {
    main.innerHTML = '<div class="note warn">' + Common.L("未找到该小节。", "Lesson not found. ") + '<a href="index.html">' + Common.L("返回首页", "Back to home") + "</a></div>";
    Shell.init("home");
    Common.renderFooter();
    return;
  }
  const ch = I18N.chapterObj(found.ch);
  const ls = I18N.lessonObj(found.ls);
  document.documentElement.style.setProperty("--accent", ch.accent);
  document.title = ch.id + "." + ls.l + " " + ls.title + " · " + Common.L("可视化学习实验室", "Visualization Learning Lab");
  Shell.init("ch" + ch.id);
  Store.visit(ch.id, ls.l);

  const adj = Common.adjacentLessons(ch.id, ls.l);

  /* ============ 左侧目录 ============ */
  const sidebar = document.getElementById("sidebar");
  function renderSidebar() {
    const sp = Store.chapterProgress(ch);
    let sb =
      '<div class="sb-chapter"><a href="chapter.html?c=' + ch.id + '">' + ch.num + " · " + ch.title + "</a></div>" +
      '<div class="sb-progress"><div class="progress-bar"><i style="width:' + sp.pct + '%;background:' + ch.accent + '"></i></div>' +
      sp.done + "/" + sp.total + Common.L(" 节已完成", " lessons completed") + "</div>";
    ch.lessons.forEach((xRaw) => {
      const x = I18N.lessonObj(xRaw);
      let cls = x.id === ls.id ? " active" : "";
      if (Store.isCompleted(x.id)) cls += " completed";
      else if (Store.isVisited(x.id)) cls += " visited";
      sb += '<a class="sb-item' + cls + '" href="' + Common.lessonLink(ch.id, x.l) + '">' +
        '<span class="sb-no">' + ch.id + "." + x.l + "</span>" +
        '<span class="sb-name">' + x.title + "</span>" +
        '<span class="sb-dot"></span></a>';
    });
    sb += '<div style="padding:10px 12px"><a href="chapter.html?c=' + ch.id + '" style="font-size:13px">← ' + Common.L("章节总览", "Chapter overview") + "</a></div>";
    sidebar.innerHTML = sb;
  }
  renderSidebar();

  /* ============ 中间内容 ============ */
  function renderBlock(b) {
    switch (b.t) {
      case "h3": return '<h3 class="sub" id="' + ("b-" + Math.random().toString(36).slice(2, 7)) + '">' + b.x + "</h3>";
      case "p": return "<p>" + b.x + "</p>";
      case "ul": return "<ul>" + b.x.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
      case "ol": return "<ol>" + b.x.map((x) => "<li>" + x + "</li>").join("") + "</ol>";
      case "note": return '<div class="note ' + (b.kind || "info") + '"><span class="ni">' +
        Common.icon(b.kind === "warn" ? "warn" : b.kind === "tip" ? "bulb" : "info", 15) + "</span><p>" + b.x + "</p></div>";
      case "table":
        return '<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="' + Common.L("课程内容表格，可横向滚动", "Lesson table, scrollable horizontally") + '"><table class="tbl"><thead><tr>' + b.head.map((h) => "<th>" + h + "</th>").join("") +
          "</tr></thead><tbody>" + b.rows.map((r) => "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>";
      default: return "";
    }
  }

  const goalHtml =
    '<div class="lesson-goal"><h3>' + Common.icon("pin", 14) + Common.L(" 本节学习目标", " Lesson goals") + '</h3><ul>' +
    ls.goal.map((g) => "<li>" + g + "</li>").join("") + "</ul></div>";

  const prereqHtml =
    '<div class="prereq"><b>' + Common.L("前置知识：", "Prerequisites: ") + "</b>" +
    ls.prereq.map((p) => '<span class="ptag">' + p + "</span>").join("") + "</div>";

  const bodyHtml = ls.blocks.map(renderBlock).join("");

  const codeHtml = (ls.code || []).map((cd, i) => {
    const codeId = "code-" + i;
    return (
      '<div class="code-block">' +
      '<div class="cb-head"><span>' + Common.icon("code", 13) + " " + cd.title + "</span>" +
      '<button class="cb-copy" data-code="' + codeId + '">' + Common.L("复制代码", "Copy code") + '</button></div>' +
      (cd.purpose ? '<div class="cb-purpose">' + Common.icon("book", 13) + " " + cd.purpose + "</div>" : "") +
      '<pre><code class="language-javascript" id="' + codeId + '">' + Prism.highlight(cd.code, Prism.languages.javascript, "javascript") + "</code></pre>" +
      (cd.kp && cd.kp.length ? '<div class="cb-keypoints"><b>' + Common.L("关键点", "Key points") + '</b><ul>' +
        cd.kp.map((k) => "<li>" + k + "</li>").join("") + "</ul></div>" : "") +
      "</div>");
  }).join("");

  const pitfallHtml =
    '<div class="content-card"><h2><span class="h-ico">' + Common.icon("warn", 15) + '</span>' + Common.L("易错点与常见误区", "Pitfalls & misconceptions") + '</h2>' +
    '<ul class="pitfall-list">' + ls.pitfalls.map((p) => "<li>" + p + "</li>").join("") + "</ul></div>";

  /* 自测（卡片由 renderQuiz 生成，支持原地重置，不整页刷新） */
  const quizSection =
    '<div class="content-card"><h2><span class="h-ico">' + Common.icon("quiz", 15) + '</span>' + Common.L("小节自测", "Lesson quiz") + '</h2>' +
    '<p class="muted" style="font-size:14px">' + Common.L("作答后即时反馈，可查看解释与常见误区；成绩会记录在当前浏览器。", "Instant feedback after each answer, with explanations and common misconceptions; scores are stored in this browser.") + '</p>' +
    '<div id="quiz-body"></div></div>';

  /* 上/下一节 */
  const footBtn = (x, dir) => {
    if (!x) return '<span style="width:1px"></span>';
    const cls = dir === "next" ? "lf-btn next" : "lf-btn";
    const arrow = dir === "next" ? Common.L("下一节 →", "Next →") : Common.L("← 上一节", "← Previous");
    return '<a class="' + cls + '" href="' + Common.lessonLink(x.ch.id, x.ls.l) + '">' +
      '<span class="lf-dir">' + arrow + '</span><span>' + x.ch.id + "." + x.ls.l + " " + I18N.lessonObj(x.ls).title + "</span></a>";
  };

  main.innerHTML =
    '<div class="crumb"><a href="index.html">' + Common.L("首页", "Home") + '</a> / <a href="chapter.html?c=' + ch.id + '">' +
    ch.num + '</a> / <span>' + ch.id + "." + ls.l + " " + ls.title + "</span></div>" +
    '<button class="btn btn-ghost btn-sm sidebar-toggle" id="sidebar-toggle">' + Common.icon("menu", 14) + Common.L(" 本章目录", " Chapter contents") + '</button>' +
    '<a class="btn btn-soft btn-sm lesson-lab-link" href="#lab-pane">' + Common.L("进入本节实验 ↓", "Open this lesson's lab ↓") + '</a>' +
    '<div class="lesson-head"><div class="lh-tag">' + ch.num + " · " + Common.L("小节 ", "Lesson ") + ch.id + "." + ls.l + "</div>" +
    "<h1>" + ls.title + "</h1>" +
    '<p class="lh-sub">' + ls.subtitle + "</p></div>" +

    '<div class="content-card"><h2><span class="h-ico">' + Common.icon("question", 15) + '</span>' + Common.L("本节问题", "Guiding question") + '</h2>' +
    '<p style="font-size:16px;color:var(--text-2);margin:0">' + ls.question + "</p>" + goalHtml +
    '<div style="margin-top:12px">' + prereqHtml + "</div></div>" +

    '<div class="content-card"><h2><span class="h-ico">' + Common.icon("bulb", 15) + '</span>' + Common.L("核心结论", "Key takeaway") + '</h2>' +
    '<div class="keyline">' + ls.keyPoint + "</div>" + bodyHtml + "</div>" +

    '<div class="content-card"><h2><span class="h-ico">' + Common.icon("code", 15) + '</span>' + Common.L("关键代码", "Key code") + '</h2>' +
    (codeHtml || '<p class="muted">' + Common.L("本节以概念与实验为主。", "This lesson focuses on concepts and the experiment.") + '</p>') + "</div>" +
    '<div id="pg-slot"></div>' +

    pitfallHtml + quizSection + '<div id="weak-hint"></div>' +

    /* 学习笔记 */
    '<div class="content-card note-card" id="note-card">' +
    '<h2><span class="h-ico">' + Common.icon("edit", 15) + '</span>' + Common.L("我的笔记", "My notes") +
    '<button class="btn btn-ghost btn-sm" id="note-toggle" aria-expanded="false" aria-controls="note-body" style="margin-left:auto">' + Common.icon("chevron-down", 14) + Common.L(" 展开", " Expand") + '</button></h2>' +
    '<div class="note-body" id="note-body" style="display:none">' +
    '<textarea id="note-text" placeholder="' + Common.L("记录本节要点、疑问或心得…支持 #标签，自动保存到当前浏览器", "Note down key points, questions or thoughts… #tags supported; auto-saved in this browser") + '">' + window.esc(Store.getNote(ch.id, ls.l)) + "</textarea>" +
    '<div class="note-meta" id="note-meta" role="status">' + (Store.getNote(ch.id, ls.l) ? Common.L("已保存", "Saved") : "") + "</div>" +
    "</div></div>" +

    '<div class="lesson-footer">' +
    footBtn(adj.prev, "prev") +
    '<div class="lf-actions">' +
    '<button class="fav-btn" id="fav-btn">' + Common.icon("star", 14) + Common.L(" 收藏", " Save") + '</button>' +
    '<button class="mark-done" id="mark-done">' + Common.icon("check", 14) + Common.L(" 标记本节已掌握", " Mark as mastered") + "</button>" +
    "</div>" +
    footBtn(adj.next, "next") +
    "</div>";

  /* 目录抽屉（移动端） */
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    let mask = document.getElementById("sb-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.className = "drawer-mask";
      mask.id = "sb-mask";
      mask.style.zIndex = 200;
      document.body.appendChild(mask);
      mask.addEventListener("click", () => { sidebar.classList.remove("open"); mask.classList.remove("open"); });
    }
    mask.classList.add("open");
  });

  /* 复制代码 */
  main.querySelectorAll(".cb-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = document.getElementById(btn.dataset.code).textContent;
      Common.copyText(code, btn);
    });
  });

  /* 收藏 / 完成 */
  const favBtn = document.getElementById("fav-btn");
  function syncFav() {
    const on = Store.isBookmarked(ls.id);
    favBtn.classList.toggle("on", on);
    favBtn.innerHTML = Common.icon(on ? "star-fill" : "star", 14) + (on ? Common.L(" 已收藏", " Saved") : Common.L(" 收藏", " Save"));
  }
  syncFav();
  favBtn.addEventListener("click", () => {
    const on = Store.toggleBookmark(ch.id, ls.l);
    syncFav();
    Common.toast(on ? Common.L("已加入收藏", "Added to bookmarks") : Common.L("已取消收藏", "Bookmark removed"));
  });

  const doneBtn = document.getElementById("mark-done");
  function syncDone() {
    const on = Store.isCompleted(ls.id);
    doneBtn.classList.toggle("is-done", on);
    doneBtn.innerHTML = Common.icon("check", 14) + (on ? Common.L(" 已标记掌握", " Mastered") : Common.L(" 标记本节已掌握", " Mark as mastered"));
  }
  syncDone();
  doneBtn.addEventListener("click", () => {
    const on = Store.toggleComplete(ch.id, ls.l);
    syncDone();
    renderSidebar();
    Common.toast(on ? Common.L("已标记掌握，进度已更新", "Marked as mastered, progress updated") : Common.L("已取消掌握标记", "Mastered mark removed"), on ? "ok" : "warn");
  });

  /* 自测逻辑（原地渲染与重置） */
  const answered = {};
  function refreshScore() {
    const total = ls.quiz.length;
    const correct = Object.values(answered).filter((v) => v === true).length;
    const answeredCount = Object.keys(answered).length;
    const el = document.getElementById("quiz-score");
    if (el && answeredCount) {
      el.textContent = Common.L("已答 ", "Answered ") + answeredCount + "/" + total + Common.L("，正确 ", ", ") + correct + Common.L(" 题", " correct");
      if (answeredCount === total) {
        Store.recordQuiz(ch.id, ls.l, correct, total);
        const answerArr = ls.quiz.map((_, i) => answered[i] === true);
        Store.recordQuizDetail(ch.id, ls.l, answerArr);
        renderWeakHint();
      }
    }
  }

  /* 薄弱点提示 */
  function renderWeakHint() {
    const host = document.getElementById("weak-hint");
    if (!host) return;
    const weak = Store.getLessonWeakPoints(ls.id);
    if (!weak || !weak.length) {
      host.style.display = "none";
      return;
    }
    host.style.display = "";
    host.innerHTML =
      '<div class="note warn" style="margin-top:12px"><span class="ni">' + Common.icon("warn", 15) + '</span><p>' + Common.L("本节自测中，你有 ", "You answered ") + "<b>" + weak.length + "</b>" + Common.L(" 道题答错了（题号：", " question(s) wrong in this quiz (No. ") + weak.map((i) => i + 1).join("、") + Common.L("）。建议重新阅读对应知识点后再做一遍。", "). Re-read the related points and try again. ") + '<a href="review.html">' + Common.L("去错题本重做 →", "Go to mistake review →") + "</a></p></div>";
  }
  function renderQuiz() {
    const qb = document.getElementById("quiz-body");
    let h = "";
    ls.quiz.forEach((q, qi) => {
      const name = "q-" + ls.id + "-" + qi;
      h += '<div class="quiz-card" data-qi="' + qi + '">' +
        '<div class="q-head"><span class="q-no">Q' + (qi + 1) + "</span><span class=\"q-text\">" + q.q + "</span></div>" +
        '<div class="q-opts">' +
        q.opts.map((o, oi) =>
          '<label class="q-opt" data-oi="' + oi + '"><input type="radio" name="' + name + '" value="' + oi + '">' +
          "<span>" + o + "</span></label>").join("") +
        "</div>" +
        '<div class="q-feedback" id="fb-' + ls.id + "-" + qi + '"></div></div>';
    });
    h += '<div style="margin-top:6px"><button class="btn btn-ghost btn-sm" id="reset-quiz">' + Common.L("重新作答", "Retry") + '</button>' +
      '<span class="muted" style="margin-left:10px;font-size:13px" id="quiz-score"></span></div>';
    qb.innerHTML = h;

    qb.querySelectorAll(".quiz-card").forEach((card) => {
      const qi = +card.dataset.qi;
      const q = ls.quiz[qi];
      const opts = card.querySelectorAll(".q-opt");
      const fb = card.querySelector(".q-feedback");
      opts.forEach((opt) => {
        opt.addEventListener("click", () => {
          if (answered[qi] !== undefined) return;
          const oi = +opt.dataset.oi;
          const isCorrect = oi === q.ans;
          answered[qi] = isCorrect;
          opts.forEach((o) => {
            o.classList.add("locked");
            o.querySelector("input").disabled = true;
            if (+o.dataset.oi === q.ans) o.classList.add("correct");
            if (+o.dataset.oi === oi && !isCorrect) o.classList.add("wrong");
          });
          fb.classList.add("show");
          fb.classList.add(isCorrect ? "ok" : "no");
          fb.innerHTML =
            '<div class="qf-title">' + Common.icon(isCorrect ? "check" : "x", 14) + (isCorrect ? Common.L(" 回答正确", " Correct") : Common.L(" 回答不正确", " Incorrect")) + "</div>" +
            "<div><b>" + Common.L("解释：", "Explanation: ") + "</b>" + q.explain + "</div>" +
            (isCorrect ? "" : '<div style="margin-top:5px"><b>' + Common.L("常见误区：", "Common mistake: ") + "</b>" + q.mistake + "</div>");
          refreshScore();
        });
      });
    });

    document.getElementById("reset-quiz").addEventListener("click", () => {
      Object.keys(answered).forEach((k) => delete answered[k]);
      renderQuiz();
      Common.toast(Common.L("自测已重置，可重新作答", "Quiz reset — you can answer again"));
    });
  }
  renderQuiz();
  renderWeakHint();

  /* 学习笔记 */
  const noteToggle = document.getElementById("note-toggle");
  const noteBody = document.getElementById("note-body");
  const noteText = document.getElementById("note-text");
  const noteMeta = document.getElementById("note-meta");
  noteToggle.addEventListener("click", () => {
    const open = noteBody.style.display === "none";
    noteBody.style.display = open ? "" : "none";
    noteToggle.setAttribute("aria-expanded", String(open));
    noteToggle.innerHTML = Common.icon(open ? "chevron-up" : "chevron-down", 14) + (open ? Common.L(" 收起", " Collapse") : Common.L(" 展开", " Expand"));
  });
  let noteTimer;
  function saveNote() {
    clearTimeout(noteTimer);
    const text = noteText.value.trim();
    if (text !== Store.getNote(ch.id, ls.l)) Store.setNote(ch.id, ls.l, text);
    noteMeta.textContent = text ? Common.L("已保存", "Saved") : Common.L("暂无笔记", "No notes yet");
  }
  noteText.addEventListener("blur", saveNote);
  window.addEventListener("pagehide", saveNote);
  noteText.addEventListener("input", () => {
    clearTimeout(noteTimer);
    noteMeta.textContent = Common.L("正在保存…", "Saving…");
    noteTimer = setTimeout(saveNote, 400);
  });
  if (Store.getNote(ch.id, ls.l)) {
    noteToggle.click();
  }

  /* 参数实验室 */
  const pgSlot = document.getElementById("pg-slot");
  if (window.CodePlayground) {
    CodePlayground.mount(ls.id, pgSlot);
  }

  /* 快捷键与命令面板动作 */
  function focusNote() {
    if (noteBody.style.display === "none") noteToggle.click();
    noteText.scrollIntoView({ block: "center", behavior: "smooth" });
    noteText.focus();
  }
  window.addEventListener("vll:cmd", (e) => {
    if (e.detail === "toggle-done") doneBtn.click();
    else if (e.detail === "reset-quiz") { const b = document.getElementById("reset-quiz"); if (b) b.click(); }
    else if (e.detail === "focus-note") focusNote();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target && e.target.matches && e.target.matches("input,textarea,select")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const cp = document.getElementById("cmd-palette");
    if (cp && cp.classList.contains("open")) return;
    if (e.key === "j" && adj.next) location.href = Common.lessonLink(adj.next.ch.id, adj.next.ls.l);
    else if (e.key === "k" && adj.prev) location.href = Common.lessonLink(adj.prev.ch.id, adj.prev.ls.l);
    else if (e.key === "m") doneBtn.click();
    else if (e.key === "n") { e.preventDefault(); focusNote(); }
  });

  /* ============ 右侧实验 ============ */
  const lab = document.getElementById("lab-pane");
  lab.innerHTML =
    '<div class="lab-head"><div class="lab-kicker">' + Common.icon("flask", 13) + Common.L(" 交互实验", " Interactive lab") + "</div>" +
    "<h3>" + ls.demo.title + '</h3><a class="lab-return-link" href="#learn-main">← ' + Common.L("返回讲解", "Back to lesson") + "</a></div>" +
    '<div class="lab-body">' +
    '<div class="lab-task"><b>' + Common.icon("target", 13) + Common.L(" 实验任务", " Task") + "</b>" + ls.demo.task + "</div>" +
    '<div id="lab-mount"></div>' +
    '<div class="lab-observe"><b>' + Common.icon("eye", 13) + Common.L(" 你应该观察到", " What to observe") + "</b><br>" + ls.demo.observe + "</div>" +
    "</div>";

  const mount = document.getElementById("lab-mount");
  function mountDemo() {
    try {
      if (window.Demos && typeof window.Demos.render === "function") {
        window.Demos.render(ls.demo.id, mount, { ch, ls });
        if (new URLSearchParams(location.search).get("mode") === "lab") {
          mount.querySelector('[data-tool="focus"]').click();
        }
      } else {
        mount.innerHTML = '<div class="note warn">' + Common.L("实验模块未加载。", "Experiment module failed to load.") + "</div>";
      }
    } catch (e) {
      console.error(e);
      mount.innerHTML = '<div class="note danger">' + Common.L("实验初始化失败：", "Experiment failed to initialize: ") + window.esc(e.message) + "</div>";
    }
  }
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(mountDemo, 0);
  } else {
    window.addEventListener("DOMContentLoaded", mountDemo);
  }

  Common.renderFooter();
})();

/* ============================================================
 * review.js — 错题重做页
 * 汇总 quizDetail 中的答错题；答错不揭示答案、可重试，答对即移出错题本
 * ============================================================ */
(function () {
  Shell.init("review");
  Common.renderFooter();

  const listEl = document.getElementById("review-list");
  const statEl = document.getElementById("review-stat");

  function weakItems() {
    return Store.getAllWeakPoints().map((w) => {
      const [c, l] = w.id.split("-").map(Number);
      const found = Common.findLesson(c, l);
      return found ? { ch: I18N.chapterObj(found.ch), ls: I18N.lessonObj(found.ls), mistakes: w.mistakes } : null;
    }).filter(Boolean);
  }

  function questionHtml(ls, qi) {
    const q = ls.quiz[qi];
    return '<div class="quiz-card rv-q" data-ls="' + ls.id + '" data-qi="' + qi + '">' +
      '<div class="q-head"><span class="q-no">Q' + (qi + 1) + '</span><span class="q-text">' + q.q + "</span></div>" +
      '<div class="q-opts">' +
      q.opts.map((o, oi) =>
        '<label class="q-opt" data-oi="' + oi + '"><input type="radio" name="rv-' + ls.id + "-" + qi + '"><span>' + o + "</span></label>").join("") +
      "</div>" +
      '<div class="q-feedback"></div></div>';
  }

  function render() {
    const items = weakItems();
    const totalQ = items.reduce((n, x) => n + x.mistakes.length, 0);
    statEl.innerHTML = items.length
      ? Common.L("共 ", "") + "<b>" + totalQ + "</b>" + Common.L(" 道错题，分布在 ", " mistake(s) across ") + "<b>" + items.length + "</b>" + Common.L(" 个小节。", " lesson(s).")
      : "";
    if (!items.length) {
      listEl.innerHTML = '<div class="note-empty"><div class="empty-art" aria-hidden="true">' + Common.experimentPreview('good-bad') + '</div><h2>' + Common.L("当前没有待巩固的错题", "No mistakes to consolidate") + '</h2><p>' + Common.L("完成小节自测后，答错的题目会汇总在这里，方便回看与重做。", "After a lesson quiz, wrong answers are collected here for review and retry.") + '</p><a class="btn btn-primary btn-sm" href="index.html#route-index">' + Common.L("回到学习路线 ↗", "Back to learning path ↗") + "</a></div>";
      return;
    }
    listEl.innerHTML = items.map((it) =>
      '<section class="content-card rv-card">' +
      '<div class="rv-head"><div>' +
      '<div class="rv-crumb">' + it.ch.num + " · " + Common.L("小节 ", "Lesson ") + it.ch.id + "." + it.ls.l + "</div>" +
      '<h3 class="rv-title">' + window.esc(it.ls.title) + "</h3></div>" +
      '<a class="btn btn-ghost btn-sm" href="' + Common.lessonLink(it.ch.id, it.ls.l) + '">' + Common.L("回看小节 ↗", "Open lesson ↗") + "</a></div>" +
      it.mistakes.map((qi) => questionHtml(it.ls, qi)).join("") +
      "</section>"
    ).join("");
    bind();
  }

  function bind() {
    listEl.querySelectorAll(".rv-q").forEach((card) => {
      const lsId = card.dataset.ls, qi = +card.dataset.qi;
      const [c, l] = lsId.split("-").map(Number);
      const found = Common.findLesson(c, l);
      if (!found) return;
      const lsView = I18N.lessonObj(found.ls);
      const q = lsView.quiz[qi];
      const fb = card.querySelector(".q-feedback");
      card.querySelectorAll(".q-opt").forEach((opt) => {
        opt.addEventListener("click", () => {
          if (card.classList.contains("solved") || opt.classList.contains("wrong")) return;
          const oi = +opt.dataset.oi;
          if (oi === q.ans) {
            card.classList.add("solved");
            opt.classList.add("correct", "locked");
            opt.querySelector("input").disabled = true;
            fb.className = "q-feedback show ok";
            fb.innerHTML = '<div class="qf-title">' + Common.icon("check", 14) + Common.L(" 回答正确，本题已移出错题本", " Correct — removed from the mistake list") + "</div>";
            const left = Store.resolveWeakPoint(c, l, qi);
            Common.toast(left ? Common.L("该小节还剩 ", "This lesson has ") + left + Common.L(" 道错题", " mistake(s) left") : Common.L("该小节错题已全部清除", "All mistakes cleared for this lesson"), "ok");
            setTimeout(() => { card.classList.add("rv-fade"); setTimeout(render, 280); }, 900);
          } else {
            opt.classList.add("wrong", "locked");
            opt.querySelector("input").disabled = true;
            fb.className = "q-feedback show no";
            fb.innerHTML = '<div class="qf-title">' + Common.icon("x", 14) + Common.L(" 回答不正确，再想想", " Incorrect — try again") + "</div>" +
              "<div><b>" + Common.L("提示：", "Hint: ") + "</b>" + q.mistake + "</div>";
          }
        });
      });
    });
  }

  render();
})();

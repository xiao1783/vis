/* ============================================================
 * notes.js — 笔记总览页：全文搜索 / #标签筛选 / 导出 Markdown
 * ============================================================ */
(function () {
  Shell.init("notes");
  Common.renderFooter();

  const listEl = document.getElementById("notes-list");
  const searchEl = document.getElementById("notes-search");
  const searchIco = document.getElementById("notes-search-ico");
  const tagsEl = document.getElementById("notes-tags");
  const exportBtn = document.getElementById("notes-export");
  if (searchIco) searchIco.innerHTML = Common.icon("search", 14);

  let activeTag = "";

  function extractTags(text) {
    return (text.match(/#[^\s#，。,.;；、！!？?]+/g) || []).map((t) => t.slice(1));
  }
  function allTags() {
    const set = new Set();
    Store.getAllNotes().forEach((n) => extractTags(n.text).forEach((t) => set.add(t)));
    return [...set];
  }

  function renderTags() {
    const tags = allTags();
    if (!tags.length) { tagsEl.innerHTML = ""; return; }
    tagsEl.innerHTML =
      '<span class="muted" style="font-size:13px;align-self:center">' + Common.L("标签：", "Tags: ") + "</span>" +
      tags.map((t) => '<button class="note-tag' + (t === activeTag ? " active" : "") + '" data-tag="' + window.esc(t) + '">#' + window.esc(t) + "</button>").join("") +
      (activeTag ? '<button class="note-tag note-tag-clear" data-tag="">' + Common.L("清除筛选 ×", "Clear filter ×") + "</button>" : "");
    tagsEl.querySelectorAll(".note-tag").forEach((b) =>
      b.addEventListener("click", () => {
        activeTag = b.dataset.tag || "";
        renderTags();
        render(searchEl.value);
      })
    );
  }

  function render(q) {
    const notes = Store.getAllNotes();
    const filtered = notes.filter((n) => {
      if (activeTag && !extractTags(n.text).includes(activeTag)) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      const lsView = I18N.lessonObj(n.ls);
      return n.text.toLowerCase().includes(t) || lsView.title.toLowerCase().includes(t) ||
        (I18N.lessonHayExtra ? I18N.lessonHayExtra(n.ls).toLowerCase().includes(t) : false);
    });

    if (!filtered.length) {
      listEl.innerHTML = '<div class="note-empty"><div class="empty-art" aria-hidden="true">' + Common.experimentPreview('treelist') + '</div>' +
        (notes.length
          ? '<h2>' + Common.L("没有匹配的笔记", "No matching notes") + '</h2><p>' + Common.L("试试更短的关键词，或清除搜索与标签。", "Try shorter keywords, or clear the search and tag filters.") + '</p><button class="btn btn-soft btn-sm" id="notes-clear">' + Common.L("清除筛选", "Clear filters") + '</button>'
          : '<h2>' + Common.L("让每次理解，留下自己的记录", "Let every insight leave a trace") + '</h2><p>' + Common.L("在小节底部展开「我的笔记」，记录要点与疑问；使用 #标签 方便以后查找。", "Open “My notes” at the bottom of a lesson to record key points and questions; use #tags to find them later.") + '</p><a class="btn btn-primary btn-sm" href="index.html#route-index">' + Common.L("开始学习与记录 ↗", "Start learning & note-taking ↗") + "</a>") +
        "</div>";
      const clear = document.getElementById("notes-clear");
      if (clear) clear.addEventListener("click", () => { activeTag = ""; searchEl.value = ""; renderTags(); render(); searchEl.focus(); });
      return;
    }

    let h = "";
    const byCh = d3.group(filtered, (d) => d.ch.id);
    window.COURSE.chapters.forEach((chRaw) => {
      const ch = I18N.chapterObj(chRaw);
      const group = byCh.get(ch.id);
      if (!group) return;
      h += '<section class="content-card" style="margin-bottom:16px">' +
        '<h2 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span class="h-ico">' + Common.icon("book", 14) + "</span>" +
        ch.num + " · " + ch.title + '</h2><div style="display:grid;gap:12px">';
      group.forEach((n) => {
        const tags = extractTags(n.text);
        const lsView = I18N.lessonObj(n.ls);
        h += '<a class="note-row" href="' + Common.lessonLink(ch.id, n.ls.l) + '">' +
          '<div class="note-chap">' + ch.id + "." + n.ls.l + "</div>" +
          '<div class="note-preview">' +
          '<div class="note-title">' + window.esc(lsView.title) + "</div>" +
          '<div class="note-snippet">' + window.esc(n.text.slice(0, 120)) + (n.text.length > 120 ? "…" : "") + "</div>" +
          (tags.length ? '<div class="note-tag-row">' + tags.map((t) => '<span class="note-tag-sm">#' + window.esc(t) + "</span>").join("") + "</div>" : "") +
          "</div></a>";
      });
      h += "</div></section>";
    });
    listEl.innerHTML = h;
  }

  /* 导出 Markdown：按章节分标题 */
  exportBtn.addEventListener("click", () => {
    const notes = Store.getAllNotes();
    if (!notes.length) { Common.toast(Common.L("还没有笔记可导出", "No notes to export yet"), "warn"); return; }
    let md = Common.L("# 《可视化导论》学习笔记\n\n导出时间：", "# Visualization Learning Notes\n\nExported at: ") + new Date().toLocaleString() + "\n";
    window.COURSE.chapters.forEach((chRaw) => {
      const ch = I18N.chapterObj(chRaw);
      const group = notes.filter((n) => n.ch.id === ch.id);
      if (!group.length) return;
      md += "\n## " + ch.num + " " + ch.title + "\n";
      group.forEach((n) => {
        md += "\n### " + ch.id + "." + n.ls.l + " " + I18N.lessonObj(n.ls).title + "\n\n" + n.text + "\n";
      });
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vll-notes-" + new Date().toISOString().slice(0, 10) + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
    Common.toast(Common.L("已导出 Markdown 笔记", "Markdown notes exported"), "ok");
  });

  renderTags();
  render();
  searchEl.addEventListener("input", () => render(searchEl.value));
})();

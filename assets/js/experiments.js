/* Experiment center: one catalog, shareable filters and contextual lab guides. */
(function () {
  Shell.init("exp");
  Common.renderFooter();
  const $ = id => document.getElementById(id);
  const esc = window.esc;
  const KEY_META = {
    "data-transform": { title: Common.L("数据变换实验", "Data Transform"), params: [Common.L("筛选", "Filter"), Common.L("字段派生", "Derived field"), Common.L("分组计数", "Group count")] },
    "data-join": { title: Common.L("Data Join 三态实验", "Data Join Three States"), params: [Common.L("增删", "Add / remove"), Common.L("改值", "Change value"), Common.L("替换身份", "Replace identity"), Common.L("重排", "Reorder")] },
    "pipeline": { title: Common.L("可视化流程实验", "Visualization Pipeline"), params: [Common.L("流程节点", "Pipeline stage"), Common.L("聚合维度", "Aggregation")] },
    "color-semantics": { title: Common.L("配色语义实验", "Color Semantics"), params: [Common.L("数据场景", "Data scenario"), Common.L("配色方案", "Palette"), Common.L("判断练习", "Right-vs-wrong")] },
    "scale-curve": { title: Common.L("比例尺与曲线实验", "Scales & Curves"), params: [Common.L("线性 / 对数", "Linear / log"), Common.L("曲线插值", "Interpolation"), Common.L("拟合线", "Fitted line")] },
    "time-views": { title: Common.L("时序多视图实验", "Temporal Multi-View"), params: [Common.L("日期选择", "Date pick"), Common.L("多图联动", "Linked views"), Common.L("视图切换", "View switch")] }
  };
  const COLORS = ["#526bd6", "#237d73", "#8765b7", "#92682b", "#476f95"];
  const SOFT = ["#f0f3ff", "#edf7f4", "#f5f1fb", "#faf5ec", "#eff5fa"];
  const catalog = [];
  COURSE.chapters.forEach(chRaw => {
    const ch = I18N.chapterObj(chRaw);
    const seen = new Set();
    chRaw.lessons.forEach(lsRaw => {
      if (!lsRaw.demo || seen.has(lsRaw.demo.id)) return;
      seen.add(lsRaw.demo.id);
      const related = chRaw.lessons.filter(item => item.demo && item.demo.id === lsRaw.demo.id).map(item => I18N.lessonObj(item));
      const ls = I18N.lessonObj(lsRaw);
      catalog.push({ ch, ls, related, id: ls.demo.id, meta: KEY_META[ls.demo.id],
        title: KEY_META[ls.demo.id]?.title || ls.demo.title,
        hay: [KEY_META[ls.demo.id]?.title || "", ...(KEY_META[ls.demo.id]?.params || []), ...related.map(item => [item.title, item.demo.title, item.demo.task, ...(item.keywords || [])].join(" ") + " " + I18N.lessonHayExtra(item))].join(" ").toLowerCase() });
    });
  });
  const search = $("experiment-search"), keyOnly = $("experiment-key-only"), scope = $("experiment-scope"), sort = $("experiment-sort");
  const grid = $("exp-grid"), result = $("experiment-results"), dialog = $("lab-info-dialog");
  let chapter = "all", view = "grid", featureIndex = 0;
  const scopeNames = { all: Common.L("全部学习状态", "All statuses"), new: Common.L("尚未浏览", "Not visited"), visited: Common.L("已浏览未掌握", "Visited, not mastered"), mastered: Common.L("已掌握", "Mastered"), saved: Common.L("我的收藏", "Saved") };

  function recordState(item) {
    return { mastered: item.related.every(ls => Store.isCompleted(ls.id)),
      visited: item.related.some(ls => Store.isVisited(ls.id)),
      saved: item.related.some(ls => Store.isBookmarked(ls.id)) };
  }
  function matches(item, includeChapter = true) {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const state = recordState(item);
    return (!includeChapter || chapter === "all" || String(item.ch.id) === chapter) &&
      (!keyOnly.checked || !!item.meta) && terms.every(term => item.hay.includes(term)) &&
      (scope.value === "all" || (scope.value === "new" && !state.visited && !state.mastered) ||
        (scope.value === "visited" && state.visited && !state.mastered) ||
        (scope.value === "mastered" && state.mastered) || (scope.value === "saved" && state.saved));
  }
  function restoreFilters() {
    const params = new URLSearchParams(location.search);
    chapter = COURSE.chapters.some(ch => String(ch.id) === params.get("chapter")) ? params.get("chapter") : "all";
    search.value = (params.get("q") || "").slice(0, 120);
    keyOnly.checked = params.get("key") === "1";
    scope.value = Object.hasOwn(scopeNames, params.get("scope")) ? params.get("scope") : "all";
    sort.value = params.get("sort") === "key" ? "key" : "course";
    view = params.get("view") === "list" ? "list" : "grid";
  }
  function updateURL() {
    const url = new URL(location.href);
    const values = { chapter: chapter === "all" ? "" : chapter, q: search.value.trim(), key: keyOnly.checked ? "1" : "",
      scope: scope.value === "all" ? "" : scope.value, sort: sort.value === "course" ? "" : sort.value, view: view === "grid" ? "" : view };
    Object.entries(values).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    history.replaceState(null, "", url);
  }
  function resetFilters() {
    chapter = "all"; search.value = ""; keyOnly.checked = false; scope.value = "all";
    sort.value = "course"; view = "grid"; render();
  }
  function labURL(item, experiment = false) {
    return Common.lessonLink(item.ch.id, item.ls.l) + (experiment ? "&mode=lab#lab-pane" : "");
  }

  const themes = [{ id: "all", title: Common.L("全部主题", "All topics"), number: "ALL" }].concat(COURSE.chapters.map(chRaw => { const ch = I18N.chapterObj(chRaw); return { id: String(ch.id), title: ch.title, number: "0" + ch.id }; }));
  themes.forEach(theme => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "filter-btn"; button.dataset.chapter = theme.id;
    button.addEventListener("click", () => { chapter = theme.id; render(); });
    $("filter-bar").append(button);
  });
  $("catalog-total").textContent = catalog.length;
  $("catalog-search-icon").innerHTML = Common.icon("search", 18);
  $("catalog-note-icon").innerHTML = Common.icon("info", 16);
  $("lab-info-close").innerHTML = Common.icon("x", 18);
  $("view-grid").innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="4.5" height="4.5" rx="1"/><rect x="9.5" y="2" width="4.5" height="4.5" rx="1"/><rect x="2" y="9.5" width="4.5" height="4.5" rx="1"/><rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1"/></svg>';
  $("view-list").innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3h8M6 8h8M6 13h8M2 3h1M2 8h1M2 13h1"/></svg>';

  function cardHTML(item) {
    const state = recordState(item), number = item.ch.id + "." + item.ls.l;
    const keywords = [...new Set(item.related.flatMap(ls => ls.keywords || []))].slice(0, 2);
    return '<div class="lab-preview-wrap"><span class="lab-card-id">LAB / ' + number + '</span><button type="button" class="lab-save" data-save="' + item.id + '" aria-label="' + (state.saved ? Common.L('取消收藏：', 'Remove from saved: ') : Common.L('收藏：', 'Save: ')) + esc(item.title) + '" aria-pressed="' + state.saved + '">' + Common.icon(state.saved ? 'star-fill' : 'star', 16) + '</button>' + Common.experimentPreview(item.id) + '</div>' +
      '<div class="exp-card-body"><div class="lab-card-heading"><div class="lab-card-meta"><span class="lab-chapter">' + esc(item.ch.num + ' · ' + item.ch.title) + '</span>' + (item.meta ? '<span class="lab-key-badge">' + Common.L('重点实验', 'Key lab') + '</span>' : '') + '</div><h3>' + esc(item.title) + '</h3><a class="lab-context" href="' + labURL(item) + '">' + Common.L('对应小节 ', 'Lesson ') + number + (item.related.length > 1 ? ' / ' + item.ch.id + '.' + item.related[1].l : '') + Common.L(' · 阅读讲解 ↗', ' · Read the lesson ↗') + '</a></div>' +
      '<p class="lab-card-task">' + esc(item.ls.demo.task) + '</p>' +
      '<div class="lab-keywords">' + keywords.map(word => '<button type="button" data-keyword="' + esc(word) + '">' + esc(word) + '</button>').join('') + '</div>' +
      '<div class="lab-card-foot"><span class="lab-record ' + (state.mastered ? 'mastered' : state.visited ? 'visited' : '') + '"><i></i>' + (state.mastered ? Common.L('已掌握', 'Mastered') : state.visited ? Common.L('已浏览', 'Visited') : Common.L('待探索', 'Not explored')) + '</span><div class="lab-card-actions"><a class="btn lab-open" href="' + labURL(item, true) + '">' + Common.L('进入实验', 'Open lab') + ' <span aria-hidden="true">↗</span></a><button type="button" class="btn lab-details" data-info="' + item.id + '" aria-label="' + Common.L('实验说明：', 'About lab: ') + esc(item.title) + '">' + Common.L('实验说明', 'Details') + '</button></div></div></div>';
  }
  function render(update = true) {
    const items = catalog.filter(item => matches(item));
    if (sort.value === "key") items.sort((a, b) => Number(!!b.meta) - Number(!!a.meta));
    $("filter-bar").querySelectorAll("button").forEach((button, i) => {
      const theme = themes[i];
      const count = catalog.filter(item => matches(item, false) && (theme.id === "all" || String(item.ch.id) === theme.id)).length;
      button.innerHTML = '<span class="filter-number">' + theme.number + '</span>' + esc(theme.title) + '<span class="filter-count">' + count + '</span>';
      button.classList.toggle("active", chapter === theme.id);
      button.setAttribute("aria-pressed", String(chapter === theme.id));
      button.setAttribute("aria-label", theme.title + Common.L('，', ', ') + count + Common.L(' 个实验', ' labs'));
    });
    result.innerHTML = '<b>' + String(items.length).padStart(2, '0') + '</b>' + Common.L(' 个实验 <span> / ', ' matching labs <span> / ') + catalog.length + Common.L(' 个独立实验</span>', ' labs in total</span>');
    grid.classList.toggle("is-list", view === "list");
    $("view-grid").setAttribute("aria-pressed", String(view === "grid"));
    $("view-list").setAttribute("aria-pressed", String(view === "list"));
    d3.select(grid).selectAll(".center-empty").remove();
    d3.select(grid).selectAll("article[data-lab]").data(items, item => item.id).join("article")
      .attr("class", item => "exp-card with-preview" + (item.meta ? " key" : ""))
      .attr("data-lab", item => item.id)
      .style("--lab-color", item => COLORS[item.ch.id - 1])
      .style("--lab-soft", item => SOFT[item.ch.id - 1])
      .each(function (item) { const html = cardHTML(item); if (this._labMarkup !== html) { this.innerHTML = html; this._labMarkup = html; } });
    if (!items.length) grid.innerHTML = '<div class="center-empty"><span>' + Common.icon("search", 27) + '</span><h3>' + Common.L('换个角度，再找找', 'Try another angle') + '</h3><p>' + Common.L('当前条件下没有匹配的实验。可以移除部分筛选，或重新浏览全部主题。', 'No labs match the current filters. Remove some filters, or browse all topics again.') + '</p><button class="btn btn-primary" type="button" data-clear-all>' + Common.L('清除筛选，查看全部', 'Clear filters, show all') + '</button></div>';
    const chips = [];
    if (chapter !== "all") chips.push({ key: "chapter", label: themes.find(t => t.id === chapter).title });
    if (search.value.trim()) chips.push({ key: "q", label: Common.L('搜索：', 'Search: ') + search.value.trim() });
    if (keyOnly.checked) chips.push({ key: "key", label: Common.L("重点实验", "Key labs") });
    if (scope.value !== "all") chips.push({ key: "scope", label: scopeNames[scope.value] });
    $("active-lab-filters").innerHTML = chips.map(chip => '<button type="button" data-remove="' + chip.key + '" aria-label="' + Common.L('移除筛选：', 'Remove filter: ') + esc(chip.label) + '">' + esc(chip.label) + '<span aria-hidden="true">×</span></button>').join('');
    if (update) updateURL();
  }

  function showInfo(item) {
    $("lab-info-content").innerHTML = '<div class="lab-info-header"><div class="workspace-kicker">LAB / ' + item.ch.id + '.' + item.ls.l + ' · ' + esc(item.ch.num) + '</div><h2 id="lab-info-title">' + esc(item.title) + '</h2><p>' + esc(item.ls.subtitle) + '</p></div><div class="lab-info-grid"><div class="lab-info-visual">' + Common.experimentPreview(item.id) + '<span>' + Common.L('实验主题示意', 'Lab preview') + '</span>' + (item.meta ? '<div class="lab-info-tags">' + item.meta.params.map(p => '<span>' + esc(p) + '</span>').join('') + '</div>' : '') + '</div><div class="lab-info-guide"><section><h3>' + Common.L('你将做什么', "What you'll do") + '</h3><p>' + esc(item.ls.demo.task) + '</p></section><section><h3>' + Common.L('观察重点', 'What to observe') + '</h3>' + item.related.map(ls => (item.related.length > 1 ? '<h4>' + item.ch.id + '.' + ls.l + ' ' + esc(ls.demo.title) + '</h4>' : '') + '<p>' + esc(ls.demo.observe) + '</p>').join('') + '</section></div></div><div class="lab-info-lessons"><span>' + Common.L('关联讲解', 'Related lessons') + '</span>' + item.related.map(ls => '<a href="' + Common.lessonLink(item.ch.id, ls.l) + '">' + item.ch.id + '.' + ls.l + ' ' + esc(ls.title) + ' ↗</a>').join('') + '</div><div class="lab-info-actions"><span>' + Common.L('先尝试，再回到原理。', 'Try first, then return to the theory.') + '</span><a class="btn btn-primary" href="' + labURL(item, true) + '">' + Common.L('进入实验 ↗', 'Open lab ↗') + '</a></div>';
    dialog.showModal();
  }
  grid.addEventListener("click", event => {
    const save = event.target.closest("[data-save]"), info = event.target.closest("[data-info]"), keyword = event.target.closest("[data-keyword]");
    if (save) {
      const item = catalog.find(item => item.id === save.dataset.save), wasSaved = recordState(item).saved;
      if (wasSaved) item.related.filter(ls => Store.isBookmarked(ls.id)).forEach(ls => Store.toggleBookmark(item.ch.id, ls.l));
      else Store.toggleBookmark(item.ch.id, item.ls.l);
      render();
      const next = grid.querySelector('[data-save="' + item.id + '"]');
      (next || result).focus({ preventScroll: true });
      Common.toast(wasSaved ? Common.L("已取消收藏", "Removed from saved") : Common.L("已收藏，可在学习统计中回看", "Saved — see it in Learning stats"), "ok");
    } else if (info) showInfo(catalog.find(item => item.id === info.dataset.info));
    else if (keyword) { search.value = keyword.dataset.keyword; render(); $("catalog-filters").scrollIntoView({ block: "start" }); search.focus({ preventScroll: true }); }
    else if (event.target.closest("[data-clear-all]")) { resetFilters(); search.focus(); }
  });
  $("active-lab-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    if (button.dataset.remove === "chapter") chapter = "all";
    if (button.dataset.remove === "q") search.value = "";
    if (button.dataset.remove === "key") keyOnly.checked = false;
    if (button.dataset.remove === "scope") scope.value = "all";
    render(); result.focus({ preventScroll: true });
  });
  $("lab-info-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", event => {
    event.stopPropagation();
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll("button,a[href]")];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  search.addEventListener("input", () => render());
  [keyOnly, scope, sort].forEach(control => control.addEventListener("change", () => render()));
  $("experiment-reset").addEventListener("click", resetFilters);
  $("view-grid").addEventListener("click", () => { view = "grid"; render(); });
  $("view-list").addEventListener("click", () => { view = "list"; render(); });
  $("copy-filters").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); Common.toast(Common.L("筛选链接已复制", "Filter link copied"), "ok"); }
    catch (_) { Common.toast(Common.L("请复制地址栏链接，筛选条件已包含在内", "Please copy the address bar link — filters are included in the URL"), "warn"); }
  });
  $("explore-key").addEventListener("click", () => { resetFilters(); keyOnly.checked = true; render(); $("lab-catalog").scrollIntoView({ block: "start" }); });
  window.addEventListener("popstate", () => { restoreFilters(); render(false); });

  const featured = Object.keys(KEY_META).map(id => catalog.find(item => item.id === id));
  function showFeature(index) {
    featureIndex = (index + featured.length) % featured.length;
    const item = featured[featureIndex];
    $("feature-index").textContent = String(featureIndex + 1).padStart(2, '0') + ' / 06';
    $("feature-content").innerHTML = Common.experimentPreview(item.id) + '<div class="feature-description"><div class="feature-chapter">' + esc(item.ch.num + ' · ' + item.ch.title) + '</div><h2>' + esc(item.title) + '</h2><div class="feature-params">' + item.meta.params.map(p => '<span>' + esc(p) + '</span>').join('') + '</div><a href="' + labURL(item, true) + '">' + Common.L('进入这个实验', 'Open this lab') + ' <span aria-hidden="true">↗</span></a></div>';
    $("feature-dots").querySelectorAll("button").forEach((button, i) => button.setAttribute("aria-pressed", String(i === featureIndex)));
  }
  featured.forEach((item, i) => {
    const button = document.createElement("button"); button.type = "button";
    button.setAttribute("aria-label", Common.L("预览：", "Preview: ") + item.title); button.textContent = String(i + 1).padStart(2, '0');
    button.addEventListener("click", () => showFeature(i)); $("feature-dots").append(button);
  });
  $("feature-prev").addEventListener("click", () => showFeature(featureIndex - 1));
  $("feature-next").addEventListener("click", () => showFeature(featureIndex + 1));
  restoreFilters(); showFeature(0); render(false);
})();

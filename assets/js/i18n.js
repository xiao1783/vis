/* ============================================================
 * i18n.js — 中英双语基础设施
 * - I18N.lang：当前语言（localStorage vll.lang，默认 zh）
 * - I18N.L(zh, en)：脚本内联取词
 * - I18N.t(key, zh)：按 key 查英文词典（供静态 HTML data-i18n）
 * - I18N.applyStatic()：扫描 data-i18n / data-i18n-ph / data-i18n-aria / data-i18n-html
 * - I18N.lessonObj(ls) / I18N.chapterObj(ch)：合并 COURSE_I18N 英文课程内容
 * 依赖：在 store.js 之后、各页面脚本之前加载；course-en.js 可选
 * ============================================================ */
(function () {
  const LS_KEY = "vll.lang";
  let lang = "zh";
  try { lang = localStorage.getItem(LS_KEY) === "en" ? "en" : "zh"; } catch (_) {}

  /* 静态 HTML 英文词典（key → 英文；中文即页面原文） */
  const EN = {
    /* <title> 与 meta */
    "title.home": "Visualization Learning Lab · Introduction to Data Visualization",
    "title.chapter": "Chapter · Visualization Learning Lab",
    "title.lesson": "Lesson · Visualization Learning Lab",
    "title.experiments": "Experiment Center · Visualization Learning Lab",
    "title.notes": "My Notes · Visualization Learning Lab",
    "title.review": "Review Mistakes · Visualization Learning Lab",
    "title.stats": "Learning Stats · Visualization Learning Lab",

    /* 首页 hero */
    "hero.tag-edition": "Interactive Learning",
    "hero.h1": "Turn raw data <br>into <span>readable graphics.</span>",
    "hero.sub": "From the first row of data to interactive charts. A set of hands-on experiments for understanding how visualization expresses, explains and discovers.",
    "hero.start": "Start Learning ↗",
    "hero.continue": "Continue where I left off",
    "hero.explore": "Explore Experiments →",
    "hero.notes": "My Notes",
    "hero.stat1": " progressive chapters",
    "hero.stat2": " lessons",
    "hero.stat3": " key experiments",
    "hero.carousel-title": "Live Visualization Stage",
    "hero.slide1.title": "From one row of data to a shape",
    "hero.slide1.desc": "See how data maps to the length, position and color of a graphic.",
    "hero.slide2.title": "One day, three views of time",
    "hero.slide2.desc": "Follow a date across yearly trend, calendar and weekday views.",
    "hero.slide3.title": "Let character stories unfold over time",
    "hero.slide3.desc": "Watch character trajectories converge and split along a storyline.",
    "hero.prev": "Previous scene",
    "hero.next": "Next scene",
    "hero.play": "Pause auto play",

    /* 首页分区 */
    "home.exp.title": "Concepts click after you build them",
    "home.exp.lead": "Change one parameter, see one change. ",
    "home.exp.all": "View all experiments ↗",
    "home.ch.title": "Course Chapters",
    "home.km.title": "Connect the knowledge to see the whole picture",
    "home.km.lead": "Explore core concepts along the five-chapter path and see how data becomes visual expression.",
    "home.km.note": "05 chapters · concept atlas",
    "home.km.start": " Start from knowing data",
    "home.km.legend.line": "Course sequence",
    "home.km.legend.branch": "Concept branch",
    "home.km.legend.current": "Current lesson",
    "home.km.legend.weak": "To consolidate",
    "home.km.cross": "Cross-chapter links",
    "home.km.crossdesc": "Let knowledge from different chapters explain each other",
    "home.km.rel1.note": "determines the mapping",
    "home.km.rel2.note": "guides view palette",
    "home.km.foot1": "Chapter cards open chapters; concept nodes open lessons.",
    "home.km.foot2": "Solid links show learning order; cross-chapter links show knowledge ties.",
    "home.pace.title": "Leave progress behind at every step.",
    "home.pace.desc": "Bookmark key points anytime, check understanding with instant quizzes, and pick up where you left off.",
    "home.pace.storage": "Progress is saved in this browser",

    /* 页脚 */
    "footer.site": "Visualization Learning Lab",
    "footer.sub": " · interactive course site for Introduction to Data Visualization",
    "footer.motto": "Know data · Understand process · Choose color · Express graphics · Discover patterns",
    "footer.storage": "Progress and bookmarks are stored in this browser.",
    "footer.original": "Original course: ",

    /* 头部 */
    "brand.small": "Intro. to Data Visualization",
    "nav.home": "Home",
    "nav.ch": "Chapter",
    "nav.exp": "Experiments",
    "tools.summary": "Study tools ",
    "tools.notes": "My Notes",
    "tools.notes.desc": "Organize key points and tags",
    "tools.review": "Review Mistakes",
    "tools.review.desc": "Return to what needs consolidating",
    "tools.stats": "Learning Stats",
    "tools.stats.desc": "Track progress and back up records",
    "search.ph": "Search lessons / terms, e.g. Data Join…",
    "search.aria": "Search course lessons or terms",
    "search.results.aria": "Course search results",
    "search.empty1": "Nothing matches “",
    "search.empty2": "”",
    "search.empty.hint": "Try a chapter name, a term or an English keyword like Data Join, colormap, scaleTime",
    "search.heading10": "Showing first 10 results",
    "search.heading": " lessons found",
    "search.kbd": "↑↓ select · Enter open",
    "status.done": "Completed",
    "status.visited": "Visited",
    "lesson.word": "Lesson ",

    /* 抽屉 */
    "drawer.title": "Explore & Learn",
    "drawer.aria": "Site navigation",
    "drawer.close": "Close menu",
    "drawer.group.tools": "Study tools",
    "drawer.group.chapters": "Five chapters",

    /* 命令面板 */
    "cmd.ph": "Search commands, lessons, terms, experiments… (↑↓ select, Enter run, Esc close)",
    "cmd.group.acts": "Commands",
    "cmd.group.lessons": "Lessons",
    "cmd.empty": "No matching content",
    "cmd.act.done": "Mark this lesson as mastered",
    "cmd.act.quiz": "Reset this lesson's quiz",
    "cmd.act.note": "Take a note (expand & focus)",
    "cmd.act.review": "Go to mistake review",
    "cmd.act.stats": "Go to learning stats",
    "cmd.act.notes": "Go to my notes",
    "cmd.act.exps": "Go to experiment center",
    "cmd.act.export": "Export learning data (JSON)",
    "cmd.act.import": "Import learning data (JSON)…",
    "cmd.act.reset": "Clear all learning data…",

    /* 通用提示 */
    "toast.copied": "Code copied",
    "toast.copyfail": "Copy failed, please select manually",
    "toast.copiedok": "Copied ✓",
    "toast.exported": "Learning data exported as JSON",
    "toast.imported": "Import succeeded, refreshing…",
    "toast.importfail": "Import failed: invalid file format",
    "toast.resetconfirm": "Clear ALL learning data? Progress, bookmarks, quizzes and notes will be deleted permanently.",
    "toast.resetdone": "All learning data cleared",

    /* 实验中心 */
    "exp.h1": "Experiment Center<span>Understanding happens by doing.</span>",
    "exp.intro": "Put abstract concepts into operable graphics. Change parameters, watch what happens, and find the patterns behind the data through trial and error.",
    "exp.start": "Start from key experiments ↗",
    "exp.browse": "Browse all experiments ↓",
    "exp.m1": "independent experiments",
    "exp.m2": "learning topics",
    "exp.m3": "key experiments",
    "exp.coverage": "Covers all 27 lessons · scale & curves shown combined",
    "exp.feature": "Key experiment tour",
    "exp.prev": "Previous key experiment",
    "exp.next": "Next key experiment",
    "exp.method": "How to learn with experiments",
    "exp.step1": "Clarify the task", "exp.step1s": "Enter with a question in mind",
    "exp.step2": "Adjust parameters", "exp.step2s": "Change data & graphics by hand",
    "exp.step3": "Observe changes", "exp.step3s": "Compare before and after",
    "exp.step4": "Explain results", "exp.step4s": "Return to principles, form understanding",
    "exp.catalog.title": "Find the question you want to explore",
    "exp.copy": "Copy filter link ↗",
    "exp.find": "Find experiments",
    "exp.search.ph": "Search experiments, concepts or terms…",
    "exp.keyonly": "Key experiments",
    "exp.scope.all": "All learning states",
    "exp.scope.new": "Not visited yet",
    "exp.scope.visited": "Visited, not mastered",
    "exp.scope.mastered": "Mastered",
    "exp.scope.saved": "My bookmarks",
    "exp.reset": "Reset",
    "exp.topics": "Course topics",
    "exp.swipe": "swipe",
    "exp.sort.course": "Course order",
    "exp.sort.key": "Key first",
    "exp.note1": "“Visited” and “Mastered” come from lesson records. Interactions inside experiments do not mark mastery automatically.",
    "exp.note2": "View learning progress ↗",
    "exp.dialog.close": "Close experiment info",

    /* 工作台页（笔记/错题/统计） */
    "ws.nav": "Study tool pages",
    "notes.h1": "My Notes",
    "notes.intro": "All notes you took in lessons are gathered here with full-text search. Write <b>#tags</b> (like <b>#scale</b>) to filter by tag; click a note to jump back to its lesson.",
    "notes.search.ph": "Search note content…",
    "notes.export": "Export Markdown",
    "review.h1": "Review Mistakes",
    "review.intro": "All quiz questions you got wrong are collected here. A wrong answer won't reveal the correct one — retry freely; a correct answer removes the question from this list.",
    "stats.h1": "Learning Stats",
    "stats.intro": "All data comes from local records in this browser. Export a JSON backup before switching devices, then import it on the new one.",
    "stats.chapters": "Chapter completion",
    "stats.quiz": "Quiz accuracy",
    "stats.saved": "Saved lessons",
    "stats.saved.desc": "Keep content worth revisiting in one place; click to return to the lesson.",
    "stats.data": "Learning data management",
    "stats.data.desc": "Export includes: progress, bookmarks, quiz scores & mistakes, and all notes.",
    "stats.export": "Export JSON backup",
    "stats.import": "Import JSON…",
    "stats.reset": "Clear all learning data",
  };

  function t(key, zh) {
    if (lang === "en" && EN[key] != null) return EN[key];
    return zh != null ? zh : key;
  }
  function L(zh, en) { return lang === "en" && en != null ? en : zh; }

  /* 静态 HTML 扫描：首次记录原文，之后按语言切换 */
  function applyStatic(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.dataset.i18nZh == null) el.dataset.i18nZh = el.textContent;
      el.textContent = lang === "en" && EN[el.dataset.i18n] != null ? EN[el.dataset.i18n] : el.dataset.i18nZh;
    });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      if (el.dataset.i18nZh == null) el.dataset.i18nZh = el.innerHTML;
      el.innerHTML = lang === "en" && EN[el.dataset.i18nHtml] != null ? EN[el.dataset.i18nHtml] : el.dataset.i18nZh;
    });
    root.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      if (el.dataset.i18nZh == null) el.dataset.i18nZh = el.getAttribute("placeholder");
      el.setAttribute("placeholder", lang === "en" && EN[el.dataset.i18nPh] != null ? EN[el.dataset.i18nPh] : el.dataset.i18nZh);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      if (el.dataset.i18nZh == null) el.dataset.i18nZh = el.getAttribute("aria-label");
      el.setAttribute("aria-label", lang === "en" && EN[el.dataset.i18nAria] != null ? EN[el.dataset.i18nAria] : el.dataset.i18nZh);
    });
    const tEl = root.querySelector("title[data-i18n]");
    if (tEl) document.title = t("title." + tEl.dataset.i18n, tEl.textContent);
  }

  /* 语言切换（保存并整页刷新，让所有渲染脚本按新语言执行） */
  function setLang(l) {
    if (l !== "zh" && l !== "en") return;
    try { localStorage.setItem(LS_KEY, l); } catch (_) {}
    lang = l;
    location.reload();
  }

  /* ---------- 课程内容英文覆盖层合并 ---------- */
  function chapterObj(ch) {
    if (lang !== "en" || !window.COURSE_I18N || !window.COURSE_I18N.ch) return ch;
    const en = window.COURSE_I18N.ch[ch.id];
    if (!en) return ch;
    return Object.assign({}, ch, en, { lessons: ch.lessons, accent: ch.accent, id: ch.id });
  }
  function lessonObj(ls) {
    if (lang !== "en" || !window.COURSE_I18N || !window.COURSE_I18N.ls) return ls;
    const en = window.COURSE_I18N.ls[ls.id];
    if (!en) return ls;
    const out = Object.assign({}, ls);
    ["title", "subtitle", "question", "keyPoint"].forEach((k) => { if (en[k] != null) out[k] = en[k]; });
    ["goal", "prereq", "pitfalls"].forEach((k) => { if (en[k] != null) out[k] = en[k]; });
    if (en.keywords) out.keywords = ls.keywords.concat(en.keywords);
    if (en.blocks) out.blocks = (ls.blocks || []).map((b, i) => en.blocks[i] ? Object.assign({}, b, en.blocks[i]) : b);
    if (en.code) out.code = (ls.code || []).map((c, i) => en.code[i] ? Object.assign({}, c, en.code[i]) : c);
    if (en.demo && ls.demo) out.demo = Object.assign({}, ls.demo, en.demo);
    if (en.quiz) out.quiz = (ls.quiz || []).map((q, i) => en.quiz[i] ? Object.assign({}, q, en.quiz[i]) : q);
    return out;
  }

  /* 搜索索引双语合并（供 shell.js 使用） */
  function lessonHayExtra(ls) {
    if (lang !== "en" || !window.COURSE_I18N || !window.COURSE_I18N.ls) return "";
    const en = window.COURSE_I18N.ls[ls.id];
    if (!en) return "";
    return [en.title, en.subtitle, en.question, en.keyPoint,
      (en.keywords || []).join(" "), (en.goal || []).join(" "), (en.pitfalls || []).join(" ")].join(" ");
  }

  window.I18N = {
    get lang() { return lang; },
    isEn: () => lang === "en",
    t, L, setLang, applyStatic, chapterObj, lessonObj, lessonHayExtra,
    toggleBtn: function () {
      return '<button class="lang-btn" id="lang-btn" type="button" aria-label="Switch language / 切换语言">' +
        (lang === "zh" ? "EN" : "中") + "</button>";
    },
  };

  /* DOM ready 后：更新 html lang 属性 + 扫描静态文本 */
  function boot() {
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    applyStatic(document);
    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest("#lang-btn");
      if (btn) setLang(lang === "zh" ? "en" : "zh");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

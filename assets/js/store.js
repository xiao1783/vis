/* ============================================================
 * store.js — 本地学习状态（localStorage）
 * 进度 / 收藏 / 自测成绩 / 设置，全部仅保存在当前浏览器
 * ============================================================ */
(function () {
  const KEY = "vll.progress.v1";

  const defaultState = {
    visited: {},      // { "1-5": true } 访问过
    visitLog: {},     // { "1-5": "2026-10-17" } 最近访问日期
    completed: {},    // { "1-5": true } 主动标记完成
    bookmarks: {},    // { "1-5": true } 收藏
    quiz: {},         // { "1-5": {correct: 2, total: 3} } 历史最好成绩
    quizDetail: {},   // { "1-5": {answers: [true,false], mistakes: [1], lastDate: "2026-10-17"} }
    notes: {},        // { "1-5": "用户笔记内容" }
    lastLesson: null, // "1-5"
    reduceMotion: false,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredCloneSafe(defaultState);
      const s = JSON.parse(raw);
      return Object.assign(structuredCloneSafe(defaultState), s);
    } catch (e) {
      return structuredCloneSafe(defaultState);
    }
  }
  function structuredCloneSafe(o) {
    return JSON.parse(JSON.stringify(o));
  }

  let state = load();
  const listeners = [];

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("无法写入 localStorage", e);
    }
    listeners.forEach((fn) => fn(state));
  }

  const Store = {
    onChange(fn) { listeners.push(fn); },
    get() { return state; },

    lessonId(c, l) { return c + "-" + l; },

    visit(c, l) {
      const id = this.lessonId(c, l);
      const today = new Date().toISOString().slice(0, 10);
      state.visited[id] = true;
      state.visitLog[id] = today;
      state.lastLesson = id;
      save();
    },
    isVisited(id) { return !!state.visited[id]; },
    lastVisitDate(id) { return state.visitLog[id] || null; },

    toggleComplete(c, l) {
      const id = this.lessonId(c, l);
      state.completed[id] = !state.completed[id];
      save();
      return state.completed[id];
    },
    isCompleted(id) { return !!state.completed[id]; },

    toggleBookmark(c, l) {
      const id = this.lessonId(c, l);
      state.bookmarks[id] = !state.bookmarks[id];
      save();
      return state.bookmarks[id];
    },
    isBookmarked(id) { return !!state.bookmarks[id]; },

    recordQuiz(c, l, correct, total) {
      const id = this.lessonId(c, l);
      const prev = state.quiz[id] || { correct: 0, total: 0 };
      state.quiz[id] = {
        correct: Math.max(prev.correct, correct),
        total: Math.max(prev.total, total),
      };
      save();
    },
    getQuiz(id) { return state.quiz[id] || null; },

    /* 错题追踪 */
    recordQuizDetail(c, l, answers) {
      const id = this.lessonId(c, l);
      const mistakes = answers.map((v, i) => (!v ? i : -1)).filter((i) => i >= 0);
      state.quizDetail[id] = {
        answers: answers.slice(),
        mistakes: mistakes,
        lastDate: new Date().toISOString().slice(0, 10),
      };
      save();
    },
    getQuizDetail(id) { return state.quizDetail[id] || null; },
    getLessonWeakPoints(id) {
      const d = state.quizDetail[id];
      if (!d || !d.mistakes.length) return null;
      return d.mistakes;
    },
    getAllWeakPoints() {
      const out = [];
      Object.entries(state.quizDetail).forEach(([id, d]) => {
        if (d.mistakes.length) out.push({ id, mistakes: d.mistakes, lastDate: d.lastDate });
      });
      return out;
    },
    /* 错题重做：答对后把该题从 mistakes 移除；全部做对则清除记录 */
    resolveWeakPoint(c, l, qi) {
      const id = this.lessonId(c, l);
      const d = state.quizDetail[id];
      if (!d) return 0;
      d.mistakes = d.mistakes.filter((i) => i !== qi);
      if (d.answers) d.answers[qi] = true;
      if (!d.mistakes.length) delete state.quizDetail[id];
      save();
      return d.mistakes ? d.mistakes.length : 0;
    },

    /* 数据导出 / 导入 / 清除 */
    exportState() {
      return JSON.stringify({ app: "vll", version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
    },
    importState(json) {
      const obj = JSON.parse(json);
      const data = obj && obj.app === "vll" && obj.data ? obj.data : obj;
      if (!data || typeof data !== "object") throw new Error("格式不正确");
      state = Object.assign(structuredCloneSafe(defaultState), data);
      save();
    },
    resetAll() {
      state = structuredCloneSafe(defaultState);
      save();
    },

    /* 学习笔记 */
    setNote(c, l, text) {
      const id = this.lessonId(c, l);
      if (!text || !text.trim()) delete state.notes[id];
      else state.notes[id] = text.trim();
      save();
    },
    getNote(c, l) { return state.notes[this.lessonId(c, l)] || ""; },
    getAllNotes() {
      const out = [];
      Object.entries(state.notes).forEach(([id, text]) => {
        const [c, l] = id.split("-").map(Number);
        const ch = window.COURSE.chapters.find((x) => x.id === c);
        const ls = ch ? ch.lessons.find((x) => x.l === l) : null;
        if (ch && ls) out.push({ ch, ls, text });
      });
      return out;
    },

    setReduceMotion(v) { state.reduceMotion = !!v; save(); },
    getReduceMotion() {
      return state.reduceMotion ||
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    /* 统计 */
    chapterProgress(chapter) {
      const total = chapter.lessons.length;
      let done = 0, seen = 0;
      chapter.lessons.forEach((ls) => {
        if (state.completed[ls.id]) done++;
        else if (state.visited[ls.id]) seen++;
      });
      return { total, done, seen, pct: total ? Math.round((done / total) * 100) : 0 };
    },
    overallProgress() {
      const all = window.COURSE.chapters.reduce((n, ch) => n + ch.lessons.length, 0);
      const done = Object.keys(state.completed).filter((k) => state.completed[k]).length;
      const seen = Object.keys(state.visited).length;
      return {
        total: all,
        done,
        seen,
        pct: Math.round((done / all) * 100),
      };
    },
    bookmarksList() {
      const out = [];
      window.COURSE.chapters.forEach((ch) => {
        ch.lessons.forEach((ls) => {
          if (state.bookmarks[ls.id]) out.push({ ch, ls });
        });
      });
      return out;
    },
    lastLessonRef() {
      if (!state.lastLesson) return null;
      const [c, l] = state.lastLesson.split("-").map(Number);
      const ch = window.COURSE.chapters.find((x) => x.id === c);
      if (!ch) return null;
      const ls = ch.lessons.find((x) => x.l === l);
      return ls ? { ch, ls } : null;
    },
  };

  window.Store = Store;
})();

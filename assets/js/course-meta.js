/* ============================================================
 * 课程元数据 course-meta.js
 * 五章 27 小节的完整内容分别见 course-c1.js ~ course-c5.js
 * ============================================================ */
window.COURSE = {
  name: "可视化学习实验室",
  title: "《可视化导论》交互式学习网站",
  subtitle: "认识数据 → 理解流程 → 选择颜色 → 表达低维数据 → 分析时间变化",
  original: "https://cinger007.github.io/vis/",
  intro:
    "这是《可视化导论》课程的交互式学习网站。课程内容以结构化知识、可操作实验和即时自测的方式重新组织，帮助你在“看概念—做实验—测自己”的循环中理解数据可视化。",
  storageNote:
    "学习进度、收藏与自测成绩仅保存在当前浏览器（localStorage），清除浏览器数据或更换设备后不会自动同步；本站不提供账号与云端同步。",
  noVideoNote:
    "为控制服务器存储空间，本站不包含任何视频，所有可视化均由 SVG 与 D3 在浏览器中实时绘制。",
  chapters: [],
};

/* 全局小工具：转义 HTML */
window.esc = function (s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

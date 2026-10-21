/* ============================================================
 * common.js — 页脚 / 提示 / 复制 / 数据加载 / 通用 SVG
 * ============================================================ */
(function () {
  /* 双语取词：委托给 i18n.js（未加载时回退中文） */
  function L(zh, en) { return window.I18N ? window.I18N.L(zh, en) : zh; }

  function renderFooter() {
    const f = document.getElementById("site-footer");
    if (!f) return;
    f.innerHTML =
      '<div class="wrap" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
      "<div>" +
      "<b>VisLab</b> · " + L("《可视化导论》交互式学习网站", "interactive course site for Introduction to Data Visualization") + "<br>" +
      '<span class="muted">' + L("认识数据 · 理解流程 · 选择颜色 · 表达图形 · 发现规律", "Know data · Understand process · Choose color · Express graphics · Discover patterns") + "</span>" +
      "</div>" +
      '<div style="max-width:430px">' +
      '<div class="muted" style="margin-bottom:6px">' +
      L("学习进度与收藏保存在当前浏览器。", "Progress and bookmarks are stored in this browser.") + "</div>" +
      L("原始课程：", "Original course: ") + '<a href="' + window.COURSE.original + '" target="_blank" rel="noopener">cinger007.github.io/vis</a>' +
      "</div></div>";
  }

  /* 轻量 toast */
  function toast(msg, type) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      t.style.cssText =
        "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);background:#eef3fc;color:#415d89;border:1px solid #d7e2f4;" +
        "padding:10px 18px;border-radius:9px;font-size:14px;z-index:999;opacity:0;transition:opacity .2s;" +
        "box-shadow:0 8px 24px rgba(40,63,105,.12);pointer-events:none;max-width:88vw";
      document.body.appendChild(t);
    }
    const host = document.querySelector("dialog[open]") || document.body;
    if (t.parentElement !== host) host.appendChild(t);
    t.textContent = msg;
    const palette = type === "ok" ? ["#edf8f1", "#32734f", "#cde6d7"] :
      type === "warn" ? ["#fff7e9", "#8b6228", "#eeddb8"] : ["#eef3fc", "#415d89", "#d7e2f4"];
    t.style.background = palette[0];
    t.style.color = palette[1];
    t.style.borderColor = palette[2];
    t.style.opacity = "1";
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = "0"; }, 1900);
  }

  /* 复制文本 */
  async function copyText(text, btn, message) {
    message = message || L("代码已复制", "Code copied");
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) { /* Try the local selection fallback when clipboard access fails. */ }
    if (!copied) {
      const previousFocus = document.activeElement;
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      (document.querySelector("dialog[open]") || document.body).appendChild(ta);
      ta.select();
      try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
      ta.remove();
      previousFocus?.focus();
    }
    toast(copied ? message : L("复制失败，请手动选择", "Copy failed, please select manually"), copied ? "ok" : "warn");
    if (!copied) return;
    if (btn) {
      if (btn.__copyLabel === undefined) btn.__copyLabel = btn.innerHTML;
      clearTimeout(btn.__copyTimer);
      btn.textContent = L("已复制 ✓", "Copied ✓");
      btn.__copyTimer = setTimeout(() => {
        btn.innerHTML = btn.__copyLabel;
        delete btn.__copyLabel;
      }, 1400);
    }
  }

  /* 数据加载（所有页面位于站点根目录，数据在 data/） */
  async function loadData(rel) {
    if (rel.endsWith(".csv")) {
      return d3.csv(rel, d3.autoType);
    }
    return d3.json(rel);
  }

  /* 取 URL 参数 */
  function params() {
    const p = new URLSearchParams(window.location.search);
    return {
      c: p.get("c") ? +p.get("c") : null,
      l: p.get("l") ? +p.get("l") : null,
      exp: p.get("exp") || null,
    };
  }

  function lessonLink(c, l) { return "lesson.html?c=" + c + "&l=" + l; }

  function findLesson(c, l) {
    const ch = window.COURSE.chapters.find((x) => x.id === c);
    if (!ch) return null;
    const ls = ch.lessons.find((x) => x.l === l);
    return ls ? { ch, ls } : null;
  }

  /* 邻接小节（用于上一节/下一节） */
  function adjacentLessons(c, l) {
    const flat = [];
    window.COURSE.chapters.forEach((ch) => ch.lessons.forEach((ls) => flat.push({ ch, ls })));
    const idx = flat.findIndex((x) => x.ch.id === c && x.ls.l === l);
    return { prev: idx > 0 ? flat[idx - 1] : null, next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null };
  }

  /* 清空 SVG 容器并返回新的 svg（带响应式 viewBox） */
  function svgMount(container, width, height, margin) {
    const sel = d3.select(container);
    sel.selectAll("*").remove();
    const svg = sel.append("svg")
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%");
    return svg;
  }

  /* 实验预览：同尺寸的微型数据场景，供首页与实验中心共用。 */
  function experimentPreview(id) {
    const panel = (x, y, w, h) => `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="9" fill="#dfe5f5" opacity=".65"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="white" stroke="#d9e1f3"/>`;
    const label = (x, y, text, color = "#7b88a6") => `<text x="${x}" y="${y}" fill="${color}" font-size="7" font-weight="600" letter-spacing=".5">${text}</text>`;
    const dot = (x, y, color, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
    const arrow = (x, y) => `<path d="M${x} ${y}h18m-4-4 4 4-4 4" stroke="#96a5d0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    const tableRows = Array.from({length: 4}, (_, i) => `<rect x="31" y="${49 + i * 14}" width="78" height="10" rx="3" fill="${i === 1 || i === 3 ? '#e9edff' : '#f4f6fb'}"/>${dot(38, 54 + i * 14, i === 1 || i === 3 ? '#6276ea' : '#b8c2da', 2)}<path d="M46 ${54 + i * 14}h20m9 0h24" stroke="#bac4db" stroke-width="2" stroke-linecap="round"/>`).join("");
    const frames = {
      "data-transform": panel(19, 20, 102, 100) + label(30, 35, "SOURCE / 12 ROWS") + tableRows + arrow(130, 71) +
        panel(161, 30, 110, 82) + label(173, 46, "FILTER + GROUP", "#5268d7") +
        '<rect x="173" y="55" width="86" height="17" rx="4" fill="#eef1ff"/><path d="M180 63h30" stroke="#7e8de3" stroke-width="2" stroke-linecap="round"/><rect x="225" y="59" width="26" height="9" rx="3" fill="#596fe7"/><rect x="173" y="78" width="86" height="17" rx="4" fill="#eaf8f3"/><path d="M180 86h24" stroke="#69ad98" stroke-width="2" stroke-linecap="round"/><rect x="225" y="82" width="17" height="9" rx="3" fill="#41b99b"/>' +
        '<circle cx="120" cy="108" r="11" fill="#596fe7"/><path d="M116 104h8l-3 4v4l-2-1v-3z" fill="white"/>',
      "data-join": '<path d="M62 69h165" stroke="#d1d9ef" stroke-width="2" stroke-dasharray="3 4"/>' +
        [ {x:22, name:"ENTER", color:"#35ad8b", bg:"#e9f8f2", sign:"+", bars:[18,30,24]}, {x:109, name:"UPDATE", color:"#5b70e4", bg:"#edf0ff", sign:"↻", bars:[27,38,23]}, {x:196, name:"EXIT", color:"#db8b7f", bg:"#fff0ec", sign:"−", bars:[25,19,31]} ].map(d => panel(d.x, 31, 72, 82) + `<rect x="${d.x + 8}" y="40" width="56" height="17" rx="4" fill="${d.bg}"/>` + label(d.x + 14, 51, d.name, d.color) + d.bars.map((h, i) => `<rect x="${d.x + 13 + i * 16}" y="${99 - h}" width="10" height="${h}" rx="3" fill="${d.color}" opacity="${.45 + i * .23}"/>`).join("") + `<circle cx="${d.x + 59}" cy="108" r="10" fill="${d.color}"/><text x="${d.x + 59}" y="112" text-anchor="middle" font-size="14" fill="white">${d.sign}</text>`).join(""),
      "pipeline": panel(14, 36, 70, 73) + panel(110, 27, 70, 91) + panel(206, 36, 70, 73) + arrow(88, 73) + arrow(184, 73) +
        label(25, 51, "01 / DATA") + label(120, 42, "02 / ENCODE", "#5268d7") + label(217, 51, "03 / VIEW") +
        Array.from({length: 4}, (_, i) => `<rect x="25" y="${60 + i * 9}" width="48" height="5" rx="2" fill="${i === 1 ? '#99a9ef' : '#e0e6f3'}"/>`).join("") +
        '<path d="M123 59h44M123 76h44M123 93h44" stroke="#dce3f3" stroke-width="3" stroke-linecap="round"/><circle cx="135" cy="59" r="5" fill="#6276e9"/><circle cx="156" cy="76" r="5" fill="#40b99b"/><circle cx="144" cy="93" r="5" fill="#edb45e"/><path d="M218 94h46" stroke="#dce3f3"/><rect x="221" y="76" width="9" height="18" rx="2" fill="#acb9f3"/><rect x="237" y="65" width="9" height="29" rx="2" fill="#788ce9"/><rect x="253" y="57" width="9" height="37" rx="2" fill="#4d64dc"/>',
      "color-semantics": panel(25, 24, 240, 94) + label(38, 40, "COLOR / MEANING") +
        ['#ec9b91','#efc46e','#6cc9ac','#7ba8ec','#a695e6'].map((c, i) => `<rect x="${38 + i * 44}" y="49" width="38" height="27" rx="5" fill="${c}"/>`).join("") +
        label(38, 99, "LOW") + ['#e5eaff','#c3cef8','#99aaef','#7389e4','#4a63d1'].map((c, i) => `<rect x="${65 + i * 32}" y="88" width="32" height="13" rx="2" fill="${c}"/>`).join("") + label(233, 99, "HI") +
        '<circle cx="212" cy="87" r="9" fill="white" stroke="#4a63d1" stroke-width="1.5"/><path d="m209 87 2 2 4-4" stroke="#4a63d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "scale-curve": panel(21, 21, 248, 100) + label(34, 37, "SCALE / CURVE") +
        '<path d="M37 58h216M37 78h216M37 98h216" stroke="#edf0f7" stroke-dasharray="3 3"/><path d="M37 49v56h216" stroke="#cbd5eb"/><path d="M42 99C66 95 75 77 99 81S133 62 155 63 201 35 247 46L247 104H42Z" fill="#edf0ff"/><path d="M42 99C66 95 75 77 99 81S133 62 155 63 201 35 247 46" stroke="#5b72e4" stroke-width="2.5" stroke-linecap="round"/><path d="m42 100 205-49" stroke="#42b89b" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        [[54,94],[89,79],[122,77],[157,59],[191,55],[230,43]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="white" stroke="#5b72e4" stroke-width="1.5"/>`).join("") +
        '<rect x="201" y="27" width="55" height="14" rx="7" fill="#e8f7f1"/>' + label(209, 37, "FIT 0.96", "#369a7e"),
      "time-views": panel(17, 29, 145, 86) + panel(177, 20, 96, 102) + label(29, 44, "TREND / 2024") + label(189, 36, "OCTOBER") +
        '<path d="M29 65h120M29 86h120M29 103h120" stroke="#edf0f7"/><path d="M29 97C45 99 53 59 72 65S102 101 119 80 136 57 150 61" stroke="#6379e5" stroke-width="2.5" stroke-linecap="round"/><path d="M119 52v54" stroke="#a4b1e4" stroke-dasharray="3 3"/><circle cx="119" cy="80" r="4" fill="#6379e5" stroke="white" stroke-width="2"/><path d="M123 79h48l26 2" stroke="#9eaddd" stroke-dasharray="3 3"/>' +
        Array.from({length: 35}, (_, i) => `<rect x="${188 + i % 7 * 10.5}" y="${46 + Math.floor(i / 7) * 12.5}" width="8" height="9" rx="2" fill="${['#edf0fa','#dbe2fa','#aab9ed','#768ee1'][i * 3 % 4]}"/>`).join("") +
        '<rect x="186" y="69" width="12" height="13" rx="3" fill="#5b71dc" stroke="white" stroke-width="1.5"/>' + label(189, 114, "DAY 15 / SELECTED", "#5b71dc"),
      "default": panel(28, 21, 234, 100) + label(41, 37, "VISUALIZATION / LAB") +
        '<path d="M42 60h205M42 82h205M42 104h205" stroke="#edf0f7"/><rect x="49" y="77" width="21" height="27" rx="3" fill="#c3cef8"/><rect x="82" y="58" width="21" height="46" rx="3" fill="#95a7ef"/><rect x="115" y="68" width="21" height="36" rx="3" fill="#637be4"/><path d="m161 86 22-20 23 8 30-25" stroke="#42b89b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' + [[161,86],[183,66],[206,74],[236,49]].map(([x,y]) => dot(x, y, '#42b89b')).join("")
    };
    const chart = title => panel(25, 20, 240, 102) + label(38, 36, title) + '<path d="M39 58h211M39 80h211M39 103h211" stroke="#edf0f7" stroke-dasharray="3 3"/>';
    const swatches = (colors, y = 91) => colors.map((c, i) => `<rect x="${40 + i * 30}" y="${y}" width="27" height="15" rx="3" fill="${c}"/>`).join("");
    const extraFrames = {
      "csv-loader": () => panel(22, 24, 105, 94) + label(34, 40, "STUDENTS.CSV") +
        '<path d="M34 49h81M34 65h81M34 81h81M34 97h81M59 49v59M88 49v59" stroke="#e2e7f3"/><path d="M38 57h13m17 0h12m16 0h12M38 73h13m17 0h12m16 0h12M38 89h13m17 0h12m16 0h12" stroke="#a4b3df" stroke-width="3" stroke-linecap="round"/>' + arrow(135, 70) + panel(166, 32, 101, 79) + label(177, 48, "TYPED OBJECT") +
        '<text x="177" y="65" fill="#6379df" font-size="9" font-family="monospace">{ id: 01,</text><text x="185" y="80" fill="#42a98b" font-size="9" font-family="monospace">age: 19,</text><text x="177" y="95" fill="#6379df" font-size="9" font-family="monospace">}</text>',
      "dikw": () => panel(29, 17, 232, 107) +
        '<path d="m145 30-18 22h36z" fill="#596fe2"/><path d="m123 57-18 20h80l-18-20z" fill="#8799eb"/><path d="m101 82-17 16h122l-17-16z" fill="#b0bdf3"/><path d="m80 103-16 14h162l-16-14z" fill="#d9e1fc"/>' +
        label(173, 44, "WISDOM") + label(191, 71, "KNOW") + label(51, 91, "INFO") + label(41, 111, "DATA"),
      "attribute": () => panel(22, 25, 94, 91) + label(34, 42, "ATTRIBUTE") +
        ['CATEGORY','QUANTITY','ORDER'].map((t,i) => `<rect x="34" y="${50+i*19}" width="70" height="15" rx="4" fill="${i === 1 ? '#eaf7f2' : '#eef1fb'}"/>` + label(40, 60+i*19, t)).join("") + arrow(125, 70) + panel(155, 25, 113, 91) + label(168, 42, "VISUAL CHANNEL") +
        dot(178, 63, '#7287e7', 6) + dot(201, 63, '#46b59b', 6) + dot(224, 63, '#e9b96d', 6) + '<rect x="170" y="85" width="20" height="16" rx="3" fill="#a9b8ef"/><rect x="197" y="77" width="20" height="24" rx="3" fill="#7e95e8"/><rect x="224" y="69" width="20" height="32" rx="3" fill="#596fe2"/>',
      "rollup": () => chart("GROUP / AGGREGATE") +
        '<path d="M62 57h54l33 13h57M62 100h54l33-13h57M116 57v43" stroke="#bbc8e9" stroke-width="1.5"/>' +
        [52,64,88,100].map((y,i) => dot(62, y, i<2?'#7a8fe4':'#45b69a', 4)).join("") +
        '<rect x="155" y="56" width="77" height="22" rx="6" fill="#edf0ff"/><rect x="155" y="84" width="77" height="22" rx="6" fill="#e8f7f1"/>' + label(165, 70, "GROUP A / 06", '#5b70d8') + label(165, 98, "GROUP B / 06", '#349d80'),
      "tree": () => chart("HIERARCHY / TREE") +
        '<path d="M71 77h46M117 55v45M117 55h43M117 100h43M166 55h32M198 44v24M198 44h30M198 68h30M166 100h62" stroke="#bdc9e9" stroke-width="1.5"/>' +
        [[71,77,7],[117,55,5],[117,100,5],[166,55,6],[166,100,6],[228,44,4],[228,68,4],[228,100,4]].map(([x,y,r],i)=>dot(x,y,i<5?'#6b80e3':'#48b59b',r)).join(""),
      "treelist": () => panel(34, 19, 222, 104) + label(48, 35, "EXPAND / COLLAPSE") +
        '<path d="M57 53v46h15M57 72h15M79 72v16h15" stroke="#d0d9ee" stroke-width="1.5"/>' +
        [[48,44,155],[72,63,128],[94,82,106],[72,101,128]].map(([x,y,w],i)=>`<rect x="${x}" y="${y}" width="${w}" height="15" rx="4" fill="${i===2?'#e6f6ef':'#eef1fc'}"/><path d="m${x+6} ${y+6} 3 3 3-3" stroke="#7e8ec5" stroke-width="1.2"/><path d="M${x+21} ${y+8}h${w-34}" stroke="${i===2?'#7dc6ae':'#b3bfdf'}" stroke-width="3" stroke-linecap="round"/>`).join(""),
      "color-models": () => panel(30, 21, 230, 100) + label(43, 37, "RGB / CHANNEL MIX") +
        '<circle cx="93" cy="69" r="24" fill="#ed9c99" opacity=".8"/><circle cx="115" cy="69" r="24" fill="#92b3eb" opacity=".8"/><circle cx="104" cy="87" r="24" fill="#78c6b0" opacity=".8"/>' +
        ['#d98985','#59b69c','#6e86dd'].map((c,i)=>`<path d="M158 ${58+i*20}h77" stroke="#e6ebf7" stroke-width="5" stroke-linecap="round"/><path d="M158 ${58+i*20}h${[49,32,61][i]}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>` + dot(158+[49,32,61][i],58+i*20,c,4)).join(""),
      "lab-gamut": () => chart("LAB / GAMUT") +
        '<path d="M144 47v64M77 80h134" stroke="#d8e0f0"/><path d="M95 95 101 62 142 46 191 66 182 99 136 110Z" fill="#eef1fb" stroke="#c5d0e9" stroke-dasharray="3 3"/>' +
        Array.from({length:35},(_,i)=>dot(106+i%7*11,59+Math.floor(i/7)*10,`hsl(${(i%7)*40+10}, 48%, ${68-Math.floor(i/7)*6}%)`,4)).join("") + '<circle cx="150" cy="79" r="7" fill="none" stroke="#24365c" stroke-width="1.5"/>' + label(211, 105, "a* / b*"),
      "harmony": () => panel(27, 20, 236, 102) + label(40, 36, "HARMONY / TRIAD") +
        Array.from({length:12},(_,i)=>{ const a=i*Math.PI/6;return `<path d="M95 77 ${95+32*Math.cos(a)} ${77+32*Math.sin(a)} A32 32 0 0 1 ${95+32*Math.cos(a+Math.PI/6)} ${77+32*Math.sin(a+Math.PI/6)}Z" fill="hsl(${i*30}, 55%, 70%)"/>`; }).join("") +
        '<circle cx="95" cy="77" r="19" fill="white"/><path d="m95 50 24 41H71Z" fill="none" stroke="#5063a8" stroke-width="1.5"/>' +
        ['#7389e4','#e4ad73','#80c8ae'].map((c,i)=>`<rect x="${151+i*29}" y="53" width="24" height="47" rx="5" fill="${c}"/>`).join(""),
      "palettes": () => panel(29, 19, 232, 104) + label(42, 35, "PALETTE / LIBRARY") +
        [['#e2b85c','#79b7cf','#499680','#e99a7c','#a496c3','#657bad','#9fabc3'],['#49336b','#504b8c','#3b7893','#3f9b8d','#71b67d','#aecb67','#dfd975'],['#658cc1','#9fbed9','#cddded','#eff1f4','#ecd3c9','#dba191','#c37572']].map((colors,j)=>swatches(colors,45+j*23)).join(""),
      "good-bad": () => panel(22, 26, 112, 88) + panel(156, 26, 112, 88) + label(35, 42, "AMBIGUOUS", '#ba817a') + label(169, 42, "ORDERED", '#369d80') +
        [38,172].map((x,j)=>[24,41,32,48].map((h,i)=>`<rect x="${x+i*20}" y="${101-h}" width="13" height="${h}" rx="3" fill="${j?['#ccd5f7','#a4b5f0','#8099e8','#586fd5'][i]:['#a3b5b9','#afb7b0','#a1b9bb','#b0b8ae'][i]}"/>`).join("")).join(""),
      "philosophy": () => chart("SCIENTIFIC / COLOR STUDIO") +
        ['#9dadec','#70baa8','#e1b774'].map((c,i)=>`<path d="M44 ${55+i*12}h120" stroke="#e9edf7" stroke-width="4" stroke-linecap="round"/>` + dot(73+i*32,55+i*12,c,4)).join("") +
        '<rect x="191" y="48" width="42" height="33" rx="6" fill="#6b83e1"/>' + swatches(['#dce3fb','#b7c5f4','#93a8ed','#6b83e1','#53b49d','#90cbb6','#e7c483']),
      "cvd": () => panel(25, 24, 240, 93) + label(38, 40, "ACCESSIBLE / REDUNDANT") +
        '<path d="M145 48v57" stroke="#e0e6f2" stroke-dasharray="3 3"/><path d="M43 100h84M165 100h84" stroke="#d9e1f1"/>' +
        [52,86,119,174,208,241].map((x,i)=>`<path d="M${x} 97v-${[27,43,35][i%3]}" stroke="${i<3?'#a8b4ad':['#6c81de','#49b499','#d8b16e'][i%3]}" stroke-width="12"/>`).join("") +
        dot(174,70,'#6c81de',4) + '<path d="m208 49 5 8h-10z" fill="#49b499"/><rect x="237" y="57" width="8" height="8" fill="#d8b16e"/>',
      "wide-long": () => panel(22, 29, 105, 82) + label(34, 45, "WIDE TABLE") +
        '<path d="M34 55h80v42H34Z M34 69h80M34 83h80M61 55v42M88 55v42" stroke="#cbd5ee"/><path d="M63 57h23v10H63z" fill="#a2b3ef"/><path d="M90 57h22v10H90z" fill="#87cbb6"/>' + arrow(135,70) + panel(166,20,101,103) + label(178,36,"LONG TABLE") +
        Array.from({length:5},(_,i)=>`<rect x="178" y="${45+i*13}" width="76" height="10" rx="2" fill="${i%2?'#e8f7f0':'#edf0ff'}"/><path d="M185 ${50+i*13}h16m9 0h33" stroke="${i%2?'#7ec5af':'#9cace6'}" stroke-width="2"/>`).join(""),
      "slope": () => chart("ASPECT RATIO / PERCEPTION") +
        '<path d="M42 52v53h87M155 52v53h87" stroke="#c5d0e8"/><path d="m48 99 72-23M162 99l69-48" stroke="#677de0" stroke-width="2.5" stroke-linecap="round"/><path d="M70 99a22 22 0 0 0-1-6M184 99a22 22 0 0 0-4-13" stroke="#45b69b" stroke-width="2"/>' + label(77,95,"18°",'#45a58f') + label(197,96,"35°",'#45a58f'),
      "contour": () => chart("MARCHING SQUARES / ISOLINES") +
        '<path d="M47 49v59M75 49v59M103 49v59M131 49v59M47 49h84M47 78h84M47 107h84" stroke="#dde4f3"/><path d="m47 92 19-14 9-17 28-5 28 10" stroke="#8195e8" stroke-width="2"/><path d="m47 107 28-12 28-17 28 5" stroke="#42b599" stroke-width="2"/><path d="M167 108C133 73 167 40 207 50S260 83 234 105 182 123 167 108Z" fill="#eef2fd" stroke="#b2c1ee"/><path d="M179 100C154 77 179 52 207 61S244 86 224 101 188 111 179 100Z" fill="#dce7f7" stroke="#8ca5dc"/><path d="M190 93C177 80 189 67 207 73S228 88 215 96 197 100 190 93Z" fill="#a5d8c6" stroke="#4eaf94"/>',
      "time-attr": () => chart("TIME / CYCLE + SEQUENCE") +
        '<circle cx="84" cy="79" r="27" stroke="#d4dff3" stroke-width="7"/><path d="M84 52a27 27 0 0 1 27 27" stroke="#6a81e1" stroke-width="7" stroke-linecap="round"/><path d="M84 63v16l13 8" stroke="#6a81e1" stroke-width="2" stroke-linecap="round"/><path d="M146 80h91" stroke="#cbd5ed" stroke-width="2"/>' + [153,179,205,231].map((x,i)=>dot(x,80,i===2?'#47b69b':'#95a7e7',i===2?6:4)).join("") + label(153,103,"MON     TUE     WED"),
      "french-names": () => chart("NAMES / 120 YEARS") +
        '<path d="M42 103C65 103 65 50 96 58S137 99 161 80 195 51 246 64" stroke="#7288e3" stroke-width="2.5"/><path d="M42 95C74 94 91 101 119 86S166 53 196 65 224 98 246 91" stroke="#49b399" stroke-width="2"/><path d="M161 45v64" stroke="#a1b0db" stroke-dasharray="3 3"/>' + dot(161,80,'#7288e3',4) + '<rect x="170" y="42" width="54" height="15" rx="4" fill="#edf0ff"/>' + label(177,53,"1980 / 42"),
      "spiral": () => chart("TIME / RADIAL CYCLES") +
        '<path d="M145 44v64M103 78h84" stroke="#e1e7f5" stroke-dasharray="3 3"/>' +
        `<path d="${Array.from({length:150},(_,i)=>{const a=i*.13,r=3+i*.21;return `${i?'L':'M'}${(145+r*Math.cos(a)).toFixed(1)} ${(78+r*Math.sin(a)).toFixed(1)}`;}).join(' ')}" stroke="#768ce4" stroke-width="3" stroke-linecap="round"/>` + dot(174,95,'#40b395',5) + label(204,68,"PERIOD") + label(204,82,"7 DAYS",'#566fd6'),
      "storyline": () => chart("STORYLINE / EVENT") +
        '<rect x="144" y="44" width="37" height="67" rx="5" fill="#edf0fc"/><path d="M42 55h58c27 0 31 20 60 20s38-20 86-20" stroke="#7187e0" stroke-width="3"/><path d="M42 78h58c27 0 31 3 60 3s38 20 86 20" stroke="#46b499" stroke-width="3"/><path d="M42 101h58c27 0 31-14 60-14s38-8 86-8" stroke="#dfaf69" stroke-width="3"/>' + dot(160,75,'#7187e0',4) + dot(160,81,'#46b499',4) + dot(160,87,'#dfaf69',4) + label(147,53,"EVENT")
    };
    return '<div class="experiment-preview" aria-hidden="true"><svg viewBox="0 0 290 140" fill="none" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">' +
      '<circle cx="72" cy="70" r="62" fill="#e8edfb"/><circle cx="239" cy="31" r="24" fill="#e4f3ef"/><g class="preview-scene">' +
      (frames[id] || (extraFrames[id] ? extraFrames[id]() : frames["default"])) + '</g></svg></div>';
  }

  /* 统一线性图标：16×16 viewBox、1.5 线宽 */
  function icon(name, size) {
    const P = {
      target: '<circle cx="8" cy="8" r="5.6"/><circle cx="8" cy="8" r="2"/>',
      compass: '<circle cx="8" cy="8" r="5.6"/><path d="m10.6 5.4-1.5 3.7-3.7 1.5 1.5-3.7z"/>',
      pin: '<path d="M8 14.2S3.6 10.3 3.6 6.9a4.4 4.4 0 0 1 8.8 0c0 3.4-4.4 7.3-4.4 7.3z"/><circle cx="8" cy="6.8" r="1.5"/>',
      book: '<path d="M2.8 3.2h3.4A1.8 1.8 0 0 1 8 5v8a2.2 2.2 0 0 0-1.8-1.1H2.8z"/><path d="M13.2 3.2H9.8A1.8 1.8 0 0 0 8 5v8a2.2 2.2 0 0 1 1.8-1.1h3.4z"/>',
      quiz: '<rect x="3" y="2.2" width="10" height="11.6" rx="1.6"/><path d="m5.4 7 1.6 1.6 2.6-2.8M5.4 11l1.6 1.6 2.6-2.8"/>',
      bulb: '<path d="M8 1.8a4.3 4.3 0 0 0-2.5 7.8c.6.5 1 1.2 1 1.9v.5h3v-.5c0-.7.4-1.4 1-1.9A4.3 4.3 0 0 0 8 1.8z"/><path d="M6.6 14.2h2.8"/>',
      warn: '<path d="M8 2.2 14.6 13.6H1.4z"/><path d="M8 6.4v3.2M8 12.1v.2"/>',
      info: '<circle cx="8" cy="8" r="5.9"/><path d="M8 7.4v3.8M8 4.6v.2"/>',
      question: '<circle cx="8" cy="8" r="5.9"/><path d="M6.2 6.2a1.9 1.9 0 0 1 3.7.4c0 1.3-1.9 1.7-1.9 2.9M8 12v.2"/>',
      code: '<path d="m5.5 5-3 3 3 3M10.5 5l3 3-3 3"/>',
      flask: '<path d="M6.5 1.8h3M7 1.8v4l-3.6 6.4A1.6 1.6 0 0 0 4.8 14.5h6.4a1.6 1.6 0 0 0 1.4-2.3L9 5.8v-4"/><path d="M5.2 10.4h5.6"/>',
      eye: '<path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8z"/><circle cx="8" cy="8" r="2"/>',
      star: '<path d="m8 2 1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.4l-3.7 1.9.8-4.1L2 6.3l4.2-.5z"/>',
      check: '<path d="m2.8 8.6 3.2 3.2L13.2 4.4"/>',
      x: '<path d="m4 4 8 8M12 4l-8 8"/>',
      menu: '<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>',
      search: '<circle cx="7" cy="7" r="4.5"/><path d="m10.4 10.4 3.1 3.1"/>',
      play: '<path d="M5 3.4v9.2L12.6 8z"/>',
      refresh: '<path d="M13.6 8a5.6 5.6 0 1 1-1.6-3.9M13.6 2.4v2.8h-2.8"/>',
      edit: '<path d="M11.2 2.6 13.4 4.8 5 13.2l-3 .8.8-3z"/>',
      "chevron-down": '<path d="m4 6 4 4 4-4"/>',
      "chevron-up": '<path d="m12 10-4-4-4 4"/>',
      network: '<circle cx="4" cy="8" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M5.8 7.2 10.2 4.8M5.8 8.8l4.4 2.4"/>',
    };
    const filled = name === "star-fill";
    const body = P[filled ? "star" : name] || P.info;
    return '<svg class="ico" width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 16 16" fill="' +
      (filled || name === "play" ? "currentColor" : "none") +
      '" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  /* 学习数据导出 / 导入 / 清除（命令面板与统计页共用） */
  function exportData() {
    const blob = new Blob([window.Store.exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vll-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast(L("已导出学习数据 JSON", "Learning data exported as JSON"), "ok");
  }
  function importData(onDone) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const f = input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          window.Store.importState(reader.result);
          toast(L("导入成功，即将刷新页面", "Import succeeded, refreshing…"), "ok");
          setTimeout(() => { if (onDone) onDone(); else location.reload(); }, 800);
        } catch (e) {
          toast(L("导入失败：文件格式不正确", "Import failed: invalid file format"), "warn");
        }
      };
      reader.readAsText(f);
    });
    input.click();
  }
  function resetData() {
    if (confirm(L("确定清除全部学习数据吗？进度、收藏、自测、笔记都会被删除，且不可恢复。", "Clear ALL learning data? Progress, bookmarks, quizzes and notes will be deleted permanently."))) {
      window.Store.resetAll();
      toast(L("已清除全部学习数据", "All learning data cleared"), "warn");
      setTimeout(() => location.reload(), 600);
    }
  }

  window.Common = {
    L,
    renderFooter, toast, copyText, loadData, params,
    lessonLink, findLesson, adjacentLessons, svgMount, experimentPreview, icon,
    exportData, importData, resetData,
  };
})();

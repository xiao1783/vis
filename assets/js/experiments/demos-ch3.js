/* ============================================================
 * demos-ch3.js — 第三章 7 个色彩演示
 * ============================================================ */

/* CVD 矩阵（近似） */
const CVD_M = {
  deuteranopia: [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]],
  protanopia: [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
  tritanopia: [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]],
};
function simCVD(rgb, type) {
  if (!type) return rgb;
  const m = CVD_M[type];
  return [
    Math.round(Math.max(0, Math.min(255, rgb[0] * m[0][0] + rgb[1] * m[0][1] + rgb[2] * m[0][2]))),
    Math.round(Math.max(0, Math.min(255, rgb[0] * m[1][0] + rgb[1] * m[1][1] + rgb[2] * m[1][2]))),
    Math.round(Math.max(0, Math.min(255, rgb[0] * m[2][0] + rgb[1] * m[2][1] + rgb[2] * m[2][2]))),
  ];
}
function rgbOf(hex) { const c = d3.color(hex); return [Math.round(c.rgb().r), Math.round(c.rgb().g), Math.round(c.rgb().b)]; }
function grayOf(hex) {
  const [r,g,b] = rgbOf(hex);
  const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return "rgb(" + v + "," + v + "," + v + ")";
}

/* ---------- 3.1 颜色模型与 CVD ---------- */
(function () {
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls">' +
      '<label>R <input type="range" id="cm-r" min="0" max="255" value="100"></label>' +
      '<label>G <input type="range" id="cm-g" min="0" max="255" value="50"></label>' +
      '<label>B <input type="range" id="cm-b" min="0" max="255" value="200"></label>' +
      '<label>CVD：<select id="cm-cvd"><option value="">正常</option><option value="protanopia">红色盲</option><option value="deuteranopia">绿色盲</option><option value="tritanopia">蓝色盲</option></select></label></div>' +
      '<div class="muted" style="font-size:11px">原始颜色 · 拖动 RGB 滑块实时混色</div>' +
      '<div id="cm-swatch" style="height:56px;border-radius:10px;border:1px solid var(--border);margin-bottom:10px"></div>' +
      '<div class="muted" style="font-size:11px">模拟视觉 · 与原色对照</div>' +
      '<div id="cm-sim" style="height:40px;border-radius:10px;border:1px solid var(--border);margin-bottom:10px"></div>' +
      '<div class="demo-detail" id="cm-detail"></div>';
    function update() {
      const r = +container.querySelector("#cm-r").value,
        g = +container.querySelector("#cm-g").value,
        b = +container.querySelector("#cm-b").value,
        type = container.querySelector("#cm-cvd").value;
      const hex = d3.rgb(r, g, b).formatHex();
      const hsl = d3.hsl(hex), lab = d3.lab(hex);
      container.querySelector("#cm-swatch").style.background = hex;
      container.querySelector("#cm-sim").style.background = "rgb(" + simCVD([r, g, b], type).join(",") + ")";
      container.querySelector("#cm-detail").innerHTML =
        '<table class="data-table"><tbody>' +
        "<tr><td>HEX</td><td><code>" + hex + "</code></td></tr>" +
        "<tr><td>RGB</td><td>" + r + ", " + g + ", " + b + "</td></tr>" +
        "<tr><td>HSL</td><td>H " + (hsl.h || 0).toFixed(0) + "°, S " + (hsl.s * 100).toFixed(0) + "%, L " + (hsl.l * 100).toFixed(0) + "%</td></tr>" +
        "<tr><td>Lab</td><td>L* " + lab.l.toFixed(1) + ", a* " + lab.a.toFixed(1) + ", b* " + lab.b.toFixed(1) + "</td></tr>" +
        "</tbody></table>" +
        '<div class="muted" style="font-size:12.5px">CVD 模拟为线性近似，仅用于预判，不能替代真实用户测试。</div>';
    }
    container.querySelectorAll("input,select").forEach((el) => el.addEventListener("input", update));
    update();
  }
  window.Demos.register("color-models", render);
})();

/* ---------- 3.3 Lab 色域 ---------- */
(function () {
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>明度 L*：<input type="range" id="lab-l" min="10" max="90" value="55"></label>' +
      '<span class="muted" style="font-size:12px">点击平面或用滑块取色</span>' +
      '<label>a* <input type="range" id="lab-a" min="-120" max="120" value="0"></label>' +
      '<label>b* <input type="range" id="lab-b" min="-120" max="120" value="0"></label></div>' +
      '<div class="lab-svg-wrap" id="lab-svg"></div>' +
      '<div class="demo-detail" id="lab-detail"></div>';
    const slider = container.querySelector("#lab-l");
    function draw() {
      const L = +slider.value;
      const host = container.querySelector("#lab-svg");
      const W = Math.max(300, host.clientWidth || 360), H = 320, size = Math.min(120, (W - 110) / 2);
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
      // 背景：整个 a*b* 范围（含超色域）
      const g = svg.append("g").attr("transform", "translate(" + W / 2 + "," + H / 2 + ")");
      const N = 42;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const a = -120 + (240 * i) / (N - 1), b = -120 + (240 * j) / (N - 1);
          const col = d3.lab(L, a, b);
          const rgb = col.rgb();
          const inGamut = rgb.r >= 0 && rgb.r <= 255 && rgb.g >= 0 && rgb.g <= 255 && rgb.b >= 0 && rgb.b <= 255;
          g.append("rect").attr("x", (a / 120) * size - size / N).attr("y", (b / 120) * size - size / N)
            .attr("width", (2 * size) / N + 1).attr("height", (2 * size) / N + 1)
            .attr("fill", inGamut ? col.formatHex() : "#f1f5f9").attr("opacity", inGamut ? 1 : 0.4);
        }
      }
      g.append("circle").attr("r", 2).attr("fill", "#0f172a").attr("cx", 0).attr("cy", 0);
      g.append("text").attr("x", 6).attr("y", 3).attr("font-size", 10).attr("fill", "#334155").text("中性");
      g.append("text").attr("x", size + 4).attr("y", 0).attr("font-size", 10).attr("fill", "#64748b").text("a*+ 红");
      g.append("text").attr("x", -size - 4).attr("y", 0).attr("text-anchor", "end").attr("font-size", 10).attr("fill", "#64748b").text("绿 a*-");
      g.append("text").attr("x", 0).attr("y", -size - 4).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "#64748b").text("b*- 蓝");
      g.append("text").attr("x", 0).attr("y", size + 14).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "#64748b").text("黄 b*+");
      const marker = g.append("circle").attr("r", 6).attr("fill", "none").attr("stroke", "#0f172a").attr("stroke-width", 2).style("pointer-events", "none");
      function pick(a, b) {
          const col = d3.lab(L, a, b);
          const rgb = col.rgb();
          const clamped = Math.min(rgb.r, rgb.g, rgb.b) < 0 || Math.max(rgb.r, rgb.g, rgb.b) > 255;
          marker.attr("cx", a / 120 * size).attr("cy", b / 120 * size);
          container.querySelector("#lab-detail").innerHTML =
            "<b>Lab(" + L + ", " + a.toFixed(0) + ", " + b.toFixed(0) + ")</b><br>" +
            "转换 HEX：<code>" + col.formatHex() + "</code>" +
            (clamped ? '<div class="note warn" style="margin:6px 0">该点超出 sRGB 色域，显示时被裁剪（clamp）。</div>'
                     : '<div class="note tip" style="margin:6px 0">该点在 sRGB 色域内，可正常显示。</div>');
      }
      svg.append("rect").attr("width", W).attr("height", H).attr("fill", "transparent").attr("pointer-events", "all").style("cursor", "crosshair")
        .on("click", e => {
          const [mx,my] = d3.pointer(e,g.node());
          if (Math.abs(mx) > size || Math.abs(my) > size) return;
          container.querySelector("#lab-a").value = Math.round(mx / size * 120);
          container.querySelector("#lab-b").value = Math.round(my / size * 120);
          container.querySelector("#lab-a").dispatchEvent(new Event("input", {bubbles:true}));
        });
      pick(+container.querySelector("#lab-a").value, +container.querySelector("#lab-b").value);
    }
    container.querySelectorAll('input[type="range"]').forEach(input => input.addEventListener("input", draw));
    Demos.onResize(container, draw);
    draw();
  }
  window.Demos.register("lab-gamut", render);
})();

/* ---------- 3.4 色系搭配 ---------- */
(function () {
  const RULES = {
    monochromatic: { name: "同类 0°", off: 0, desc: "保持同一色相，通过明度区分层次。" },
    analogous: { name: "邻近 ±30°", off: 30, desc: "相邻色协调，但类别之间的区分度较弱。" },
    triadic: { name: "三色 120°", off: 120, desc: "三个色相等距分布，兼顾对比与均衡；用图例明确类别。" },
    split: { name: "分裂互补 150°", off: 150, desc: "基色搭配其互补色两侧的颜色，保留对比并减弱直接冲突。" },
    complementary: { name: "互补 180°", off: 180, desc: "两色对比鲜明，适合突出主体；具体含义仍需图例说明。" },
  };
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>基色 H：<input type="range" id="ha-h" min="0" max="359" value="210"></label>' +
      Object.keys(RULES).map((k) => '<button class="sem-btn" data-r="' + k + '">' + RULES[k].name + "</button>").join("") + "</div>" +
      '<div class="lab-svg-wrap" id="ha-wheel"></div>' +
      '<div class="color-swatch-grid" id="ha-pal" style="margin:10px 0"></div>' +
      '<div class="demo-detail" id="ha-detail"></div>';
    let rule = "analogous";
    function draw() {
      const H = +container.querySelector("#ha-h").value, off = RULES[rule].off;
      const host = container.querySelector("#ha-wheel");
      const W = Math.max(300, host.clientWidth || 360), cx = W / 2, cy = 130, R = 96;
      d3.select(host).selectAll("*").remove();
      const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", 250).attr("viewBox", "0 0 " + W + " " + 250);
      const wheel = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");
      const steps = 72;
      for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * 360, a1 = ((i + 1) / steps) * 360;
        wheel.append("path")
          .attr("d", "M0 0 L " + (R * Math.cos((a0 - 90) * Math.PI / 180)) + " " + (R * Math.sin((a0 - 90) * Math.PI / 180)) +
            " A " + R + " " + R + " 0 0 1 " + (R * Math.cos((a1 - 90) * Math.PI / 180)) + " " + (R * Math.sin((a1 - 90) * Math.PI / 180)) + " Z")
          .attr("fill", d3.hsl(i * 5, 0.6, 0.55).formatHex());
      }
      const hs = rule === "monochromatic" ? [H] : rule === "complementary" ? [H, (H + 180) % 360]
        : rule === "analogous" ? [H - 30, H, H + 30]
        : rule === "triadic" ? [H, H + 120, H + 240]
        : [H, (H + 150) % 360, (H + 210) % 360];
      hs.forEach((hh) => {
        const rad = (hh - 90) * Math.PI / 180;
        wheel.append("circle").attr("cx", R * Math.cos(rad)).attr("cy", R * Math.sin(rad)).attr("r", 7)
          .attr("fill", d3.hsl(hh, 0.6, 0.55).formatHex()).attr("stroke", "#0f172a").attr("stroke-width", 2);
      });
      const palette = rule === "monochromatic" ? [.3,.42,.55,.68,.8].map(light => d3.hsl(H,.6,light).formatHex()) :
        hs.map(hue => d3.hsl((hue + 360) % 360,.6,.55).formatHex());
      LabWorkbench.swatches(container.querySelector("#ha-pal"), palette);
      wheel.append("circle").attr("r", R + 10).attr("fill", "transparent").style("cursor", "crosshair")
        .on("click", event => {
          const [mx,my] = d3.pointer(event, wheel.node());
          container.querySelector("#ha-h").value = Math.round((Math.atan2(my,mx) * 180 / Math.PI + 450) % 360);
          container.querySelector("#ha-h").dispatchEvent(new Event("input", {bubbles: true}));
        });
      container.querySelector("#ha-detail").innerHTML = "规则：<b>" + RULES[rule].name +
        "</b>。" + RULES[rule].desc;
    }
    container.querySelectorAll("[data-r]").forEach((b) => {
      b.addEventListener("click", () => {
        rule = b.dataset.r;
        container.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("active", x === b));
        draw();
      });
    });
    container.querySelector("#ha-h").addEventListener("input", draw);
    container.querySelector('[data-r="analogous"]').classList.add("active");
    Demos.onResize(container, draw);
    draw();
  }
  window.Demos.register("harmony", render);
})();

/* ---------- 3.5 经典调色板 ---------- */
(function () {
  const PAL = {
    "Okabe-Ito（CVD）": ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"],
    "Paul Tol": ["#4477AA", "#EE6677", "#228833", "#CCBB44", "#66CCEE", "#AA3377", "#BBBBBB"],
    "Tableau 10": ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7"],
  };
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>模式：<select id="pl-mode"><option value="color">彩色</option><option value="gray">灰度</option></select></label>' +
      '<label>CVD：<select id="pl-cvd"><option value="">正常</option><option value="protanopia">红色盲</option><option value="deuteranopia">绿色盲</option></select></label></div>' +
      '<div id="pl-list"></div>' +
      '<div class="demo-detail">顺序型 Viridis 与发散型 RdBu：</div>' +
      '<div style="margin-bottom:6px"><div class="muted" style="font-size:12px">Viridis（顺序）</div><div class="color-strip" id="pl-vir"></div></div>' +
      '<div><div class="muted" style="font-size:12px">RdBu（发散，中点为中性）</div><div class="color-strip" id="pl-rdbu"></div></div>';
    function cellColor(hex, mode, cvd) {
      if (mode === "gray") return grayOf(hex);
      return "rgb(" + simCVD(rgbOf(hex), cvd).join(",") + ")";
    }
    function draw() {
      const mode = container.querySelector("#pl-mode").value;
      const cvd = container.querySelector("#pl-cvd").value;
      const list = container.querySelector("#pl-list"); list.replaceChildren();
      Object.entries(PAL).forEach(([name, colors]) => {
        const group = document.createElement("div"); group.className = "ctrl-group";
        const title = document.createElement("div"); title.className = "cg-title"; title.textContent = name + " · 点击复制原始色值";
        const swatches = document.createElement("div"); swatches.className = "color-swatch-grid";
        group.append(title,swatches); list.append(group);
        LabWorkbench.swatches(swatches,colors,c => cellColor(c,mode,cvd));
      });
      container.querySelector("#pl-vir").innerHTML = d3.range(0, 1, 0.08).map((t) =>
        "<i style='background:" + cellColor(d3.interpolateViridis(t),mode,cvd) + "'></i>").join("");
      container.querySelector("#pl-rdbu").innerHTML = d3.range(0, 1, 0.05).map((t) =>
        "<i style='background:" + cellColor(d3.interpolateRdBu(1 - t),mode,cvd) + "'></i>").join("");
    }
    container.querySelectorAll("select").forEach((s) => s.addEventListener("change", draw));
    draw();
  }
  window.Demos.register("palettes", render);
})();

/* ---------- 3.6 对错案例 ---------- */
(function () {
  const CASES = [
    { name: "类别用类别色", good: true, type: "cat", palette: ["#4E79A7", "#F28E2B", "#59A14F", "#E15759", "#76B7B2", "#B07AA1"],
      reason: "6 个无顺序类别使用离散定性色，区分清晰且不暗示顺序。" },
    { name: "类别用彩虹渐变", good: false, type: "cat", palette: ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#fee08b", "#f46d43"],
      reason: "类别本无顺序，彩虹渐变凭空制造高低，且相邻色难区分。" },
    { name: "偏差用发散色", good: true, type: "div", palette: ["#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b"],
      reason: "以中性白为零点，蓝/红表达正负，深浅表达偏离程度。" },
    { name: "偏差用单方向蓝", good: false, type: "div", palette: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
      reason: "单向蓝色深浅无法表达正负，读不出中性零点。" },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="demo-detail">先选择一组图，再判断配色是否合理。提交后查看解释；本轮仅记录每组第一次的判断。</div>' +
      '<div class="mini-grid" id="gb-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>' +
      '<div class="demo-detail" id="gb-result" style="margin-top:12px"></div>';
    const answers = {};
    function bars(palette, type) {
      return '<svg viewBox="0 0 120 90" style="height:90px;width:100%">' +
        palette.map((c, i) => {
          const value = type === "div" ? i-3 : i%4+2, height=Math.abs(value)*9;
          return '<rect x="' + (i*16+3) + '" y="' + (type === "div" ? value>=0 ? 45-height : 45 : 75-height) + '" width="12" height="' + height + '" fill="' + c + '" rx="2"/>';
        }).join("") + (type === "div" ? '<path d="M0 45H120" stroke="#b1bfd4"/><text x="1" y="88" font-size="8" fill="#71849c">负偏差 ← 0 → 正偏差</text>' : '') + '</svg>';
    }
    const grid = container.querySelector("#gb-grid");
    CASES.forEach((c, i) => {
      const card = document.createElement("div");
      card.className = "mini-card";
      card.innerHTML = bars(c.palette,c.type) + '<div class="mc-name" style="font-size:12.5px">' + c.name + "</div>";
      card.addEventListener("click", () => {
        grid.querySelectorAll(".mini-card").forEach((x) => { x.style.borderColor = ""; x.style.background = ""; });
        card.style.borderColor = "#879cdd"; card.style.background = "#f0f4ff";
        const result=container.querySelector("#gb-result");
        result.innerHTML='<b>第 ' + (i+1) + ' 组 · 你的判断？</b><div class="lab-controls" style="margin-top:10px"><button class="demo-btn" data-answer="yes">配色合理</button><button class="demo-btn secondary" data-answer="no">需要改进</button></div><div id="gb-explain"></div>';
        result.querySelectorAll("[data-answer]").forEach(button=>button.addEventListener("click",()=>{
          const correct=(button.dataset.answer==="yes")===c.good;
          if(!(i in answers)) answers[i]=correct;
          result.querySelector("#gb-explain").innerHTML='<div class="sem-verdict '+(correct?"good":"bad")+'">'+(correct?"✓ 判断正确":"再想一想")+'<br>'+c.reason+'</div><p style="font-size:12px;margin-top:8px">本轮首答 '+Object.values(answers).filter(Boolean).length+' / '+Object.keys(answers).length+'，共 4 组。</p>';
        }));
      });
      grid.appendChild(card);
    });
  }
  window.Demos.register("good-bad", render);
})();

/* ---------- 3.7 科研配色生成 ---------- */
(function () {
  function hslHex(h, s, l) { return d3.hsl(h, s, l).formatHex(); }
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls">' +
      '<label>主色 H <input type="range" id="ph-h" min="0" max="359" value="210"></label>' +
      '<label>S <input type="range" id="ph-s" min="0" max="100" value="62"></label>' +
      '<label>L <input type="range" id="ph-l" min="20" max="80" value="55"></label>' +
      '<label><input type="checkbox" id="ph-gray"> 灰度检查</label></div>' +
      '<div class="color-swatch-grid" id="ph-pal" style="margin:10px 0"></div><div class="lab-svg-wrap" id="ph-preview"></div>' +
      '<div class="demo-detail" id="ph-detail"></div>';
    function gen(H, S, L) {
      return [
        hslHex((H - 30 + 360) % 360, S * 0.6, L * 1.1),
        hslHex((H - 30 + 360) % 360, S, L),
        hslHex(H, S, L),
        hslHex((H + 30) % 360, S, L),
        hslHex((H + 30) % 360, S * 0.6, L * 1.1),
        hslHex((H + 180) % 360, S * 0.8, L * 0.95),
        hslHex(H, S * 0.2, Math.min(0.95, L * 1.4)),
      ];
    }
    function draw() {
      const H = +container.querySelector("#ph-h").value,
        S = +container.querySelector("#ph-s").value / 100,
        L = +container.querySelector("#ph-l").value / 100;
      const gray = container.querySelector("#ph-gray").checked;
      const pal = gen(H, S, L);
      LabWorkbench.swatches(container.querySelector("#ph-pal"), pal, c => gray ? grayOf(c) : c);
      const preview = d3.select(container.querySelector("#ph-preview")); preview.selectAll("*").remove();
      const svg = preview.append("svg").attr("viewBox", "0 0 360 160").attr("role","img").attr("aria-label","生成配色在柱状图中的预览");
      svg.selectAll("rect").data(pal).join("rect").attr("x",(d,i)=>22+i*46).attr("y",(d,i)=>130-[52,84,110,70,95,118,60][i])
        .attr("height",(d,i)=>[52,84,110,70,95,118,60][i]).attr("width",30).attr("rx",4).attr("fill",d=>gray?grayOf(d):d);
      svg.selectAll("text").data(pal).join("text").attr("x",(d,i)=>37+i*46).attr("y",147).attr("text-anchor","middle").attr("font-size",11).attr("fill","#71849c").text((d,i)=>"组 "+(i+1));
      container.querySelector("#ph-detail").innerHTML =
        "7 色：相邻色（低饱和）→ 主色 → 相邻色 → 互补（压暗）→ 高亮（极低饱和）。<br>" +
        '<span class="muted" style="font-size:12.5px">这是经验规则，不是绝对标准；出图前请做灰度与 CVD 检查。</span>';
    }
    container.querySelectorAll("input").forEach((el) => el.addEventListener("input", draw));
    draw();
  }
  window.Demos.register("philosophy", render);
})();

/* ---------- 3.8 CVD 论文图检查 ---------- */
(function () {
  const FIG = [
    { name: "类别图（红绿 → Okabe-Ito）",
      bad: ["#d73027", "#1a9850", "#d73027", "#1a9850", "#d73027"],
      good: ["#E69F00", "#56B4E9", "#009E73", "#CC79A7", "#0072B2"] },
    { name: "热力图（Jet → Viridis）",
      bad: ["#00007f", "#0000ff", "#00ffff", "#ffff00", "#ff0000", "#7f0000"],
      good: d3.range(0, 1, 0.16).map(d3.interpolateViridis) },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="lab-controls"><label>视图：<select id="cv-fig"><option value="0">类别图</option><option value="1">热力图</option></select></label>' +
      '<label>CVD：<select id="cv-cvd"><option value="">正常</option><option value="protanopia">红色盲</option><option value="deuteranopia">绿色盲</option><option value="tritanopia">蓝色盲</option></select></label>' +
      '<label><input type="checkbox" id="cv-shape"> 加形状/标签冗余</label></div>' +
      '<div class="mini-grid" id="cv-row" style="grid-template-columns:1fr 1fr"></div>' +
      '<div class="demo-detail" id="cv-detail"></div>';
    const SHAPES = ["●", "■", "▲", "◆", "★", "✚"];
    function draw() {
      const fi = +container.querySelector("#cv-fig").value;
      const cvd = container.querySelector("#cv-cvd").value;
      const shape = container.querySelector("#cv-shape").checked;
      const fig = FIG[fi];
      const row = container.querySelector("#cv-row");
      row.innerHTML = ["原方案（易混淆）", "改进方案（CVD 友好）"].map((title, k) => {
        const pal = k === 0 ? fig.bad : fig.good;
        return '<div class="ctrl-card" style="border:1px solid var(--border);border-radius:10px;padding:12px"><div class="cg-title">' + title + "</div>" +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' + pal.map((c, i) => {
            const cc = "rgb(" + simCVD(rgbOf(c), cvd).join(",") + ")";
            if (fi === 1) return "<span style='width:32px;height:32px;background:" + cc + ";display:grid;place-items:center;color:white;text-shadow:0 1px 3px #334155;font-size:11px'>" + (shape ? i + 1 : "") + "</span>";
            return '<div style="width:38px;height:38px;border-radius:50%;background:' + cc +
              ';display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px">' + (shape ? SHAPES[i] : "") + "</div>";
          }).join("") + "</div></div>";
      }).join("");
      container.querySelector("#cv-detail").innerHTML =
        (cvd ? "当前为 <b>" + container.querySelector("#cv-cvd").selectedOptions[0].text +
          "模拟</b>：" : "正常视图：") +
        "原方案中多个颜色趋于相同；" +
        (shape ? "已加形状/标签，即使颜色混淆也能区分。" : "打开“形状/标签冗余”，颜色失效时仍可辨认。");
    }
    container.querySelectorAll("select,input").forEach((el) => el.addEventListener("change", draw));
    draw();
  }
  window.Demos.register("cvd", render);
})();

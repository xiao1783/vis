/* ============================================================
 * demos-ch5.js — 第五章：time-attr / french-names / spiral / storyline
 * ============================================================ */

/* ---------- 5.1 时间属性 ---------- */
(function () {
  const ATTRS = [
    { key: "ordered", name: "有序性", icon: "↗", color: "#10b981",
      desc: "时间是有序的，两个事件有先后次序，与因果关系紧密相连。",
      example: "火车时刻表、事件日志、git commit history" },
    { key: "continuous", name: "连续性", icon: "∞", color: "#3b82f6",
      desc: "时间是连续的，两个时间点之间总存在另一个时间点。",
      example: "实时传感器数据（温度、心率）、流式数据" },
    { key: "periodic", name: "周期性", icon: "🔁", color: "#f59e0b",
      desc: "许多自然过程有循环规律（季节、昼夜），可用循环时间域表示。",
      example: "24 小时体温、12 个月气温、年周期销售" },
    { key: "independent", name: "独立于空间", icon: "✂️", color: "#8b5cf6",
      desc: "时间与空间相关，但科学可视化中通常将二者独立处理。",
      example: "折线图 x 轴只用时间、y 轴只用度量" },
    { key: "structured", name: "结构性", icon: "📐", color: "#ec4899",
      desc: "时间尺度分年/月/日/时/分/秒，既有自然划分也有人为定义。",
      example: "日历/周排列、闰年调整、工作日与周末" },
  ];
  function render(container) {
    container.innerHTML =
      '<div class="mini-grid" id="ta-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))"></div>' +
      '<div class="lab-svg-wrap" id="ta-timeline"></div>' +
      '<div class="demo-detail" id="ta-detail" style="margin-top:12px"></div>';
    const grid = container.querySelector("#ta-grid");
    ATTRS.forEach((a, i) => {
      const c = document.createElement("div");
      c.className = "mini-card";
      c.innerHTML = '<div style="font-size:26px;color:' + a.color + '">' + a.icon + "</div>" +
        '<div class="mc-name" style="font-size:13px">' + a.name + "</div>";
      c.addEventListener("click", () => select(i));
      grid.appendChild(c);
    });
    function select(i) {
      const a = ATTRS[i];
      grid.querySelectorAll(".mini-card").forEach((x, j) => x.classList.toggle("active", j === i));
      container.querySelector("#ta-detail").innerHTML =
        "<h4 style='color:" + a.color + "'>" + a.name + "</h4><p>" + a.desc + "</p>" +
        '<div class="example-box"><div class="eb-title">典型例子</div>' + a.example + "</div>";
      const svg = d3.select(container.querySelector("#ta-timeline"));
      svg.selectAll("*").remove();
      const chart = svg.append("svg").attr("viewBox", "0 0 360 140").attr("role", "img").attr("aria-label", a.name + "示意图");
      chart.append("line").attr("x1", 30).attr("x2", 330).attr("y1", 105).attr("y2", 105).attr("stroke", "#dbe4f1");
      if (a.key === "periodic") {
        chart.append("path").datum(d3.range(101)).attr("d", d3.line().x(d => 30 + d * 3).y(d => 65 - Math.sin(d / 100 * Math.PI * 4) * 30))
          .attr("fill", "none").attr("stroke", a.color).attr("stroke-width", 3);
      } else if (a.key === "continuous") {
        chart.append("path").attr("d", "M30,90 C100,90 100,25 180,50 S260,90 330,30").attr("fill", "none").attr("stroke", a.color).attr("stroke-width", 3);
      } else {
        chart.selectAll("rect").data(d3.range(a.key === "structured" ? 12 : 6)).join("rect")
          .attr("x", (d, i) => 30 + i * (a.key === "structured" ? 25 : 50)).attr("y", d => a.key === "ordered" ? 85 - d * 10 : 40)
          .attr("width", a.key === "structured" ? 19 : 30).attr("height", d => a.key === "ordered" ? 20 + d * 10 : 50)
          .attr("rx", 5).attr("fill", a.color).attr("opacity", d => .35 + d * .05);
      }
      chart.append("text").attr("x", 30).attr("y", 128).attr("font-size", 11).attr("fill", "#71849c").text(a.key === "periodic" ? "同一周期反复出现" : a.key === "structured" ? "年 → 月 → 日：时间可分层" : "时间 →");
    }
    select(0);
  }
  window.Demos.register("time-attr", render);
})();

/* ---------- 5.2 法国人名折线（长程趋势） ---------- */
(function () {
  function render(container) {
    container.innerHTML =
      '<div class="demo-detail" id="fn-status">正在加载 data/french_names.json…</div>' +
      '<div class="lab-controls" id="fn-controls" style="display:none"></div>' +
      '<div class="lab-svg-wrap" id="fn-svg"></div>' +
      '<div class="demo-detail" id="fn-tip">折线图最适合看<b>长程趋势与命名流行度的变迁</b>。</div>';
    d3.json("data/french_names.json").then(function (json) {
      if (!container.isConnected) return;
      const names = Object.keys(json.names);
      const colors = { Marie: "#1976d2", Jean: "#d32f2f", Camille: "#388e3c" };
      const controls = container.querySelector("#fn-controls");
      controls.style.display = "flex";
      controls.innerHTML =
        '<label style="font-size:13px">显示：</label>' +
        names.map((n) =>
          '<label class="check-chip"><input type="checkbox" data-n="' + n + '" checked> ' + n + "</label>").join("") +
        '<label style="margin-left:8px">起始年 <input type="range" id="fn-from" min="1900" max="2019" step="1" value="1900"></label>' +
        '<span class="readout" id="fn-fromv">1900</span>' +
        '<label>定位年份 <input type="range" id="fn-year" min="1900" max="2020" value="1960"></label>';
      const status = container.querySelector("#fn-status");
      status.innerHTML = "数据：法国 1900–2020 年三个名字的出生登记数（真实历史统计）。";
      function draw() {
        const from = +container.querySelector("#fn-from").value;
        container.querySelector("#fn-year").min = from;
        container.querySelector("#fn-fromv").textContent = from;
        const show = {};
        controls.querySelectorAll("[data-n]").forEach((cb) => { show[cb.dataset.n] = cb.checked; });
        const host = container.querySelector("#fn-svg");
        const W = Math.max(320, host.clientWidth || 400), H = 260;
        d3.select(host).selectAll("*").remove();
        const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
        const M = { l: 48, r: 65, t: 14, b: 28 }, iw = W - M.l - M.r, ih = H - M.t - M.b;
        const x = d3.scaleLinear().domain([from, 2020]).range([0, iw]);
        const active = names.filter((n) => show[n]);
        const y = d3.scaleLinear().domain([0, d3.max(active.flatMap((n) =>
          json.names[n].filter((d) => d.year >= from).map((d) => d.count))) || 100]).range([ih, 0]);
        const g = svg.append("g").attr("transform", "translate(" + M.l + "," + M.t + ")");
        const yearTicks = Math.max(1, Math.min(7, 2020 - from, Math.floor(iw / 55)));
        g.append("g").attr("transform", "translate(0," + ih + ")").call(d3.axisBottom(x).ticks(yearTicks).tickFormat(d3.format("d"))).selectAll("text").attr("font-size", 10);
        g.append("g").call(d3.axisLeft(y).ticks(6)).selectAll("text").attr("font-size", 10);
        active.forEach((n) => {
          const line = d3.line().x((d) => x(d.year)).y((d) => y(d.count)).curve(d3.curveMonotoneX);
          g.append("path").datum(json.names[n].filter((d) => d.year >= from))
            .attr("d", line).attr("fill", "none").attr("stroke", colors[n]).attr("stroke-width", 2);
          g.append("text").attr("x", iw + 4).attr("y", y(json.names[n].find((d) => d.year === 2020).count))
            .attr("font-size", 11).attr("fill", colors[n]).text(n);
        });
        // 交互：十字线
        const vline = g.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", "#94a3b8").attr("stroke-dasharray", "3 3").style("display", "none");
        function inspect(year) {
            year = Math.max(from, Math.min(2020, year));
            container.querySelector("#fn-year").value = year;
            vline.style("display", null).attr("x1", x(year)).attr("x2", x(year));
            const tip = active.map((n) => {
              const d = json.names[n].find((q) => q.year === year);
              return n + ": " + (d ? d.count : 0);
            }).join("　");
            container.querySelector("#fn-tip").textContent = active.length ? year + " 年 —— " + tip : "请至少勾选一个名字，才能比较趋势。";
        }
        g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "none").attr("pointer-events", "all")
          .on("pointermove pointerdown", (e) => inspect(Math.round(x.invert(d3.pointer(e)[0]))));
        inspect(+container.querySelector("#fn-year").value);
      }
      controls.addEventListener("input", draw);
      Demos.onResize(container, draw);
      draw();
    }).catch(function (e) {
      container.querySelector("#fn-status").innerHTML =
        '<span class="demo-error">数据加载失败：' + window.esc(e.message) + "，请用本地服务器访问。</span>";
    });
  }
  window.Demos.register("french-names", render);
})();

/* ---------- 5.4 螺旋图（年度周期） ---------- */
(function () {
  const parse = d3.timeParse("%Y-%m-%d");
  function render(container) {
    container.innerHTML =
      '<div class="demo-detail" id="sp-status">正在加载 data/weather_2024.csv…</div>' +
      '<div class="lab-controls"><label>每月一圈：</label><span class="muted" style="font-size:12.5px">12 个月 = 12 圈，颜色按日最高气温</span>' +
      '<label style="margin-left:6px"><input type="checkbox" id="sp-lines"> 显示月份分隔线</label>' +
      '<label>突出月份 <select id="sp-month"><option value="all">全年</option>' + d3.range(12).map(m => '<option value="' + m + '">' + (m + 1) + ' 月</option>').join("") + '</select></label></div>' +
      '<div class="lab-svg-wrap" id="sp-svg"></div>' +
      '<div id="sp-legend"></div><div class="lab-chart-readout" id="sp-readout">点击任意日期点，查看日期与最高气温。</div>' +
      '<div class="demo-detail">螺旋图把<b>周期性</b>展开为环形，便于比较周期中相同位置（如每月初/月中）；径向位置表示月份推进。</div>';
    d3.csv("data/weather_2024.csv", (d) => ({ date: parse(d.date), temp: +d.temp_max })).then(function (days) {
      if (!container.isConnected) return;
      container.querySelector("#sp-status").innerHTML = "2024 全年 " + days.length + " 天日最高气温（真实日度观测）。";
      function draw() {
        const host = container.querySelector("#sp-svg");
        const W = Math.max(300, host.clientWidth || 380), H = 340;
        d3.select(host).selectAll("*").remove();
        const svg = d3.select(host).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H);
        const cx = W / 2, cy = H / 2;
        const rIn = 26, rOut = Math.min(W, H) / 2 - 26;
        const tExt = d3.extent(days, (d) => d.temp);
        const color = d3.scaleSequential(d3.interpolateRdYlBu).domain([tExt[1], tExt[0]]);
        // 角度：一年中的位置（每月一个相对位置），半径：按月递增
        function pos(dObj) {
          const date = dObj.date ? dObj.date : dObj; // 兼容裸 Date 与 {date}
          const dayOfYear = d3.timeDay.count(new Date(2024, 0, 1), date);
          const month = date.getMonth();
          const dayInMonth = date.getDate();
          const dim = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const progress = month + (dayInMonth - 1) / dim;
          const angle = progress * 2 * Math.PI;
          const r = rIn + (progress / 12) * (rOut - rIn);
          return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle), r };
        }
        const g = svg.append("g");
        // 月份分隔线
        if (container.querySelector("#sp-lines").checked) {
          d3.timeMonth.every(1).range(new Date(2024, 0, 1), new Date(2025, 0, 1)).forEach((m) => {
            const p = pos(m);
            g.append("line").attr("x1", cx).attr("y1", cy).attr("x2", p.x).attr("y2", p.y)
              .attr("stroke", "#e2e8f0").attr("stroke-width", 1);
          });
        }
        // 螺旋路径
        const path = d3.line().x((d) => pos(d).x).y((d) => pos(d).y);
        g.append("path").datum(days).attr("d", path).attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 1);
        g.selectAll("circle").data(days).join("circle")
          .attr("cx", (d) => pos(d).x).attr("cy", (d) => pos(d).y).attr("r", 2.6)
          .attr("fill", (d) => color(d.temp))
          .attr("opacity", d => container.querySelector("#sp-month").value === "all" || d.date.getMonth() === +container.querySelector("#sp-month").value ? 1 : .12)
          .on("pointerenter click", (event, d) => {
            g.selectAll("circle").attr("r", 2.6).attr("stroke", "none");
            d3.select(event.currentTarget).attr("r", 5).attr("stroke", "#5068cf").attr("stroke-width", 2);
            container.querySelector("#sp-readout").textContent = d3.timeFormat("%Y-%m-%d")(d.date) + " · 日最高气温 " + d.temp + " ℃";
          });
        // 月份标签
        ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"].forEach((lb, m) => {
          const p = pos(new Date(2024, m, 15));
          const rr = p.r + 12;
          const angle = (m + 14 / new Date(2024, m + 1, 0).getDate()) * 2 * Math.PI;
          g.append("text").attr("x", cx + rr * Math.sin(angle)).attr("y", cy - rr * Math.cos(angle))
            .attr("text-anchor", "middle").attr("font-size", 9).attr("fill", "#94a3b8").text(lb);
        });
        // 图例
        const w = 160;
        const grad = d3.scaleLinear().domain(tExt);
        const lg = svg.append("g").attr("transform", "translate(" + (W - w - 14) + "," + (H - 34) + ")");
        const defs = svg.append("defs");
        const gid = "spgrad";
        defs.append("linearGradient").attr("id", gid)
          .selectAll("stop").data(d3.range(0, 1.01, 0.1)).join("stop")
          .attr("offset", (t) => t).attr("stop-color", (t) => color(t * (tExt[1] - tExt[0]) + tExt[0]));
        lg.append("rect").attr("width", w).attr("height", 8).attr("fill", "url(#" + gid + ")");
        lg.append("text").attr("x", 0).attr("y", 22).attr("font-size", 9).attr("fill", "#64748b").text(tExt[0] + "℃");
        lg.append("text").attr("x", w).attr("y", 22).attr("text-anchor", "end").attr("font-size", 9).attr("fill", "#64748b").text(tExt[1] + "℃");
      }
      container.querySelector("#sp-lines").addEventListener("change", draw);
      container.querySelector("#sp-month").addEventListener("change", draw);
      Demos.onResize(container, draw);
      draw();
    }).catch(function (e) {
      container.querySelector("#sp-status").innerHTML =
        '<span class="demo-error">数据加载失败：' + window.esc(e.message) + "，请用本地服务器访问。</span>";
    });
  }
  window.Demos.register("spiral", render);
})();

/* ---------- 5.5 Storyline（事件与人物关系） ---------- */
(function () {
  const DATA = {
    title: "侏罗纪公园 (Jurassic Park, 1993)",
    duration: 127,
    characters: [
      { name: "Alan Grant & Kids", color: "#1976d2",
        points: [[5,80],[18,130],[38,180],[65,150],[78,80],[88,110],[105,60],[125,40]],
        events: [[78, "T-REX 攻击"]] },
      { name: "T-REX", color: "#d32f2f",
        points: [[75,280],[78,130],[88,200],[100,250],[120,290]],
        events: [[78, "T-REX 攻击"]] },
      { name: "Raptors", color: "#f57c00",
        points: [[50,320],[80,290],[95,230],[108,180],[118,100]],
        events: [[95, "Raptor 追逐"]] },
      { name: "Malcolm", color: "#7b1fa2",
        points: [[22,40],[45,90],[70,120],[82,130],[95,200],[120,240]], events: [] },
      { name: "Dilophosaurus", color: "#388e3c",
        points: [[38,350],[48,320],[58,340]],
        events: [[48, "Nedry 事件"]] },
    ],
  };
  function advanceTime(time, elapsedMs, speed) {
    return Math.min(DATA.duration, time + Math.max(0, elapsedMs) * .005 * speed);
  }
  function render(container) {
    container.classList.add("showcase-story");
    const labels=["格兰特与孩子","霸王龙","迅猛龙","马尔科姆","双脊龙"];
    const colors=["#5872cf","#d18465","#bb974a","#9479bc","#589a8d"];
    const events=[
      {minute:48,title:"Nedry 事件",note:"双脊龙轨迹在这一段出现，对比不同角色，观察并行叙事。"},
      {minute:78,title:"T-REX 攻击",note:"关注霸王龙与格兰特一行在事件线附近的轨迹变化。"},
      {minute:95,title:"Raptor 追逐",note:"观察迅猛龙轨迹与其他角色在这一时段的相对聚散。"}
    ];
    container.innerHTML=
      '<div class="showcase-intro"><span class="showcase-eyebrow">NARRATIVE VISUALIZATION / JURASSIC PARK</span><h4>让角色关系，沿时间展开。</h4><p>播放、拖动时间，或点击图中的事件名称，观察角色轨迹如何聚拢与分离。</p></div>'+
      '<div class="story-layout"><div class="story-main"><div class="story-transport lab-controls"><button class="demo-btn" id="st-play">播放时间线</button><label>演示速度 <select id="st-speed"><option value="1">1× · 约 26 秒 / 全程</option><option value="2">2× · 约 13 秒 / 全程</option><option value="4">4× · 约 6 秒 / 全程</option></select></label><span class="story-running-state" id="st-state">已暂停</span></div>'+
      '<div class="story-canvas" id="st-svg"></div><div class="story-scrubber"><label for="st-time">时间定位</label><input type="range" id="st-time" min="0" max="127" value="78"><span>127 min</span></div></div>'+
      '<aside class="story-side"><div class="story-clock"><span>当前时间 / 127 min</span><strong id="st-current">078</strong><small>分钟</small><div class="story-progress"><i id="st-progress"></i></div></div>'+
      '<div class="story-legend-heading">角色图例 · 点击显隐</div><div id="st-characters"></div></aside>'+
      '<div class="story-feedback" id="st-tip" role="status" aria-live="polite"></div></div>'+
      '<div class="showcase-source">《侏罗纪公园》角色关系教学示意 · 纵向位置不代表数值或地理位置 · 轨迹为教学改绘，非逐帧影片标注。</div>';
    const host=container.querySelector("#st-svg"),hidden=new Set();
    let width=Math.max(320,host.clientWidth),time=78,frameId=null,lastFrame=0,lastWhole=-1,playDialog=null;
    const height=340,m={l:24,r:24,t:54,b:30},ih=height-m.t-m.b;
    let iw=width-m.l-m.r;
    const x=d3.scaleLinear().domain([0,DATA.duration]).range([0,iw]);
    const y=d3.scaleLinear().domain([0,380]).range([0,ih]);
    const svg=d3.select(host).append("svg").attr("width","100%").attr("viewBox","0 0 "+width+" "+height)
      .attr("role","img").attr("aria-label","侏罗纪公园角色关系时间线，横轴为影片分钟，纵向为叙事布局");
    const g=svg.append("g").attr("transform","translate("+m.l+","+m.t+")");
    const axis=g.append("g").attr("transform","translate(0,"+ih+")");
    const clip=svg.append("defs").append("clipPath").attr("id","story-progress-clip").append("rect")
      .attr("x",0).attr("y",-12).attr("height",ih+24);
    const eventGroups=g.selectAll("g.story-event").data(events).join("g").attr("class","story-event")
      .attr("role","button").attr("aria-label",event=>"定位 "+event.minute+" 分钟，"+event.title)
      .on("click",(event,cue)=>jump(cue.minute));
    eventGroups.append("rect").attr("class","story-event-band").attr("y",0).attr("width",18).attr("height",ih).attr("rx",6);
    eventGroups.append("line").attr("y1",0).attr("y2",ih).attr("stroke","#c8d2e5").attr("stroke-dasharray","3 5");
    eventGroups.append("rect").attr("class","story-event-hit").attr("width",88).attr("height",22).attr("rx",6).attr("fill","transparent");
    eventGroups.append("text").attr("text-anchor","middle").attr("font-size",10).text(event=>event.title);
    const paths=[],ghosts=[],dots=[],lengths=[];
    DATA.characters.forEach((character,index)=>{
      const makePath=()=>g.append("path").datum(character.points).attr("fill","none").attr("stroke",colors[index]).attr("stroke-linecap","round");
      ghosts.push(makePath().attr("stroke-width",2).attr("opacity",.16));
      paths.push(makePath().attr("stroke-width",index===1?3.5:2.8).attr("clip-path","url(#story-progress-clip)"));
      dots.push(g.append("circle").attr("r",5).attr("fill",colors[index]).attr("stroke","#fff").attr("stroke-width",2));
      const button=document.createElement("button");button.type="button";button.className="story-character";
      button.style.setProperty("--actor-color",colors[index]);button.setAttribute("aria-pressed","true");
      button.innerHTML='<i></i><span>'+labels[index]+'<small>'+window.esc(character.name)+'</small></span>';
      button.addEventListener("click",()=>{
        if(hidden.has(index))hidden.delete(index);else hidden.add(index);
        button.setAttribute("aria-pressed",String(!hidden.has(index)));paint(true);
      });
      container.querySelector("#st-characters").append(button);
    });
    const cursor=g.append("line").attr("class","story-cursor").attr("y1",0).attr("y2",ih);
    const slider=container.querySelector("#st-time"),play=container.querySelector("#st-play");
    function paint(force=false) {
      clip.attr("width",x(time));cursor.attr("x1",x(time)).attr("x2",x(time));
      const present=[];
      DATA.characters.forEach((character,index)=>{
        const visible=!hidden.has(index),active=time>=character.points[0][0]&&time<=character.points.at(-1)[0];
        ghosts[index].style("display",visible?null:"none");paths[index].style("display",visible?null:"none");
        dots[index].style("display",visible&&active?null:"none");
        if(!visible||!active)return;
        present.push(labels[index]);
        const path=paths[index].node();let lo=0,hi=lengths[index];
        for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(path.getPointAtLength(mid).x<x(time))lo=mid;else hi=mid;}
        const point=path.getPointAtLength((lo+hi)/2);dots[index].attr("cx",point.x).attr("cy",point.y);
      });
      const whole=Math.floor(time);
      slider.value=whole;
      container.querySelector("#st-progress").style.width=(time/DATA.duration*100)+"%";
      if(whole===lastWhole&&!force)return;
      lastWhole=whole;
      container.querySelector("#st-current").textContent=String(whole).padStart(3,"0");
      const output=slider.nextElementSibling;
      if(output?.classList.contains("lw-range-value"))output.value=String(whole);
      const cue=events.find(event=>Math.abs(event.minute-time)<=3);
      eventGroups.classed("active",event=>Math.abs(event.minute-time)<=3);
      container.querySelector("#st-tip").innerHTML='<div class="story-cue-label">'+(cue?'关键事件 · '+cue.minute+' min':'当前片段 · '+whole+' min')+'</div><strong>'+(cue?cue.title:'观察轨迹的聚拢与分离')+'</strong><p>'+
        (cue?cue.note:'彩色部分是已经走过的时间，浅色轨迹提供后续走向。纵向位置仅用于表达叙事关系。')+'</p><span>当前有轨迹的角色：'+(present.join('、')||'无')+'</span>';
    }
    function pause() {
      if(frameId!==null)cancelAnimationFrame(frameId);
      frameId=null;play.textContent="播放时间线";play.setAttribute("aria-pressed","false");
      container.querySelector("#st-state").textContent=time>=DATA.duration?"播放结束":"已暂停";
    }
    function jump(value) {
      time=Math.max(0,Math.min(DATA.duration,value));pause();paint(true);
      slider.dispatchEvent(new Event("change",{bubbles:true}));
    }
    function frame(now) {
      if(!container.isConnected||document.hidden||(playDialog&&!playDialog.open)){pause();return;}
      time=advanceTime(time,now-lastFrame,+container.querySelector("#st-speed").value);lastFrame=now;
      paint();
      if(time>=DATA.duration){pause();return;}
      frameId=requestAnimationFrame(frame);
    }
    play.addEventListener("click",()=>{
      if(frameId!==null){pause();return;}
      if(time>=DATA.duration)time=0;
      play.textContent="暂停";play.setAttribute("aria-pressed","true");
      container.querySelector("#st-state").textContent="播放中";playDialog=container.closest("dialog");
      lastFrame=performance.now();frameId=requestAnimationFrame(frame);
    });
    slider.addEventListener("input",()=>{time=+slider.value;pause();paint(true);});
    const overlay=g.append("rect").attr("height",ih).attr("fill","transparent").style("cursor","crosshair");
    function scrub(event){jump(x.invert(Math.max(0,Math.min(iw,d3.pointer(event)[0]))));}
    overlay.on("pointerdown",function(event){this.setPointerCapture(event.pointerId);scrub(event);})
      .on("pointermove",event=>{if(event.buttons)scrub(event);});
    const lifecycle=new AbortController();
    document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();},{signal:lifecycle.signal});
    container.__dispose=()=>{pause();lifecycle.abort();};
    function redraw() {
      width=Math.max(320,host.clientWidth);iw=width-m.l-m.r;svg.attr("viewBox","0 0 "+width+" "+height);x.range([0,iw]);
      axis.call(d3.axisBottom(x).tickValues([0,30,60,90,120]).tickFormat(value=>value+"′"));
      eventGroups.select("line").attr("x1",event=>x(event.minute)).attr("x2",event=>x(event.minute));
      eventGroups.select(".story-event-band").attr("x",event=>x(event.minute)-9);
      eventGroups.select(".story-event-hit").attr("x",event=>x(event.minute)-44).attr("y",(event,index)=>index%2?-43:-25);
      eventGroups.select("text").attr("x",event=>x(event.minute)).attr("y",(event,index)=>index%2?-28:-10);
      DATA.characters.forEach((character,index)=>{
        const shape=d3.line().x(point=>x(point[0])).y(point=>y(point[1])).curve(d3.curveCatmullRom.alpha(.5))(character.points);
        paths[index].attr("d",shape);ghosts[index].attr("d",shape);lengths[index]=paths[index].node().getTotalLength();
      });
      overlay.attr("width",iw);paint(true);
    }
    Demos.onResize(container,redraw);redraw();pause();
  }
  window.Demos.register("storyline", render);
})();

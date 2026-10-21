/* One observation, three linked temporal views. */
(function () {
  const parse = d3.timeParse("%Y-%m-%d"), fmt = d3.timeFormat("%Y-%m-%d");
  const weekdays = [Common.L("周日","Sun"), Common.L("周一","Mon"), Common.L("周二","Tue"), Common.L("周三","Wed"), Common.L("周四","Thu"), Common.L("周五","Fri"), Common.L("周六","Sat")];
  const weekdaysShort = [Common.L("日","S"), Common.L("一","M"), Common.L("二","T"), Common.L("三","W"), Common.L("四","T"), Common.L("五","F"), Common.L("六","S")];
  const blue = "#5975d5", accent = "#c88140";
  function calendarSlot(date) {
    const half = date.getMonth() < 6 ? 0 : 1;
    const origin = d3.timeSunday.floor(new Date(2024, half * 6, 1));
    return {half, week: d3.timeSunday.count(origin, date), day: date.getDay()};
  }
  function render(container) {
    container.classList.add("showcase-time");
    container.innerHTML = '<div class="demo-detail">' + Common.L("正在加载 2024 年日度气象教学数据…", "Loading the 2024 daily weather teaching dataset…") + '</div>';
    d3.csv("data/weather_2024.csv", row => ({date:parse(row.date),
      temp:row.temp_max === "" ? null : +row.temp_max, rain:row.rain_mm === "" ? null : +row.rain_mm
    })).then(raw => { if (container.isConnected) draw(container, raw); }).catch(error => {
      if (container.isConnected) container.innerHTML = '<div class="note danger">' + Common.L("数据加载失败：", "Failed to load data: ") + window.esc(error.message) + Common.L("。请检查本地服务器。", ". Please check the local server.") + '</div>';
    });
  }
  function draw(container, raw) {
    const byKey = new Map(raw.map(day => [fmt(day.date),day]));
    const days = d3.timeDay.range(new Date(2024,0,1),new Date(2025,0,1)).map(date => byKey.get(fmt(date)) || {date,temp:null,rain:null});
    const valid = days.filter(day => day.temp != null && Number.isFinite(day.temp));
    if (!valid.length) { container.innerHTML = '<div class="note warn">' + Common.L("没有可显示的气温观测。", "No temperature observations to display.") + '</div>'; return; }
    const extent = d3.extent(valid,day=>day.temp);
    const domain = [Math.min(0,Math.floor(extent[0])-2),Math.ceil(extent[1])+2];
    const color = d3.scaleDiverging().domain([extent[0],0,extent[1]])
      .interpolator(d3.interpolateRgbBasis(["#6d87d8","#f5f7fc","#df9b74"]));
    let selected=null,lineX,lineY,weekX,weekY,calendarCells=new Map();
    let range = null, brush, brushLayer, rangeMode = false, movingBrush = false;
    function rangeDays() { return range ? valid.filter(day => fmt(day.date) >= range[0] && fmt(day.date) <= range[1]) : valid; }
    function rangeAverages() { return weekdays.map((name, wd) => { const rows = rangeDays().filter(day => day.date.getDay() === wd); return {name, wd, count: rows.length, avg: d3.mean(rows, day => day.temp) ?? 0}; }); }
    container.innerHTML =
      '<div class="showcase-intro"><span class="showcase-eyebrow">TEMPORAL EXPLORATION / 2024</span><h4>' + Common.L("同一天，三种时间视角。", "One day, three views of time.") + '</h4><p>' + Common.L("选择一个日期，追踪它在全年趋势、日历位置与星期汇总中的关系。", "Pick a date and trace it across the yearly trend, the calendar, and the weekday summary.") + '</p></div>' +
      '<div class="tv-controls experiment-options"><label>' + Common.L("观察日期", "Observe date") + ' <input type="date" id="tv-date" min="2024-01-01" max="2024-12-31"></label><div class="tv-day-nav"><button class="demo-btn secondary" id="tv-prev">' + Common.L("← 上一日", "← Previous day") + '</button><button class="demo-btn secondary" id="tv-next">' + Common.L("下一日 →", "Next day →") + '</button></div><button class="demo-btn secondary" id="tv-reset">' + Common.L("清除选择", "Clear selection") + '</button></div>' +
      '<div class="tv-range-controls experiment-options"><label><input type="checkbox" id="tv-range-mode"> ' + Common.L("在折线上拖动框选范围", "Drag on the line to brush a range") + '</label><label>' + Common.L("起始", "From") + ' <input type="date" id="tv-from" min="2024-01-01" max="2024-12-31"></label><label>' + Common.L("结束", "To") + ' <input type="date" id="tv-to" min="2024-01-01" max="2024-12-31"></label><button type="button" id="tv-range-clear">' + Common.L("清除范围", "Clear range") + '</button></div><p id="tv-range-summary" class="lab-chart-readout" role="status"></p>' +
      '<div class="tv-selection" id="tv-readout" role="status" aria-live="polite"></div>' +
      '<div class="tv-showcase-grid">' +
      '<section class="tv-panel tv-trend"><div class="showcase-panel-head"><span class="showcase-number">01</span><div><h5>' + Common.L("全年趋势", "Yearly trend") + '</h5><p>' + Common.L("移动或点击曲线区域，查看每天的观测。", "Move over or click the curve area to see each day's observation.") + '</p></div><span class="showcase-unit">' + Common.L("日最高气温 · °C", "Daily max temp · °C") + '</span></div><div id="tv-line"></div></section>' +
      '<section class="tv-panel tv-calendar"><div class="showcase-panel-head"><span class="showcase-number">02</span><div><h5>' + Common.L("日历中的位置", "Calendar position") + '</h5><p>' + Common.L("同一日期，在日历中精确定位。", "The same date, precisely located in the calendar.") + '</p></div></div><div id="tv-cal"></div><div class="tv-color-key"><span>'+extent[0].toFixed(1)+' °C</span><i></i><span>'+extent[1].toFixed(1)+' °C</span></div></section>' +
      '<section class="tv-panel tv-weekday"><div class="showcase-panel-head"><span class="showcase-number">03</span><div><h5>' + Common.L("星期汇总对照", "Weekday summary") + '</h5><p>' + Common.L("柱形为全年平均，圆点为当天观测。", "Bars show the whole-year average; dots show the selected day.") + '</p></div></div><div id="tv-week"></div><p class="tv-chart-caption">' + Common.L("点击星期柱，逐次查看该星期的日期。汇总差异不代表星期造成温差。", "Click a weekday bar to step through that weekday's dates. Differences in the summary do not mean weekdays cause temperature differences.") + '</p></section></div>' +
      '<div class="showcase-source">' + Common.L("2024 日度气象教学数据 · ", "2024 daily weather teaching dataset · ") + valid.length + Common.L(" 条有效观测 · 折线与星期图使用相同温度轴，柱形以 0 °C 为基线。", " valid observations · the line and weekday charts share the same temperature axis; bars use 0 °C as the baseline.") + '</div>';
    container.querySelector(".tv-color-key i").style.background = "linear-gradient(90deg,"+
      d3.range(0,1.01,.1).map(t=>color(extent[0]+t*(extent[1]-extent[0]))).join(",")+")";
    function makeChart(host,height,label) {
      d3.select(host).selectAll("*").remove();
      const width=Math.max(280,host.clientWidth);
      const svg=d3.select(host).append("svg").attr("width","100%").attr("viewBox","0 0 "+width+" "+height).attr("role","img").attr("aria-label",label);
      return {svg,width};
    }
    function drawLine() {
      const {svg,width}=makeChart(container.querySelector("#tv-line"),178,Common.L("2024 年每日最高气温折线图","Line chart of daily maximum temperature in 2024"));
      const m={l:40,r:18,t:12,b:26},iw=width-m.l-m.r,ih=178-m.t-m.b;
      lineX=d3.scaleTime().domain([days[0].date,days.at(-1).date]).range([0,iw]);
      lineY=d3.scaleLinear().domain(domain).range([ih,0]);
      const g=svg.append("g").attr("transform","translate("+m.l+","+m.t+")");
      g.append("g").attr("class","showcase-grid-lines").call(d3.axisLeft(lineY).ticks(4).tickSize(-iw).tickFormat("")).select(".domain").remove();
      g.append("g").attr("transform","translate(0,"+ih+")").call(d3.axisBottom(lineX).ticks(Math.max(3,Math.floor(iw/72))).tickFormat(d3.timeFormat(Common.L("%m月","%b"))));
      g.append("g").call(d3.axisLeft(lineY).ticks(4));
      const fill=svg.append("defs").append("linearGradient").attr("id","tv-area-gradient").attr("x2",0).attr("y2",1);
      fill.append("stop").attr("stop-color",blue).attr("stop-opacity",.2);
      fill.append("stop").attr("offset","100%").attr("stop-color",blue).attr("stop-opacity",.015);
      g.append("path").datum(valid).attr("d",d3.area().x(day=>lineX(day.date)).y0(lineY(0)).y1(day=>lineY(day.temp)).curve(d3.curveMonotoneX)).attr("fill","url(#tv-area-gradient)");
      g.append("path").datum(valid).attr("d",d3.line().x(day=>lineX(day.date)).y(day=>lineY(day.temp)).curve(d3.curveMonotoneX)).attr("fill","none").attr("stroke",blue).attr("stroke-width",2);
      g.append("line").attr("id","vl-line").attr("y1",0).attr("y2",ih).attr("stroke",accent).attr("stroke-dasharray","3 4").style("display","none").style("pointer-events","none");
      g.append("circle").attr("id","vl-dot").attr("r",4.5).attr("fill","#fff").attr("stroke",accent).attr("stroke-width",2.5).style("display","none").style("pointer-events","none");
      const overlay=g.append("rect").attr("width",iw).attr("height",ih).attr("fill","transparent").style("cursor","crosshair");
      function pick(event) {
        const date=lineX.invert(Math.max(0,Math.min(iw,d3.pointer(event)[0])));
        select(valid[d3.bisector(day=>day.date).center(valid,date)].date);
      }
      overlay.on("pointerdown",function(event){this.setPointerCapture(event.pointerId);pick(event);})
        .on("pointermove",event=>{if(event.pointerType==="mouse"||event.buttons)pick(event);});
      overlay.style("touch-action", "pan-y");
      brush = d3.brushX().extent([[0,0],[iw,ih]]).touchable(() => true).on("brush end", event => {
        if (movingBrush) return;
        range = event.selection ? event.selection.map(x => fmt(d3.timeDay.round(lineX.invert(x)))) : null;
        refreshRange();
        if (event.type === "end") container.dispatchEvent(new Event("lab:change", {bubbles:true}));
      });
      brushLayer = g.append("g").attr("class", "tv-brush").call(brush).style("display", rangeMode ? null : "none");
      if (range) { movingBrush = true; brushLayer.call(brush.move, range.map(date => lineX(parse(date)))); movingBrush = false; }
    }
    function drawCalendar() {
      const host=container.querySelector("#tv-cal");
      d3.select(host).selectAll("*").remove();
      const width=Math.max(410,host.clientWidth),cell=Math.min(12,(width-44)/27);
      const rowHeight=cell*7+30,height=rowHeight*2+8,offset=(width-27*cell-28)/2+28;
      const svg=d3.select(host).append("svg").attr("viewBox","0 0 "+width+" "+height).style("min-width","410px").attr("role","img").attr("aria-label",Common.L("2024 年日历热图，含闰日 2 月 29 日","Calendar heatmap of 2024, including the leap day Feb 29"));
      for(let half=0;half<2;half++){
        const top=half*rowHeight+24;
        weekdays.forEach((name,i)=>svg.append("text").attr("x",offset-8).attr("y",top+i*cell+cell*.72).attr("text-anchor","end").attr("class","cal-week-label").text(weekdaysShort[i]));
        d3.range(6).forEach(month=>{
          const date=new Date(2024,half*6+month,1),slot=calendarSlot(date);
          svg.append("text").attr("x",offset+slot.week*cell).attr("y",top-8).attr("class","cal-month-label").text(Common.L(date.getMonth()+1+"月",["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][date.getMonth()]))
        });
      }
      const cells=svg.selectAll("rect.tv-cell").data(days).join("rect").attr("class","tv-cell")
        .attr("x",day=>offset+calendarSlot(day.date).week*cell)
        .attr("y",day=>calendarSlot(day.date).half*rowHeight+24+calendarSlot(day.date).day*cell)
        .attr("width",cell-2).attr("height",cell-2).attr("rx",2)
        .attr("fill",day=>day.temp==null?"#edf0f6":color(day.temp)).attr("data-key",day=>fmt(day.date))
        .attr("aria-label",day=>fmt(day.date)+Common.L("，最高气温 ",", max temperature ")+(day.temp==null?Common.L("无观测","no observation"):day.temp+Common.L(" 摄氏度"," °C")))
        .on("click",(event,day)=>{if(day.temp!=null)select(day.date);});
      cells.append("title").text(day=>fmt(day.date)+" · "+(day.temp==null?Common.L("无观测","No observation"):day.temp+" °C"));
      calendarCells=new Map();cells.each(function(day){calendarCells.set(fmt(day.date),this);});
    }
    function drawWeek() {
      const averages = rangeAverages();
      const {svg,width}=makeChart(container.querySelector("#tv-week"),240,Common.L("按星期汇总的所选范围平均气温与所选日气温对照","Weekday averages over the selected range compared with the selected day's temperature"));
      const m={l:36,r:12,t:24,b:30},iw=width-m.l-m.r,ih=240-m.t-m.b;
      weekX=d3.scaleBand().domain(d3.range(7)).range([0,iw]).padding(.35);
      weekY=d3.scaleLinear().domain(domain).range([ih,0]);
      const g=svg.append("g").attr("transform","translate("+m.l+","+m.t+")");
      g.append("g").attr("class","showcase-grid-lines").call(d3.axisLeft(weekY).ticks(4).tickSize(-iw).tickFormat("")).select(".domain").remove();
      g.append("g").attr("transform","translate(0,"+ih+")").call(d3.axisBottom(weekX).tickFormat(i=>weekdaysShort[i]));
      g.append("g").call(d3.axisLeft(weekY).ticks(4));
      g.append("line").attr("x2",iw).attr("y1",weekY(0)).attr("y2",weekY(0)).attr("stroke","#b8c6dd");
      g.selectAll("rect.wbar").data(averages).join("rect").attr("class","wbar")
        .attr("x",day=>weekX(day.wd)).attr("y",day=>weekY(Math.max(0,day.avg)))
        .attr("height",day=>Math.abs(weekY(day.avg)-weekY(0))).attr("width",weekX.bandwidth())
        .attr("fill","#a4b5e6").attr("rx",3)
        .attr("aria-label",day=>day.name+Common.L("，",", ")+(day.count ? Common.L("范围平均 ","range average ")+day.avg.toFixed(1)+Common.L(" 摄氏度，"," °C, ")+day.count+Common.L(" 天。点击查看同星期的下一条观测。"," days. Click to see the next observation on this weekday.") : Common.L("所选范围无观测","no observations in the selected range")))
        .on("click",(event,day)=>{
          const matching=rangeDays().filter(value=>value.date.getDay()===day.wd);
          if (!matching.length) return;
          const current=selected?matching.findIndex(value=>+value.date===+selected):-1;
          select(matching[(current+1)%matching.length].date);
        });
      g.selectAll("text.wvalue").data(averages).join("text").attr("class","wvalue")
        .attr("x",day=>weekX(day.wd)+weekX.bandwidth()/2).attr("y",day=>weekY(Math.max(0,day.avg))-7)
        .attr("text-anchor","middle").attr("fill","#62779a").attr("font-size",10).text(day=>day.count ? day.avg.toFixed(1) : Common.L("无观测","n/a"));
      g.append("circle").attr("id","tv-week-dot").attr("r",5).attr("fill",accent).attr("stroke","#fff").attr("stroke-width",2).style("pointer-events","none").style("display","none");
    }
    function select(date,force=false) {
      const day=byKey.get(fmt(date));
      if(!day||day.temp==null||(!force&&selected&&+selected===+date))return;
      if(selected)d3.select(calendarCells.get(fmt(selected))).classed("sel",false).attr("aria-pressed","false");
      selected=day.date;
      const index=valid.indexOf(day),wd=selected.getDay(),summary=rangeAverages()[wd],average=summary.avg;
      container.querySelector("#tv-date").value=fmt(selected);
      container.querySelector("#tv-prev").disabled=index<=0;container.querySelector("#tv-next").disabled=index>=valid.length-1;
      d3.select(container.querySelector("#vl-line")).style("display",null).attr("x1",lineX(selected)).attr("x2",lineX(selected));
      d3.select(container.querySelector("#vl-dot")).style("display",null).attr("cx",lineX(selected)).attr("cy",lineY(day.temp));
      d3.select(calendarCells.get(fmt(selected))).classed("sel",true).attr("aria-pressed","true");
      d3.select(container.querySelector("#tv-week")).selectAll(".wbar").attr("fill",value=>value.wd===wd?blue:"#b2c0e8");
      d3.select(container.querySelector("#tv-week-dot")).style("display",null).attr("cx",weekX(wd)+weekX.bandwidth()/2).attr("cy",weekY(day.temp));
      const delta=day.temp-average;
      container.querySelector("#tv-readout").innerHTML='<div class="tv-selected-date"><span>'+Common.L("当前观测","Current observation")+'</span><strong>'+fmt(selected)+'</strong><small>'+weekdays[wd]+'</small></div>'+
        '<div><span>'+Common.L("日最高气温","Daily max temp")+'</span><strong>'+day.temp.toFixed(1)+'<small> °C</small></strong></div>'+
        '<div><span>'+Common.L("当日降水","Precipitation")+'</span><strong>'+(day.rain==null?'—':day.rain.toFixed(1))+'<small> mm</small></strong></div>'+
        '<div><span>'+Common.L("较","vs. ")+(range ? Common.L("所选范围","selected range") : Common.L("全年","whole year"))+weekdays[wd]+Common.L("平均"," avg.")+'</span><strong>'+(summary.count ? (delta>0?'+':'')+delta.toFixed(1) : Common.L("无观测","n/a"))+'<small> °C</small></strong></div>';
    }
    function clear() {
      if(selected)d3.select(calendarCells.get(fmt(selected))).classed("sel",false).attr("aria-pressed","false");
      selected=null;container.querySelector("#tv-date").value="";
      container.querySelector("#tv-prev").disabled=true;container.querySelector("#tv-next").disabled=false;
      d3.select(container).selectAll("#vl-line,#vl-dot,#tv-week-dot").style("display","none");
      d3.select(container).selectAll(".wbar").attr("fill","#a4b5e6");
      container.querySelector("#tv-readout").innerHTML='<div class="tv-empty-selection">'+Common.L("尚未选中日期 · 点击图形、输入日期，或用“下一日”从年初开始。","No date selected · click the chart, type a date, or use “Next day” to start from the beginning of the year.")+'</div>';
    }
    container.querySelector("#tv-date").addEventListener("change",event=>{
      if(!event.target.value){clear();return;}
      const day=byKey.get(event.target.value);
      if(day&&day.temp!=null)select(day.date);
      else{event.target.value=selected?fmt(selected):"";Common.toast(Common.L("请选择 2024 年内有有效观测的日期","Please pick a date in 2024 that has a valid observation"),"warn");}
    });
    function shift(delta) {
      const index=selected?valid.findIndex(day=>+day.date===+selected):-1;
      select(valid[Math.max(0,Math.min(valid.length-1,index+delta))].date);
    }
    container.querySelector("#tv-prev").addEventListener("click",()=>shift(-1));
    container.querySelector("#tv-next").addEventListener("click",()=>shift(1));
    container.querySelector("#tv-reset").addEventListener("click",clear);
    function refreshRange() {
      container.querySelector("#tv-from").value = range?.[0] || "";
      container.querySelector("#tv-to").value = range?.[1] || "";
      const rows = rangeDays();
      container.querySelector("#tv-range-summary").textContent = (range ? range.join(" → ") : Common.L("全年范围","whole year")) + Common.L(" · "," · ") + rows.length + Common.L(" 天有效观测 · 平均最高气温 "," days of valid observations · mean daily max ") + (rows.length ? d3.mean(rows, day => day.temp).toFixed(1) + " °C" : Common.L("无观测","n/a")) + Common.L("；日历和星期汇总同步更新。","; the calendar and weekday summary update in sync.");
      d3.select(container).selectAll(".tv-cell").classed("outside-range", day => !!range && (fmt(day.date) < range[0] || fmt(day.date) > range[1]));
      container.querySelector(".tv-weekday .showcase-panel-head p").textContent = Common.L("柱形为","Bars show the ") + (range ? Common.L("所选范围","selected-range") : Common.L("全年","whole-year")) + Common.L("平均，圆点为当天观测。"," average; dots show the selected day.");
      drawWeek(); if (selected) select(selected, true);
    }
    function moveBrush() { movingBrush = true; brushLayer.call(brush.move, range ? range.map(date => lineX(parse(date))) : null); movingBrush = false; refreshRange(); }
    container.querySelector("#tv-range-mode").addEventListener("change", event => { rangeMode = event.target.checked; brushLayer.style("display", rangeMode ? null : "none"); });
    ["#tv-from", "#tv-to"].forEach(selector => container.querySelector(selector).addEventListener("change", () => {
      const from = container.querySelector("#tv-from").value, to = container.querySelector("#tv-to").value;
      if (!from || !to) return;
      if (from > to || from < "2024-01-01" || to > "2024-12-31") { Common.toast(Common.L("起始日期应早于结束日期，且位于 2024 年内","The start date must be before the end date and stay within 2024"), "warn"); refreshRange(); return; }
      range = [from,to]; moveBrush();
    }));
    container.querySelector("#tv-range-clear").addEventListener("click", () => { range = null; moveBrush(); });
    function redraw(){drawLine();drawCalendar();drawWeek();if(selected)select(selected,true);}
    redraw();select(d3.greatest(valid,day=>day.temp).date); refreshRange();
    let resizeTimer;
    Demos.onResize(container,()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(container.isConnected)redraw();},100);});
    container.__dispose=()=>clearTimeout(resizeTimer);
    LabWorkbench.connect(container, "time-views", {
      get: () => ({selected: selected ? fmt(selected) : null, range, rangeMode}),
      valid: s => (s.selected === null || byKey.has(s.selected)) && (s.range === null || (Array.isArray(s.range) && s.range.length === 2 && s.range.every(key => byKey.has(key)) && s.range[0] <= s.range[1])),
      set: s => { range = s.range; rangeMode = !!s.rangeMode; container.querySelector("#tv-range-mode").checked = rangeMode; brushLayer.style("display", rangeMode ? null : "none"); moveBrush(); if (s.selected) select(parse(s.selected), true); else clear(); },
      steps: [Common.L("预测：只观察夏季，星期平均气温会与全年平均一样吗？","Predict: if you only look at summer, will the weekday average temperature match the whole-year average?"), Common.L("开启框选，在折线上拖动范围，或填写起止日期；点击日历和星期柱观察单日。","Turn on brushing and drag a range on the line, or type the start/end dates; click the calendar and weekday bars to inspect single days."), Common.L("对照范围天数、日历高亮和星期平均；撤销或清除范围，说明样本范围如何改变汇总。","Compare the range length, the calendar highlight, and the weekday averages; undo or clear the range and explain how the sample window changes the summary.")],
      question: () => ({text: Common.L("当前汇总包含 ","The current summary includes ") + rangeDays().length + Common.L(" 天有效观测。星期柱形随框选变化，是否说明星期造成温差？"," days of valid observations. The weekday bars change with the brushed range — does that prove weekdays cause temperature differences?"), options: [Common.L("是，柱高就是因果关系","Yes — bar height shows causation"), Common.L("否，范围与样本构成会影响平均值","No — the range and sample composition affect the averages")], correct: 1, explain: Common.L("这里展示描述性汇总；季节、范围和观测样本都会影响平均值，不能据此判断因果。","This is a descriptive summary; season, range, and the observed sample all affect the average, so causation cannot be concluded.")})
    });
  }
  Demos.register("time-views",render);
})();

/* ============================================================
 * 第五章：时序数据可视化（5 小节）
 * ============================================================ */
window.COURSE.chapters.push({
  id: 5,
  num: "第五章",
  title: "时序数据可视化",
  accent: "#10b981",
  route: "分析时间变化",
  question: "不同的时间图形分别回答什么问题？怎样表达趋势、周期与事件？",
  outcome:
    "学完后，你能够说明时间的五大属性，用 scaleTime 与悬停十字线读折线，用日历热图看周内模式、螺旋图看周期结构，并理解 Storyline 如何表达事件与对象关系。",
  prereq: ["1.3 视觉通道","第四章坐标与曲线","JavaScript Date"],
  lessons: [
    {
      id: "5-1", c: 5, l: 1,
      title: "时间属性",
      subtitle: "时间为什么特殊：有序、连续、周期、独立于空间、有结构",
      question: "时间数据与普通数值数据有什么不同？这些属性怎样决定图形选择？",
      goal: ["说出时间的五大属性","为每个属性举出数据例子","理解时间属性与图形选择的对应关系"],
      prereq: ["1.3 测量尺度","Date 对象"],
      keyPoint: "时间是特殊的连续量：它有序、连续、常带周期、与空间相对独立，且具有层级结构（年/月/日/时）；这些属性共同决定了时序图该强调趋势还是周期。",
      blocks: [
        {t:"h3", x:"时间的五个属性"},
        {t:"table", head:["属性","含义","例子"], rows:[
          ["有序性","事件有先后、与因果相关","时刻表、事件日志、git 历史"],
          ["连续性","任意两个时间点之间还有时间点","实时传感器、心率、流数据"],
          ["周期性","昼夜、季节等循环","24h 体温、月度气温、年周期销售"],
          ["独立于空间","常将时间与空间分别处理","折线 x 轴只用时间、y 轴用度量"],
          ["结构性","年/月/日/时/分等层级","日历排列、工作日/周末、闰年"],
        ]},
        {t:"h3", x:"为什么 5 个属性都重要"},
        {t:"ul", x:[
          "强调趋势（有序、连续）→ 折线图。",
          "强调周期（周期性、结构性）→ 日历热图、螺旋图。",
          "强调事件与对象关系（有序、结构性）→ Storyline。",
        ]},
      ],
      code: [
        {title:"单一数据源：时间属性配置", purpose:"用一张表统一描述 5 个属性。",
        code:`const TIME_ATTRIBUTES = [
  { key:"ordered", name:"有序性", icon:"↗",
    desc:"事件有先后，与因果相关",
    example:"火车时刻表、事件日志" },
  { key:"periodic", name:"周期性", icon:"🔁",
    desc:"昼夜、季节等循环",
    example:"24h 体温、12 月气温" },
  /* …共 5 项… */
];`},
      ],
      demo: {id:"time-attr", title:"时间属性卡片", task:"点击五个属性卡片，查看含义、例子与对应图形。",
        observe:"不同属性对应不同图形：趋势用折线，周期用日历/螺旋。"},
      pitfalls: [
        "把时间当成普通分类轴，忽略其顺序与连续性。",
        "周期性数据还用普通折线，难以发现周内/年内规律。",
        "忽视时间层级结构，按错误的粒度聚合。",
      ],
      quiz: [
        {q:"想突出“每天 24 小时内体温的昼夜循环规律”，最应利用时间的哪个属性？",
         opts:["有序性","周期性","独立于空间","连续性"],
         ans:1, explain:"昼夜循环是周期性，用循环时间域（如螺旋/日历）比普通线性折线更能体现。",
         mistake:"连续性强调时间可无限细分，周期性才强调循环规律。"},
      ],
      keywords: ["时间属性","有序性","连续性","周期性","结构性","时间粒度","周期性","时间尺度"],
    },
    {
      id: "5-2", c: 5, l: 2,
      title: "折线图：scaleTime 与悬停",
      subtitle: "时间轴是数值轴的特化版，配合 bisect 做十字线",
      question: "怎样绘制 120 年的时间序列，并在悬停时精确定位最近点？",
      goal: ["用 scaleTime 绘制时间轴","用 timeParse/timeFormat 解析与格式化","用 bisect 与透明覆盖层实现悬停十字线"],
      prereq: ["5.1 时间属性","4.2 比例尺"],
      keyPoint: "Date 在底层是数字，scaleTime 就是会自动选择合适时间刻度的数值轴；悬停提示用 invert 反查日期、用 bisect 找最近点。",
      blocks: [
        {t:"h3", x:"时间解析与格式化"},
        {t:"ul", x:[
          "<code>d3.timeParse('%Y')</code>：字符串 → Date；<code>d3.timeFormat('%Y')</code>：Date → 字符串。",
          "常用 token：%Y 年、%m 月、%d 日、%a 星期、%H 时、%M 分。",
        ]},
        {t:"h3", x:"scaleTime 与自动刻度"},
        {t:"p", x:"scaleTime 的 domain 是 Date 区间，axisBottom 会自动按十年/年/月等粒度切换刻度。"},
        {t:"h3", x:"悬停十字线（bisect）"},
        {t:"ul", x:[
          "在绘图区盖一层透明 rect 接收鼠标事件。",
          "用 <code>xScale.invert(mouseX)</code> 反查日期，再用 <code>d3.bisector</code> 找到最近数据点。",
          "移动竖线、圆点与提示框实现十字线。",
        ]},
        {t:"note", kind:"info", x:"案例数据为 1900–2020 法国新生儿姓名（Marie/Jean/Camille），可看到名字流行度随年代的兴衰。"},
      ],
      code: [
        {title:"时间轴", purpose:"Date 区间 + 自动刻度。",
        code:`const x = d3.scaleTime()
  .domain([new Date(1900,0,1), new Date(2020,11,31)])
  .range([0, innerW]);
g.call(d3.axisBottom(x).ticks(10));`},
        {title:"悬停：invert + bisect", purpose:"找最近点。",
        code:`const date = x.invert(d3.pointer(event)[0] - M.l);
const i = d3.bisector(d => d.year).left(series, date);
const d = series[i];
focus.attr("transform", \`translate(\${x(d.year)},0)\`);`},
      ],
      demo: {id:"french-names", title:"法国新生儿姓名折线", task:"鼠标在图上移动查看十字线与数值，切换姓名观察 120 年的流行度变化。",
        observe:"折线擅长长周期趋势：可以清晰看到 Marie 衰退、Camille 兴起等时间节点。"},
      pitfalls: [
        "把年份字符串直接当数字排序，遇到世纪交替可能出错。",
        "悬停时不做 bisect，鼠标与数据点对不齐。",
        "在稀疏/不规则采样上用过平滑曲线，制造虚假趋势。",
      ],
      quiz: [
        {q:"实现悬停十字线时，用鼠标 x 像素反查对应日期的是哪个方法？",
         opts:["xScale(domain)","xScale.invert(pixel)","d3.timeFormat","d3.group"],
         ans:1, explain:"连续比例尺的 invert 把屏幕像素反算成数据值（这里是 Date），再用 bisect 找最近点。",
         mistake:"正方向 scale(value) 是数据→像素，反查才是 invert。"},
      ],
      keywords: ["折线图","scaleTime","timeParse","timeFormat","bisect","invert","十字线","悬停","时间序列","法国姓名"],
    },
    {
      id: "5-3", c: 5, l: 3,
      title: "日历热图：年/月/周/日",
      subtitle: "把每天放进日历网格，看周内模式与月份边界",
      question: "怎样把 366 天摆成日历？为什么要补全缺失日期？",
      goal: ["用 timeDay.range 补全全年日期","按周列、周日行计算每格坐标","用月份分割算法标注月份边界"],
      prereq: ["5.2 时间轴","比例尺"],
      keyPoint: "日历热图把日期映射到“周列×周日行”，强调星期几与周内规律；必须先把全年日期补全，缺失日期按缺失/0 处理，避免格子错位。",
      blocks: [
        {t:"h3", x:"先补全年份日期"},
        {t:"p", x:"用 d3.timeDay.range 生成 2024 全年 366 天（闰年），再与实际数据按 YYYY-MM-DD 关联；没有观测的日期用 <code>?? 缺失</code> 标记，不能伪造观测。"},
        {t:"h3", x:"行列计算"},
        {t:"ul", x:[
          "周列（x）：当年第 n 个星期 = floor(dayOfYear / 7)。",
          "周日行（y）：date.getDay()（0 周日 … 6 周六）。",
          "每个日期画一个 cell，用颜色编码值。",
        ]},
        {t:"h3", x:"月份分割（isMonthDivider）"},
        {t:"p", x:"判断“7 天前是否与今天不同月”，若跨月则画一条分割线，使月份边界自然显现。"},
        {t:"note", kind:"warn", x:"日历热图回答“周内/月内规律”，折线图回答“长期趋势”。不能把年份级数据硬塞进日历，也不能用插值伪造不存在的每日观测。"},
      ],
      code: [
        {title:"补全年份日期", purpose:"缺测日期也要占位。",
        code:`const days = d3.timeDay.range(new Date(2024,0,1),
  new Date(2025,0,1)).map(d => ({
  date: d,
  value: byKey.get(d3.timeFormat("%Y-%m-%d")(d)) ?? null
})); // 366 天`},
        {title:"周列与周日行", purpose:"每个日期定位到日历格子。",
        code:`const weekCol = d =>
  Math.floor(d3.timeDay.count(d3.timeYear.floor(d), d)/7);
const dayRow = d => d.getDay();
cells.attr("x", d => weekCol(d.date)*cellSize)
     .attr("y", d => dayRow(d.date)*cellSize)
     .attr("fill", d => color(d.value));`},
      ],
      demo: {id:"time-views", title:"时序多视图实验", task:"点击或拖动折线、选择日历日期，对照当天温度与全年同星期平均值，观察三图同步定位。",
        observe:"折线看年度趋势，日历看周内/月内规律，周期视图比较星期几；同一份数据、不同视图回答不同问题。"},
      pitfalls: [
        "不补全缺失日期，导致日历格子错位、星期对不上。",
        "用插值给缺失日期“造”出观测值。",
        "拿年份级数据硬画日历，粒度不匹配。",
      ],
      quiz: [
        {q:"某传感器数据只有 100 天有记录，要画 2024 全年日历热图，正确做法是？",
         opts:["只画 100 个格子，其余留空不管坐标","用插值补出 266 天假数据","用 timeDay.range 补全 366 天，缺失日期明确标记为缺失","把 100 天平均分配到 12 个月"],
         ans:2, explain:"日历网格必须基于完整日期序列定位，缺测日期要占位置并明确标记，不能插值伪造观测。",
         mistake:"留空会错位，插值会造假，平均分配会破坏时间结构。"},
      ],
      keywords: ["日历热图","calendar","timeDay.range","周列","周日行","isMonthDivider","缺失日期","周内模式","多视图"],
    },
    {
      id: "5-4", c: 5, l: 4,
      title: "螺旋图：阿基米德螺旋",
      subtitle: "用周期螺旋表达循环时间，让相同相位上下对齐",
      question: "螺旋图是怎样把时间沿螺旋摆放的？它比日历更擅长什么？",
      goal: ["用阿基米德公式 r=a+bθ 生成螺旋路径","按等弧长步进放置日期","绘制带状区段并看出周期"],
      prereq: ["5.3 日历热图","极坐标"],
      keyPoint: "螺旋图把时间沿阿基米德螺旋展开，每一环代表一个周期；相同周期相位（如每年同月）在径向上对齐，便于比较跨周期的规律。",
      blocks: [
        {t:"h3", x:"阿基米德螺旋 r = a + bθ"},
        {t:"ul", x:[
          "θ 是累计角度，r 随 θ 线性增长，环宽恒定。",
          "b = 环间距 / 2π，决定每环半径增长。",
          "极坐标转直角坐标：x = r·cosθ，y = r·sinθ。",
        ]},
        {t:"h3", x:"等弧长步进"},
        {t:"p", x:"沿螺旋等角度步进会使外圈格子变宽、内圈变窄。应按弧长相等计算角度增量：Δθ = boxSize / √(b² + r²)，使每天的格子宽度近似一致。"},
        {t:"h3", x:"区段（月份环带）"},
        {t:"p", x:"每段用 4 个关键点构成四边形：起点外→终点外→终点内→起点内，沿环用颜色填充即可表达月份/季节。"},
      ],
      code: [
        {title:"螺旋路径", purpose:"r = a + bθ，极坐标转笛卡尔。",
        code:`const b = coilGap/(2*Math.PI);
function pos(t){ const r = b*t;
  return { x:r*Math.cos(t), y:r*Math.sin(t), r }; }`},
        {title:"等弧长步进 + 区段", purpose:"让每天宽度一致，月份成环带。",
        code:`function angleDelta(r){ return boxSize/Math.sqrt(b*b+r*r); }
function segmentPath(t0,t1){ // 起点外→终点外→终点内→起点内
  const c=(t,s)=>{ const r=pos(t).r+s*coilGap/2;
    return [r*Math.cos(t), r*Math.sin(t)]; };
  return \`M \${c(t0,1)} L \${c(t1,1)} L \${c(t1,-1)} L \${c(t0,-1)} Z\`;
}`},
      ],
      demo: {id:"spiral", title:"螺旋图演示", task:"切换周期（星期/月/年）与颜色字段，观察相同相位如何沿径向对齐，以及等弧长/等角度步进的差异。",
        observe:"等弧长步进使每天格子宽度一致；环状排布让跨周期的同月/同日对比更直观。"},
      pitfalls: [
        "等角度步进导致外圈格子过宽、内圈过窄。",
        "把螺旋图用于强调长期单调趋势（其实它更擅长周期）。",
        "区段四点顺序写错，月份环带出现交叉/孔洞。",
      ],
      quiz: [
        {q:"螺旋图相比普通折线，最擅长表达时间的哪一类特征？",
         opts:["单调的长期涨跌","跨周期的重复结构（如每年同月对比）","单个事件的精确数值","类别数量"],
         ans:1, explain:"螺旋每环代表一个周期，相同相位径向对齐，最适合比较跨周期的重复规律。",
         mistake:"长期趋势更适合折线；螺旋是为周期结构设计的。"},
      ],
      keywords: ["螺旋图","阿基米德","极坐标","r=a+bθ","等弧长","周期","环带","segmentPath"],
    },
    {
      id: "5-5", c: 5, l: 5,
      title: "Storyline：事件与对象关系",
      subtitle: "用角色轨迹的聚散与事件层讲述时间线故事",
      question: "怎样在一条时间轴上同时表现多个对象的关系和关键事件？",
      goal: ["理解 Storyline 的角色线与事件层","用 Catmull-Rom 平滑角色轨迹","用时间轴+聚散表达相遇与分离"],
      prereq: ["5.2 折线","4.3 曲线插值"],
      keyPoint: "Storyline 用每条线代表一个对象，纵向上的聚拢表示相遇/关系、分开表示分离，再叠加事件层标注关键事件；它强调“对象关系随时间的变化”而非精确数值。",
      blocks: [
        {t:"h3", x:"两个图层"},
        {t:"ul", x:[
          "<b>角色线（character layer）：</b>每个对象一条平滑轨迹，x 是时间、y 是人工调整的相对位置；聚拢=相遇。",
          "<b>事件层（event layer）：</b>在时间轴上用标记/半透明圈标注事件，悬停显示详情。",
        ]},
        {t:"h3", x:"为什么用 Catmull-Rom 而不是 monotoneX"},
        {t:"p", x:"Storyline 追求轨迹自然连贯、允许轨迹在对象间平滑“靠拢”，Catmull-Rom 能得到自然的弯曲；monotoneX 强调保持单调，会限制这种表现。注意这是叙事表达，不是数据拟合。"},
        {t:"note", kind:"info", x:"案例为《侏罗纪公园》片段（0–127 分钟）：T-REX 攻击、Nedry 事件等，通过角色线聚散与事件标记呈现剧情时间线。"},
      ],
      code: [
        {title:"角色轨迹（Catmull-Rom）", purpose:"时间轴 → 平滑路径。",
        code:`const line = d3.line()
  .curve(d3.curveCatmullRom.alpha(0.5))
  .x(d => xScale(d.time)).y(d => d.y);
characters.forEach(c =>
  svg.append("path").datum(c.points).attr("d", line)
    .attr("stroke", c.color).attr("fill","none"));`},
        {title:"事件层", purpose:"半透明标记 + 悬停说明。",
        code:`events.each(function(d){
  d3.select(this).append("circle")
    .attr("r",20).attr("fill","rgba(255,0,0,.15)");
  d3.select(this).append("text").text(d.name);
});`},
      ],
      demo: {id:"storyline", title:"侏罗纪公园 Storyline", task:"播放或拖动时间线，点击事件名称定位关键片段，切换角色并观察轨迹的聚拢与分离。",
        observe:"角色线聚拢表示相遇，事件层标记说明发生了什么；它表达的是关系与叙事，而非精确数值。"},
      pitfalls: [
        "把 Storyline 的纵向位置当作可精确比较的数值。",
        "过度平滑让角色轨迹产生不符合事件的交叉。",
        "事件层与角色线缺乏时间对齐，叙事关系混乱。",
      ],
      quiz: [
        {q:"Storyline 中，两条角色轨迹在某时间点明显聚拢，通常表示？",
         opts:["两个对象数值相等","两个对象在该时刻相遇/发生关系（叙事上的靠近）","数据缺失","时间轴出错"],
         ans:1, explain:"Storyline 的纵向聚拢是叙事手法，表示对象相遇/关系紧密，不代表数值严格相等。",
         mistake:"纵向位置是人工调整的相对位置，不是定量轴。"},
      ],
      keywords: ["Storyline","故事线","角色线","事件层","时间叙事","Catmull-Rom","聚散","侏罗纪公园"],
    },
  ],
});

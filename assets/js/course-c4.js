/* ============================================================
 * 第四章：低维数据可视化（5 小节）
 * ============================================================ */
window.COURSE.chapters.push({
  id: 4,
  num: "第四章",
  title: "低维数据可视化",
  accent: "#f59e0b",
  route: "表达低维数据",
  question: "数据值是怎样被映射成屏幕坐标和形状的？怎样避免图形“说谎”？",
  outcome:
    "学完后，你能够完成宽表/长表转换，说明比例尺与坐标变换，区分曲线插值与统计拟合，解释显示比例对斜率感知的影响，并理解等值线（Marching Squares）的生成原理。",
  prereq: ["第一、二章数据处理与流程","D3 比例尺"],
  lessons: [
    {
      id: "4-1", c: 4, l: 1,
      title: "数据转换：宽表与长表",
      subtitle: "为什么绘图前往往要把“列”变成“行”（tidy data）",
      question: "什么样的数据是“整洁数据”？怎样用 flatMap 把宽表变成长表？",
      goal: ["区分宽表与长表","用 d3.autoType 自动推断类型","用 flatMap 把多个指标列展开成长表"],
      prereq: ["1.4 数据变换","2.2 聚合"],
      keyPoint: "D3 与大多数可视化库偏好长表（整洁数据）：一列一个变量、一行一个观测；宽表适合人读，长表适合分组、映射和分面。",
      blocks: [
        {t:"h3", x:"宽表 vs 长表（以 crime.csv 为例）"},
        {t:"ul", x:[
          "<b>宽表：</b>每州一行，murder、robbery、burglary 等各占一列。",
          "<b>长表：</b>每个“州×指标”一行，列为 state、metric、value。",
        ]},
        {t:"h3", x:"整洁数据三原则"},
        {t:"ul", x:[
          "每个变量占一列（指标名本身成为 metric 列的取值）。",
          "每个观测占一行（一个州的一个指标是一条观测）。",
          "每类观测单元一张表。",
        ]},
        {t:"note", kind:"info", x:"长表可以直接用 d3.group(data, d => d.metric) 按指标分组，或用 metric 做颜色/分面——这正是宽表难做的。"},
      ],
      code: [
        {title:"自动类型推断", purpose:"读取时自动转数字/日期/布尔。",
        code:`const raw = await d3.csv("./data/crime.csv", d3.autoType);
// {state:"Alabama", population:3979000, murder:350, ...}`},
        {title:"flatMap 宽表 → 长表", purpose:"每行展开成多个指标观测。",
        code:`const long = raw.flatMap(d =>
  ["murder","robbery","burglary"].map(key => ({
    state: d.state, metric: key, value: d[key]
  }))
);
// 现在可按指标分组：d3.group(long, d => d.metric)`},
      ],
      demo: {id:"wide-long", title:"宽表/长表转换", task:"点击转换，观察 crime.csv 中同一州的多个指标列如何展开成多行，以及对应单元格的高亮。",
        observe:"长表行数 = 州数 × 指标数；metric 列让按指标分组/着色变得直接。"},
      pitfalls: [
        "在宽表上硬编码多列名做映射，新增指标就要改代码。",
        "autoType 把邮编、学号等误判成数字（必要时手写转换）。",
        "混淆长表与聚合：变长表只是改变结构，并不一定减少行数。",
      ],
      quiz: [
        {q:"50 个州、每个州有 4 个犯罪指标的宽表，转成长表后应有多少行（忽略表头）？",
         opts:["50 行","200 行","54 行","4 行"],
         ans:1, explain:"每个州展开为 4 个指标观测，共 50×4 = 200 行，每行一个“州×指标”。",
         mistake:"长表每个观测一行，行数是州数与指标数的乘积。"},
      ],
      keywords: ["宽表","长表","tidy data","整洁数据","flatMap","autoType","数据转换","crime","分面"],
    },
    {
      id: "4-2", c: 4, l: 2,
      title: "坐标变换：比例尺与空间",
      subtitle: "数据值 → 数据坐标 → 屏幕坐标，两步映射",
      question: "数据空间和屏幕空间有什么区别？线性与对数比例尺怎样选择？",
      goal: ["写出数据坐标与屏幕坐标两级比例尺","用 scaleLog 处理跨数量级数据","用 invert 从鼠标位置反查数据值"],
      prereq: ["4.1 长表","1.3 通道"],
      keyPoint: "渲染是两级映射：先把数据值映射到坐标系（domain→innerWidth），再叠加 margin 映射到屏幕；对数比例尺用于跨数量级差异，但只对正数有效。",
      blocks: [
        {t:"h3", x:"两级映射"},
        {t:"ul", x:[
          "<b>数据坐标 xData：</b>数据值 → 绘图区坐标（0 到 innerWidth）。",
          "<b>屏幕坐标 xScreen：</b>绘图区坐标 → 加 margin 后的真实像素。",
          "渲染时 <code>cx = xScreen(xData(d.x))</code>。",
        ]},
        {t:"h3", x:"线性 vs 对数"},
        {t:"ul", x:[
          "线性：等距代表等值，适合差异不悬殊的数据。",
          "对数：等距代表等比，适合跨数量级（如 50 万到 2700 万人口，相差约 50 倍）。",
          "对数 domain 必须为正数（不能含 0 或负数），否则无意义。",
        ]},
        {t:"h3", x:"反查：invert"},
        {t:"p", x:"比例尺是函数，d3 的连续比例尺支持 <code>.invert(pixel)</code>，从屏幕像素反查数据值——这是悬停提示、缩放刷选的基础。"},
      ],
      code: [
        {title:"两级比例尺", purpose:"数据空间 → 坐标系 → 屏幕。",
        code:`const xData = d3.scaleLinear()
  .domain([0, d3.max(data,d=>d.x)]).range([0, innerW]);
const xScreen = d3.scaleLinear()
  .domain([0, innerW]).range([M.l, M.l+innerW]);
.attr("cx", d => xScreen(xData(d.x)));`},
        {title:"对数比例尺", purpose:"跨数量级数据。",
        code:`const xLog = d3.scaleLog()
  .domain([1, d3.max(data,d=>d.x)]).range([0, innerW]);`},
      ],
      demo: {id:"scale-curve", title:"比例尺与曲线实验（比例尺部分）", task:"拖动滑块改变一个数据值，在线性/对数两条轨道上对比其位置；切换到曲线标签查看曲线插值。",
        observe:"同样的大值，在线性轴上挤占小州空间，在对数轴上大小州都能看清；log 域不能含 0。"},
      pitfalls: [
        "在含 0 或负数的数据上用 scaleLog，会得到 NaN/错误。",
        "把像素坐标直接当数据值，忽略 margin 导致悬停位置错位。",
        "对线性数据滥用对数轴，夸大或压缩真实差距。",
      ],
      quiz: [
        {q:"一组数据最小值为 0、最大值为 1000，要使用对数比例尺，应先怎样处理？",
         opts:["直接使用 scaleLog，D3 会自动处理","对数不能取 0，应改用线性比例尺或对数据做合法的正偏移后再评估","把所有数据取负数","对数比例尺与 0 无关"],
         ans:1, explain:"log(0) 无定义（-∞），scaleLog 的 domain 必须严格为正；数据含 0 时通常改用线性比例尺，或谨慎使用正值偏移。",
         mistake:"D3 不会自动修复 0，直接使用会导致坐标错误。"},
      ],
      keywords: ["坐标变换","scaleLinear","scaleLog","margin","数据空间","屏幕空间","invert","对数比例尺","域 domain"],
    },
    {
      id: "4-3", c: 4, l: 3,
      title: "曲线插值 vs 统计拟合",
      subtitle: "平滑曲线不是回归：点之间的形状可能是“画出来的”",
      question: "d3 的 curve 类型和回归拟合有什么区别？平滑曲线会不会造假？",
      goal: ["区分插值（过采样点）与拟合（最小化误差）","比较 linear/monotoneX/natural/curveBasis 等曲线","识别平滑曲线造成的虚假峰谷"],
      prereq: ["4.2 比例尺","折线图"],
      keyPoint: "curve 插值只决定“怎样连接已有数据点”，通常穿过采样点；统计拟合用一条模型曲线近似整体趋势、不必过点。平滑插值可能在数据点之间产生并不存在的峰谷。",
      blocks: [
        {t:"h3", x:"插值 vs 拟合（陈为教材）"},
        {t:"table", head:["","插值 interpolation","拟合 fitting"], rows:[
          ["目的","连接已知点，估计点间形态","用模型概括整体趋势"],
          ["是否过点","多数曲线穿过采样点","通常不过每个点"],
          ["回答","点之间怎么连线","数据整体遵循什么规律"],
          ["D3","line.curve(...)","d3-regression 等"],
        ]},
        {t:"h3", x:"常见曲线"},
        {t:"ul", x:[
          "<b>linear：</b>直线连接，最忠实，不添加峰谷。",
          "<b>monotoneX：</b>在保持单调性的前提下平滑（推荐，不易造假）。",
          "<b>catmullRom：</b>平滑且过点，张力可调。",
          "<b>natural / basis：</b>更圆滑，但可能在点间制造过冲（虚假峰谷）。",
          "<b>step：</b>阶梯，用于离散跳变。",
        ]},
        {t:"note", kind:"warn", x:"曲线越平滑不等于越真实：natural/basis 可能越过采样点制造数据中不存在的起伏。展示时务必保留原始采样点，避免误导。"},
      ],
      code: [
        {title:"切换 curve 类型", purpose:"只改一行即可。",
        code:`const line = d3.line()
  .x(d => xScale(d.x)).y(d => yScale(d.y))
  .curve(d3.curveCatmullRom);
svg.append("path").datum(data).attr("d", line);`},
        {title:"统计拟合（最小二乘/LOESS）", purpose:"需要额外的回归库。",
        code:`import {regressionLinear} from "d3-regression";
const lin = regressionLinear()
  .x(d=>d.population).y(d=>d.murder)
  .domain([0, d3.max(data,d=>d.population)]);
svg.append("path").attr("d", d3.line()(lin(data)));`},
      ],
      demo: {id:"scale-curve", title:"比例尺与曲线实验（曲线部分）", task:"始终保留原始点，切换 linear/monotoneX/natural/basis，观察平滑曲线在点之间是否制造了峰谷；打开/关闭“拟合线”。",
        observe:"linear 逐点直线连接；natural 可能过冲；basis 通常不穿过全部采样点；拟合线估计整体趋势。"},
      pitfalls: [
        "把平滑曲线当成回归分析，误以为得到了趋势/因果。",
        "只画平滑曲线、隐藏采样点，让读者无法判断真实数据。",
        "对离散/跳变数据强行平滑，掩盖真实的台阶。",
      ],
      quiz: [
        {q:"把 d3.line 的 curve 从 linear 换成 curveNatural，曲线在两个采样点之间出现了一个明显高峰。这说明？",
         opts:["数据中真实存在这个高峰","插值算法可能制造了采样点之间不存在的峰谷，需保留原始点核实","已经完成了线性回归","数据一定有误"],
         ans:1, explain:"natural 插值可能在点间过冲，产生过平滑的虚假峰谷；插值不是拟合，不能据此声称存在高峰。",
         mistake:"不经过点的起伏不能当成数据事实；回归拟合是另一套方法。"},
      ],
      keywords: ["曲线","插值","interpolation","拟合","fitting","curveMonotoneX","curveNatural","curveBasis","catmullRom","回归","d3-regression"],
    },
    {
      id: "4-4", c: 4, l: 4,
      title: "倾角感知：斜率与显示比例",
      subtitle: "同一组数据，改变图的宽高比，趋势看起来完全不同",
      question: "为什么显示比例（倾角）会影响人对变化幅度的判断？",
      goal: ["解释倾角感知现象","用角度滑块展示斜率变化","理解 Cleveland 角度判读与误差范围"],
      prereq: ["4.2 坐标映射","折线图"],
      keyPoint: "折线斜率在视觉上依赖宽高比与坐标范围：把图拉高变窄，趋势显得陡峭；压扁变宽，趋势显得平缓。30°–60° 附近判读较稳定，接近 0°/90° 误差大。",
      blocks: [
        {t:"h3", x:"倾角决定“看起来变化多大”"},
        {t:"p", x:"屏幕上的斜率 = 物理尺度 ×（y 轴单位/像素 ÷ x 轴单位/像素）。即使数据完全相同，改变绘图区的宽高比或坐标轴范围，都会改变线段角度，从而改变人对增幅的主观印象。"},
        {t:"h3", x:"Cleveland 的角度判读"},
        {t:"ul", x:[
          "人对角度的定量判断在中段（约 30°–60°）最准确。",
          "接近水平（0°）或垂直（90°）时，角度变化难以区分，误差最大。",
          "多序列比较时，应让关键斜率落在可读区间，并保持尺度一致。",
        ]},
        {t:"note", kind:"tip", x:"折线图的宽高比是一种“表达方式”而非纯美学；汇报时故意压缩/拉伸坐标是常见的误导手段。"},
      ],
      code: [
        {title:"角度 → 屏幕坐标", purpose:"画一条给定角度的参考线。",
        code:`function lineAtAngle(angleDeg, length=240, origin={x:100,y:240}){
  const r = angleDeg * Math.PI/180;
  return { x1:origin.x, y1:origin.y,
    x2:origin.x + length*Math.cos(r),
    y2:origin.y - length*Math.sin(r) }; // SVG y 向下
}`},
        {title:"滑块联动重绘", purpose:"拖动角度立即看到差异。",
        code:`slider.addEventListener("input", e => renderLine(+e.target.value));
// 30°~60° 误差小，0°/90° 误差大`},
      ],
      demo: {id:"slope", title:"倾角感知实验", task:"拖动滑块或调整宽高比，观察同一份数据折线的陡峭程度变化；用参考角度对比 30°/45°/60°。",
        observe:"数据没变，仅改显示比例，趋势的视觉强度就会明显变化。"},
      pitfalls: [
        "通过拉伸纵轴夸大变化，制造“暴涨/暴跌”假象。",
        "多子图使用不同 y 轴尺度却直接比较斜率。",
        "完全垂直/水平的线段上追求精确斜率判读。",
      ],
      quiz: [
        {q:"两张图用完全相同的数据，只是第二张图更窄、更高，第二张的上升看起来更陡峭。原因是？",
         opts:["数据被改变了","显示比例（宽高比/坐标范围）改变了线段的视觉倾角","使用了不同的曲线插值","一定是计算错误"],
         ans:1, explain:"屏幕斜率取决于显示比例与轴范围；图变窄变高会增大倾角，让趋势显得更陡，数据本身并未改变。",
         mistake:"这是感知/表达问题，不是数据或计算错误。"},
      ],
      keywords: ["倾角","斜率","slope","显示比例","宽高比","Cleveland","角度感知","坐标范围","误导"],
    },
    {
      id: "4-5", c: 4, l: 5,
      title: "等值线：Marching Squares",
      subtitle: "从网格数据到等高线，逐格查表连成线",
      question: "二维标量场（高度、密度）是怎样变成等值线的？",
      goal: ["理解 Marching Squares 的查表思想","用网格四角值确定 case 编号","理解鞍点（saddle）的二义性"],
      prereq: ["数据网格化基础","SVG 连线"],
      keyPoint: "Marching Squares 对每个网格单元，用四个角与阈值的大小关系得到 4 位二进制（16 种 case），查表决定单元内画哪些线段，相邻单元的线段自然连接成等值线。",
      blocks: [
        {t:"h3", x:"算法步骤"},
        {t:"ul", x:[
          "对每个网格单元，比较四角值与阈值（>阈值记 1）。",
          "四个角（BL、BR、TR、TL）组成 4 位二进制，得到 0–15 共 16 种 case。",
          "查“边表”决定该单元内画 0/1/2 条线段，边的编号为左中、下中、右中、上中。",
          "交点用线性插值确定在边上的具体位置；遍历所有单元即得到等值线。",
        ]},
        {t:"h3", x:"鞍点（saddle）二义性"},
        {t:"p", x:"当两个对角角点都大于阈值、另两个对角小于阈值（如 0101、1010），存在两种连接方式，需要结合鞍点值或额外规则消歧。"},
        {t:"note", kind:"info", x:"等值线是低维标量场的标准表达：地形等高线、温度场、密度场、机器学习的决策边界都基于同一思想。"},
      ],
      code: [
        {title:"四角 → 4 位二进制 → case", purpose:"查表确定画线。",
        code:`let code = 0;
if (bl > threshold) code |= 1;  // bit0
if (br > threshold) code |= 2;  // bit1
if (tr > threshold) code |= 4;  // bit2
if (tl > threshold) code |= 8;  // bit3
const lines = EDGE_TABLE[code]; // 0~15 查表`},
        {title:"16 种 case 的边表（节选）", purpose:"每种 case 对应 0/1/2 条边对。",
        code:`// 边编号：0=左中,1=下中,2=右中,3=上中
const EDGE_TABLE = [
  [],            // 0000
  [[3,0]],       // 0001 仅 BL 大
  [[0,1]],       // 0010 仅 BR 大
  [[3,0],[1,2]], // 0101 鞍点
  /* …共 16 种… */
  []             // 1111 全大
];`},
      ],
      demo: {id:"contour", title:"Marching Squares 演示", task:"拖动阈值滑块，先观察单个网格单元的 case 与连线，再查看整体等高线（含/不含鞍点消歧）。",
        observe:"阈值变化时，每个单元的 case 重算，等值线随之移动；鞍点格有两种连接方式。"},
      pitfalls: [
        "只记“等高线”概念，不理解它是逐格查表拼出来的。",
        "忽略鞍点二义性，等值线可能出现不合理连接。",
        "交点不做插值直接取边中点，等高线粗糙失真。",
      ],
      quiz: [
        {q:"在 Marching Squares 中，一个网格单元的四个角与阈值比较得到 4 位二进制，最多对应多少种 case？",
         opts:["8 种","12 种","16 种","32 种"],
         ans:2, explain:"4 个角各 0/1，共 2⁴=16 种组合（0000–1111），边表为每种 case 规定连线。",
         mistake:"是 4 位而非 3 位，组合数是 2 的 4 次方。"},
      ],
      keywords: ["等值线","等高线","Marching Squares","标量场","网格","鞍点","saddle","查表","线性插值","contour"],
    },
  ],
});

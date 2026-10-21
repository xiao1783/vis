/* ============================================================
 * 第一章：数据（5 小节）
 * ============================================================ */
window.COURSE.chapters.push({
  id: 1,
  num: "第一章",
  title: "数据",
  route: "认识数据",
  accent: "#2563eb",
  question: "图表背后的“数据”到底是什么，又是怎样从表格进入图形的？",
  outcome:
    "学完后，你能够区分数据属性与测量尺度，说明 DIKW 层次关系，完成基础数据变换，并理解数据与图形元素的对应（Data Join）关系。",
  prereq: ["了解 HTML 与 JavaScript 基础", "知道什么是 CSV 表格", "无需 D3 基础"],
  lessons: [
    {
      id: "1-1", c: 1, l: 1,
      title: "数据生成：从 CSV 到对象",
      subtitle: "把磁盘上的文本表格，变成内存里有类型的对象数组",
      question: "d3.csv 读进来的为什么默认都是字符串？怎样在加载时完成类型转换？",
      goal: [
        "说明 d3.csv 第二参（row 回调）的作用",
        "用一元 +、new Date、trim 完成字段映射与类型转换",
        "解释表格中数据的类型与对象中的类型差异",
      ],
      prereq: ["JavaScript 对象与数组", "CSV 表格概念"],
      keyPoint: "d3.csv 只会做“文本分割”，不会做“类型推断”；必须在 row 回调里显式转换，数据才是你想要的类型。",
      blocks: [
        {t:"h3", x:"数据从哪来：教学数据是合成数据"},
        {t:"p", x:"本章使用 <b>newstudent.csv</b>（软件工程与数据科学两个专业新生数据）。它是为本课程<b>合成</b>的教学数据，用于演示数据处理流程，不代表真实学生分布，不能用于真实人口或招生分析。"},
        {t:"note", kind:"warn", x:"<b>数据声明：</b>newstudent.csv 是 AI 合成的教学数据，姓名、班级、籍贯等均为虚构，仅用于演示。"},
        {t:"h3", x:"d3.csv 的两个阶段"},
        {t:"ul", x:[
          "<b>第一阶段（解析）：</b>按换行、逗号把文本切成对象，键名是表头第一行，值一律是字符串。",
          "<b>第二阶段（row 回调）：</b>每一行调用一次回调，由你决定返回什么对象、字段叫什么、是什么类型。",
        ]},
        {t:"table", head:["CSV 原始字段","转换后字段","类型","转换方式"], rows:[
          ["序号","id","number","一元 +d"],["姓名","name","string","trim() 去空白"],["性别","gender","string","直接保留"],
          ["生日","birthday","Date","new Date(...)"],["年龄","age","number","一元 +d"],["班级","class","string","trim() 去空白"],
        ]},
        {t:"h3", x:"为什么必须显式转换"},
        {t:"p", x:"字符串 \"18\" 与数字 18 在内存里完全不同：<code>\"18\" + 1</code> 得到 <code>\"181\"</code>，而 <code>18 + 1</code> 才是 19。日期若不转成 Date 对象，也无法按时间排序、计算间隔。"},
        {t:"note", kind:"info", x:"也可以用 <code>d3.csv(url, d3.autoType)</code> 让 D3 自动推断类型，但自动推断可能误判（如邮编、学号被当成数字）；教学数据字段含义明确时，建议手写转换函数。"},
      ],
      code: [
        {title:"字段名映射（中文表头 → 英文字段）", purpose:"在加载前约定好字段名，避免后续代码到处写中文键。",
        code:`const COLUMN_MAP = { "序号":"id", "姓名":"name", "性别":"gender",
  "生日":"birthday", "年龄":"age", "班级":"class" };`,
        kp:["键是 CSV 表头原文，值是你希望的对象字段名","集中管理字段名，后续改表只改一处"]},
        {title:"类型转换函数", purpose:"row 回调：一行文本对象 → 一个有类型的数据对象。",
        code:`function transformRow(d) {
  return {
    id: +d["序号"],               // 一元 + 把字符串转成数字
    name: d["姓名"].trim(),       // 去掉首尾空白
    birthday: new Date(d["生日"]),// 字符串 → Date
    age: +d["年龄"],
    class: d["班级"].trim()
  };
}`},
        {title:"一行完成加载 + 转换", purpose:"async 加载并验证类型。",
        code:`const data = await d3.csv("data/newstudent.csv", transformRow);
console.log(typeof data[0].age);               // "number"
console.log(data[0].birthday instanceof Date); // true`},
      ],
      demo: {id:"csv-loader", title:"CSV 加载与类型转换", task:"加载 newstudent.csv，观察原始文本与转换后对象的差异，切换行查看字段类型。",
        observe:"原始 CSV 每个值都是字符串；经过 row 回调后，年龄是 number、生日是 Date。"},
      pitfalls: [
        "以为 d3.csv 会自动转数字：不写转换时，年龄排序会按字符串字典序（17、18、8…）。",
        "用 +d 转换空字符串或非数字文本会得到 NaN，脏数据要先做校验。",
        "中文表头含空格或全角字符时，键名必须与表头完全一致，否则取到 undefined。",
      ],
      quiz: [
        {q:"d3.csv(url, transformRow) 中 transformRow 的作用是什么？",
         opts:["决定每个 CSV 文件用什么分隔符","对每一行数据进行映射与类型转换，返回新对象","把数据画成图形","删除包含缺失值的行"],
         ans:1, explain:"row 回调对每一行调用一次，你在这里重命名字段、用一元 + 转数字、用 new Date 转日期，返回的对象才会进入最终数组。",
         mistake:"分隔符由 d3.dsvFormat 决定，不是 row 回调；画图是后续选择器的工作。"},
        {q:"表达式 +\"18\" + 1 的结果是？", opts:["19","181","\"181\"","报错"],
         ans:0, explain:"一元 + 先把字符串 \"18\" 转成数字 18，再加 1 得到 19。",
         mistake:"若不转换，\"18\" + 1 才是字符串拼接 \"181\"。"},
      ],
      keywords: ["d3.csv","类型转换","type coercion","row回调","字段映射","new Date","CSV","数据加载","合成数据"],
    },
    {
      id: "1-2", c: 1, l: 2,
      title: "数据定义：DIKW 金字塔",
      subtitle: "Data → Information → Knowledge → Wisdom，可视化处在哪个位置",
      question: "数据、信息、知识、智慧有什么区别？可视化在其中扮演什么角色？",
      goal: ["说明 DIKW 四个层次的含义","用同一个例子区分各层次","解释可视化为什么主要作用于 D→I 与 I→K"],
      prereq: ["第 1.1 节：数据对象"],
      keyPoint: "数据是原始符号，信息是赋予上下文后的数据，知识是信息中归纳出的规律，智慧是基于知识的判断与行动；可视化主要帮助“从数据到信息、从信息到知识”。",
      blocks: [
        {t:"h3", x:"DIKW 四个层次"},
        {t:"p", x:"DIKW 是信息科学中经典的层次模型，自下而上价值递增、数量递减。"},
        {t:"table", head:["层次","含义","班级示例（同一条记录的不同表达）"], rows:[
          ["Data 数据","原始、离散的符号","17、女、软件工程1班"],
          ["Information 信息","加了上下文、有结构的数据","李华，17岁，软件工程1班女生"],
          ["Knowledge 知识","从信息中归纳的模式/规则","软件工程1班平均年龄18.2岁，17岁属于低龄新生"],
          ["Wisdom 智慧","基于知识的判断与决策","低龄新生入学适应可能需要更多关注"],
        ]},
        {t:"h3", x:"可视化在 DIKW 中的位置"},
        {t:"ul", x:[
          "数据→信息：用图表呈现数据结构、字段与关系（如柱状图显示各班级人数）。",
          "信息→知识：通过对比、趋势、分布，帮助发现规律（如某专业性别比例明显失衡）。",
          "图表本身不直接产生智慧；判断与决策由人结合领域知识完成。",
        ]},
        {t:"note", kind:"tip", x:"同一个例子贯穿四层，比四个互不相关的例子更能说明层次差别。"},
      ],
      code: [
        {title:"SVG 金字塔路径（梯形四层）", purpose:"用 trapezoid 路径绘制上窄下宽的金字塔。",
        code:`const path = \`M \${cx-topW/2} \${yTop} L \${cx+topW/2} \${yTop}
  L \${cx+botW/2} \${yBot} L \${cx-botW/2} \${yBot} Z\`;`},
        {title:"选择集绑定交互", purpose:"悬停高亮、点击查看该层说明。",
        code:`g.on("mouseover", function() {           // 注意用 function 以获得 this
   d3.select(this).select("path")
     .transition().duration(150)
     .attr("fill", d3.color(layer.color).brighter(0.5));
 }).on("click", () => showDetail(layer));`},
      ],
      demo: {id:"dikw", title:"DIKW 金字塔", task:"点击或悬停四个层级，阅读同一班级示例在各层的表达。",
        observe:"越向上，数据越抽象、越接近判断；可视化主要帮你完成下两层的跃升。"},
      pitfalls: [
        "把“数据多”当成“知识多”：没有组织和上下文，再多符号也只是数据。",
        "认为图表能自动给出结论：可视化帮助发现规律，结论仍需领域判断。",
        "四层边界不是绝对的，同一份内容在不同任务下可能处于不同层次。",
      ],
      quiz: [
        {q:"“软件工程1班平均年龄 18.2 岁，17 岁属于低龄新生”属于 DIKW 的哪一层？",
         opts:["Data 数据","Information 信息","Knowledge 知识","Wisdom 智慧"],
         ans:2, explain:"这是从多条信息中归纳出的规律/判断标准，属于知识（Knowledge）。",
         mistake:"单个字段值是数据，加了上下文是信息，而“平均、属于低龄”已经是归纳出的模式。"},
      ],
      keywords: ["DIKW","金字塔","Data","Information","Knowledge","Wisdom","数据定义","信息","知识"],
    },
    {
      id: "1-3", c: 1, l: 3,
      title: "数据属性：尺度与视觉通道",
      subtitle: "不是所有数字都该用高度，不是所有类别都该用颜色",
      question: "拿到一个字段，怎么判断它的测量尺度，又该用什么视觉通道表达？",
      goal: ["区分名义、序数、区间、比率四类测量尺度","为不同尺度选择合适的视觉通道","理解 Mackinlay 通道有效性排序"],
      prereq: ["第 1.1 节数据类型","第 1.2 节 DIKW"],
      keyPoint: "测量尺度决定允许的操作与视觉通道：类别用色相区分、顺序用位置/长度、有绝对零点的比率才适合长度和面积。",
      blocks: [
        {t:"h3", x:"Stevens 四类测量尺度（1946）"},
        {t:"table", head:["尺度","特征","允许的操作","班级字段示例"], rows:[
          ["名义 Nominal","相等/不等，无顺序","=、≠、计数","性别、籍贯、专业"],
          ["序数 Ordinal","有顺序，差值无意义","排序、中位数","学历、满意度等级"],
          ["区间 Interval","差值有意义，无绝对零点","加减","摄氏温度、年份"],
          ["比率 Ratio","有绝对零点，比值有意义","加减乘除","年龄、人数、身高"],
        ]},
        {t:"h3", x:"Mackinlay 视觉通道有效性（1986）"},
        {t:"p", x:"Mackinlay 给出了不同通道对不同尺度的表达有效性排序，核心结论是：位置（position）对定量最有效，长度/角度次之，面积/颜色亮度再次，色相（hue）最适合区分类别。"},
        {t:"ul", x:[
          "名义型 → 色相、形状、位置（分类轴）",
          "序数型 → 灰度、明度、位置（有顺序的轴）",
          "区间/比率 → 位置、长度、角度（定量轴）",
        ]},
        {t:"note", kind:"warn", x:"用面积/体积编码定量会产生系统误差（面积按半径平方增长）；给类别做彩虹渐变会暗示不存在的顺序。"},
      ],
      code: [
        {title:"比例尺选型（属性 ↔ 通道）", purpose:"连续定量用 scaleLinear，离散分类用 scaleBand。",
        code:`// 比率型 → 连续定量
const x = d3.scaleLinear().domain([0,100]).range([0,800]);
// 名义/序数 → 离散分类
const xb = d3.scaleBand().domain(["软件1班","软件2班"]).range([0,800]);`},
        {title:"colormap 选型", purpose:"三类颜色映射对应三种数据语义。",
        code:`d3.scaleSequential(d3.interpolateViridis);        // 顺序型
d3.scaleOrdinal().range(d3.schemeTableau10);       // 定性/类别
d3.scaleDiverging(d3.interpolateRdBu);            // 发散型（有中点）`},
      ],
      demo: {id:"attribute", title:"属性 × 视觉通道", task:"选择字段，查看其尺度类型与推荐通道，并测试错误编码。",
        observe:"类别字段用彩虹渐变会产生虚假顺序；比率字段用面积会夸大差异。"},
      pitfalls: [
        "给名义变量（如专业、性别）施加有序颜色，误导读者以为有高低。",
        "用饼图（角度/面积）表达需要精确比较的数值，不如条形图（长度）。",
        "区间型（如摄氏温度）做“倍数”比较：20℃ 不是 10℃ 的两倍“热度”。",
      ],
      quiz: [
        {q:"下列字段中，最适合用“色相（不同颜色）”来区分的是？",
         opts:["学生年龄（比率）","专业名称（名义）","满意度等级（序数）","摄氏温度（区间）"],
         ans:1, explain:"名义变量只需要区分相等与否，色相最适合分类；年龄/温度是定量，应优先用位置或长度。",
         mistake:"给定量用不同色相无法比较大小，给类别用渐变会暗示顺序。"},
        {q:"为什么饼图通常不适合精确比较多个数值？",
         opts:["饼图不能显示百分比","人对角度和面积的定量判断不如对长度准确","饼图只能画两个类别","饼图无法使用颜色"],
         ans:1, explain:"依据通道有效性，位置/长度对定量最准确，角度与面积的判断误差更大，类别多时更明显。",
         mistake:"饼图能显示百分比也能着色，问题在通道的定量精度。"},
      ],
      keywords: ["测量尺度","Stevens","名义","序数","区间","比率","ordinal","nominal","视觉通道","Mackinlay","channel","scaleBand","scaleLinear"],
    },
    {
      id: "1-4", c: 1, l: 4,
      title: "数据变换：map / filter / reduce / group",
      subtitle: "用函数式数据流把原始数组一步步变成绘图所需的结构",
      question: "怎样从原始记录数组，通过筛选、派生、分组聚合得到可绘图的数据？",
      goal: ["用 map/filter/reduce 做行级变换","用 d3.rollup/group 做层次聚合","读懂并书写函数式数据处理链"],
      prereq: ["第 1.1 节对象数组","箭头函数与高阶函数"],
      keyPoint: "可视化中“数据变换”回答的是数据从什么结构变成什么结构：filter 改行数、map 改字段、reduce/rollup 改聚合程度。",
      blocks: [
        {t:"h3", x:"四类基础操作"},
        {t:"table", head:["操作","输入 → 输出","典型用途"], rows:[
          ["filter","行 → 部分行（改变记录数）","筛选男生、筛选某专业"],
          ["map","行 → 新行（字段重命名/派生）","提取年龄、计算年龄分段"],
          ["reduce","数组 → 单值（或聚合结构）","求和、计数、平均"],
          ["group / rollup","数组 → 嵌套 Map（分组）","按班级、性别分组计数"],
        ]},
        {t:"h3", x:"函数式数据流"},
        {t:"p", x:"数据处理通常写成一条链：先 filter，再 map，最后 reduce/rollup。每一步只做一件事，中间结果清晰，便于调试。"},
        {t:"note", kind:"tip", x:"d3.group 返回 Map，每个 key 保留所有原始记录；d3.rollup 返回 Map，但每个 key 只保留 reducer 计算出的聚合值。"},
        {t:"h3", x:"group vs rollup"},
        {t:"ul", x:[
          "<code>d3.group(students, d => d.class)</code>：Map<班级, 学生数组>",
          "<code>d3.rollup(students, v => v.length, d => d.class)</code>：Map<班级, 人数>",
        ]},
      ],
      code: [
        {title:"map / filter / reduce 链式组合", purpose:"计算男生平均年龄。",
        code:`const males = students.filter(s => s.gender === "男");
const avgAge = males.map(s => s.age)
  .reduce((sum, a) => sum + a, 0) / males.length;`,
        kp:["filter 先缩小记录集，map 再提取字段，reduce 汇总","每一步职责单一，可单独打印中间结果"]},
        {title:"d3.cross 笛卡尔积", purpose:"生成两两组合，用于网格/对照表。",
        code:`const combos = d3.cross(["男","女"], ["软件工程","数据科学"]);
// → [["男","软件工程"], ...，共4组]`},
        {title:"group 与 rollup 层次聚合", purpose:"分组后保留记录或保留计数。",
        code:`const byClass = d3.group(students, s => s.class);
const countByClass = d3.rollup(students, v => v.length, s => s.class);`},
      ],
      demo: {id:"data-transform", title:"数据变换流水线", task:"依次点击筛选、派生、分组，观察一个小数据集如何一步步变成输出，并阅读每步说明。",
        observe:"filter 改变记录数但不改变保留记录的字段；map 改变字段；rollup 把多行折叠成每组一个值。"},
      pitfalls: [
        "混淆 map 与 forEach：map 会返回新数组，forEach 只遍历不返回。",
        "在 reduce 里忘记给初始值（空数组第一次迭代会出错）。",
        "以为 rollup 结果还是数组：它是嵌套 Map，需要用 for...of 或 d3.index 取值。",
      ],
      quiz: [
        {q:"对一个 12 条记录的数组执行 filter（保留满足条件的行），结果只剩 7 条。下面说法正确的是？",
         opts:["保留的 7 条记录字段被修改了","记录数减少，但保留下来的记录字段没有改变","每条记录都被重新计算了","一定发生了分组聚合"],
         ans:1, explain:"filter 只决定哪些行被保留，不改变这些行的字段；改字段是 map 的职责。",
         mistake:"map 才改字段；rollup/group 才做分组聚合。"},
        {q:"d3.rollup(data, v => v.length, d => d.class) 的返回值是？",
         opts:["一个普通数组","以班级为键、以人数为值的 Map","按年龄排序的数组","一个 Date 对象"],
         ans:1, explain:"rollup 按 key 函数分组，并用 reducer（v.length）把每组折叠为一个值，返回 Map。",
         mistake:"group 才返回 Map<键, 记录数组>；rollup 返回 Map<键, 聚合值>。"},
      ],
      keywords: ["map","filter","reduce","d3.group","d3.rollup","数据变换","聚合","group","rollup","笛卡尔积","cross","函数式"],
    },
    {
      id: "1-5", c: 1, l: 5,
      title: "D3 数据选择器：Data Join 三态",
      subtitle: "数据如何与图形元素“配对”，谁进入、谁更新、谁退出",
      question: "数据变化后，D3 怎样决定哪些图形要创建、更新、删除？为什么 key 如此重要？",
      goal: ["解释 enter / update / exit 三态","用 .join() 处理三态","用 key 函数绑定元素身份","区分 select 与 selectAll"],
      prereq: ["第 1.1 节数据加载","第 1.4 节数据变换","SVG 基础"],
      keyPoint: "Data Join 按“身份”（key）匹配新旧数据：新数据里有、旧图形没有的是 enter，二者都有的是 update，旧图形有、新数据没有的是 exit；数组长度相同也可能三种状态同时出现。",
      blocks: [
        {t:"h3", x:"三态模型（Mike Bostock）"},
        {t:"ul", x:[
          "<b>enter（进入）：</b>新数据中存在，但页面上还没有对应图形 → 需要创建。",
          "<b>update（更新）：</b>新旧数据中都存在 → 更新属性（如位置、颜色）。",
          "<b>exit（退出）：</b>页面上有图形，但新数据中已不存在 → 删除。",
        ]},
        {t:"h3", x:"关键：匹配靠身份，不靠数量"},
        {t:"p", x:"默认按索引位置匹配；一旦提供 key 函数（如 <code>d => d.id</code>），就按唯一身份匹配。于是旧数组 [A,B,C] 变成新数组 [B,C,D] 时，虽然长度都为 3，仍然是：<b>A 退出、D 进入、B 与 C 更新</b>。"},
        {t:"note", kind:"warn", x:"这是最常见的误区：数据项数量不变，不等于只有 update。只要身份发生替换，就会同时出现 enter 和 exit。"},
        {t:"h3", x:"select 与 selectAll"},
        {t:"ul", x:[
          "<code>d3.select</code>：只选中第一个匹配元素，数据绑定只作用于这一个。",
          "<code>d3.selectAll</code>：选中全部匹配元素，与数据按 key 一一对应。",
        ]},
      ],
      code: [
        {title:".join(enter, update, exit) 三态", purpose:"用 v5+ 的 join API 同时处理三态。",
        code:`svg.selectAll("circle").data(currentData, d => d.id)
  .join(
    enter  => enter.append("circle").attr("fill", "#10b981"),
    update => update.attr("fill", "#2563eb"),
    exit   => exit.attr("fill", "#ef4444").remove()
  )
  .attr("cx", d => x(d.id)).attr("r", d => d.value);`},
        {title:"key 函数：元素身份的稳定器", purpose:"让元素“知道自己是哪个”。",
        code:`// ❌ 不带 key：顺序变化 → 元素按索引错配
svg.selectAll("circle").data(newData);
// ✅ 带 key：用唯一 id 绑定身份
svg.selectAll("circle").data(newData, d => d.id);
// 等价于 React 的 key={item.id}`,
        kp:["重排数据时，带 key 的元素只更新位置而不是整体重建","身份替换（等长）时能正确出现 enter/exit"]},
        {title:"select 与 selectAll", purpose:"单选与多选。",
        code:`const title = d3.select("#title");       // 1 个
const bars = d3.selectAll(".bar").data(values); // 多个`},
      ],
      demo: {id:"data-join", title:"Data Join 三态实验", task:"点击“替换一个 ID”，让 [A,B,C] → [B,C,D]；观察等长数组下 A 退出、D 进入、B/C 更新。再试增删、改值、重排。",
        observe:"三态由身份匹配决定，与数组长度无关；圆形上的文字标签与颜色共同标出 enter/update/exit。"},
      pitfalls: [
        "认为数据项数量不变就只有 update：替换身份时仍会有 enter/exit。",
        "不写 key 导致重排时动画错乱、元素错配。",
        "忘记在 exit 上调用 remove()，退出的图形会残留在页面上。",
        "join 之后再设置的共有属性（如位置）会同时作用于三态，可减少重复代码。",
      ],
      quiz: [
        {q:"旧数据是 [A,B,C]，新数据是 [B,C,D]（均用字母作为 key），且长度都为 3。下列正确的是？",
         opts:["全部 update，因为长度相同","A 退出、D 进入、B 和 C 更新","B、C 退出，A 更新","没有 enter 也没有 exit"],
         ans:1, explain:"按 key 匹配：A 在新数据中消失→exit，D 是新身份→enter，B/C 身份仍在→update。长度相同也会三态并存。",
         mistake:"默认按索引匹配才会显得“数量没变”；用身份匹配后应看每个 key 的去留。"},
        {q:"data(newData, d => d.id) 中第二个参数的作用是？",
         opts:["指定动画时长","为每个元素提供唯一身份标识，用于稳定匹配","按 id 排序数据","决定删除哪些元素"],
         ans:1, explain:"key 函数返回元素身份，D3 据此在新旧数据间匹配，避免重排/替换时错配。",
         mistake:"排序是 sort 的事，动画是 transition 的事，key 只负责身份。"},
      ],
      keywords: ["Data Join","enter","update","exit","join","key","select","selectAll","数据选择器","三态","身份匹配"],
    },
  ],
});

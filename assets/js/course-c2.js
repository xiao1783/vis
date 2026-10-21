/* ============================================================
 * 第二章：数据可视化流程（4 小节）
 * ============================================================ */
window.COURSE.chapters.push({
  id: 2,
  num: "第二章",
  title: "数据可视化流程",
  route: "理解流程",
  accent: "#0891b2",
  question: "一份原始数据，要经过哪些步骤才能变成可交互的图形？",
  outcome:
    "学完后，你能够描述可视化流程各环节的输入输出，用 rollup 与层次结构组织数据，用 d3.tree 绘制树形图，并解释交互如何作用于流程的某一步。",
  prereq: ["第一章的数据变换与 Data Join","HTML/SVG 基础"],
  lessons: [
    {
      id: "2-1", c: 2, l: 1,
      title: "可视化流程总览",
      subtitle: "原始数据 → 变换 → 映射 → 渲染 → 交互，五步如何串起来",
      question: "可视化包含哪些核心环节？每一步的输入与输出分别是什么？",
      goal: ["说出可视化流程的五个环节","说明每一步的输入、操作与输出","理解交互改变的是流程中的哪一步"],
      prereq: ["第一章全部内容"],
      keyPoint: "可视化是一条数据流水线：原始记录经变换得到结构化数据，再经视觉映射确定图形属性，最后渲染为视图；交互可以反过来改变前几步的参数。",
      blocks: [
        {t:"h3", x:"三个经典流程模型"},
        {t:"ul", x:[
          "<b>Card 模型：</b>数据获取→清洗→视觉映射→渲染→交互。",
          "<b>数据状态参考模型（Chi）：</b>数据空间与视图空间各自经历变换（derivation、visual mapping、view transformation）。",
          "<b>Ben Shneiderman：</b>概览、缩放与过滤、按需细节（Overview first, zoom and filter, details on demand）。",
        ]},
        {t:"h3", x:"五步流水线（贯穿本章案例）"},
        {t:"table", head:["环节","输入","操作","输出"], rows:[
          ["① 原始数据","CSV 学生记录","加载、解析","对象数组"],
          ["② 数据变换","对象数组","分组、聚合、分层","汇总/嵌套结构"],
          ["③ 视觉映射","结构化数据","比例尺、布局","位置/大小/颜色"],
          ["④ 渲染","映射结果","Data Join","SVG 图形"],
          ["⑤ 交互","用户事件","过滤、缩放、折叠","视图更新"],
        ]},
        {t:"note", kind:"tip", x:"本章用同一份新生合成数据，从原始记录一路走到可折叠树形图，让你看到每一步的“变化是如何传递的”。"},
      ],
      code: [
        {title:"流程节点与箭头（SVG）", purpose:"用 marker 定义箭头，把节点连成流水线。",
        code:`svg.append("defs").append("marker").attr("id","arrow")
  .attr("viewBox","0 -5 10 10").attr("refX",8).attr("orient","auto")
  .append("path").attr("d","M0,-5L10,0L0,5").attr("fill","#94a3b8");
line.attr("marker-end","url(#arrow)");`},
        {title:"节点点击同步详情", purpose:"点击节点高亮并显示该步骤的输入/输出。",
        code:`nodes.join("g").attr("class","flow-node")
  .on("click", (e,d) => {
    svg.selectAll(".flow-node").classed("selected", n => n.id === d.id);
    detail.innerHTML = d.detail;
  });`},
      ],
      demo: {id:"pipeline", title:"可视化流程联动实验", task:"依次点击五个流程节点，或切换聚合维度，观察当前步骤的输入、操作、输出与图形结果如何联动。",
        observe:"改变聚合维度会同时影响“变换”的汇总结果和“映射/渲染”的树形图，说明各环节是串起来的。"},
      pitfalls: [
        "把可视化只理解为“画图”：画图只是渲染这一步，前面还有变换与映射。",
        "修改了交互却看不出变化：没有明确交互作用于哪一步、参数如何回流。",
        "把箭头理解成单向：用户交互往往会反过来改变前面环节的参数。",
      ],
      quiz: [
        {q:"用户在可折叠树形图上点击节点收起子树，这一交互主要作用于流程的哪一步？",
         opts:["数据加载","视觉映射/渲染（视图变换）","数据声明","DIKW 层次"],
         ans:1, explain:"折叠改变的是视图中哪些元素被展示（视图变换），底层数据与聚合结果通常不变。",
         mistake:"折叠不改变磁盘数据，也不重新加载，它改变的是展示状态。"},
      ],
      keywords: ["可视化流程","pipeline","Card","Chi","视觉映射","渲染","交互","overview","view transformation"],
    },
    {
      id: "2-2", c: 2, l: 2,
      title: "数据变换：多层聚合",
      subtitle: "用 d3.rollup 把学生记录汇总成专业→班级的嵌套结构",
      question: "怎样按两个维度（专业、班级）分组计数，并保留层次？",
      goal: ["用 d3.rollup 做双层聚合","用正则从“软件工程1班”提取“软件工程”","遍历嵌套 Map 并转为层级 JSON"],
      prereq: ["1.4 数据变换","正则表达式基础"],
      keyPoint: "d3.rollup 用多个 key 函数产生嵌套 Map；嵌套结构正是 d3.hierarchy 的输入，因此聚合与可视化布局天然衔接。",
      blocks: [
        {t:"h3", x:"双层 rollup"},
        {t:"p", x:"d3.rollup 的第三参起是可变参数 key 函数：第一个 key 是外层，第二个 key 是内层，reducer 决定每组保留什么值。"},
        {t:"h3", x:"从班级名提取专业"},
        {t:"p", x:"班级字段形如“软件工程1班”，专业是“软件工程”。用正则 <code>/^(.+?)(\\d+班)$/</code> 匹配：非贪婪前缀是专业，末尾“数字+班”是班号。"},
        {t:"note", kind:"info", x:"OLAP 视角：按专业、班级汇总对应“切片/切块”；从专业下钻到班级对应“钻取（drill down）”。"},
        {t:"h3", x:"嵌套 Map → 层级 JSON"},
        {t:"p", x:"d3.hierarchy 需要的是递归的 {name, children} 结构。把双层 Map 用嵌套循环转成：root → 专业 → 班级（叶子带 count）。"},
      ],
      code: [
        {title:"双层 rollup", purpose:"外层专业、内层班级，reducer 计数。",
        code:`const nested = d3.rollup(
  students,
  v => v.length,      // 每组人数
  d => d.major,       // 外层 key
  d => d.class        // 内层 key
);
for (const [major, inner] of nested)
  for (const [cls, count] of inner)
    console.log(major, cls, count);`},
        {title:"用正则提取专业", purpose:"在 row 回调里派生 major 字段。",
        code:`const data = await d3.csv("./data/newstudent.csv", d => {
  const cls = d["班级"].trim();
  const m = cls.match(/^(.+?)(\\d+班)$/);
  return { id:+d["序号"], name:d["姓名"].trim(), class:cls,
           major: m ? m[1] : cls };
});`},
      ],
      demo: {id:"rollup", title:"多层聚合演示", task:"切换聚合维度（专业/班级/性别），观察嵌套 Map 与分组人数的变化。",
        observe:"加一层 key 就多一层嵌套；每加一层，叶子上的计数被重新组织。"},
      pitfalls: [
        "正则写错：用贪婪 .+ 会把“数据科学1班”里的数字也吞掉，应使用非贪婪 .+?。",
        "把嵌套 Map 当普通数组用 map() 处理，应使用 for...of 或转换。",
        "reducer 与 group 混淆：要保留计数用 rollup(v => v.length)，要保留记录用 group。",
      ],
      quiz: [
        {q:"d3.rollup(students, v => v.length, d => d.major, d => d.class) 的结果结构是？",
         opts:["扁平数组，每行一个专业","以专业为外层键、班级为内层键的嵌套 Map，叶子为人数","按人数排序的数组","一个二维矩阵"],
         ans:1, explain:"两个 key 函数产生两层 Map，reducer 是计数，叶子值即每组人数。",
         mistake:"rollup 返回 Map 而非数组；只有一个 key 才是单层 Map。"},
      ],
      keywords: ["rollup","聚合","嵌套","OLAP","drill down","钻取","正则","group","层次结构"],
    },
    {
      id: "2-3", c: 2, l: 3,
      title: "视觉映射：树布局",
      subtitle: "把层次数据交给 d3.hierarchy 与 d3.tree，自动计算坐标",
      question: "一份嵌套 JSON 是怎样变成一棵有坐标、能连线的树的？",
      goal: ["用 d3.hierarchy 计算父子关系","用 d3.tree 计算节点坐标","用 linkHorizontal 绘制连线","用 separation 控制节点间距"],
      prereq: ["2.2 多层聚合","SVG path"],
      keyPoint: "d3.hierarchy 负责“关系”（parent/children/depth），d3.tree 负责“几何”（x/y 坐标），二者分离，布局算法可替换。",
      blocks: [
        {t:"h3", x:"hierarchy + tree 三步走"},
        {t:"ul", x:[
          "<b>① hierarchy：</b>读入嵌套 JSON，计算每个节点的 parent、children、depth、height。",
          "<b>② tree layout：</b>Reingold-Tilford 算法给每个节点分配 x/y 坐标。",
          "<b>③ 渲染：</b>用 linkHorizontal 画连线，用 join 画节点圆点和文字。",
        ]},
        {t:"h3", x:"Reingold-Tilford 算法"},
        {t:"p", x:"该算法通过自底向上的子树合并，尽量减少树的宽度，同时保持层级对称、避免兄弟子树重叠。d3.tree 已内置实现，只需用 size 指定绘图区域。"},
        {t:"h3", x:"d3-hierarchy 家族"},
        {t:"ul", x:[
          "<b>tree：</b>树状图（层级连线，每层深度相同）",
          "<b>cluster：</b>叶子对齐到同一层",
          "<b>treemap / partition：</b>用面积表达层级（矩形）",
          "<b>pack：</b>用嵌套圆表达层级",
          "<b>chord/force：</b>用于关系/网络（不是层次）",
        ]},
      ],
      code: [
        {title:"hierarchy + tree 三步走", purpose:"从嵌套数据到可见的树。",
        code:`const root = d3.hierarchy(rootData);                 // ① 关系
const layout = d3.tree().size([360, 720]);
const td = layout(root);                                      // ② 坐标
g.selectAll("path.link").data(td.links()).join("path")
  .attr("d", d3.linkHorizontal().x(d=>d.y).y(d=>d.x));       // ③ 连线
const ng = g.selectAll("g.node").data(td.descendants()).join("g")
  .attr("transform", d=>\`translate(\${d.y},\${d.x})\`);
ng.append("circle").attr("r",5);`},
        {title:"separation 控制间距", purpose:"兄弟节点紧贴，非兄弟拉开。",
        code:`d3.tree().size([360,720])
  .separation((a,b)=> a.parent===b.parent ? 1 : 2);`},
      ],
      demo: {id:"tree", title:"树布局演示", task:"展开/收起节点，观察 d3.tree 如何重新计算坐标，切换布局方向。",
        observe:"折叠一个子树后，其余节点会平滑移动以重新占据空间——这正是布局算法在重新计算。"},
      pitfalls: [
        "忘记在连线前调用布局，导致 links() 没有坐标。",
        "把 hierarchy 与 layout 混为一谈：前者算关系，后者算几何。",
        "横向树时把 x/y 坐标写反（linkHorizontal 下 x 取 d.y）。",
      ],
      quiz: [
        {q:"d3.hierarchy(rootData) 的主要作用是？",
         opts:["计算每个节点的屏幕像素坐标","计算节点的 parent/children/depth 等关系结构","决定节点颜色","把数据导出为 CSV"],
         ans:1, explain:"hierarchy 只负责关系；坐标由 d3.tree() 等布局函数随后计算。",
         mistake:"坐标是布局的职责，颜色是视觉映射的职责。"},
      ],
      keywords: ["d3.hierarchy","d3.tree","Reingold-Tilford","linkHorizontal","separation","树布局","cluster","treemap","pack"],
    },
    {
      id: "2-4", c: 2, l: 4,
      title: "渲染与交互：可折叠树形列表",
      subtitle: "用事件委托、classed 与递归渲染实现可交互的视图",
      question: "怎样用少量事件监听管理很多节点的折叠、选中与动画？",
      goal: ["用事件委托为大量节点统一监听","用 classed 管理选中状态","递归构建嵌套列表并用 transition 做动画","解释 DOM 事件三阶段"],
      prereq: ["2.3 树布局","DOM 事件机制"],
      keyPoint: "交互不是给每个节点各绑一个监听器，而是在父节点上用事件委托统一处理，再用 classed 切换状态、用 transition 平滑过渡。",
      blocks: [
        {t:"h3", x:"DOM 事件三阶段"},
        {t:"ul", x:[
          "<b>捕获阶段（capture）：</b>从 window 向下到目标元素。",
          "<b>目标阶段（target）：</b>事件到达目标。",
          "<b>冒泡阶段（bubble）：</b>事件从目标向上冒泡到 window。",
        ]},
        {t:"h3", x:"事件委托（Event Delegation）"},
        {t:"p", x:"在父节点上绑一次 click，利用事件冒泡判断点击来自哪个子元素。节点再多也只有一个监听器，且动态新增节点无需重新绑定。"},
        {t:"h3", x:"D3 classed：状态管理核心"},
        {t:"ul", x:[
          "<code>sel.classed('selected', true)</code>：添加类",
          "<code>sel.classed('selected', false)</code>：移除类",
          "<code>sel.classed('selected', d => d.id === pickId)</code>：函数式批量切换",
        ]},
        {t:"h3", x:"递归渲染与 transition"},
        {t:"p", x:"每个列表节点递归渲染其子节点；折叠时在数据上标记 _collapsed 后重新渲染。位置变化用 transition + duration 平滑过渡，新节点先 opacity:0 再淡入。"},
      ],
      code: [
        {title:"事件委托（一对多监听）", purpose:"父节点绑一次，子元素共享。",
        code:`label.on("click.toggle", e => {
  e.stopPropagation();                    // 折叠按钮不触发“选中”
  d.data._collapsed = !d.data._collapsed;
  render();
});
liSel.on("click.select", function(){
  d3.selectAll("li").classed("selected", false);
  d3.select(this).classed("selected", true);
});`},
        {title:"递归 buildList + transition", purpose:"重渲染并做平滑动画。",
        code:`function render(){
  tree.innerHTML = "";
  d3.create("ul").selectAll("li").data([root]).join("li")
    .each(function(d){ buildList(d3.select(this), d); });
}
node.transition().duration(DURATION)
  .attr("transform", d=>\`translate(\${d.y},\${d.x})\`);`},
      ],
      demo: {id:"treelist", title:"可折叠树形列表", task:"点击三角展开/收起，点击节点名称选中；用滑块调节动画时长。",
        observe:"整棵树只在外层监听一次点击；折叠后状态类与动画随之变化。"},
      pitfalls: [
        "在折叠按钮上不阻止冒泡，导致一点折叠也同时触发了节点选中。",
        "给每个叶子都单独绑定事件，节点增多后性能差且新增节点漏绑。",
        "在事件回调中误用箭头函数取 this（D3 中 this 指向当前元素，应用 function 或用 event.currentTarget）。",
      ],
      quiz: [
        {q:"使用事件委托时，给 200 个树节点添加点击响应，需要绑定多少个监听器？",
         opts:["200 个","在父节点上绑定 1 个","每个节点 2 个","无法实现"],
         ans:1, explain:"事件委托利用冒泡，在父节点绑一次即可处理所有子节点点击，且对动态新增节点也有效。",
         mistake:"逐节点绑定既冗余又会让后续新增节点漏绑。"},
      ],
      keywords: ["事件委托","event delegation","classed","冒泡","capture","transition","递归","可折叠","stopPropagation"],
    },
  ],
});

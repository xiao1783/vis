# 第三方资源与版权声明

本网站在重构过程中使用了以下第三方开源库与教学数据。课程内容与原始演示的思路源自原课程网站，
在此一并致谢并说明来源。

## 1. D3.js（数据驱动文档）

- 文件：`assets/vendor/d3.min.js`
- 版本：D3 **v7.9.0**（UMD 整合包，已本地化，不依赖任何在线 CDN）
- 主页：<https://d3js.org/>
- 源码：<https://github.com/d3/d3>
- 许可证：**ISC License**

D3 整合包由多个 d3 子模块（d3-selection、d3-scale、d3-shape、d3-array、d3-array、d3-axis、
d3-dsv、d3-color、d3-contour、d3-geo、d3-time、d3-time-format、d3-hierarchy、d3-interpolate 等）
组成，各模块均由 Mike Bostock 及 D3 贡献者以 ISC 许可证发布。

ISC 许可证全文：

> Permission to use, copy, modify, and/or distribute this software for any purpose
> with or without fee is hereby granted, provided that the above copyright notice
> and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
> REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
> FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
> INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
> OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
> TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
> THIS SOFTWARE.

Copyright 2010–2023 Mike Bostock. All rights reserved.

## 2. 教学数据（均沿用原课程仓库，仅作教学演示）

以下数据文件来自原课程网站 <https://cinger007.github.io/vis/> 的代码仓库，本站在其基础上沿用：

| 文件 | 说明 |
| --- | --- |
| `data/newstudent.csv` | **合成**的新生信息，由原课程为教学生成，不代表真实人口统计；本站在页面中持续标注“AI 合成”。 |
| `data/crime.csv` | 美国各州犯罪/人口指标宽表（原课程第三章、第四章教学数据），仅用于多指标可视化演示。 |
| `data/weather_2024.csv` | 2024 年逐日最高气温与降水量（原课程第五章教学数据），用于折线/日历/周期对照。 |
| `data/french_names.json` | 法国 1900–2020 年新生儿名字登记数量（原课程第五章教学数据），用于折线图。 |

上述数据仅用于课堂教学与可视化概念演示，不用于任何商业或真实统计分析。

## 3. 课程内容来源

- 原课程网站：《可视化导论》—— <https://cinger007.github.io/vis/>
- 本站保留原课程的五章 27 小节知识范围与有效演示思路，重新组织了学习界面、内容表述、
  交互实验与自测/进度等学习功能；所有重写后的页面、样式与实验脚本为本作业成果。

## 4. Prism 语法高亮

- 文件：`assets/vendor/prism.js`
- 版本：**1.30.0**，本地加载，用于课程与实验代码的语法高亮。
- 源码：<https://github.com/PrismJS/prism>
- 许可证：**MIT License**，完整版权与许可见 `assets/vendor/prism-LICENSE`。

## 5. 其他说明

- 本网站不包含视频或音频。界面使用 `assets/images/logo.png` 作为 VisLab 网站标识，
  首页场景素材位于 `assets/images/hero/`；课程图表、流程图和交互图形使用 SVG/D3 在浏览器中绘制。
- 未使用任何在线字体、图标库或需要密钥的第三方服务。

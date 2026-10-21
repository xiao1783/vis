const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const d3 = require("../assets/vendor/d3.min.js");
const source = fs.readFileSync(path.join(__dirname, "../assets/js/experiments/demos-ch5.js"), "utf8");
const tickExpression = source.match(/const yearTicks = ([^;]+);/)[1];

for (const from of [1900, 1980, 2019]) {
  for (const iw of [207, 786]) {
    test("unique integer year labels from " + from + " at plot width " + iw, () => {
      const count = vm.runInNewContext(tickExpression, {from, iw});
      const labels = d3.ticks(from, 2020, count).map(d3.format("d"));
      assert.equal(new Set(labels).size, labels.length);
      assert.ok(labels.length >= 2);
      assert.ok(labels.every(label => +label >= from && +label <= 2020));
      if (from === 2019) assert.deepEqual(labels, ["2019", "2020"]);
    });
  }
}

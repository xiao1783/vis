const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname, "../assets/js/experiments/demos-ch4.js"), "utf8");
const table = vm.runInNewContext(source.match(/const EDGE_TABLE = (\[[\s\S]*?\]);/)[1]);

test("all 16 marching-squares cases connect exactly the edges that cross the threshold", () => {
  // Bits: TL=8, TR=4, BR=2, BL=1. Edges: left, bottom, right, top.
  const corners = [[8,1],[1,2],[4,2],[8,4]];
  for (let code = 0; code < 16; code++) {
    const expected = corners.flatMap(([a,b], edge) => Boolean(code & a) !== Boolean(code & b) ? [edge] : []);
    const actual = Array.from(table[code].flat()).sort();
    assert.deepEqual(actual, expected, "incorrect crossing edges for case " + code);
    for (const [a,b] of table[code]) assert.notEqual(a,b);
    assert.equal(table[code].length, code === 5 || code === 10 ? 2 : code === 0 || code === 15 ? 0 : 1);
  }
});

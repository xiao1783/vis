const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = name => fs.readFileSync(path.join(__dirname, "../assets/js/", name), "utf8");

const dragBody = read("experiments/scale-curve.js").match(/\.on\("drag", \(event, d\) => \{([\s\S]*?)\n          \}\)\)/)[1];
for (const touch of [false, true]) {
  test((touch ? "touch" : "mouse") + " dragging uses pointer coordinates from the current SVG", () => {
    const pointer = {clientX: 20, clientY: 50};
    const svg = {}, point = {x: 0, y: 30}, index = {};
    const events = [], editor = {dispatchEvent(event) {events.push(event.type);}};
    let draws = 0;
    const context = {
      Event, event: {sourceEvent: touch ? {changedTouches: [pointer]} : pointer}, d: point,
      d3: {pointer(event, target) { assert.equal(event, pointer); assert.equal(target, svg); return [event.clientX,event.clientY]; }},
      wrap: {querySelector: () => svg}, M: {t: 14}, y: {invert: value => value},
      host: {querySelector: () => index}, pts: [point], editor, draw() { draws++; }
    };
    vm.runInNewContext(dragBody, context);
    assert.equal(point.y, 36);
    assert.equal(editor.value, 36);
    assert.equal(index.value, 0);
    assert.equal(draws, 1);
    assert.deepEqual(events, ["change"]);
  });
}

const backdropBody = read("lab-workbench.js").match(/dialog.addEventListener\("click", event => \{([\s\S]*?)\n      \}\);/)[1];
for (const [name, x, y, expected] of [["inside padding", 103, 150, 0], ["outside backdrop", 50, 150, 1]]) {
  test("dialog click on " + name, () => {
    let closes = 0;
    const dialog = {getBoundingClientRect: () => ({left:100,right:600,top:20,bottom:700}), close() { closes++; }};
    const context = {dialog, event:{target:dialog,clientX:x,clientY:y}};
    vm.runInNewContext("(() => {" + backdropBody + "})()", context);
    assert.equal(closes, expected);
  });
}

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../assets/js/common.js"), "utf8");
const copySource = source.slice(source.indexOf("  async function copyText"), source.indexOf("  /* 数据加载"));

function setup({writeText, fallback = false, modal = null} = {}) {
  const messages = [], timers = new Map();
  let appendedTo, timerId = 0, focusRestored = false;
  const env = {
    L: zh => zh,
    navigator: {clipboard: writeText ? {writeText} : undefined},
    document: {
      body: {appendChild() { appendedTo = "body"; }},
      activeElement: {focus() { focusRestored = true; }},
      querySelector: () => modal,
      createElement: () => ({style: {}, select() {}, remove() {}}),
      execCommand: () => fallback
    },
    toast: (...args) => messages.push(args),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id)
  };
  vm.createContext(env);
  vm.runInContext(copySource + ";this.copy = copyText;", env);
  return {copy: env.copy, messages, timers, get appendedTo() {return appendedTo;}, get focusRestored() {return focusRestored;}};
}

test("failed clipboard and failed fallback never report success", async () => {
  const context = setup({writeText: async () => { throw Error("denied"); }});
  const button = {innerHTML: "复制代码", textContent: "复制代码"};
  await context.copy("example", button);
  assert.equal(context.messages.at(-1)[1], "warn");
  assert.equal(button.textContent, "复制代码");
  assert.equal(context.timers.size, 0);
});

test("fallback copies inside the open modal and restores focus", async () => {
  let appended = false;
  const modal = {appendChild() { appended = true; }};
  const context = setup({fallback: true, modal});
  await context.copy("#526bd6", null, "色值已复制");
  assert.equal(appended, true);
  assert.equal(context.focusRestored, true);
  assert.deepEqual(Array.from(context.messages.at(-1)), ["色值已复制", "ok"]);
});

test("rapid repeated copies restore the original button label exactly once", async () => {
  const context = setup({writeText: async () => {}});
  const button = {innerHTML: "<span>复制代码</span>", textContent: "复制代码"};
  await context.copy("first", button);
  button.innerHTML = "已复制 ✓";
  await context.copy("second", button);
  assert.equal(context.timers.size, 1);
  [...context.timers.values()][0]();
  assert.equal(button.innerHTML, "<span>复制代码</span>");
});

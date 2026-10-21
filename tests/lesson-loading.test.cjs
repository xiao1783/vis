const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'lesson.html'), 'utf8');
const scripts = [...html.matchAll(/<script defer src="([^"?]+)[^"]*"/g)].map(m => m[1]);
const lessonSource = fs.readFileSync(path.join(root, 'assets/js/lesson.js'), 'utf8');
const init = lessonSource.slice(0, lessonSource.indexOf('  Shell.init("ch"')) + '\n})();';

for (const lang of ['zh', 'en']) {
  for (const lesson of [1, 5]) {
    test(`lesson 1.${lesson} initializes in ${lang} using declared dependencies`, () => {
      const context = vm.createContext({
        URLSearchParams,
        location: {search: `?c=1&l=${lesson}`},
        localStorage: {getItem: () => lang},
        document: {readyState: 'loading', addEventListener() {}, getElementById: () => ({}),
          documentElement: {style: {setProperty() {}}}}
      });
      context.window = context;
      for (const script of scripts) {
        if (script === 'assets/js/shell.js') break;
        if (/assets\/js\/(course-|common\.js|i18n\.js)/.test(script)) {
          vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context);
        }
      }
      assert.doesNotThrow(() => vm.runInContext(init, context));
      assert.match(context.document.title, new RegExp(`^1\\.${lesson} `));
      const found = context.Common.findLesson(1, lesson);
      assert.ok(context.I18N.lessonObj(found.ls).blocks.length > 0);
    });
  }
}

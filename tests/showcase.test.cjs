const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const d3 = require('../assets/vendor/d3.min.js');
const timeSource = fs.readFileSync('assets/js/experiments/time-views.js','utf8');
const storySource = fs.readFileSync('assets/js/experiments/demos-ch5.js','utf8');
const calendarSlot = vm.runInNewContext('('+timeSource.match(/function calendarSlot\(date\) \{[\s\S]*?\n  \}/)[0]+')',{d3,Date});
const advanceTime = vm.runInNewContext('('+storySource.match(/function advanceTime\(time, elapsedMs, speed\) \{[\s\S]*?\n  \}/)[0]+')',{DATA:{duration:127}});
test('calendar covers every leap-year day once within two half-year grids',()=>{
  const dates=d3.timeDay.range(new Date(2024,0,1),new Date(2025,0,1));
  const slots=dates.map(calendarSlot);
  assert.equal(dates.length,366);
  assert.equal(new Set(slots.map(s=>[s.half,s.week,s.day].join(':'))).size,366);
  assert.ok(slots.every(s=>s.half>=0&&s.half<=1&&s.week>=0&&s.week<27&&s.day>=0&&s.day<7));
  assert.equal(calendarSlot(new Date(2024,1,29)).day,4);
  assert.equal(calendarSlot(new Date(2024,5,30)).half,0);
  assert.equal(calendarSlot(new Date(2024,6,1)).half,1);
});
test('playback progress depends on elapsed time rather than refresh rate',()=>{
  const simulate=frames=>{let t=0;for(let i=0;i<frames;i++)t=advanceTime(t,1000/frames,1);return t;};
  assert.ok(Math.abs(simulate(30)-5)<1e-10);
  assert.ok(Math.abs(simulate(144)-simulate(30))<1e-10);
  assert.equal(advanceTime(20,1000,2),30);
  assert.equal(advanceTime(20,1000,4),40);
});
test('playback clamps at the end and ignores negative elapsed time',()=>{
  assert.equal(advanceTime(126,1000,4),127);
  assert.equal(advanceTime(78,-100,1),78);
  assert.equal(advanceTime(127,1000,1),127);
});

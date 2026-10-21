const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/experiments/data-join.js','utf8').replace(/\r\n/g,'\n');
const syncEditor = source.match(/function syncEditor\(\) \{([\s\S]*?)\n    \}\n    function choose/)[1];

for (const [id, disabled, value] of [['A',true,15],['B',false,36]]) {
  test('selection '+id+' edits only the selected current item',()=>{
    const controls = {'#j-edit-id':{},'#j-edit-value':{},'#j-edit-readout':{},'#j-selection':{}};
    vm.runInNewContext(syncEditor,{Common:{L:zh=>zh},selectedId:id,curr:[{id:'B',value:36}],container:{querySelector:selector=>controls[selector]}});
    assert.equal(controls['#j-edit-id'].value,id);
    assert.equal(controls['#j-edit-value'].disabled,disabled);
    assert.equal(controls['#j-edit-value'].value,value);
    assert.match(controls['#j-selection'].textContent,disabled?/已退出/:/已选 B/);
  });
}

test('empty data disables editing and gives an actionable explanation',()=>{
  const controls = {'#j-edit-id':{},'#j-edit-value':{},'#j-edit-readout':{},'#j-selection':{}};
  vm.runInNewContext(syncEditor,{Common:{L:zh=>zh},selectedId:null,curr:[],container:{querySelector:selector=>controls[selector]}});
  assert.equal(controls['#j-edit-value'].disabled,true);
  assert.match(controls['#j-selection'].textContent,/新增一项/);
});

test('paused playback offers resume and marks the actual current phase',()=>{
  const buttons={'#j-play':{},'#j-pause':{}};
  const steps=Array.from({length:5},(_,i)=>({dataset:{phase:String(i)},classes:{},attrs:{},classList:{toggle(name,value){steps[i].classes[name]=value;}},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];}}));
  const body=source.match(/function syncPlayback\(\) \{([\s\S]*?)\n    \}\n    function stop/)[1];
  vm.runInNewContext(body,{Common:{L:zh=>zh},phase:2,playTimer:null,container:{querySelector:selector=>buttons[selector],querySelectorAll:()=>steps}});
  assert.equal(buttons['#j-play'].textContent,'继续播放');
  assert.equal(buttons['#j-play'].disabled,false);
  assert.equal(buttons['#j-pause'].disabled,true);
  assert.equal(steps[2].attrs['aria-current'],'step');
  assert.equal(steps.filter(s=>s.classes['is-current']).length,1);
});

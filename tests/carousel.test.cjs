const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/home.js','utf8');
const code = source.slice(source.indexOf('  const carousel ='),source.indexOf('  /* 学习路线索引'));

function setup(reduce = false) {
  let now = 0, id = 0;
  const timers = new Map(), animations = [];
  function element() {
    const names = new Set(), attrs = {}, handlers = {};
    return {attrs,handlers,hidden:false,inert:false,dataset:{},style:{setProperty(){}},textContent:'',
      classList:{add:n=>names.add(n),contains:n=>names.has(n),toggle(n,on){if(on)names.add(n);else names.delete(n);}},
      setAttribute(n,v){attrs[n]=v;},removeAttribute(n){delete attrs[n];},getAttribute(n){return attrs[n];},
      addEventListener(n,fn){(handlers[n] ||= []).push(fn);},fire(n,event={}){for(const fn of handlers[n]||[])fn(event);},
      animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;},finished:Promise.resolve()};animations.push(animation);return animation;}
    };
  }
  const carousel = element(), slides = [element(),element(),element()], dots = [element(),element(),element()];
  const prev = element(), next = element(), play = element(), viewport = element(), rail = element();
  const count = element(), status = element(), body = element(), motion = element();
  motion.matches = reduce;
  const nodes={'.carousel-progress i':rail,'.hero-slides':viewport,'[data-carousel="play"]':play,'[data-carousel="prev"]':prev,'[data-carousel="next"]':next};
  carousel.querySelector=s=>nodes[s];carousel.querySelectorAll=s=>s==='.hero-slide'?slides:dots;
  carousel.contains=()=>false;
  slides.forEach((slide,i)=>{slide.hidden=i!==0;slide.attrs['aria-label']='scene '+i;});
  const document = {...element(),body,hidden:false,querySelector:()=>carousel,getElementById:id=>id==='hero-slide-count'?count:status};
  const store = element();
  const window = {...element(),matchMedia:()=>motion};
  let visibility;
  vm.runInNewContext(code,{window,document,Common:{L:zh=>zh},Store:{onChange:fn=>store.addEventListener('change',fn)},performance:{now:()=>now},
    setTimeout(fn,delay){timers.set(++id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},
    IntersectionObserver:class {constructor(fn){visibility=fn;}observe(){}}
  });
  return {carousel,slides,dots,prev,next,play,viewport,rail,count,status,motion,document,timers,animations,
    advance(ms){now+=ms;},visibility(on){visibility([{isIntersecting:on}]);},store};
}

test('rapid navigation settles on one visible interactive scene',async()=>{
  const ui=setup();ui.next.fire('click');ui.next.fire('click');ui.prev.fire('click');
  await new Promise(setImmediate);
  assert.equal(ui.count.textContent,'02 / 03');
  assert.equal(ui.slides.filter(s=>!s.hidden).length,1);
  assert.equal(ui.slides.filter(s=>!s.inert).length,1);
  assert.equal(ui.slides[1].attrs['aria-hidden'],'false');
  assert.equal(ui.play.attrs['aria-label'],'开始自动轮播');
  assert.equal(ui.timers.size,0);
});

test('hover preserves remaining autoplay time and explicit play resumes',()=>{
  const ui=setup();ui.advance(2000);ui.carousel.fire('mouseenter');
  assert.equal(ui.timers.size,0);
  ui.carousel.fire('mouseleave');
  assert.equal([...ui.timers.values()][0].delay,2000);
  ui.next.fire('click');ui.play.fire('click');
  assert.equal(ui.play.attrs['aria-label'],'暂停自动轮播');
  assert.equal([...ui.timers.values()][0].delay,4000);
});

test('hidden or offscreen carousels do not run an autoplay clock',()=>{
  const ui=setup();ui.visibility(false);assert.equal(ui.timers.size,0);
  ui.visibility(true);assert.equal(ui.timers.size,1);
  ui.document.hidden=true;ui.document.fire('visibilitychange');assert.equal(ui.timers.size,0);
});

test('reduced motion disables autoplay and scene transitions, including preference changes',()=>{
  const ui=setup(true);assert.equal(ui.timers.size,0);
  ui.next.fire('click');assert.equal(ui.animations.length,0);
  assert.equal(ui.slides.filter(s=>!s.hidden).length,1);
  const changing=setup();changing.next.fire('click');changing.motion.matches=true;changing.motion.fire('change');
  assert.equal(changing.timers.size,0);
  assert.equal(changing.slides.filter(s=>!s.hidden).length,1);
});

test('horizontal swipe navigates, vertical scroll and later taps remain available',()=>{
  const ui=setup();ui.viewport.fire('pointerdown',{pointerType:'touch',clientX:200,clientY:100});
  ui.viewport.fire('pointerup',{clientX:100,clientY:105});
  assert.equal(ui.count.textContent,'02 / 03');
  let prevented=0;const click={preventDefault(){prevented++;},stopPropagation(){}};
  ui.viewport.fire('click',click);assert.equal(prevented,1);
  ui.advance(500);ui.viewport.fire('click',click);assert.equal(prevented,1);
  ui.viewport.fire('pointerdown',{pointerType:'touch',clientX:200,clientY:100});
  ui.viewport.fire('pointerup',{clientX:180,clientY:200});
  assert.equal(ui.count.textContent,'02 / 03');
});

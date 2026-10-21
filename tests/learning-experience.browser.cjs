/* Start the local HTTP server, then run with Playwright available in NODE_PATH. */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.VIS_TEST_URL || 'http://127.0.0.1:8123';

(async () => {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  async function open(c,l) {
    await page.goto(`${base}/lesson.html?c=${c}&l=${l}&mode=lab`);
    await page.locator('.lab-learning').waitFor();
    await page.locator('.lab-focus-dialog').waitFor();
  }
  const undo = () => page.locator('[data-history=undo]').click();
  const redo = () => page.locator('[data-history=redo]').click();
  const state = id => page.evaluate(id => JSON.parse(localStorage.getItem('vll.lab.v1.' + id)), id);
  async function shot(name) {
    if (!process.env.VIS_TEST_OUTPUT) return;
    fs.mkdirSync(process.env.VIS_TEST_OUTPUT,{recursive:true});
    await page.screenshot({path:path.join(process.env.VIS_TEST_OUTPUT,name+'.png')});
  }
  try {
    await page.goto(base + '/'); await page.evaluate(() => localStorage.clear());
    await open(1,5);
    await page.locator('[data-act=replace]').click();
    assert.match(await page.locator('#j-counts').innerText(), /enter 1 · update 2 · exit 1/);
    await undo(); assert.equal(await page.locator('#j-curr [data-join-id=A]').count(),1);
    await redo(); assert.equal(await page.locator('#j-curr [data-join-id=D]').count(),1);
    await page.locator('#j-curr [data-join-id=D]').click();
    assert.equal(await page.locator('#j-edit-id').inputValue(),'D');
    assert.equal(await page.locator('#j-code [data-state=enter]').getAttribute('class'),'join-code-line join-code-active');
    for (const [step, count] of [[0,3],[1,3],[2,2],[3,3],[4,3]]) {
      await page.locator('#j-step').click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('circle.cid').count(),count, 'join phase '+step);
    }
    await page.locator('#j-play').click(); await page.locator('#j-pause').click();
    const paused = await page.locator('#j-phase').innerText();
    await page.waitForTimeout(1200); assert.equal(await page.locator('#j-phase').innerText(),paused);
    await page.locator('#j-curr [data-join-id=D]').focus(); await page.keyboard.press('Enter');
    await page.locator('.lab-learning-content > summary').click();
    await page.locator('.lab-context-quiz summary').click();
    await page.locator('[data-answers] button').first().click();
    assert.match(await page.locator('[data-result]').innerText(),/判断正确/);
    await page.locator('[data-tool=capture]').click();
    assert.equal(await page.locator('.lw-snapshot .lab-learning').count(),0);
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.equal(await page.locator('#j-curr [data-join-id=D]').count(),1);
    await shot('join-desktop');
    console.log('PASS Data Join matching, linked selection, phases, pause, undo/redo, quiz, snapshot, persistence');

    await open(1,4);
    for (let i=0;i<3;i++) await page.locator(`[data-step="${i}"]`).click();
    assert.equal((await state('data-transform')).stage,3);
    await undo(); assert.equal((await state('data-transform')).stage,2);
    await redo(); assert.equal((await state('data-transform')).stage,3);
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.match(await page.locator('#t-feedback').innerText(),/聚合/);
    console.log('PASS transformation restores computed data at the correct stage');

    await open(2,1); await page.locator('[data-dim=cls]').click();
    assert.equal((await state('pipeline')).dim,'cls');
    await undo(); assert.equal((await state('pipeline')).dim,'major');
    await redo(); assert.equal((await state('pipeline')).dim,'cls');
    console.log('PASS pipeline history');

    await open(3,2); await page.locator('[data-sc=div]').click();
    await page.locator('[data-pal=diverging]').click();
    await page.locator('#sem-practice').check(); await page.locator('#sem-check').click();
    assert.equal((await state('color-semantics')).firstAnswers.div,true);
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.match(await page.locator('#sem-verdict').innerText(),/合理选择/);
    console.log('PASS color scenario, practice state and result persistence');

    await open(4,2);
    const track = page.locator('#lin-track'); await track.scrollIntoViewIfNeeded();
    const box = await track.boundingBox();
    await page.mouse.move(box.x+box.width*.35,box.y+8); await page.mouse.down();
    await page.mouse.move(box.x+box.width*.5,box.y+8,{steps:8}); await page.mouse.up();
    const value = +(await page.locator('#sc-slider').inputValue());
    assert.ok(value >= 1950 && value <= 2050);
    await undo(); assert.equal(await page.locator('#sc-slider').inputValue(),'534');
    await redo(); assert.equal(+(await page.locator('#sc-slider').inputValue()),value);
    await page.locator('#log-track').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('#sc-slider').inputValue(),'1');
    await page.locator('[data-tab=curve]').click();
    const dot = page.locator('circle.pt').nth(2); await dot.scrollIntoViewIfNeeded();
    assert.equal(await dot.getAttribute('role'),'slider');
    const dotBox = await dot.boundingBox();
    await page.mouse.move(dotBox.x+dotBox.width/2,dotBox.y+dotBox.height/2); await page.mouse.down();
    await page.mouse.move(dotBox.x+dotBox.width/2,dotBox.y+dotBox.height/2+35,{steps:8}); await page.mouse.up();
    const moved = +(await page.locator('#cv-value').inputValue()); assert.ok(moved < 48);
    await undo(); assert.equal((await state('scale-curve')).pts[2].y,48);
    await redo(); assert.equal((await state('scale-curve')).pts[2].y,moved);
    await page.locator('circle.pt').nth(2).focus(); await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300); assert.equal(+(await page.locator('#cv-value').inputValue()),moved+1);
    await shot('curve-desktop');
    console.log('PASS direct scale/curve dragging, keyboard operation and gesture undo');

    await open(5,3);
    await page.locator('#tv-from').fill('2024-07-01'); await page.locator('#tv-to').fill('2024-07-31');
    await page.locator('#tv-range-summary').click();
    assert.match(await page.locator('#tv-range-summary').innerText(),/31 天/);
    assert.equal(await page.locator('.tv-cell:not(.outside-range)').count(),31);
    const expected = await page.evaluate(async () => {
      const rows = await d3.csv('data/weather_2024.csv',r=>({date:r.date,temp:+r.temp_max}));
      return d3.mean(rows.filter(r=>r.date>='2024-07-01' && r.date<='2024-07-31'),r=>r.temp).toFixed(1);
    });
    assert.match(await page.locator('#tv-range-summary').innerText(),new RegExp(expected.replace('.','\\.')));
    await undo(); assert.equal(await page.locator('.tv-cell:not(.outside-range)').count(),366);
    await redo(); assert.equal(await page.locator('.tv-cell:not(.outside-range)').count(),31);
    await page.locator('#tv-range-mode').check();
    const overlay = page.locator('.tv-brush .overlay'); await overlay.scrollIntoViewIfNeeded();
    const brushBox = await overlay.boundingBox();
    await page.mouse.move(brushBox.x+brushBox.width*.2,brushBox.y+30); await page.mouse.down();
    await page.mouse.move(brushBox.x+brushBox.width*.4,brushBox.y+30,{steps:10}); await page.mouse.up();
    assert.ok((await state('time-views')).range[0] < '2024-07-01');
    await page.locator('#tv-range-clear').click();
    assert.equal(await page.locator('.tv-cell:not(.outside-range)').count(),366);
    await page.locator('#tv-date').fill('2024-02-29'); await page.locator('#tv-range-summary').click();
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.equal(await page.locator('#tv-date').inputValue(),'2024-02-29');
    await shot('time-desktop');
    console.log('PASS temporal brushing, exact aggregation, linked calendar, clear, undo/redo and leap-day persistence');

    await page.setViewportSize({width:390,height:844});
    for (const [c,l,name] of [[1,5,'join'],[4,2,'scale'],[5,3,'time']]) {
      await open(c,l); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow: '+name);
      const panelBox = await page.locator('.lab-learning').boundingBox();
      assert.ok(panelBox.x>=0 && panelBox.x+panelBox.width<=390,'panel overflow: '+name);
      await page.locator('.lab-learning-content > summary').click();
      await page.locator('[data-guide-next]').click();
      assert.match(await page.locator('.lab-guide-step').innerText(),/^2\/3/);
      await page.locator('.lab-learning-content > summary').click();
      await shot(name+'-mobile');
    }
    // Touch input uses the browser's real touch event pipeline, including D3 drag/brush.
    const touchContext = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror',error=>errors.push(error.message));
    const cdp = await touchContext.newCDPSession(touchPage);
    async function swipe(x,y,toX,toY) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(toX-x)*i/8,y:y+(toY-y)*i/8}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await touchPage.goto(`${base}/lesson.html?c=4&l=3&mode=lab`);
    await touchPage.locator('.lab-learning').waitFor();
    const point = touchPage.locator('circle.pt').nth(2); await point.scrollIntoViewIfNeeded();
    const pb = await point.boundingBox();
    await swipe(pb.x+pb.width/2,pb.y+pb.height/2,pb.x+pb.width/2,pb.y+pb.height/2+35);
    assert.ok(+(await touchPage.locator('#cv-value').inputValue())<48);
    await touchPage.locator('[data-history=undo]').tap();
    assert.equal(await touchPage.locator('#cv-value').inputValue(),'30');
    await touchPage.goto(`${base}/lesson.html?c=5&l=3&mode=lab`);
    await touchPage.locator('.lab-learning').waitFor();
    await touchPage.locator('#tv-range-mode').check();
    const touchBrush=touchPage.locator('.tv-brush .overlay'); await touchBrush.scrollIntoViewIfNeeded();
    const tb=await touchBrush.boundingBox();
    await swipe(tb.x+tb.width*.15,tb.y+30,tb.x+tb.width*.65,tb.y+30);
    assert.ok(await touchPage.locator('.tv-cell.outside-range').count()>0);
    assert.ok(await touchPage.locator('.tv-cell:not(.outside-range)').count()>0);
    await touchContext.close();
    console.log('PASS touch curve drag and temporal range brush');

    await open(1,5);
    await page.locator('[data-tool=reset]').click();
    assert.equal(await page.locator('#j-curr [data-join-id=A]').count(),1);
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.equal(await page.locator('#j-curr [data-join-id=A]').count(),1);
    await page.evaluate(()=>localStorage.setItem('vll.lab.v1.data-join',JSON.stringify({curr:[{id:'<bad>',value:-1}],prev:null})));
    await page.reload(); await page.locator('.lab-learning').waitFor();
    assert.equal(await page.locator('#j-curr [data-join-id=A]').count(),1);
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
    await page.locator('[data-act=replace]').click();
    assert.match(await page.locator('.lab-history-status').innerText(),/无法保存/);
    await undo(); assert.equal(await page.locator('#j-curr [data-join-id=A]').count(),1);
    console.log('PASS reset persistence, invalid saved state and failed storage recovery');
    assert.deepEqual(errors,[]);
    console.log('PASS 390px layouts, guidance and no browser errors');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

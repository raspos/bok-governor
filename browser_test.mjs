import {newsCases} from './news-fixtures.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {opinions} from './dist/game.mjs';
import {getCommittee,backgrounds,persuasionCase} from './dist/committee.mjs';
import {simulate} from './balance.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.BOK_PLAYWRIGHT??'../.venv-land/Lib/site-packages/playwright/driver/package');
const chrome=process.env.BOK_CHROME??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir=new URL('./artifacts/'+(process.env.BOK_CAPTURE??'phase25')+'/',import.meta.url);
await mkdir(dir,{recursive:true});
const types={html:'text/html; charset=utf-8',mjs:'text/javascript',css:'text/css',jpg:'image/jpeg',png:'image/png',woff2:'font/woff2'};
const http=createServer(async(req,res)=>{
 const path=req.url==='/'?'index.html':req.url.slice(1);
 if(!/^[a-z0-9.-]+$/i.test(path)){res.writeHead(404).end();return;}
 try{const data=await readFile(new URL('./dist/'+path,import.meta.url));res.writeHead(200,{'Content-Type':types[path.split('.').at(-1)]}).end(data);}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+http.address().port;
assert.ok((await fetch(url)).ok);
console.log('HTTP ready',url);
let browser;
try{
 browser=await chromium.launch({executablePath:chrome,timeout:15000});
 console.log('Chrome ready',browser.version());
 const widths=(process.env.BOK_WIDTHS??'320,390,768,1440').split(',').map(Number);
 const audit=[];
 for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
 const page=await context.newPage();
 page.setDefaultTimeout(20000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({seed})=>{if(!localStorage.getItem('bok-governor-v2')){
 const random=crypto.getRandomValues.bind(crypto);
 crypto.getRandomValues=arr=>{if(arr instanceof Uint32Array&&arr.length===1){arr[0]=seed;return arr;}return random(arr);};
 }},{seed:Number(process.env.BOK_SEED??12345)});
 const pageUrl=(process.env.BOK_FILE?new URL('./play.html',import.meta.url).href:url)+(process.env.BOK_TYPE?'#type='+process.env.BOK_TYPE:'');
 assert.ok((await page.goto(pageUrl)).ok());
 assert.equal(await page.evaluate(()=>location.protocol),process.env.BOK_FILE?'file:':'http:');
 assert.equal(await page.locator('style').count(),process.env.BOK_FILE?1:0);
 assert.equal(await page.locator('script[src="./ui.mjs"]').count(),process.env.BOK_FILE?0:1);
 const missing=[];
 page.on('requestfailed',req=>missing.push(req.url()));
 page.on('response',res=>{if(res.status()>=400)missing.push(res.url());});
 const fonts={};
 const shot=async(name)=>{
 if(process.env.BOK_TYPE){
 await page.evaluate(()=>document.fonts.ready);
 const cdp=await context.newCDPSession(page);
 await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');
 const selector={title:'.title-korean',press:'.press-question>p',persuasion:'.character-scene blockquote',decision:'main h1',watch:'.watch-hero strong',newspaper:'.front-page h1'}[name];
 if(selector){
 const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
 if(nodeId)fonts[name]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
 }
 await cdp.detach();
 }
 assert.equal(await page.locator('main h1').count(),1,name);
 const layout=await page.evaluate(()=>({view:innerWidth,scroll:document.documentElement.scrollWidth,unloaded:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
 assert.ok(layout.scroll<=layout.view,JSON.stringify({name,width,...layout}));
 assert.equal(layout.unloaded,0,name);
 await page.screenshot({path:fileURLToPath(new URL(width+'-'+name+'.png',dir)),fullPage:true});
 };
 const act=async(selector)=>{let el=page.locator(selector).first();
 if(selector.includes('data-action="step-')&&!await el.isVisible()){
 if(!await page.locator('.council-agenda[open]').count())await page.locator('.council-agenda summary').click();
 el=page.locator('.council-agenda '+selector).first();
 }
 if(width<600&&!selector.includes('form button'))await el.tap();else await el.click();};
 assert.equal(await page.locator('header.mast, nav').count(),0);
 await shot('title');
 await act('.title-actions [data-view="model"]');
 assert.equal(await page.locator('.play-guide li').count(),5);
 await page.getByRole('dialog',{name:'게임 방법'}).screenshot({path:fileURLToPath(new URL(width+'-guide.png',dir))});
 await act('.game-document .overlay-toolbar button');
 await act('[data-action="new-term"]');
 if(await page.locator('[data-action^="background-"]').count()){
 await shot('background');
 await act('[data-action="background-'+(process.env.BOK_BACKGROUND??({320:'scholar',390:'official',768:'politician',1440:'scholar'})[width]??'scholar')+'"]');
 }
 assert.equal(await page.locator('#inaugural-form input').count(),3);
 await shot('inaugural');
 await page.locator('#inaugural-form input[value="conditional"]').check();
 await act('#inaugural-form button');
 await page.reload();
 assert.match(await page.locator('.inaugural .press-question .eyebrow').innerText(),/2 \/ 3/);
 await page.locator('#inaugural-form input[value="'+(width===390?'markets':width===768?'activity':'prices')+'"]').check();
 await act('#inaugural-form button');
 await page.locator('#inaugural-form input[value="activity"]').check();
 await act('#inaugural-form button');
 assert.ok(await page.locator('.hud-more').isVisible());
 assert.match(await page.locator('.hud-more').innerText(),/GDP 성장률 전망/);
 await shot('office');
 if(width===1440){await page.keyboard.press('Escape');assert.ok(await page.locator('.pause-menu').isVisible());await act('.pause-menu [data-action="save"]');assert.match(await page.locator('.pause-status').innerText(),/저장했습니다/);await page.keyboard.press('Escape');await page.locator('.pause-menu').waitFor({state:'detached'});}
 await act('[data-action="scorecard"]');
 assert.match(await page.locator('.scorecard').innerText(),/GDP 성장률 전망은 산출하지/);
 await act('[data-score-tab="2"]');
 assert.equal(await page.locator('.score-trend svg').count(),7);
 if(width===390||width===1440)await page.locator('.scorecard').screenshot({path:fileURLToPath(new URL(width+'-scorecard.png',dir))});
 await act('.scorecard form button');
 await act('[data-action="office-report"]');
 assert.ok(await page.locator('dialog.office-document').isVisible());
 await act('dialog [data-metric="rate"]');
 await act('dialog dialog form button');
 await act('dialog.office-document form button');
 await act('[data-action="office-phone"]');
 assert.match(await page.locator('dialog.office-document').innerText(),/정부 연락 기록/);
 await act('dialog.office-document form button');
 let crisisCount=0;
 let governmentCount=0;
 for(let turn=0;turn<8;turn++){
 await act('[data-action="meeting"]');
 if(await page.locator('#crisis-form').isVisible()){
 if(!crisisCount)await shot('crisis');
 crisisCount++;
 await page.locator('#crisis-form input[value="liquidity"]').check();
 await act('#crisis-form button');
 }
 if(await page.locator('#government-form').isVisible()){
 if(!governmentCount)await shot('government');
 governmentCount++;
 const coordinate=page.locator('#government-form input[value="coordinate"]');
 if(await coordinate.count())await coordinate.check();
 await act('#government-form button');
 }
 if(turn===0&&width===1440){
 const keyStep=page.locator('.stage-actions [data-action="step-1"]').first();await keyStep.focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.council-agenda li[aria-current]').textContent(),'2. 수치 목표');
 }else if(turn===0)await act('[data-action="step-1"]');
 else assert.equal(await page.locator('.council-agenda li[aria-current]').textContent(),'2. 수치 목표');
 assert.equal(await page.locator('#goal-form input:checked').count(),0);
 if(turn===0){
 await act('[data-action="step-5"]');
 assert.equal(await page.locator('#decision button[type="submit"]').count(),0);
 await act('[data-action="step-1"]');
 }
 await page.locator('#goal-form input[value="'+['inflation','growth','debt','stress'][turn%4]+'"]').check();
 await act('#goal-form button');
 if(turn===0){
 await page.reload();
 assert.ok(await page.locator('.goal-table').isVisible());
 assert.match(await page.locator('.goal-number').last().innerText(),/2.60%/);
 await shot('target');
 }
 if(turn===0){
 await act('[data-action="pause"]');
 await act('.pause-menu [data-view="model"]');
 assert.ok(await page.locator('.play-guide').isVisible());
 await act('.game-document .overlay-toolbar button');
 await act('.pause-menu [data-view="watch"]');
 const probabilities=await page.locator('.watch-probabilities strong').allTextContents();
 assert.equal(probabilities.map(v=>parseInt(v,10)).reduce((a,b)=>a+b,0),100);
 await shot('watch');
 await act('.game-document .overlay-toolbar button');
 await act('.pause-menu form button');
 }
 await page.locator('[name="proposal"][value="'+(turn<2?.25:-.25)+'"]').check();
 if(turn===1){
 await page.getByRole('button',{name:'최종 의결로',exact:true}).click();
 assert.ok(await page.getByRole('button',{name:'금리안 제출 및 표결'}).isVisible());
 await page.reload();
 assert.ok(await page.getByRole('button',{name:'금리안 제출 및 표결'}).isVisible());
 }
 await act('[data-action="step-4"]');
 if(turn===0){
 assert.equal(await page.locator('.council-person').count(),6);
 assert.equal(await page.locator('.council-chair').count(),1);
 for(const selector of ['.council-room','.council-person .cast-portrait']){
 const loaded=await page.locator(selector).first().evaluate(el=>new Promise(resolve=>{
 const background=getComputedStyle(el).backgroundImage;
 const url=background.slice(5,-2);
 const img=new Image();
 img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve({background:background.slice(0,80),size:background.length,position:getComputedStyle(el).backgroundPosition});img.src=url;
 }));
 assert.equal(loaded,true,JSON.stringify({selector,loaded}));
 }
 await shot('committee');
 }
 await page.locator('[name="focus"][value="'+(turn%2?'activity':'prices')+'"]').check();
 if((turn===0||turn===3)&&await page.locator('#ability-form').isVisible()){
 await act('#ability-form button');
 assert.ok(await page.locator('.ability h2').isVisible());
 if(turn===0)await shot('ability');
 }
 if(await page.locator('[data-action^="member-"]').count()){
 const savedMeeting=await page.evaluate(()=>JSON.parse(localStorage.getItem('bok-governor-v2')));
 const move=turn<2?.25:-.25, focus=turn%2?'activity':'prices';
 const opinionsNow=opinions(savedMeeting.state,focus,move,'하락',savedMeeting.market,savedMeeting);
 const method=backgrounds[savedMeeting.background].bonus;
 const candidates=opinionsNow.filter(o=>o.vote!==move).map(o=>{
 const member=getCommittee(savedMeeting).find(m=>m.id===o.id);
 return persuasionCase(savedMeeting,member,o.vote,move,method,'crosscheck');
 }).sort((a,b)=>Number(b.changed)-Number(a.changed)||b.fit-a.fit);
 if(candidates.length){
 await act('[data-action="member-'+candidates[0].id+'"]');
 await act('#persuasion-form button');
 if(turn===0){
 await shot('persuasion');
 await act('[data-action="scorecard"]');
 await act('[data-score-tab="1"]');
 assert.match(await page.locator('.scorecard').innerText(),/평가 대기/);
 await act('.scorecard form button');
 assert.ok(await page.locator('#persuasion-form [name="follow"]').first().isVisible());
 }
 await act('#persuasion-form button');
 }
 }
 await act('[data-action="step-5"]');
 await act('#decision button[type="submit"]');
 if(await page.locator('#review-form').isVisible())await act('#review-form button');
 assert.equal(await page.locator('.ballot-roll li').count(),7);
 if(turn===0)await page.locator('.ballot-scene').screenshot({path:fileURLToPath(new URL(width+'-ballot.png',dir)),animations:'disabled'});
 await act('.ballot-scene form button');
 if(await page.locator('#dot-form').isVisible()){
 if(turn===1)await page.reload();
 const selectors=page.locator('#dot-form select');
 const current=Number(await selectors.first().inputValue());
 await selectors.nth(0).selectOption(String(Math.max(0,current-.25)));
 await selectors.nth(2).selectOption(String(current+.25));
 await act('#dot-form button');
 const chart=page.locator('.dot-charts section').first();
 assert.equal(await chart.locator('.dot-track i').count(),21);
 assert.ok(await chart.locator('.dot-row').evaluateAll(rows=>rows.every(row=>{
 const dots=[...row.querySelectorAll('i')].map(el=>el.getBoundingClientRect());
 return dots.every((d,i)=>d.width>=4&&(!i||dots[i-1].right<=d.left));
 })));
 if(turn===1)await shot('dots');
 if(turn===7)assert.match(await chart.innerText(),/2028-05/);
 }
 if(turn===0){
 await shot('press');
 if(width===1440)await page.keyboard.press('Alt+e');else await act('[data-action="scorecard"]');
 assert.ok(await page.locator('.scorecard').isVisible());
 await act('.scorecard form button');
 assert.ok(await page.locator('#qa-form').isVisible());
 }
 let answered=0;
 while(await page.locator('#qa-form').isVisible()){
 if(answered===0)await page.locator('#qa-form input[value="guide"]').check();
 if(turn===0&&answered===1){
 await page.reload();
 assert.match(await page.locator('.press-question').innerText(),/추가 질문/);
 await shot('followup');
 }
 await act('#qa-form button');
 answered++;
 assert.ok(answered<=3);
 }
 assert.equal(answered,3);
 await act('#press-form button');
 if(width<600)assert.ok(await page.locator('[data-action="next"]').isVisible());
 if(turn===0)await shot('decision');
 if(turn===3)await page.reload();
 if(turn===3){
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bok-governor-v2')).records.at(-1).change);
 assert.notEqual(Number(await page.locator('#alternative').inputValue()),saved);
 }
 const ballots=page.locator('section').filter({has:page.getByRole('heading',{name:'표결 기록',exact:true})});
 assert.equal(await ballots.locator('tbody tr').count(),7);
 assert.ok(await page.getByRole('heading',{name:/정책 목표 · (달성|미달)/}).isVisible());
 if(turn===7)await shot('november');
 await act('[data-action="next"]');
 assert.ok(await page.locator('.front-page .joongang-logo[aria-label="중앙일보"]').isVisible());
 const pageTitle=await page.locator('.front-page h1').innerText();
 if(turn===0){
 await page.reload();
 assert.equal(await page.locator('.front-page h1').innerText(),pageTitle);
 assert.ok(await page.locator('.front-story p').first().isVisible());
 await shot('newspaper');
 }
 assert.ok(await page.locator('.front-page').evaluate(el=>el.scrollWidth<=el.clientWidth+2));
 await act('.front-page [data-action="next"]');
 }
 assert.match(await page.locator('.newspaper header').innerText(),/2029년 게임 속 가상 기사/);
 assert.ok(await page.locator('.newspaper .joongang-logo').isVisible());
 assert.equal(await page.locator('.newspaper-archive details').count(),8);
 await shot('ending');
 assert.ok(await page.getByRole('heading',{name:'2029년 역사적 재평가'}).isVisible());
 assert.ok(await page.getByRole('heading',{name:'시장은 무엇을 예상했나'}).isVisible());
 assert.ok(await page.getByRole('heading',{name:'11월 결정이 남긴 차이'}).isVisible());
 assert.ok(await page.getByRole('heading',{name:'임기 중 목표와 시행 결과'}).isVisible());
 assert.ok(await page.getByRole('heading',{name:'임기 중 공개 발언'}).isVisible());
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('bok-governor-v2')));
 assert.equal(save.records.length,8);
 assert.equal(save.inaugural.answers.length,3);
 assert.ok(save.records.every(r=>r.article?.body.length>=5));
 assert.ok(save.records.every(r=>r.goal&&r.goalResult&&typeof r.goalResult.met==='boolean'));
 assert.ok(save.records.every(r=>r.conference?.answers.length>=3&&r.pressSummary?.headline));
 assert.equal(save.records.filter(r=>r.ability).length,2);
 assert.ok(save.records.every(r=>r.watchResult&&r.watch.probabilities.raise+r.watch.probabilities.hold+r.watch.probabilities.cut===100));
 assert.deepEqual(errors,[]);
 assert.deepEqual(missing,[]);
 await act('[data-action="pause"]');
 await act('.pause-menu [data-view="watch"]');
 assert.equal(await page.locator('.watch-record').count(),8);
 await act('.watch-record summary');
 assert.ok(await page.locator('.watch-record[open]').first().getByRole('heading',{name:'예상과 의결의 차이'}).isVisible());
 await act('.game-document .overlay-toolbar button');
 await act('.pause-menu form button');
 audit.push({width,crisisCount,governmentCount,background:save.background,ratePath:save.records.map(r=>r.rate),events:save.records.map(r=>r.incidents?.map(e=>e.id)),changed:save.records.flatMap(r=>r.persuasion??[]).filter(p=>p.changed).length,abilities:save.records.flatMap(r=>r.ability?[r.ability.choice]:[]),decisive:save.records.filter(r=>r.persuasionDecisive).length,trust:save.market.trust,approval:save.politics?.approval,ending:await page.locator('.newspaper h2').count()?await page.locator('.newspaper h2').innerText():await page.locator('main h1').innerText()});
 console.log('PASS',width,crisisCount,save.records.map(r=>r.rate).join(','));
 if(width===1440){
 const samples=Array.from({length:12},(_,i)=>simulate(Math.imul(i+1,2654435761)>>>0,'scholar','prices'));
 const actual=samples.find(g=>g.records.some(r=>r.persuasionDecisive&&r.influence.some(p=>p.withoutRate!==r.rate)));
 const index=actual.records.findIndex(r=>r.persuasionDecisive&&r.influence.some(p=>p.withoutRate!==r.rate));
 const records=actual.records.slice(0,index+1), decision=records.at(-1);
 const checkpoint={...actual,phase:'result',turn:index,records,state:actual.path[decision.endMonth],path:actual.path.slice(0,decision.endMonth+1),market:decision.market};
 await page.evaluate(value=>localStorage.setItem('bok-governor-v2',JSON.stringify(value)),checkpoint);
 await page.reload();
 assert.match(await page.locator('.verdict-turn').filter({hasText:'표결의 전환점'}).innerText(),/그 설득만 제외하면/);
 await shot('pivot');
 }
 await page.evaluate(value=>localStorage.setItem('bok-governor-v2',JSON.stringify(value)),save);
 await page.reload();
 await act('[data-action="reset"]');
 assert.ok(await page.locator('[data-action="resume-term"]').isVisible());
 await act('[data-action="resume-term"]');
 assert.ok(await page.locator('.newspaper').isVisible());
 await act('[data-action="reset"]');
 await act('[data-action="new-term"]');
 assert.equal(await page.locator('[data-action^="background-"]').count(),3);
 if(width===1440){
 const editions={};
 for(const [name,fixture] of Object.entries(newsCases())){
 await page.evaluate(value=>localStorage.setItem('bok-governor-v2',JSON.stringify(value)),fixture);
 await page.reload();
 assert.ok(await page.locator('.front-story p').first().isVisible());
 await shot('edition-'+name);
 editions[name]={seed:fixture.seed,background:fixture.background,...fixture.records.at(-1).article};
 }
 assert.equal(Object.keys(editions).length,3);
 await writeFile(new URL('editions.json',dir),JSON.stringify(editions,null,2));
 }
 if(process.env.BOK_TYPE)await writeFile(new URL(width+'-fonts.json',dir),JSON.stringify(fonts,null,2));
 await context.close();
 }
 await writeFile(new URL('audit.json',dir),JSON.stringify(audit,null,2));
}finally{await browser?.close();await new Promise(resolve=>http.close(resolve));}



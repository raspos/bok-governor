import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {initial,advance,project,tape} from './dist/economy.mjs';
import {start,decide,onward,compare,meetingImpact,reassess,legacyKeys,moves,briefs,submitDots,conclude,resolveReview} from './dist/game.mjs';
const calm={oil:0,world:0,fed:0,risk:0,sensitivity:1};
const repeated=Array(6).fill(calm);
function playMeeting(game,proposal,focus,forecast){
 let next=decide(game,proposal,focus,forecast);
 if(next.phase==='review')next=resolveReview(next,proposal);
 if(next.phase==='dots')next=submitDots(next,Array(3).fill(next.pending.rate));
 return conclude(next,'conditional');
}
test('growth, prices, demand and credit respond within the first two months',()=>{
 const lower=project(initial,2.75,repeated);
 const higher=project(initial,3.25,repeated);
 assert.ok(higher[1].loan>lower[1].loan);
 assert.ok(higher[1].fx<lower[1].fx);
 for(const month of [1,2]){
 for(const k of ['growth','inflation','consumption','investment','debt']){
 assert.ok(lower[month][k]-higher[month][k]>.03,k+' month '+month);
 }
 }

 assert.ok(higher[6].inflation<lower[6].inflation);
 assert.ok(higher[6].debt<lower[6].debt);
 assert.ok(higher[6].housing<lower[6].housing);
 assert.ok(higher[6].unemployment>lower[6].unemployment);
});
test('oil and Fed shocks can overwhelm exchange rate appreciation and oil drives inflation',()=>{
 const base=advance(initial,3,calm), shock=advance(initial,3.25,{...calm,oil:24,fed:.5,risk:8});
 assert.ok(shock.fx>base.fx);
 assert.ok(shock.inflation>base.inflation);
});
test('financial stress creates nonlinear amplification',()=>{
 const impact=stress=>{
 const s={...initial,stress,gaps:[1,1,1]};
 return advance({...s,gaps:[]},3,calm).growth-advance(s,3,calm).growth;
 };
 assert.ok(impact(70)>1.5*impact(30));
});
test('reproducible paths stay finite across seeds and policies',()=>{
 for(let seed=0;seed<400;seed++){
 const shocks=tape(seed,36), r=seed%7*.25+2.25;
 const a=project(initial,r,shocks);
 assert.deepEqual(a,project(initial,r,tape(seed,36)));
 for(const s of a){
 assert.ok(Object.values(s).filter(x=>typeof x==='number').every(Number.isFinite));
 assert.ok(s.fx>=900&&s.fx<=2200&&s.stress>=0&&s.stress<=100);
 }
 }
 assert.notDeepEqual(tape(33),tape(34));
});
test('eight meetings, majority outcome, save round trip and identical shock comparison',()=>{
 let g=start(12345);
 assert.throws(()=>decide(g,0,'prices','하락'));
 for(let i=0;i<8;i++){
 g=playMeeting({...g,phase:'meeting'},i===0?-.25:.25,'prices','하락');
 const r=g.records.at(-1);
 assert.equal(r.votes.length,7);
 if(!r.review)assert.ok((r.runoff??r.votes).filter(v=>v.vote===r.change).length>=4);
 if(i===0)assert.notEqual(r.change,r.proposal);
 assert.deepEqual(compare(r,r.change)[r.endMonth-r.origin.month],g.state);
 assert.deepEqual(meetingImpact(r).actual,g.state);
 assert.equal(r.shocks.length,6);
 assert.equal(g.state.month,[1,3,4,6,7,9,10,12][i]);
 assert.deepEqual(g,JSON.parse(JSON.stringify(g)));
 g=onward(g);
 }
 assert.equal(g.phase,'end');
 assert.equal(g.state.month,12);
 assert.equal(g.path.length,13);
 assert.deepEqual(g.path.map(s=>s.month),Array.from({length:13},(_,i)=>i));
 const future=reassess(g);
 assert.deepEqual(future,reassess(JSON.parse(JSON.stringify(g))));
 assert.equal(future.played[12].month,24);
 assert.equal(future.played[24].month,36);
 assert.ok(legacyKeys.every(k=>future.legacyControl[0][k]===future.baseline[k]));
 assert.ok(legacyKeys.every(k=>future.played[24][k]!==future.legacyControl[24][k]));
 assert.notEqual(future.played[24].fx,future.calmFuture[24].fx);
});

test('offline game renders and handles eight meetings and reassessment through UI events',()=>{
 const page=readFileSync(new URL('./play.html',import.meta.url),'utf8');
 const js=page.split('<script>')[1].split('</script>')[0];
 const main={innerHTML:'',focus(){}};
 const nav={innerHTML:''};
 const members={innerHTML:''};
 const events={};
 const stored=new Map();
 const env={
 document:{querySelector(id){return {'#main':main,'#nav':nav,'#members':members}[id];},addEventListener(type,fn){events[type]=fn;}},
 localStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)},
 crypto:{getRandomValues:()=>[12345]},
 };
 runInNewContext(js,env);
 const exact=runInNewContext("watchForecastPanel({date:'2027-01-14',asOf:'2027-01-01',span:13,expected:3.11,rate:3,probabilities:{raise:47,hold:48,cut:5},factors:[]},null,true)",env);
 assert.match(exact,/<div class="watch-hero"><strong>48%<\/strong><span>다음 회의 금리 동결 확률<\/span>/);
 assert.match(exact,/전망이 팽팽합니다/);
 const watchMarkup=probabilities=>runInNewContext("watchForecastPanel({date:'2027-01-14',asOf:'2027-01-01',span:13,expected:3,rate:3,probabilities:"+JSON.stringify(probabilities)+",factors:[]},null,true)",env);
 assert.match(watchMarkup({raise:55,hold:35,cut:10}),/55%<\/strong><span>다음 회의 금리 인상 확률/);
 assert.match(watchMarkup({raise:10,hold:30,cut:60}),/60%<\/strong><span>다음 회의 금리 인하 확률/);
 assert.match(watchMarkup({raise:45,hold:45,cut:10}),/45%<\/strong><span>인상·동결 전망 동률/);
 const click=action=>events.click({target:{closest:()=>({dataset:{action}})}});
 const submit=(id,key,value)=>events.submit({target:{id,elements:{[key]:{value}}},preventDefault(){}});
 assert.match(main.innerHTML,/한은 총재/);
 click('new-term');
 assert.match(main.innerHTML,/어떤 총재로 시작할 것인가/);
 click('background-scholar');
 assert.match(main.innerHTML,/어떤 경제 상황에서 출발할 것인가/);
 click('scenario-standard');
 assert.match(main.innerHTML,/신년 기자간담회/);
 for(const choice of ['conditional','prices','activity'])submit('inaugural-form','answer',choice);
 assert.match(main.innerHTML,/총재 집무실/);
 for(let i=0;i<8;i++){
 click('meeting');
 if(main.innerHTML.includes('id="crisis-form"'))submit('crisis-form','response','liquidity');
 if(main.innerHTML.includes('id="government-form"')){
 const choice=main.innerHTML.match(/name="governmentReply" value="([^"]+)"/)[1];
 submit('government-form','governmentReply',choice);
 }
 assert.match(main.innerHTML,/금통위 회의실/);
 events.submit({target:{id:'decision'},preventDefault(){}});
 assert.match(main.innerHTML,/먼저 이번 회의의 목표/);
 submit('goal-form','goalKey','inflation');
 events.change({target:{name:'proposal',value:'0.25'}});
 events.submit({target:{id:'decision'},preventDefault(){}});
 if(main.innerHTML.includes('id="review-form"'))submit('review-form','motion','0');
 if([1,3,5,7].includes(i)){
 assert.match(main.innerHTML,/총재의 점도표/);
 events.submit({target:{id:'dot-form',elements:Object.fromEntries([1,2,3].map(n=>['dot-'+n,{value:'3'}]))},preventDefault(){}});
 assert.match(main.innerHTML,/6개월 후 조건부 금리전망/);
 assert.match(main.innerHTML,/21점/);
 }
 assert.match(main.innerHTML,/기자회견/);
 for(let question=0;main.innerHTML.includes('id="qa-form"')&&question<5;question++){
 events.submit({target:{id:'qa-form',elements:{answer:{value:'explain'}}},preventDefault(){}});
 }
 events.submit({target:{id:'press-form',elements:{remark:{value:'conditional'}}},preventDefault(){}});
 assert.match(main.innerHTML,/표결 기록/);
 assert.match(main.innerHTML,/같은 충격, 다른 결정/);
 click('next');
 assert.match(main.innerHTML,/2027년 게임 속 가상 기사/);
 click('next');
 }
 assert.match(main.innerHTML,/어떤 총재로 남을 것인가/);
 assert.match(main.innerHTML,/2029년 역사적 재평가/);
 assert.equal(JSON.parse(stored.get('bok-governor-v2')).records.length,8);
});

test('prior tightening changes inherited stocks after the rate returns to neutral',()=>{
 const low=project(initial,2,repeated).at(-1);
 const high=project(initial,3.5,repeated).at(-1);
 const lowAfter=project(low,2.5,repeated).at(-1);
 const highAfter=project(high,2.5,repeated).at(-1);
 assert.deepEqual(lowAfter.gaps,highAfter.gaps);
 assert.ok(lowAfter.debtStock>highAfter.debtStock);
 assert.ok(lowAfter.imbalance>highAfter.imbalance);
 assert.ok(lowAfter.expectations>highAfter.expectations);
 assert.ok(lowAfter.capacity>highAfter.capacity);
});
test('positive demand shock can lift growth even during a hike',()=>{
 const up=advance(initial,3.25,{...calm,world:1.8});
 assert.ok(up.growth>initial.growth);
 assert.ok(up.growth<advance(initial,3,{...calm,world:1.8}).growth);
});

test('every meeting can have a policy-sensitive outcome across seeded scenarios',()=>{
 const contested=Array(8).fill(false);
 for(let i=0;i<64;i++){
 let game=start(Math.imul(i,2654435761));
 for(let turn=0;turn<8;turn++){
 const options=Object.keys(briefs).flatMap(focus=>moves.map(move=>
 playMeeting({...game,phase:'meeting'},move,focus,'하락')));
 contested[turn] ||= new Set(options.map(option=>option.state.rate)).size>1;
 const result=options[(i+turn)%options.length];
 assert.ok(['inflation','growth','stress','fx'].some(key=>Math.abs(result.state[key]-game.state[key])>=.01));
 game=onward(result);
 }
 }
 assert.ok(contested.every(Boolean),JSON.stringify(contested));
});



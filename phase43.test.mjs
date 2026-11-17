import test from 'node:test';
import assert from 'node:assert/strict';
import {start,begin,decide,conclude,onward,submitDots} from './dist/game.mjs';
import {openingStatement,conferenceFor,conferenceChoices,answerConference} from './dist/press.mjs';
import {chooseGoal} from './dist/goals.mjs';

function finish(game,choice='explain'){
 while(conferenceFor(game).answers.length<conferenceFor(game).queue.length){
 const c=conferenceFor(game), item=c.queue[c.answers.length];
 const id=typeof choice==='function'?choice(item,c):choice;
 game=answerConference(game,id);
 }
 return game;
}
const jan=()=>decide({...begin(start(21,'scholar')),phase:'meeting'},0,'prices','하락');
test('announcement uses finalized rates, recorded votes and observed figures',()=>{
 const game=jan(),r=game.pending;
 const o=openingStatement(r);
 assert.ok(o.rate.includes(r.rate.toFixed(2)+'%'));
 assert.match(o.economy,/경기 흐름 지표는 1.80점/);
 assert.match(o.vote,/인상 \d표 · 동결 \d표 · 인하 \d표/);
 const fake={...r,change:0,rate:r.origin.rate,watch:{favorite:'raise',probabilities:{raise:86,hold:10,cut:4},expected:3.20}};
 const c=conferenceFor({...game,pending:fake});
 assert.match(c.queue[0].question,/86%/);
 assert.match(c.queue[0].question,/동결/);
 assert.ok(c.queue.length===3);
 assert.ok(!c.queue.some(q=>q.id==='credit'));
});
test('a dot question uses an actual release; roles and follow-ups depend on selection',()=>{
 const first=conclude(finish(jan()),'conditional');
 let next={...onward(first),phase:'meeting'};
 next=submitDots(decide(chooseGoal(next,'inflation'),0,'prices','하락'),[2.75,3,3]);
 const q=conferenceFor(next).queue;
 assert.equal(q.length,3);
 assert.match(q.find(q=>q.id==='dots').question,new RegExp(next.pending.dots.median.toFixed(2)+'%'));
 const profiles=['scholar','official','politician'].map(background=>conferenceChoices({...next,background},q[0])[0].text);
 assert.equal(new Set(profiles).size,3);
 const guide=answerConference(next,'guide'), explain=answerConference(next,'explain');
 assert.equal(conferenceFor(guide).queue[1].id,'follow');
 assert.equal(conferenceFor(guide).queue.length,3);
 assert.notEqual(conferenceFor(explain).queue[1].id,'follow');
 assert.throws(()=>conclude(guide,'conditional'),/Answer the conference/);
 const renewed=JSON.parse(JSON.stringify(guide));
 assert.deepEqual(conferenceFor(renewed),conferenceFor(guide));
 assert.equal(finish(renewed).pending.conference.queue.filter(x=>x.id==='follow').length,1);
});
test('public guidance changes press pricing once and leaves vote and earlier stages fixed',()=>{
 const g=jan();
 const a=conclude(finish(g),'conditional');
 const b=conclude(finish(g,(_q,c)=>c.answers.length===0?'guide':'explain'),'conditional');
 assert.equal(a.state.rate,b.state.rate);
 assert.deepEqual(a.state,b.state);
 const ax=a.records[0], bx=b.records[0];
 assert.deepEqual(ax.watchResult.next.decision,bx.watchResult.next.decision);
 assert.deepEqual(ax.watchResult.next.dots,bx.watchResult.next.dots);
 assert.notEqual(ax.watchResult.next.press.expected,bx.watchResult.next.press.expected);
 assert.equal(bx.pressSummary.tone,1);
 assert.ok(bx.conference.answers.some(x=>x.text===bx.pressSummary.quote));
 assert.notDeepEqual(a.records[0].watchResult.before,a.records[0].watchResult.next.press);
 const priorState={...onward(b),phase:'meeting'};
 const p=decide(priorState,0,'prices','하락');
 const staged=submitDots(p,[3,3,3]);
 const described={...staged,pending:{...staged.pending,origin:{...staged.pending.origin,inflation:2.6},incidents:[],government:null}};
 assert.ok(conferenceFor(described).queue.some(item=>item.id==='memory'));
});
test('an unsupported target pledge risks trust and stops short of changing policy outcome',()=>{
 const g=jan();
 const goal=chooseGoal({...g,phase:'meeting'},'inflation').context.goal;
 const setup={...g,pending:{...g.pending,goal:{...goal,limit:-2.5}}};
 const neutral=conclude(finish(setup),'conditional');
 const pledge=conclude(finish(setup,q=>q.id==='target'?'pledge':'explain'),'conditional');
 assert.ok(pledge.records[0].pressSummary.pledged);
 assert.match(pledge.records[0].pressSummary.headline,/확약/);
 assert.equal(pledge.records[0].goalResult.met,false);
 assert.ok(pledge.market.trust<neutral.market.trust);
 assert.deepEqual(pledge.state,neutral.state);
});


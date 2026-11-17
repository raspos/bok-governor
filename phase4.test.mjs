import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from './dist/economy.mjs';
import {start,begin,decide,submitDots,conclude,reassess,onward,respondCrisis,respondGovernment,resolveReview} from './dist/game.mjs';
import {publicWatchSnapshot,forecastWatch,currentWatch,scoreWatch,calibrateWatch,watchCalibration,releasedWatch} from './dist/watch.mjs';
import {governmentEvent} from './dist/politics.mjs';
import {historicalVerdict} from './dist/verdict.mjs';
import {simulate} from './balance.mjs';
import {fixedPolicyPath,quantiles} from './audit_phase4.mjs';

test('calibration preserves structural zeros and announcement effects can reverse by context',()=>{
 const p=calibrateWatch({raise:0,hold:60,cut:40},watchCalibration);
 assert.equal(p.raise,0);
 assert.equal(p.hold+p.cut,100);
 const watch={rate:3,expected:2.9,probabilities:{raise:10,hold:40,cut:50}};
 const record={date:'2027-01-14',watch,rate:2.75,origin:initial,incidents:[]};
 const prior={expected:2.9,trust:70,yield:3.2};
 const quote=expected=>releasedWatch(record,{prior,decision:prior,dots:prior,press:{...prior,expected}}).reaction;
 assert.ok(quote(2.8).fxWon>0&&quote(2.8).longBps<0);
 assert.ok(quote(3.3).fxWon<0&&quote(3.3).longBps>0);
});

test('BOK WATCH probabilities sum to 100 and published expected rate matches the move weights',()=>{
 for(const rate of [0,2.5,3,10])for(const inflation of [0,2,5]){
 const input=publicWatchSnapshot({...initial,rate,inflation},null,null,'2027-01-14');
 const f=forecastWatch(input);
 const p=f.probabilities;
 assert.equal(p.raise+p.hold+p.cut,100);
 assert.equal(f.expected,rate+(p.raise-p.cut)*.0025);
 if(rate===0)assert.equal(p.cut,0);
 if(rate===10)assert.equal(p.raise,0);
 }
 assert.equal(forecastWatch(publicWatchSnapshot(initial,null,null,'2027-01-14')).span,13);
});
test('unannounced events, draft votes, identities and unreleased dots never enter the snapshot',()=>{
 const init=start(15,'scholar');
 const before=currentWatch(init);
 const spoof={...init,seed:89,background:'politician',pending:{watch:null,dots:{median:10},votes:[10],remark:'activity'},context:{persuasion:[{changed:true}],events:[{id:'fed'}]}};
 assert.deepEqual(before,currentWatch(spoof));
 assert.ok(currentWatch(init,[{id:'fed'}]).probabilities.raise>before.probabilities.raise);
 assert.ok(currentWatch({...init,state:{...initial,inflation:4}}).probabilities.raise>before.probabilities.raise);
});
test('watch freezes before vote and release reactions depend on the frozen public expectation',()=>{
 const g={...begin(start(34,'official')),phase:'meeting'};
 const before=g.context.watch;
 const first=decide(g,0,'prices','하락');
 assert.deepEqual(first.pending.watch,before);
 const alternate={...before,probabilities:{raise:90,hold:10,cut:0},expected:before.rate+.225,favorite:'raise'};
 const second=decide({...g,context:{...g.context,watch:alternate}},0,'prices','하락');
 assert.deepEqual(first.pending.votes,second.pending.votes);
 const a=conclude(first,'conditional'), b=conclude(second,'conditional');
 assert.deepEqual(a.state,b.state);
 assert.notEqual(a.records[0].watchResult.reaction.longBps,b.records[0].watchResult.reaction.longBps);
 assert.equal(a.market.trust,b.market.trust);
 const published=b.records[0].watchResult;
 assert.deepEqual(JSON.parse(JSON.stringify(published)),published);
 if(published.actual!=='raise')assert.ok(published.headline);
});
test('rate, dot plot and press snapshots are staged without reapplying actual policy shocks',()=>{
 const base=conclude(decide({...start(0),phase:'meeting'},0,'activity','하락'),'conditional');
 const g={...base,turn:1,phase:'meeting'};
 const d=decide(g,0,'prices','하락');
 const low=submitDots(d,[1,1,1]), high=submitDots(d,[6,6,6]);
 const a=conclude(low,'prices'),b=conclude(high,'activity');
 assert.deepEqual(a.state,b.state);
 assert.deepEqual(a.records[1].watchResult.next.decision,b.records[1].watchResult.next.decision);
 assert.notEqual(a.records[1].watchResult.next.dots.expected,b.records[1].watchResult.next.dots.expected);
 assert.notEqual(a.records[1].watchResult.next.press.expected,a.records[1].watchResult.next.dots.expected);
});
test('same recorded shocks exactly replay the actual rate schedule and late choice persists to 2029',()=>{
 const g=simulate(2654435761,'scholar','prices');
 const shocks=g.records.flatMap(r=>r.shocks.slice(0,r.endMonth-r.origin.month));
 assert.deepEqual(fixedPolicyPath(g.records,shocks),g.path);
 const other=g.records.map(r=>({...r,rate:r.rate-.25}));
 assert.notEqual(fixedPolicyPath(other,shocks).at(-1).inflation,g.state.inflation);
 assert.deepEqual(quantiles([1,2,3]),{mean:2,median:2,std:Math.sqrt(2/3),p10:1.2,p90:2.8});
 const end=reassess(g);
 assert.equal(end.novemberHold.month,36);
 assert.equal(end.finalDot.target,'2028-05');
 assert.equal(end.watch.count,8);
 assert.ok(Number.isFinite(scoreWatch(g.records).brier));
 const varied={...g,politics:{...g.politics,approval:20},market:{...g.market,trust:20}};
 assert.equal(historicalVerdict(varied,end).title,historicalVerdict(g,end).title);
});
test('politics rejects immediate repeats of the same type despite unchanged pressure inputs',()=>{
 const g={...start(1),state:{...initial,growth:.6}};
 for(let seed=0;seed<150;seed++){
 const game={...g,seed};
 const first=governmentEvent(game,[]);
 if(!first)continue;
 const next=governmentEvent({...game,records:[{government:{event:first},change:0,origin:game.state}]},[]);
 assert.notEqual(next?.id,first.id);
 }
});
test('at least one decisive round has a verified named pivot and alternative rate',()=>{
 const runs=Array.from({length:16},(_,i)=>simulate(Math.imul(i+1,2654435761)>>>0,'scholar','prices'));
 const found=runs.flatMap(g=>g.records).find(r=>r.persuasionDecisive&&r.influence.some(p=>p.withoutRate!==r.rate));
 assert.ok(found);
 assert.ok(found.influence.filter(p=>p.withoutRate!==found.rate).every(p=>found.persuasion.some(a=>a.changed&&a.id===p.id)));
});

test('announcement-day reaction cannot see economic outcomes within the future meeting interval',()=>{
 let g=start(18,'scholar');
 for(let turn=0;turn<4;turn++){
 g=begin(g);
 if(g.phase==='crisis')g=respondCrisis(g,'observe');
 if(g.phase==='government')g=respondGovernment(g,'evidence');
 g=decide(g,0,'prices','상승');
 if(g.phase==='review')g=resolveReview(g,0);
 if(g.phase==='dots')g=submitDots(g,[3,3,3]);
 if(turn===3){
 const up=g.pending.shocks.map(s=>({...s,oil:s.oil+75}));
 const down=g.pending.shocks.map(s=>({...s,oil:s.oil-75}));
 const a=conclude({...g,pending:{...g.pending,shocks:up}},'conditional');
 const b=conclude({...g,pending:{...g.pending,shocks:down}},'conditional');
 assert.notDeepEqual(a.records.at(-1).verified,b.records.at(-1).verified);
 assert.deepEqual(a.records.at(-1).watchResult,b.records.at(-1).watchResult);
 }
 g=onward(conclude(g,'conditional'));
 }
});


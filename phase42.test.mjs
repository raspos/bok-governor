import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {initial,metrics,project,calm} from './dist/economy.mjs';
import {chooseGoal,goalOptions,goalPeriod,goalForecast,goalDifficulty,evaluateGoal,goalMet} from './dist/goals.mjs';
import {start,begin,decide,conclude,onward,respondCrisis,respondGovernment,submitDots,resolveReview,reassess} from './dist/game.mjs';
import {currentWatch} from './dist/watch.mjs';
import {historicalVerdict} from './dist/verdict.mjs';

test('game terminology distinguishes model points from percent rates',()=>{
 assert.deepEqual(metrics.growth,['실질 GDP 성장률','%']);
 assert.equal(metrics.capacity[1],'%');
 assert.equal(metrics.inflation[1],'%');
 const dir=new URL('./dist/',import.meta.url);
 for(const file of readdirSync(dir).filter(n=>n.endsWith('.mjs'))){
 assert.doesNotMatch(readFileSync(new URL(file,dir),'utf8'),/성장 모멘텀/);
 }
});
test('target uses the same month boundary and precise units as the economic model',()=>{
 const g={...start(1),phase:'meeting'};
 const selected=chooseGoal(g,'inflation');
 assert.equal(selected.context.goal.limit,2.6);
 assert.equal(selected.context.goal.from,2.8);
 assert.equal(selected.context.goal.months,1);
 assert.deepEqual(goalPeriod(1,{...initial,month:1}),{months:2,end:3,label:'다음 금통위 전'});
 assert.deepEqual(goalPeriod(7,{...initial,month:10}),{months:2,end:12,label:'2027년 말'});
 assert.equal(goalMet(selected.context.goal,2.604),true);
 assert.equal(goalMet(selected.context.goal,2.606),false);
 assert.equal(goalOptions({...initial,inflation:1.6})[0].min,1.8);
 const drafts=goalForecast(g.state,1);
 assert.equal(drafts[2].center.growth,project(initial,3.25,[calm]).at(-1).growth);
 assert.ok(drafts[2].range.inflation[0]<drafts[2].center.inflation);
 assert.ok(drafts[2].range.inflation[1]>drafts[2].center.inflation);
 assert.match(goalDifficulty({...selected.context.goal,limit:-3},drafts),/모두 목표 범위 밖/);
});
test('private target persists through serialization without changing votes, market or economy',()=>{
 const base={...begin(start(42,'scholar')),phase:'meeting'};
 const planned=JSON.parse(JSON.stringify(chooseGoal(base,'growth')));
 assert.deepEqual(planned.context.watch,base.context.watch);
 assert.deepEqual(currentWatch(planned),currentWatch(base));
 assert.deepEqual(goalForecast(planned.state,1),goalForecast({...base,pending:{shocks:[{oil:90}]} }.state,1));
 const actual=decide(planned,0,'activity','하락'), without=decide(base,0,'activity','하락');
 assert.deepEqual(actual.pending.votes,without.pending.votes);
 assert.equal(actual.pending.rate,without.pending.rate);
 const end=conclude(actual,'conditional'), old=conclude(without,'conditional');
 assert.deepEqual(end.state,old.state);
 assert.deepEqual(end.market,old.market);
 assert.deepEqual(end.records[0].watchResult,old.records[0].watchResult);
 assert.ok(end.records[0].goalResult);
 assert.equal(old.records[0].goalResult,undefined);
});
test('recorded oil shock can defeat a target and accounting reconciles',()=>{
 const g=chooseGoal({...start(1),phase:'meeting'},'inflation');
 const record={origin:initial,endMonth:1,proposal:.25,rate:3,goal:g.context.goal};
 const normal=project(initial,3,[calm]).at(-1), shocked=project(initial,3,[{...calm,oil:50}]).at(-1);
 assert.ok(evaluateGoal(record,normal).met);
 const result=evaluateGoal(record,shocked);
 assert.equal(result.met,false);
 assert.ok(result.proposal<0&&result.vote>0&&result.shock>0);
 assert.ok(Math.abs(result.carry+result.proposal+result.vote+result.shock-(shocked.inflation-initial.inflation))<1e-10);
});
test('eight recorded targets survive to 2029 without becoming the economic verdict score',()=>{
 let g=start(40,'official');
 for(let turn=0;turn<8;turn++){
 g=begin(g);
 if(g.phase==='crisis')g=respondCrisis(g,'observe');
 if(g.phase==='government')g=respondGovernment(g,'evidence');
 g=decide(chooseGoal(g,['inflation','growth','debt','stress'][turn%4]),0,'prices','보합');
 if(g.phase==='review')g=resolveReview(g,0);
 if(g.phase==='dots')g=submitDots(g,[3,3,3]);
 g=onward(conclude(g,'conditional'));
 }
 assert.equal(g.phase,'end');
 assert.ok(g.records.every(r=>typeof r.goalResult.met==='boolean'));
 const old={...g,records:g.records.map(({goal,goalResult,...r})=>r)};
 assert.equal(historicalVerdict(g,reassess(g)).title,historicalVerdict(old,reassess(old)).title);
});


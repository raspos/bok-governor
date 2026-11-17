import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,project,calm} from './dist/economy.mjs';
import {activeIncidents,scenarioShocks} from './dist/scenarios.mjs';
import {start,begin,respondCrisis,respondGovernment,decide,submitDots,conclude,onward,reassess,resolveReview,opinions,negotiate} from './dist/game.mjs';
import {openingPolitics,pressureOdds,governmentReply,updatePolitics,reconsider,requestsReview} from './dist/politics.mjs';
import {backgrounds,memberPool,selectRoster,getCommittee,persuasionCase,voteRunoff} from './dist/committee.mjs';
import {historicalVerdict} from './dist/verdict.mjs';

test('incidents alter real dynamics over multiple months; liquidity trades credit for stability',()=>{
 const base=Array(4).fill(calm), events=[{id:'finance',start:0},{id:'ai',start:0}];
 const passive=scenarioShocks(base,0,events,'observe',initial);
 const active=scenarioShocks(base,0,events,'liquidity',initial);
 assert.equal(passive[0].risk,15);
 assert.equal(passive[3].risk,0);
 const noEvent=project(initial,3,base);
 const exposed=project(initial,3,passive);
 const supported=project(initial,3,active);
 assert.ok(exposed[2].growth<noEvent[2].growth);
 assert.ok(supported[1].stress<exposed[1].stress);
 assert.ok(supported[1].debt>exposed[1].debt);
 const fiscal=project(initial,3,scenarioShocks(base,0,[{id:'fiscal',start:0}],'observe',initial));
 assert.ok(fiscal[2].growth>noEvent[2].growth);
 assert.ok(fiscal[1].inflation>noEvent[1].inflation);
 assert.ok(new Set(Array.from({length:40},(_,seed)=>activeIncidents(start(seed)).map(e=>e.id).join())).size>=5);
});
test('economic weakness and approval change pressure, government response cannot set rates',()=>{
 const p=openingPolitics(),bad={...initial,growth:.2,consumption:.4};
 assert.ok(pressureOdds(bad,p)>pressureOdds(initial,p));
 assert.ok(pressureOdds(initial,{...p,approval:37})>pressureOdds(initial,p));
 const context={events:[],government:{id:'president'}};
 for(const background of Object.keys(backgrounds)){
 const g={...start(1,background),state:bad,phase:'government',context};
 const next=respondGovernment(g,'consider');
 assert.equal(next.state.rate,g.state.rate);
 assert.equal(next.phase,'meeting');
 assert.ok(!next.context.interaction.justified);
 }
 const cooperative={...start(1,'official'),phase:'government',context,state:bad};
 assert.ok(governmentReply(cooperative,'coordinate').cooperation>governmentReply({...cooperative,background:'scholar'},'coordinate').cooperation);
});
test('borrowers and depositors can disagree while political confidence follows different signals',()=>{
 const prior=openingPolitics();
 const record={origin:initial,change:.25,market:{trust:70,shift:0,remark:'conditional'},question:{challenge:false}};
 const higherCost=updatePolitics(prior,record,{...initial,loan:initial.loan+.5});
 assert.ok(higherCost.groups.mortgage<55);
 assert.ok(higherCost.groups.savers>55);
 const lowTrust=updatePolitics(prior,{...record,market:{...record.market,trust:50}},initial);
 const okTrust=updatePolitics(prior,record,initial);
 assert.equal(lowTrust.approval,okTrust.approval);
 assert.ok(lowTrust.confidence<okTrust.confidence);
});
test('rare formal reconsideration requires five matching votes to reach presidential decision',()=>{
 const origin={...initial,inflation:3,growth:.7};
 const record={origin,change:.25};
 const g={...start(0),politics:{...openingPolitics(),approval:43,coordination:34}};
 const eligible=Array.from({length:300},(_,seed)=>requestsReview({...g,seed},record)).filter(Boolean).length;
 assert.ok(eligible>0&&eligible<45);
 assert.equal(reconsider(record,[.25,.25,.25,.25,.25,0,0]).president,'확정');
 assert.equal(reconsider({...record,origin:{...origin,inflation:2}},[.25,.25,.25,.25,.25,0,0]).change,0);
 const fallback=reconsider(record,[.25,.25,.25,.25,0,0,-.25],[0,0,0,0,0,0,-.25]);
 assert.equal(fallback.president,null);
 assert.equal(fallback.change,0);
});
test('12-member pool yields a reproducible six with an eligible deputy',()=>{
 assert.equal(memberPool.length,12);
 const roster=selectRoster(81);
 assert.deepEqual(roster,selectRoster(81));
 assert.equal(new Set(roster).size,6);
 assert.ok(memberPool[roster[0]].deputy);
 assert.ok(new Set(Array.from({length:16},(_,seed)=>selectRoster(seed).join())).size>=12);
 const g=start(81,'scholar');
 const hot=opinions({...initial,inflation:4,growth:2.1},'prices',0,'상승',g.market,g);
 const slump=opinions({...initial,inflation:1.4,growth:-1,stress:48},'activity',0,'하락',g.market,g);
 assert.ok(hot.filter(row=>row.vote===.25).length>slump.filter(row=>row.vote===.25).length);
 assert.equal(hot[0].role,'부총재');
});
test('evidence and background can shift a hardliner by one step, and weak evidence fails',()=>{
 const member=memberPool[6];
 const s={...initial,inflation:1.3,expectations:1.4,growth:.1};
 const strong=persuasionCase({...start(4,'scholar'),state:s},member,.25,-.25,'model','crosscheck');
 const weak=persuasionCase(start(4,'scholar'),member,.25,-.25,'model','insist');
 assert.ok(strong.changed&&strong.justified);
 assert.equal(strong.final,0);
 assert.equal(weak.final,.25);
 assert.equal(new Set(Object.values(backgrounds).map(b=>b.argument)).size,3);
 const sample={...start(4,'scholar'),state:{...initial,inflation:2.75,expectations:2.45,growth:1.9}};
 const persuades=Object.keys(backgrounds).map(background=>persuasionCase({...sample,background},member,0,.25,'model','crosscheck').changed);
 assert.ok(persuades.includes(true)&&persuades.includes(false));
});
test('three-way split needs a recorded majority runoff',()=>{
 const first=[-.25,-.25,-.25,0,0,.25,.25].map(vote=>({vote}));
 const result=voteRunoff(first);
 assert.ok(result.runoff);
 assert.ok(result.runoff.filter(v=>v.vote===result.change).length>=4);
});
function fullRun(background,seed,strategy){
 let g=start(seed,background);
 for(let i=0;i<8;i++){
 g=begin(g);
 if(g.phase==='crisis')g=respondCrisis(g,strategy<0?'liquidity':'buffers');
 if(g.phase==='government'){
 const reply=g.context.government.id==='hearing'?'evidence':'coordinate';
 g=respondGovernment(g,reply);
 }
 const focus=strategy<0?'activity':'prices';
 const forecast=strategy<0?'하락':'상승';
 const targets=opinions(g.state,focus,strategy,forecast,g.market,g).filter(m=>m.vote!==strategy).slice(0,2);
 for(const m of targets)g=negotiate(g,m.id,strategy,focus,forecast,backgrounds[background].bonus,'crosscheck');
 if(targets.length===2)assert.throws(()=>negotiate(g,getCommittee(g)[2].id,strategy,focus,forecast,'model','crosscheck'));
 g=decide(JSON.parse(JSON.stringify(g)),strategy,focus,forecast);
 if(g.phase==='review')g=resolveReview(g,strategy);
 if(g.phase==='dots')g=submitDots(g,Array(3).fill(g.pending.rate));
 g=onward(conclude(g,'conditional'));
 }
 return g;
}
test('three profiles finish the year, keep debate records, and yield record-based endings',()=>{
 const results=Object.keys(backgrounds).map((profile,i)=>fullRun(profile,12345,i===0?.25:-.25));
 assert.deepEqual(results[0],fullRun('scholar',12345,.25));
 for(const g of results){
 assert.equal(g.path.length,13);
 assert.equal(g.records.filter(r=>r.poll).length,4);
 const attempted=g.records.flatMap(r=>r.persuasion).length;
 assert.ok(attempted>0&&attempted<=16);
 assert.ok(g.records.every(r=>r.votes.length===7&&r.persuasion.every(p=>Number.isFinite(p.afterEvidence))));
 assert.ok(g.records.every(r=>r.votes.slice(1).every(v=>v.initial!==undefined)));
 assert.ok(g.records.filter(r=>r.dots).every(r=>r.dots.members.length===6));
 assert.equal(reassess(g).played.at(-1).month,36);
 const verdict=historicalVerdict(g,reassess(g));
 assert.equal(verdict.score.approval,g.politics.approval);
 assert.equal(verdict.score.trust,g.market.trust);
 assert.equal(verdict.attempts,attempted);
 assert.ok(verdict.title);
 }
 assert.notDeepEqual(results[0].path,results[1].path);
 assert.notEqual(results[1].politics.approval,results[2].politics.approval);
 console.log('Profile audit',results.map(g=>({profile:g.background,rates:g.records.map(r=>r.rate),title:historicalVerdict(g,reassess(g)).title})));
});


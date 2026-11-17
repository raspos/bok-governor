import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {start,begin,respondCrisis,respondGovernment,opinions,negotiate,decide,resolveReview,submitDots,conclude,onward,reassess} from './dist/game.mjs';
import {backgrounds,getCommittee,persuasionCase,evidenceNames} from './dist/committee.mjs';
import {abilityStatus,activateAbility,persuasionLeft} from './dist/abilities.mjs';
import {historicalVerdict} from './dist/verdict.mjs';

const policies={
 prices:s=>[s.inflation>2.23?.25:s.inflation<1.85?-.25:0,'prices','model'],
 growth:s=>[s.growth<s.capacity-.10?-.25:s.growth>s.capacity+.48?.25:0,'activity','households'],
 stability:s=>[s.stress>44?-.25:s.imbalance>43||s.debt>4.3?.25:0,'markets','stability'],
 practical:s=>s.stress>=43?[0,'markets','stability']:s.inflation>2.45?[.25,'prices','model']:s.growth<s.capacity-.30?[-.25,'activity','households']:[0,'prices','model'],
};
const strategies=Object.keys(policies);
const profiles=Object.keys(backgrounds);
const responseFor=(s,incidents)=>s.stress>37||incidents.some(e=>e.id==='finance')?'liquidity':s.imbalance>44?'buffers':'observe';
function abilityChoice(g,focus){
 if(!abilityStatus(g)?.available)return null;
 const s=g.state;
 if(g.background==='scholar')return Math.abs(s.inflation-2)>.38||Math.abs(s.growth-s.capacity)>.35?focus==='prices'?'prices':'activity':null;
 if(g.background==='official'){
 if(g.context.events.length&&g.context.response==='observe'&&s.stress>34)return 'liquidity';
 if(g.context.interaction?.justified||s.imbalance>43)return 'mediation';
 return null;
 }
 if(s.inflation>2.35)return 'prices';
 return s.growth<s.capacity-.28?'activity':null;
}
export function simulate(seed,profile,key,allowAbility=true){
 let game=start(seed,profile);
 for(let i=0;i<8;i++){
 game=begin(game);
 if(game.phase==='crisis')game=respondCrisis(game,responseFor(game.state,game.context.events));
 if(game.phase==='government')game=respondGovernment(game,game.context.government.id==='hearing'?'evidence':profile==='scholar'&&!game.context.government.id.includes('official')?'evidence':'coordinate');
 const [proposal,focus,preferred]=policies[key](game.state);
 const forecast=game.state.inflation>2.20?'하락':game.state.inflation<1.75?'상승':'보합';
 const choice=allowAbility?abilityChoice(game,focus):null;
 if(choice)game=activateAbility(game,choice);
 const roster=getCommittee(game);
 while(persuasionLeft(game)>0){
 const votes=opinions(game.state,focus,proposal,forecast,game.market,game);
 const tried=game.context.persuasion??[];
 const eligible=votes.filter(v=>v.vote!==proposal&&!tried.some(p=>p.id===v.id));
 const methods=[preferred,...Object.keys(evidenceNames).filter(k=>k!==preferred)];
 const options=eligible.flatMap(v=>methods.map(method=>{
 const member=roster.find(m=>m.id===v.id);
 return persuasionCase(game,member,v.vote,proposal,method,method===backgrounds[profile].bonus?'specialist':'crosscheck');
 }));
 const best=options.sort((a,b)=>Number(b.changed)-Number(a.changed)||b.fit-a.fit)[0];
 if(!best||!best.changed&&best.fit<.32)break;
 game=negotiate(game,best.id,proposal,focus,forecast,best.method,best.follow);
 }
 game=decide(game,proposal,focus,forecast);
 if(game.phase==='review')game=resolveReview(game,proposal);
 if(game.phase==='dots'){
 const r=game.pending.rate;
 const adjustment=game.state.inflation>2.6?.25:game.state.growth<game.state.capacity-.4?-.25:0;
 const median=Math.max(0,Math.min(10,r+adjustment));
 game=submitDots(game,[Math.max(0,median-.25),median,median]);
 }
 const remark=game.pending.ability?.kind==='politician'?game.pending.ability.choice:'conditional';
 game=onward(conclude(game,remark));
 }
 return game;
}
const seedAt=i=>Math.imul(i+1,2654435761)>>>0;
const average=(items,fn)=>items.reduce((sum,v)=>sum+fn(v),0)/items.length;
const counter=(items,fn)=>{const counts={};for(const row of items){const k=fn(row);counts[k]=(counts[k]??0)+1;}return counts;};
export async function balance(count){
 const out=new URL('./artifacts/phase3/',import.meta.url);
 await mkdir(out,{recursive:true});
 const cases=[],members={},examples={};
 for(const profile of profiles)for(const strategy of strategies)for(let i=0;i<count;i++){
 const seed=seedAt(i);
 const g=simulate(seed,profile,strategy), control=simulate(seed,profile,strategy,false);
 const verdict=historicalVerdict(g,reassess(g));
 const attempts=g.records.flatMap(r=>r.persuasion);
 const rates=g.records.map(r=>r.rate), alternative=control.records.map(r=>r.rate);
 cases.push({seed,profile,strategy,rates,attempts:attempts.length,changed:attempts.filter(p=>p.changed).length,decisive:g.records.filter(r=>r.persuasionDecisive).length,
 abilities:g.records.filter(r=>r.ability).length,abilityPathDifference:rates.some((r,i)=>r!==alternative[i]),
 abilityMacroDifference:['inflation','growth','stress','debtStock'].some(k=>Math.abs(g.state[k]-control.state[k])>.0001),
 pressure:g.records.filter(r=>r.government).length,approval:g.politics.approval,trust:g.market.trust,endInflation:g.state.inflation,endGrowth:g.state.growth,
 inflationError:verdict.score.inflationError,growthGap:verdict.score.growthGap,stress:verdict.score.stress,ending:verdict.title});
 for(const r of g.records)for(const v of r.votes.slice(1)){
 const row=members[v.name]??={ballots:0,initial:{},changes:0,attempts:0};
 row.ballots++;row.initial[v.initial]=(row.initial[v.initial]??0)+1;
 }
 for(const r of g.records)for(const p of r.persuasion){
 members[p.name].attempts++;if(p.changed)members[p.name].changes++;
 const snapshot={seed,profile,strategy,date:r.date,person:p.name,from:p.initial,to:p.final,method:p.method,proof:p.proof,outcome:p.outcome,trustBefore:p.trustBefore,trustAfter:p.trustAfter,passed:r.rate,without:r.noPersuasionRate};
 if(p.changed&&!examples.success)examples.success=snapshot;
 if(p.firstHardShift&&!examples.hardliner)examples.hardliner=snapshot;
 if(!p.changed&&!examples.failure)examples.failure=snapshot;
 if(p.changed&&r.persuasionDecisive&&!examples.decisive)examples.decisive=snapshot;
 }
 }
 const summarize=rows=>{
 const attempts=rows.reduce((sum,r)=>sum+r.attempts,0), changes=rows.reduce((sum,r)=>sum+r.changed,0);
 return {runs:rows.length,attempts,changes,successRate:changes/Math.max(1,attempts),
 decisive:rows.reduce((sum,r)=>sum+r.decisive,0),abilityUse:average(rows,r=>r.abilities),abilityUseRate:average(rows,r=>r.abilities/2),
 abilityPathDifference:average(rows,r=>Number(r.abilityPathDifference)),pressure:average(rows,r=>r.pressure),
 abilityMacroDifference:average(rows,r=>Number(r.abilityMacroDifference)),
 approval:average(rows,r=>r.approval),trust:average(rows,r=>r.trust),endInflation:average(rows,r=>r.endInflation),
 endGrowth:average(rows,r=>r.endGrowth),inflationError:average(rows,r=>r.inflationError),growthGap:average(rows,r=>r.growthGap),stress:average(rows,r=>r.stress),
 titles:counter(rows,r=>r.ending)};
 };
 const report={seeds:count,total:cases.length,byProfile:Object.fromEntries(profiles.map(p=>[p,summarize(cases.filter(r=>r.profile===p))])),
 byStrategy:Object.fromEntries(strategies.map(p=>[p,summarize(cases.filter(r=>r.strategy===p))])),all:summarize(cases),members,examples};
 await writeFile(new URL('balance.json',out),JSON.stringify(report,null,2));
 await writeFile(new URL('runs.json',out),JSON.stringify(cases));
 console.log(JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await balance(Number(process.argv[2]??128));


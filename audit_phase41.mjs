import {mkdir,writeFile} from 'node:fs/promises';
import {simulate} from './balance.mjs';
import {calibrateWatch,watchCalibration,watchOutcomes} from './dist/watch.mjs';
import {reassess} from './dist/game.mjs';
import {historicalVerdict} from './dist/verdict.mjs';
const roles=['scholar','official','politician'], strategies=['prices','growth','stability','practical'];
const n=96;
const direction=(rate,origin)=>rate>origin?'raise':rate<origin?'cut':'hold';
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const loss=(p,y,k)=>k?(p[k]/100-Number(y===k))**2:watchOutcomes.reduce((a,key)=>a+loss(p,y,key),0);
function runs(offset,withAbility=true,calibration={scale:1,hold:0,cut:0}){
 const previous={...watchCalibration};
 Object.assign(watchCalibration,calibration);
 try{
 return Array.from({length:n},(_,i)=>{
 const seed=Math.imul(offset+i,2654435761)>>>0;
 return roles.flatMap(role=>strategies.map(strategy=>({seed,role,strategy,g:simulate(seed,role,strategy,withAbility)})));
 }).flat();
 }finally{Object.assign(watchCalibration,previous);}
}
const rowsOf=games=>games.flatMap(({seed,role,strategy,g})=>g.records.map((r,i)=>({
 seed,role,strategy,round:i+1,roster:g.roster.join('-'),shock:!!r.incidents?.length,pivotal:r.persuasionDecisive,
 p:r.watchResult.before.probabilities,actual:r.watchResult.actual,
 stripped:r.review?null:direction(r.noActionRate,r.origin.rate),
 reaction:r.watchResult.reaction,surprise:r.watchResult.surprise,
 })));
const train=rowsOf(runs(257)), held=runs(353), rows=rowsOf(held);
const versions=[];
for(const scale of [1,1.15,1.3,1.45,1.6])for(const hold of [0,.2,.4,.6])for(const cut of [0,.3,.6,.9,1.2]){
 const params={scale,hold,cut};
 versions.push({params,loss:mean(train.map(r=>loss(calibrateWatch(r.p,params),r.actual)))});
}
const selected=versions.sort((a,b)=>a.loss-b.loss)[0].params;
for(const r of rows)r.after=calibrateWatch(r.p,selected);
const summary=(rs,p='p',target='actual')=>{
 const collection=rs.filter(r=>r[target]!==null);
 if(!collection.length)return null;
 return {n:collection.length,brier:mean(collection.map(r=>loss(r[p],r[target]))),
 classes:Object.fromEntries(watchOutcomes.map(k=>[k,{brier:mean(collection.map(r=>loss(r[p],r[target],k))),
 bins:Array.from({length:5},(_,i)=>{
 const b=collection.filter(r=>Math.min(4,Math.floor(r[p][k]/20))===i);
 return {from:i*20,n:b.length,forecast:b.length?mean(b.map(r=>r[p][k])):null,observed:b.length?100*mean(b.map(r=>Number(r[target]===k))):null};
 })}]))};
};
const clusters=Array.from(new Set(rows.map(r=>r.seed))).map(seed=>mean(rows.filter(r=>r.seed===seed).map(r=>loss(r.after,r.actual)-loss(r.p,r.actual))));
let rng=771;
const draws=Array.from({length:2000},()=>mean(clusters.map(()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return clusters[Math.floor(rng/4294967296*clusters.length)];}))).sort((a,b)=>a-b);
const groups=Object.fromEntries(['round','role','strategy','roster','shock','pivotal'].map(key=>{
 const map=new Map();
 for(const r of rows){if(!map.has(r[key]))map.set(r[key],[]);map.get(r[key]).push(r);}
 return [key,Object.fromEntries([...map].map(([k,v])=>[k,{n:v.length,seeds:new Set(v.map(r=>r.seed)).size,before:mean(v.map(r=>loss(r.p,r.actual))),after:mean(v.map(r=>loss(r.after,r.actual)))}]))];
}));
const deployed=runs(353,true,selected), off=runs(353,false,selected);
const paired=deployed.map((x,i)=>{
 const a=x.g,b=off[i].g;
 const attempts=g=>g.records.flatMap(r=>r.persuasion??[]);
 const government=g=>g.records.filter(r=>r.government?.justified).length;
 const accuracy=g=>g.records.flatMap(r=>r.verified??[]).filter(v=>v.actual===v.forecast).length;
 return {role:x.role,uses:a.records.filter(r=>r.ability).length,rate:Number(a.records.some((r,j)=>r.rate!==b.records[j].rate)),persuaded:attempts(a).filter(r=>r.changed).length-attempts(b).filter(r=>r.changed).length,trust:a.market.trust-b.market.trust,
 government:government(a)-government(b),approval:a.politics.approval-b.politics.approval,stress:a.state.stress-b.state.stress,accuracy:accuracy(a)-accuracy(b)};
});
const abilities=Object.fromEntries(roles.map(role=>[role,Object.fromEntries(Object.keys(paired[0]).filter(k=>k!=='role').map(k=>[k,mean(paired.filter(r=>r.role===role).map(r=>r[k]))]))]));
const titles={},subtitles={};
let voteImpact=0,lowApprovalSoftLanding=0;
for(const {g} of deployed){
 const v=historicalVerdict(g,reassess(g));
 titles[v.title]=(titles[v.title]??0)+1;subtitles[v.stewardship]=(subtitles[v.stewardship]??0)+1;
 if(v.title==='연착륙의 설계자'&&g.politics.approval<53)lowApprovalSoftLanding++;
 voteImpact+=g.records.filter(r=>r.persuasionDecisive).length;
}
const sample=rowsOf(deployed), cuts=sample.filter(r=>r.actual==='cut'&&r.surprise<-.1);
const report={selected,trainIDs:[257,352],holdoutIDs:[353,448],before:summary(rows),after:summary(rows,'after'),cluster95:[draws[50],draws[1950]],groups,
 neutral:{before:summary(rows,'p','stripped'),after:summary(rows,'after','stripped'),different:rows.filter(r=>r.stripped!==null&&r.stripped!==r.actual).length,
 changed:summary(rows.filter(r=>r.stripped!==null&&r.stripped!==r.actual)),unchanged:summary(rows.filter(r=>r.stripped===r.actual))},
 closedLoop:summary(sample),abilities,titles,subtitles,voteImpact,lowApprovalSoftLanding,
 market:{count:cuts.length,wonStrengthens:cuts.filter(r=>r.reaction.fxWon<0).length,longRises:cuts.filter(r=>r.reaction.longBps>0).length,
 typical:cuts.find(r=>r.reaction.fxWon>0&&r.reaction.longBps<0),reverseFX:cuts.find(r=>r.reaction.fxWon<0),reverseLong:cuts.find(r=>r.reaction.longBps>0)}};
const dir=new URL('./artifacts/phase41/',import.meta.url);await mkdir(dir,{recursive:true});
await writeFile(new URL('calibration.json',dir),JSON.stringify(report,null,2));
console.log(JSON.stringify({selected,before:report.before.brier,after:report.after.brier,cluster95:report.cluster95,closedLoop:report.closedLoop.brier,neutral:report.neutral.before.brier,different:report.neutral.different,abilities,titles,market:report.market},null,2));


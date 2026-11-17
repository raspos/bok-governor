import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {simulate} from './balance.mjs';
import {initial,advance} from './dist/economy.mjs';
import {reassess} from './dist/game.mjs';
import {historicalVerdict} from './dist/verdict.mjs';
import {getCommittee,persuasionCase} from './dist/committee.mjs';
import {scoreWatch} from './dist/watch.mjs';

const strategies=['prices','growth','stability','practical'];
const profiles=['scholar','official','politician'];
const average=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
export function quantiles(xs){
 if(!xs.length)return null;
 const values=[...xs].sort((a,b)=>a-b);
 const quantile=p=>{
 const index=(values.length-1)*p, lo=Math.floor(index);
 return values[lo]+(values[Math.ceil(index)]-values[lo])*(index-lo);
 };
 const mean=average(values);
 return {mean,median:quantile(.5),std:Math.sqrt(average(values.map(x=>(x-mean)**2))),p10:quantile(.1),p90:quantile(.9)};
}
export function fixedPolicyPath(records,shocks){
 let index=0, state=initial;
 return [state,...shocks.map((shock,i)=>{
 while(i>=records[index].endMonth)index++;
 state=advance(state,records[index].rate,shock);
 return state;
 })];
}
const shocksFrom=records=>records.flatMap(r=>r.shocks.slice(0,r.endMonth-r.origin.month));
const economicMetrics=path=>{
 const start=path[0], end=path.at(-1), months=path.slice(1);
 return {
 endInflation:end.inflation,endMomentum:end.growth,
 inflationError:average(months.map(s=>Math.abs(s.inflation-2))),
 outsideTargetMonths:months.filter(s=>Math.abs(s.inflation-2)>.5).length,
 contractionMonths:months.filter(s=>s.growth<0).length,
 belowPotentialMonths:months.filter(s=>s.growth-s.capacity<-.5).length,
 growthGap:average(months.map(s=>s.growth-s.capacity)),
 debtGrowth:end.debtStock-start.debtStock,loanCost:average(months.map(s=>s.loan)),
 stress:average(months.map(s=>s.stress)),instabilityMonths:months.filter(s=>s.stress>=45).length,
 imbalance:end.imbalance,fxVolatility:average(months.map((s,i)=>Math.abs(s.fx-path[i].fx))),
 };
};
const freq=(xs,key)=>xs.reduce((o,row)=>{const k=key(row);o[k]=(o[k]??0)+1;return o;},{});
const distribution=rows=>Object.fromEntries(Object.keys(rows[0]).map(k=>[k,quantiles(rows.map(r=>r[k]))]));
const comparable=(a,b)=>{
 const keys=['inflationError','stress','debtGrowth','fxVolatility'];
 return keys.every(k=>a[k]<=b[k]+1e-9)&&a.growthGap>=b.growthGap-1e-9&&
 (keys.some(k=>a[k]<b[k]-1e-9)||a.growthGap>b.growthGap+1e-9);
};

export async function audit(count=256){
 const natural={},fixed={},profileAudit={},notes={attempts:0,changes:0,decisiveRounds:0,individualPivots:0,jointOnly:0,winNoPivot:0,failTrustNonLoss:0,failTrustLoss:0,priorTrustChangedAttempts:0,priorTrustComparisons:0,lateNovGap:[],approvalQualified:0,approvalCaseCount:0,pressureConflict:0,pressureAligned:0,pressureRepeats:0,pressureRounds:0,instances:[],pivotalFirstVoteCount:{},lastStrategySpread:[],seventhStrategySpread:[],lowApprovalBalanced:0};
 const titles=[],stewardship=[],watchRecords=[];
 const pairs={};
 for(const key of strategies){natural[key]=[];fixed[key]=[];pairs[key]={different:0,dominatesAll:0,deltas:[]};}
 for(const profile of profiles)profileAudit[profile]=[];
 for(let i=0;i<count;i++){
 const seed=Math.imul(i+1,2654435761)>>>0;
 for(const profile of profiles){
 const games=Object.fromEntries(strategies.map(key=>[key,simulate(seed,profile,key)]));
 const common=shocksFrom(games.practical.records);
 const shared=Object.fromEntries(strategies.map(key=>[key,economicMetrics(fixedPolicyPath(games[key].records,common))]));
 const reference=shared.practical;
 notes.seventhStrategySpread.push(Math.max(...strategies.map(k=>games[k].records[6].rate))-Math.min(...strategies.map(k=>games[k].records[6].rate)));
 notes.lastStrategySpread.push(Math.max(...strategies.map(k=>games[k].records[7].rate))-Math.min(...strategies.map(k=>games[k].records[7].rate)));
 for(const strategy of strategies){
 const g=games[strategy], muted=simulate(seed,profile,strategy,false);
 const analysis=reassess(g), result=historicalVerdict(g,analysis);
 const m=economicMetrics(g.path);
 watchRecords.push(...g.records.map(r=>({watchResult:r.watchResult})));
 const gov=g.records.filter(r=>r.government);
 natural[strategy].push({...m,approval:g.politics.approval,trust:g.market.trust,governmentRounds:gov.length});
 fixed[strategy].push(shared[strategy]);
 const difference=Object.fromEntries(Object.keys(reference).map(k=>[k,shared[strategy][k]-reference[k]]));
 pairs[strategy].deltas.push(difference);
 if(Object.values(difference).some(d=>Math.abs(d)>1e-9))pairs[strategy].different++;
 if(strategies.filter(k=>k!==strategy).every(k=>comparable(shared[strategy],shared[k])))pairs[strategy].dominatesAll++;
 titles.push(result.title);
 stewardship.push(result.stewardship);
 if(g.politics.approval<53&&result.title==='연착륙의 설계자')notes.lowApprovalBalanced++;
 const abilities=g.records.filter(r=>r.ability);
 profileAudit[profile].push({
 abilityUses:abilities.length,rateChanged:Number(g.records.some((r,j)=>r.rate!==muted.records[j].rate)),
 stressDelta:g.state.stress-muted.state.stress,approvalDelta:g.politics.approval-muted.politics.approval,
 trustDelta:g.market.trust-muted.market.trust,expectedDelta:g.market.expected-muted.market.expected,
 governmentDelta:gov.length-muted.records.filter(r=>r.government).length,
 abilityTypes:abilities.map(r=>r.ability.choice),
 });
 notes.lateNovGap.push(g.state.inflation-analysis.novemberHold2027.inflation);
 // Compare the valid proposal and the same evidence with last meeting's trust reset.
 const priorTrust={};
 for(const [j,r] of g.records.entries()){
 const govt=r.government;
 if(govt){
 const type=govt.event.id;
 notes.pressureRounds++;
 if(j&&g.records[j-1].government?.event.id===type)notes.pressureRepeats++;
 if(['president','minister'].includes(type)){
 notes.approvalCaseCount++;
 if((g.records[j-1]?.politics.approval??55)<55)notes.approvalQualified++;
 const room=r.origin.inflation<2.4&&r.origin.growth<r.origin.capacity-.2&&r.origin.imbalance<48;
 if(room)notes.pressureAligned++;else notes.pressureConflict++;
 }
 }
 if(r.persuasionDecisive){
 notes.decisiveRounds++;
 const baseVotes=r.votes.filter(v=>{
 const p=r.persuasion.find(p=>p.id===v.id&&p.changed&&p.proposal===r.proposal);
 return p?p.initial===r.change:v.vote===r.change;
 }).length;
 notes.pivotalFirstVoteCount[baseVotes]=(notes.pivotalFirstVoteCount[baseVotes]??0)+1;
 const single=r.influence.filter(v=>v.withoutRate!==r.rate);
 notes.individualPivots+=single.length;
 if(!single.length)notes.jointOnly++;
 }
 for(const p of r.persuasion){
 notes.attempts++;
 if(p.changed)notes.changes++;
 if(p.changed&&!r.persuasionDecisive)notes.winNoPivot++;
 if(!p.changed){if(p.trustAfter<p.trustBefore)notes.failTrustLoss++;else notes.failTrustNonLoss++;}
 const context={ability:r.ability};
 const probe={...g,state:r.origin,context,memberTrust:{...priorTrust,[p.id]:p.trustBefore}};
 const member=getCommittee(g).find(m=>m.id===p.id);
 if(p.trustBefore!==55){
 notes.priorTrustComparisons++;
 const reset=persuasionCase({...probe,memberTrust:{...probe.memberTrust,[p.id]:55}},member,p.initial,p.proposal,p.method,p.follow);
 if(reset.final!==p.final)notes.priorTrustChangedAttempts++;
 }
 priorTrust[p.id]=p.trustAfter;
 const influence=r.influence.find(v=>v.id===p.id);
 const type=r.persuasionDecisive&&influence?.withoutRate!==r.rate&&influence?'pivotal':p.changed&&!r.persuasionDecisive?'nonPivotal':!p.changed?p.trustAfter<p.trustBefore?'failureLoss':'failurePreserved':null;
 if(type&&!notes.instances.some(row=>row.type===type))notes.instances.push({type,seed,profile,strategy,date:r.date,member:p.name,initial:p.initial,final:p.final,trustBefore:p.trustBefore,trustAfter:p.trustAfter,actual:r.rate,without:influence?.withoutRate,proof:p.proof});
 }
 }
 }
 }
 }
 const n=count*profiles.length;
 const metrics=Object.fromEntries(strategies.map(k=>[k,{natural:distribution(natural[k]),frozenShocks:distribution(fixed[k]),pairedVsPractical:distribution(pairs[k].deltas),changedVsPractical:pairs[k].different,dominatesAll:pairs[k].dominatesAll}]));
 const role=Object.fromEntries(profiles.map(k=>[k,{activeAbility:freq(profileAudit[k].flatMap(x=>x.abilityTypes),x=>x),
 statistics:distribution(profileAudit[k].map(({abilityTypes,...v})=>v))}]));
 const {rows:watchRows,...calibration}=scoreWatch(watchRecords);
 const example=watchRows.find(r=>r.headline&&r.next&&r.before.favorite!==r.actual);
 const base=watchRows.map(r=>r.actual);
 calibration.climatologyBrier=watchRows.length?1-Object.values(freq(base,x=>x)).reduce((sum,n)=>sum+(n/base.length)**2,0):null;
 calibration.example=example??null;
 const report={seeds:count,runs:n*strategies.length,perStrategy:n,metrics,roles:role,titles:freq(titles,x=>x),stewardship:freq(stewardship,x=>x),
 watch:calibration,
 persuasion:{...notes,lateNovGap:quantiles(notes.lateNovGap),seventhStrategySpread:quantiles(notes.seventhStrategySpread),lastStrategySpread:quantiles(notes.lastStrategySpread)}};
 const out=new URL('./artifacts/phase4/',import.meta.url);
 await mkdir(out,{recursive:true});
 await writeFile(new URL('balance.json',out),JSON.stringify(report,null,2));
 return report;
}
const main=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(main){
 const result=await audit(Number(process.argv[2]??256));
 console.log(JSON.stringify({runs:result.runs,titles:result.titles,stewardship:result.stewardship,persuasion:result.persuasion},null,2));
}

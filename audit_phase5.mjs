import {simulate} from './balance.mjs';
import {watchOutcomes} from './dist/watch.mjs';
const loss=(p,y)=>watchOutcomes.reduce((sum,k)=>sum+(p[k]/100-Number(k===y))**2,0);
const rows=[];
for(let i=1001;i<=1064;i++){
 const seed=Math.imul(i,2654435761)>>>0;
 for(const role of ['scholar','official','politician'])for(const strategy of ['prices','growth','stability','practical']){
  const r=simulate(seed,role,strategy,true).records[0],w=r.watchResult;
  const counter=r.noActionRate>r.origin.rate?'raise':r.noActionRate<r.origin.rate?'cut':'hold';
  rows.push({seed,actual:w.actual,counter,base:loss(w.before.baseline,w.actual),cal:loss(w.before.probabilities,w.actual),baseCounter:loss(w.before.baseline,counter),calCounter:loss(w.before.probabilities,counter)});
 }
}
const mean=(list,k)=>list.reduce((sum,r)=>sum+r[k],0)/list.length;
const paired=Object.values(Object.groupBy(rows,r=>r.seed)).map(group=>mean(group,'cal')-mean(group,'base'));
const avg=paired.reduce((a,b)=>a+b)/paired.length;
const se=Math.sqrt(paired.reduce((sum,n)=>sum+(n-avg)**2,0)/(paired.length-1)/paired.length);
console.log(JSON.stringify({seeds:paired.length,rows:rows.length,firstMeeting:{baseline:mean(rows,'base'),calibrated:mean(rows,'cal'),noActionBaseline:mean(rows,'baseCounter'),noActionCalibrated:mean(rows,'calCounter'),calibrationDifference:avg,approximate95PercentInterval:[avg-2*se,avg+2*se]},outcomes:Object.fromEntries(watchOutcomes.map(k=>[k,rows.filter(r=>r.actual===k).length]))},null,2));

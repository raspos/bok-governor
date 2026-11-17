import {clamp} from './economy.mjs';
import {dates} from './schedule.mjs';

export const watchOutcomes=['raise','hold','cut'];
const movesByOutcome={raise:.25,hold:0,cut:-.25};
const watchNames={raise:'인상',hold:'동결',cut:'인하'};
const pressureSign={war:.14,oil:.18,tariffs:-.14,finance:-.38,ai:-.22,fed:.26,chips:.12,fiscal:.20};
const dayMs=86400000;
const asOfDate=m=>m===0?'2027-01-01':new Date(Date.UTC(2027,m,0)).toISOString().slice(0,10);

export function publicWatchSnapshot(state,market,previous,date,events=[],asOf=asOfDate(state.month)){
 return {
 date,asOf,rate:state.rate,inflation:state.inflation,expectations:state.expectations,growth:state.growth,capacity:state.capacity,
 fx:state.fx,fed:state.fed,stress:state.stress,
 fxMove:previous?state.fx-previous.origin.fx:0,previousMove:previous?.change??0,
 pricedRate:market?.expected??state.rate,marketTrust:market?.trust??70,
 incidents:[...new Set(events.map(e=>e.id).filter(id=>Object.hasOwn(pressureSign,id)))],
 };
}
function roundProbabilities(logits){
 const peak=Math.max(...logits);
 const e=logits.map(x=>Math.exp(x-peak)), total=e.reduce((a,b)=>a+b,0);
 const raw=e.map(x=>100*x/total);
 const integers=raw.map(Math.floor);
 const order=raw.map((x,i)=>({i,fraction:x-integers[i]})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i);
 for(let i=0,left=100-integers.reduce((a,b)=>a+b,0);i<left;i++)integers[order[i].i]++;
 return Object.fromEntries(watchOutcomes.map((k,i)=>[k,integers[i]]));
}
export const watchCalibration={scale:1.6,hold:.6,cut:.9};
export function calibrateWatch(probabilities,calibration){
 return roundProbabilities(watchOutcomes.map(k=>probabilities[k]>0?
 Math.log(probabilities[k])*calibration.scale+(k==='raise'?0:calibration[k]):-Infinity));
}
export function forecastWatch(input){
 const span=Math.max(0,Math.round((Date.parse(input.date)-Date.parse(input.asOf))/dayMs));
 const factors=[
 {name:'현재와 예상 물가상승률',value:.86*(input.inflation-2)+.60*(input.expectations-2)},
 {name:'경기 흐름과 기초체력의 차이',value:.75*(input.growth-input.capacity)},
 {name:'원/달러 환율과 한미 금리차',value:.004*(input.fx-1440)+.25*(input.fed-input.rate-.75)},
 {name:'금융시장 위험과 환율 변동',value:-.034*Math.max(0,input.stress-31)+.0012*input.fxMove},
 {name:'직전 공개 결정',value:.48*input.previousMove},
 {name:'점도표·기자회견이 반영된 발표 전 시장 예상 금리',value:2.5*(input.pricedRate-input.rate)},
 {name:'공개된 경제 충격과 재정정책',value:input.incidents.reduce((a,id)=>a+pressureSign[id],0)},
 ];
 const pressure=clamp(factors.reduce((sum,v)=>sum+v.value,0),-3.7,3.7);
 const uncertainty=Math.min(.65,span/105+Math.max(0,input.stress-32)*.015+Math.abs(input.fxMove)*.001);
 const directional=pressure/(.9+uncertainty*.4);
 const logits=[input.rate<10?directional:-Infinity,.74-uncertainty,input.rate>0?-directional:-Infinity];
 const baseline=roundProbabilities(logits);
 const probabilities=calibrateWatch(baseline,watchCalibration);
 const expected=input.rate+(probabilities.raise-probabilities.cut)*.0025;
 const favorite=watchOutcomes.reduce((a,b)=>probabilities[b]>probabilities[a]?b:a,'hold');
 const index=scale=>Math.round(100/(1+Math.exp(-pressure*scale)));
 return {date:input.date,asOf:input.asOf,span,rate:input.rate,expected,probabilities,baseline,favorite,
 pressure7:index(.65),pressure30:index(1),factors:factors.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)).slice(0,3)};
}
export function currentWatch(game,visibleIncidents=[]){
 const previous=game.records.at(-1);
 const date=dates[game.turn];
 return forecastWatch(publicWatchSnapshot(game.state,game.market,previous,date,visibleIncidents));
}
export function releasedWatch(record,marketStages){
 const before=record.watch;
 const actual=record.rate>before.rate?'raise':record.rate<before.rate?'cut':'hold';
 const surprise=record.rate-before.expected;
 const result={actual,actualProbability:before.probabilities[actual],surprise,headline:before.probabilities[actual]<=20&&Math.abs(surprise)>=.15};
 const s=record.origin, final=marketStages.press;
 const pre=marketStages.prior;
 const repricing=final.expected-pre.expected;
 const risk=(s.stress-32)/20;
 // Immediate simulated quotes, separate from the monthly model.
 result.reaction={
 shortBps:(final.yield-pre.yield)*100,
 longBps:100*(.31*surprise+.52*repricing+.045*risk+.003*(pre.trust-final.trust)),
 fxWon:-16*surprise-13*repricing+2.6*risk+.8*(s.fed-s.rate-.75),
 stocksPct:-1.5*surprise-.85*repricing+.32*(s.growth-s.capacity)-.42*risk+.028*(final.trust-pre.trust),
 volatility:Math.abs(surprise)*14+Math.abs(repricing)*7+Math.max(0,risk)*3,
 };
 const idx=dates.indexOf(record.date), target=dates[idx+1]??'2028-01';
 const nextDate=idx<dates.length-1?target:'2028-01-01';
 const watchedState={...s,rate:record.rate};
 result.next=idx===dates.length-1?null:Object.fromEntries(['decision','dots','press'].map(stage=>[stage,
 forecastWatch(publicWatchSnapshot(watchedState,marketStages[stage],record,nextDate,record.incidents,record.date))]));
 // November has a six-month publication and handover, but no playable next-2027 meeting.
 result.terminalAnchor={decision:marketStages.decision.expected,dots:marketStages.dots.expected,press:final.expected};
 return {...result,before};
}
export function scoreWatch(records){
 const rows=records.flatMap(r=>r.watchResult?[r.watchResult]:[]);
 const brier=rows.length?rows.reduce((sum,r)=>sum+watchOutcomes.reduce((n,k)=>n+(r.before.probabilities[k]/100-Number(k===r.actual))**2,0),0)/rows.length:null;
 const bins=watchOutcomes.flatMap(outcome=>Array.from({length:5},(_,i)=>{
 const relevant=rows.filter(r=>Math.min(4,Math.floor(r.before.probabilities[outcome]/20))===i);
 const n=relevant.length;
 return {outcome,band:i*20,n,forecast:n?relevant.reduce((sum,r)=>sum+r.before.probabilities[outcome],0)/n:null,
 observed:n?100*relevant.filter(r=>r.actual===outcome).length/n:null};
 }).filter(r=>r.n));
 return {count:rows.length,brier,bins,surprises:rows.filter(r=>r.headline).length,rows};
}
export const watchOutcomeLabel=k=>watchNames[k];


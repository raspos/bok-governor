import {calm,clamp,project} from './economy.mjs';
import {dates} from './schedule.mjs';

export const goalKeys=['inflation','growth','debt','stress'];
export const policyMetrics=goalKeys;
export const policyMoves=[-.25,0,.25];
export const metricNotes={
 rate:'현재 적용되는 연 기준금리',inflation:'소비자물가 상승률(전년동월대비)',
 growth:'실질 GDP 성장률 동학 변수',capacity:'잠재성장률 추정치',
 gdpForecast:'연간 실질 GDP 성장률 전망치',gdpGap:'GDP갭률(잠재생산 대비 %)',
 cci:'경기동행지수 순환변동치(기준=100)',
 fx:'원/달러 환율',stress:'금융위험 지수(0~100, 높을수록 위험)',
 debt:'가계신용 증가율(연율)',debtStock:'가계부채 잔액 지수(기준=100)',
 housing:'주택가격 상승률',
 expectations:'기대인플레이션율',
 loan:'은행 대출금리',unemployment:'실업률',fed:'미국 연방기금 실효금리',
 oil:'브렌트유 가격(달러)',consumption:'민간소비 증가율',investment:'설비투자 증가율',
 imbalance:'부채·주택 과열 지수(0~100, 높을수록 과열)'
};
const decimals=k=>k==='stress'?1:2;
const rounded=(k,n)=>Number(n.toFixed(decimals(k)));
export const goalRate=(s,move)=>clamp(s.rate+move,0,10);
export const goalPeriod=(turn,s)=>{
 const next=dates[turn+1];
 const end=(next?Number(next.slice(5,7)):13)-1;
 return {months:end-s.month,end,label:next?'다음 금통위 전':'2027년 말'};
};
export function goalOptions(s){
 return [
 {key:'inflation',name:s.inflation>=2.2?'물가상승률을 낮추기':'물가상승률을 2% 부근으로 유지',limit:s.inflation>=2.2?rounded('inflation',s.inflation-.2):2.2,min:s.inflation>=2.2?null:1.8},
 {key:'growth',name:'실질 GDP 성장률 하락 방어',limit:null,min:rounded('growth',s.growth-.1)},
 {key:'debt',name:s.debt>.3?'가계신용 증가세를 늦추기':'가계신용 증가율을 0.3% 이내로 유지',limit:s.debt>.3?rounded('debt',s.debt-.3):.3,min:null},
 {key:'stress',name:s.stress>=35?'금융위험 완화':'금융위험을 현재 수준 가까이 유지',limit:rounded('stress',s.stress+(s.stress>=35?-2:1)),min:null}
 ];
}
export function chooseGoal(game,key){
 const option=goalOptions(game.state).find(g=>g.key===key);
 if(game.phase!=='meeting'||!option)throw Error('Invalid policy target');
 return {...game,context:{...game.context,goal:{...option,from:game.state[key],...goalPeriod(game.turn,game.state)}}};
}
const goalScenarios=[
 calm,
 {...calm,oil:8,world:-.35,risk:4},
 {...calm,oil:-5,world:.35,risk:-3}
];
const constantPath=(state,rate,months,shock)=>project(state,rate,Array(months).fill(shock)).at(-1);
export function goalForecast(state,months){
 return policyMoves.map(move=>{
 const rate=goalRate(state,move);
 const [center,...edges]=goalScenarios.map(shock=>constantPath(state,rate,months,shock));
 return {move,rate,center,range:Object.fromEntries(policyMetrics.map(k=>[
 k,[Math.min(center[k],...edges.map(x=>x[k])),Math.max(center[k],...edges.map(x=>x[k]))]
 ]))};
 });
}
export function goalMet(goal,value){
 const compared=rounded(goal.key,value);
 return (goal.limit===null||compared<=goal.limit)&&(goal.min===null||compared>=goal.min);
}
export function goalDifficulty(goal,rows){
 const central=rows.filter(r=>goalMet(goal,r.center[goal.key])).length;
 if(!central)return '기준 전망에서는 세 금리안 모두 목표 범위 밖';
 const robust=rows.some(r=>r.range[goal.key].every(x=>goalMet(goal,x)));
 return central+'개 금리안의 기준 전망이 목표 범위 안 · '+(robust?'시험한 충격에도 범위를 유지하는 안이 있음':'충격에 따라 미달 가능');
}
export function evaluateGoal(record,actual){
 const goal=record.goal;
 if(!goal)return null;
 const s=record.origin;
 const months=record.endMonth-s.month;
 const hold=constantPath(s,s.rate,months,calm);
 const proposal=constantPath(s,goalRate(s,record.proposal),months,calm);
 const enacted=constantPath(s,record.rate,months,calm);
 const k=goal.key;
 return {actual:actual[k],met:goalMet(goal,actual[k]),carry:hold[k]-s[k],proposal:proposal[k]-hold[k],
 vote:enacted[k]-proposal[k],shock:actual[k]-enacted[k],
 effects:Object.fromEntries(policyMetrics.filter(key=>key!==k).map(key=>[key,actual[key]-s[key]]))};
}

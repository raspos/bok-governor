import {initial,tape,project,clamp,neutralRate,calm,derivedMacro} from './economy.mjs';
import {dates} from './schedule.mjs';
import {isRelease,memberDots,publishDots,pressQuestion,marketResponse,openingMarket,communicationLegacy} from './dots.mjs';
import {activeIncidents,scenarioShocks,crisisResponses,dilemma,startScenarios,seededDraw} from './scenarios.mjs';
import {openingPolitics,governmentEvent,governmentReply,requestsReview,reconsider,updatePolitics} from './politics.mjs';
import {backgrounds,getCommittee,selectRoster,persuasionCase,memberMemory,voteRunoff,evidenceNames} from './committee.mjs';
import {policyPressure} from './committee.mjs';
import {persuasionLeft} from './abilities.mjs';
import {currentWatch,releasedWatch,scoreWatch} from './watch.mjs';
import {evaluateGoal} from './goals.mjs';
import {conferenceFor,conferenceSummary} from './press.mjs';
const originalThresholds=[[.40,-.34],[.30,-.10],[.43,-.29],[.28,-.12],[.35,-.50],[.32,-.42]];
export const briefs={prices:'물가의 목표 복귀',activity:'내수와 고용의 하방 위험',markets:'환율과 금융안정'};
export const moves=[-.25,0,.25];
export const label=d=>d>0?'0.25%p 인상':d<0?'0.25%p 인하':'동결';
export const legacyKeys=['debtStock','imbalance','expectations','capacity'];
const meetingMonths=dates.map(date=>Number(date.slice(5,7)));
export function start(seed,background,scenarioId='standard'){
 if(background&&!Object.hasOwn(backgrounds,background))throw Error('Invalid background');
 const pool=['standard','inflation','stagnation','fx','debt','chips'];
 const id=scenarioId==='random'?pool[Math.floor(seededDraw(seed,0,7719)*pool.length)]:scenarioId;
 const chosen=startScenarios[id]??startScenarios.standard;
 const st={...chosen.state};
 const mkt={...chosen.market};
 return {seed:seed>>>0,scenario:chosen.id,turn:0,phase:'office',state:st,path:[{...st}],records:[],market:mkt,politics:openingPolitics(),
 ...(background?{background,roster:selectRoster(seed),memberTrust:{}}:{})};
}
export function briefing(game){
 const last=game.records.at(-1);
 return dilemma(game.state,last?last.shocks.slice(0,last.endMonth-last.origin.month):[]);
}
export function begin(game){
 if(game.phase!=='office')throw Error('No meeting to open');
 const events=activeIncidents(game),government=governmentEvent(game,events);
 const urgent=events.some(e=>e.start===game.state.month)||events.length>0&&game.state.stress>=42;
 return {...game,context:{events,government,watch:currentWatch(game,events)},phase:urgent?'crisis':government?'government':'meeting'};
}
export function respondCrisis(game,response){
 if(game.phase!=='crisis'||!Object.hasOwn(crisisResponses,response))throw Error('Invalid crisis response');
 return {...game,context:{...game.context,response},phase:game.context.government?'government':'meeting'};
}
export function respondGovernment(game,reply){
 if(game.phase!=='government')throw Error('No government event');
 return {...game,context:{...game.context,interaction:governmentReply(game,reply)},phase:'meeting'};
}
export function opinions(s,focus,proposal=0,forecast='보합',market=openingMarket,game={}){
 return getCommittee(game).map((member,i)=>{
 const [p,g,f,x]=member.weights;
 const signals={prices:p*(s.inflation-2+.22*(s.expectations-2)),activity:g*(s.growth-s.capacity),markets:f*((s.debt-3)*.2+(s.imbalance-40)*.018)-f*(s.stress-30)*.065+x*(s.fx-1400)/110};
 const evidence=signals[focus];
 const [raise,cut]=game.roster?[.41-.28*member.bias,-.32-.34*member.bias]:originalThresholds[i];
 const score=signals.prices+signals.activity+signals.markets-.54*(s.rate-neutralRate)+(.06+.08*x)*(market.expected-s.rate)+(game.roster?policyPressure(member.id,s):0);
 // A supported proposal can move a close vote. An unsupported proposal adds no weight.
 const plausible=forecast==='상승'?s.inflation>2.35&&s.expectations>2.25:forecast==='하락'?s.growth<s.capacity&&s.inflation>2:Math.abs(s.inflation-2)<.45;
 const flex=member.flexibility??.5;
 const alignBonus=proposal*evidence>0?Math.abs(evidence)*(plausible?.65:.35):0;
 const biasAlign=(proposal*member.bias>0)?Math.abs(member.bias)*.14:0;
 const govInfluence=proposal===0
  ?(Math.abs(score)<.50?-Math.sign(score)*.08*flex:0)
  :(proposal*evidence>0||Math.abs(evidence)<.25)
   ?Math.sign(proposal)*Math.min(game.roster?.24:.28, alignBonus + .08*flex + biasAlign)
   :0;
 const judgment=score+govInfluence;
 const risk=Object.keys(signals).sort((a,b)=>Math.abs(signals[b])-Math.abs(signals[a]))[0];
 const macro=derivedMacro(s,game.records?.at(-1)?.origin);
 const activityText=macro.gdpRevision<0&&macro.gdpGap<0
  ?'성장률 전망이 지난 회의보다 낮아졌습니다. GDP갭도 마이너스 폭이 커지고 있고요. 지금은 금리 인하를 검토할 필요가 있다고 봅니다.'
  :macro.gdpGap>0
  ?'성장률 전망이 '+macro.gdpForecast.toFixed(1)+'%로 견조하고 GDP갭률도 +'+macro.gdpGap.toFixed(1)+'%로 잠재생산을 웃돌아 수요측 물가 압력에 유의해야 합니다.'
  :'실질 GDP 성장률 전망 '+macro.gdpForecast.toFixed(1)+'%, GDP갭률 '+macro.gdpGap.toFixed(1)+'% (경기동행지수 '+macro.cci.toFixed(1)+'p)';
 const details={prices:'소비자물가 상승률 '+s.inflation.toFixed(2)+'%, 기대인플레이션 '+s.expectations.toFixed(2)+'%',activity:activityText,markets:'환율 '+Math.round(s.fx)+'원, 금융위험 '+Math.round(s.stress)+'/100'};
 const initial=score>raise?.25:score<cut?-.25:0;
 const vote=judgment>raise?.25:judgment<cut?-.25:0;
 const negotiated=game.context?.persuasion?.filter(a=>a.id===member.id&&a.proposal===proposal).at(-1);
 return {id:member.id,name:member.name,role:i===0?'부총재':'위원',philosophy:member.philosophy,initial,vote:negotiated?.final??vote,reason:briefs[risk],detail:details[risk],persuaded:negotiated?.changed??(vote!==initial)};
 });
}
export function negotiate(game,id,proposal,focus,forecast,method,follow){
 const prior=game.context?.persuasion??[];
 const specialist=follow==='specialist'&&(backgrounds[game.background]??backgrounds.scholar).bonus===method;
 if(game.phase!=='meeting'||persuasionLeft(game)<=0||prior.some(p=>p.id===id)||!moves.includes(proposal)||!Object.hasOwn(evidenceNames,method)||!specialist&&!['crosscheck','insist'].includes(follow))throw Error('Invalid persuasion');
 const member=getCommittee(game).find(m=>m.id===id);
 if(!member)throw Error('Unknown committee member');
 const current=opinions(game.state,focus,proposal,forecast,game.market,game).find(m=>m.id===id);
 if(current.vote===proposal)throw Error('Member already supports the motion');
 const used=persuasionCase(game,member,current.vote,proposal,method,follow);
 used.firstHardShift=used.changed&&Math.abs(member.bias)>=.32&&!game.records.some(r=>r.persuasion?.some(p=>p.id===id&&p.changed));
 return {...game,context:{...game.context,events:game.context?.events??activeIncidents(game),persuasion:[...prior,used],draft:{proposal,focus,forecast}}};
}
export function decide(game,proposal,focus,forecast){
 if(game.phase!=='meeting'||!moves.includes(proposal)||!Object.hasOwn(briefs,focus)||!['하락','보합','상승'].includes(forecast))throw new Error('Invalid decision');
 const s=game.state;
 const votes=[{name:'총재',vote:proposal,initial:proposal,reason:briefs[focus]},...opinions(s,focus,proposal,forecast,game.market,game)];
 const {change,runoff}=voteRunoff(votes);
 const rate=clamp(s.rate+change,0,10);
 const persuasiveActions=game.context?.persuasion??[];
 const without=actions=>clamp(s.rate+voteRunoff([votes[0],...opinions(s,focus,proposal,forecast,game.market,{...game,context:{...game.context,persuasion:actions}})]).change,0,10);
 const noPersuasionRate=persuasiveActions.length?without([]):rate;
 const neutralBallots=[{vote:0},...opinions(s,'prices',0,'보합',game.market,{...game,context:undefined})];
 const noActionRate=clamp(s.rate+voteRunoff(neutralBallots).change,0,10);
 const influence=persuasiveActions.filter(p=>p.changed&&p.proposal===proposal).map(p=>({id:p.id,withoutRate:without(persuasiveActions.filter(a=>a.id!==p.id))}));
 const through=(meetingMonths[game.turn+1]??13)-1;
 const baseShocks=tape(game.seed,36).slice(s.month,s.month+6);
 const ability=game.context?.ability??null;
 const coordinated=ability?.kind==='official'&&ability.choice!=='mediation';
 const events=game.context?.events??activeIncidents(game), response=coordinated?ability.choice:game.context?.response??'observe';
 const shocks=scenarioShocks(baseShocks,s.month,events,response,s);
 const date=dates[game.turn];
 const pending={date,proposal,rate,votes,runoff,forecast,focus,change:rate-s.rate,shocks,baseShocks,origin:s,endMonth:through,incidents:events,response,government:game.context?.interaction??null,persuasion:persuasiveActions,ability,noPersuasionRate,noActionRate,influence,persuasionDecisive:rate!==noPersuasionRate,watch:game.context?.watch??currentWatch(game)};
 if(game.context?.goal)pending.goal=game.context.goal;
 if(requestsReview(game,pending))return {...game,phase:'review',pending};
 return finishVote(game,pending);
}
function finishVote(game,pending){
 if(isRelease(pending.date))return {...game,phase:'dots',pending};
 pending.internalDots=memberDots({...pending.origin,rate:pending.rate},getCommittee(game).map(m=>m.weights));
 return {...game,phase:'press',pending:{...pending,question:pressQuestion(game.records,pending)}};
}
export function resolveReview(game,motion){
 if(game.phase!=='review'||!moves.includes(motion))throw Error('Invalid review motion');
 const r=game.pending;
 const committee=opinions(r.origin,r.focus,motion,r.forecast,game.market,game);
 const ballots=[motion,...committee.map(v=>v.vote)];
 const alternatives=moves.filter(v=>v!==r.change);
 const runoff=ballots.map(v=>alternatives.includes(v)?v:[...alternatives].sort((a,b)=>Math.abs(v-a)-Math.abs(v-b)||Math.abs(a)-Math.abs(b))[0]);
 const review=reconsider(r,ballots,runoff);
 const rate=clamp(r.origin.rate+review.change,0,10);
 return finishVote(game,{...r,review,rate,change:rate-r.origin.rate,committeePersuasionDecisive:r.persuasionDecisive??false,persuasionDecisive:false});
}
export function submitDots(game,points){
 if(game.phase!=='dots')throw Error('No dot release pending');
 const pending={...game.pending,dots:publishDots(game.pending,points,getCommittee(game).map(m=>m.weights))};
 return {...game,phase:'press',pending:{...pending,question:pressQuestion(game.records,pending)}};
}
export function conclude(game,remark){
 if(game.phase!=='press')throw Error('No press conference pending');
 const {pending,context,...settled}=game;
 const politicsBefore=game.politics??openingPolitics();
 const interval=pending.shocks.slice(0,pending.endMonth-pending.origin.month);
 const played=project(pending.origin,pending.rate,interval).slice(1);
 const path=[...game.path,...played];
 const verified=game.records.filter(r=>r.origin.month+6>pending.origin.month&&r.origin.month+6<=pending.endMonth).map(r=>{
 const delta=path[r.origin.month+6].inflation-r.origin.inflation;
 const actual=delta>.15?'상승':delta<-.15?'하락':'보합';
 return {date:r.date,forecast:r.forecast,actual};
 });
 // Publication-day prices can use forecast verifications from completed intervals only.
 const publishedChecks=game.records.at(-1)?.verified??[];
 const previous=game.records.at(-1);
 const brokenPledge=previous?.pressSummary?.pledged&&previous.goalResult&&!previous.goalResult.met?1:0;
 const forecastTrust=clamp(publishedChecks.reduce((sum,r)=>sum+(r.forecast===r.actual?1:-1),0),-2,2)-brokenPledge;
 const prior=game.market??openingMarket;
 const conference=pending.conference?conferenceFor(game):null;
 const pressSummary=conferenceSummary(conference);
 if(pressSummary)remark=pressSummary.tone>0?'prices':pressSummary.tone<0?'activity':'conditional';
 const publication=pressSummary?{...pending,conference,pressSummary}:pending;
 const market=marketResponse(prior,publication,pending.question,remark,politicsBefore,forecastTrust);
 const record={...publication,background:game.background,market,verified,persuasion:(pending.persuasion??[]).map(item=>({...item}))};
 if(pending.goal)record.goalResult=evaluateGoal(pending,played.at(-1));
 if(pending.watch){
 const decision=marketResponse(prior,pending,pending.question,remark,politicsBefore,0,'decision');
 const dots=marketResponse(prior,pending,pending.question,remark,politicsBefore,0,'dots');
 record.watchResult=releasedWatch(pending,{prior,decision,dots,press:market});
 }
 if(game.background===undefined)delete record.background;
 const memberTrust=memberMemory(game,record,played.at(-1));
 const politics=updatePolitics(politicsBefore,record,played.at(-1));
 record.politics={...politics};
 if(isRelease(record.date)){
 const previous=[...game.records].reverse().find(r=>r.poll);
 record.poll={...politics,change:politics.approval-(previous?.poll.approval??55),date:record.date};
 }
 return {...settled,market,politics,memberTrust,phase:'result',state:played.at(-1),path,records:[...game.records,record]};
}
export function onward(g){if(g.phase!=='result'&&g.phase!=='newspaper')throw new Error('Invalid transition');return {...g,turn:g.turn+1,phase:g.turn+1===dates.length?'end':'office'};}
export function compare(record, alternative){return project(record.origin,clamp(record.origin.rate+alternative,0,10),record.shocks);}
export function meetingImpact(record){
 const actual=project(record.origin,record.rate,record.shocks);
 const held=compare(record,0);
 const month=record.endMonth-record.origin.month;
 return {actual:actual[month],held:held[month],shocks:record.shocks.slice(0,month)};
}
export function reassess(g){
 if(g.phase!=='end'||g.state.month!==12)throw new Error('Finish 2027 before reassessment');
 const shocks=tape(g.seed,36);
 const historical=shocks.slice(0,12);
 for(const r of g.records)for(let m=r.origin.month;m<r.endMonth;m++)historical[m]=r.shocks[m-r.origin.month];
 const baseline=project(initial,initial.rate,historical).at(-1);
 const future=shocks.slice(12);
 // The control keeps the same end-2027 fast state and replaces only inherited stocks.
 const control={...g.state,...Object.fromEntries(legacyKeys.map(k=>[k,baseline[k]]))};
 const last=g.records.at(-1);
 const novemberHold=project(last.origin,last.origin.rate,last.shocks.slice(0,last.endMonth-last.origin.month)).at(-1);
 const played=project(g.state,neutralRate,future);
 const finalDot=last.dots?{median:last.dots.median,target:last.dots.target,successorRate:played[5].rate,expected:last.market?.expected??null}:null;
 return {
 played,
 novemberHold:project(novemberHold,neutralRate,future).at(-1),
 novemberHold2027:novemberHold,
 finalDot,
 watch:scoreWatch(g.records),
 legacyControl:project(control,neutralRate,future),
 calmFuture:project(g.state,neutralRate,future.map(e=>({...calm,sensitivity:e.sensitivity}))),
 baseline,
 communication:communicationLegacy(g.records,g.market??openingMarket),
 };
}


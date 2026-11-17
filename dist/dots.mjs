import {clamp,neutralRate,project,calm} from './economy.mjs';

export const isRelease=date=>['02','05','08','11'].includes(date.slice(5,7));
export const rateLevels=Array.from({length:41},(_,i)=>i/4);
export function horizon(date){
 const year=Number(date.slice(0,4)), month=Number(date.slice(5,7))+6;
 return (year+Math.floor((month-1)/12))+'-'+String((month-1)%12+1).padStart(2,'0');
}
const quarter=x=>Math.round(clamp(x,0,10)*4)/4;
const middle=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const baseline6=s=>project(s,s.rate,Array(6).fill(calm)).at(-1);

export function memberDots(s,preferences){
 const outlook=baseline6(s);
 return preferences.map(([p,g,f,x],i)=>{
 const pressure=p*(.65*(s.inflation-2)+.35*(outlook.inflation-2))
 +g*(.55*(s.growth-s.capacity)+.45*(outlook.growth-outlook.capacity))
 +f*(.15*(s.debt-3)+.025*(s.imbalance-40)-.052*(s.stress-30))
 +x*(s.fx-1440)/170;
 const center=.58*s.rate+.42*neutralRate+.68*pressure;
 const spread=.06+i*.026+Math.max(0,s.stress-30)*.005;
 return [-spread,0,spread].map(offset=>quarter(center+offset));
 });
}
export function aggregate(points,current){
 if(!points.every(x=>rateLevels.includes(x))||points.length!==21||!rateLevels.includes(current))throw Error('Invalid dot distribution');
 const counts=rateLevels.map(rate=>({rate,count:points.filter(x=>x===rate).length})).filter(row=>row.count);
 return {counts,median:middle(points),mean:mean(points),lower:points.filter(x=>x<current).length,
 same:points.filter(x=>x===current).length,higher:points.filter(x=>x>current).length};
}
export function publishDots(record,player,preferences){
 if(!isRelease(record.date)||!Array.isArray(player)||player.length!==3||!player.every(x=>rateLevels.includes(x)))throw Error('Invalid governor dots');
 const members=memberDots({...record.origin,rate:record.rate},preferences);
 return {date:record.date,target:horizon(record.date),current:record.rate,player:[...player],members,
 ...aggregate([...player,...members.flat()],record.rate)};
}

export const remarks={
 prices:'현재 물가와 예상 물가가 높으면 추가 인상을 검토하겠다고 발표한다',
 activity:'경기와 금융위험을 살핀 뒤 금리를 조정하겠다고 발표한다',
 conditional:'전망의 전제와 재검토 조건을 밝힌다',
 reaffirm:'여건 변화와 무관하게 이전 전망을 재확인한다',
};
export const openingMarket={expected:3,yield:3.25,trust:70,unexplained:0};

export function pressQuestion(records,record){
 const last=[...records].reverse().find(r=>r.dots);
 const personalGap=record.dots?middle(record.dots.player)-middle(record.dots.members.flat()):0;
 const opposing=!!record.dots&&Math.sign(record.dots.median-record.rate)*Math.sign(record.change)===-1;
 const tension=Math.abs(personalGap)>=.50||opposing;
 if(!last)return {challenge:!!tension,credible:tension?['conditional']:[],prior:null,personalGap,opposing};
 const old=last.origin, s=record.origin;
 const credible=[];
 if(Math.abs(s.inflation-old.inflation)>=.20||Math.abs(s.expectations-old.expectations)>=.12)credible.push('prices');
 if(Math.abs(s.growth-old.growth)>=.25||Math.abs(s.stress-old.stress)>=5||Math.abs(s.fx-old.fx)>=22)credible.push('activity');
 const revision=record.dots?record.dots.median-last.dots.median:0;
 const differentFromPast=Math.abs(record.rate-last.dots.median)>=.5||Math.abs(revision)>=.5;
 if(tension&&!differentFromPast)credible.push('conditional');
 return {challenge:!!(differentFromPast||tension),credible,personalGap,opposing,
 prior:last.dots,signals:{inflation:s.inflation-old.inflation,growth:s.growth-old.growth,stress:s.stress-old.stress,fx:s.fx-old.fx}};
}

export const publicGuidanceShift=(tone,trust)=>tone*.09*(.5+trust/200);
export function marketResponse(prior,record,question,remark,optics,forecastTrust=0,stage='press'){
 if(!Object.hasOwn(remarks,remark))throw Error('Invalid press response');
 const press=stage==='press';
 const transcript=press?record.pressSummary:null;
 const explained=press&&(transcript?transcript.grounded>=2:question.credible.includes(remark)||(remark==='conditional'&&question.credible.length>0));
 const unexplained=prior.unexplained+(press&&question.challenge&&!explained?1:0);
 const engagement=record.government?.justified?1:record.government?.concession&&record.change<0?-3:0;
 const communication=press?communicationEffect(record,remark):{trust:0,expectations:0,approval:0};
 const assessment=transcript?transcript.trust+(question.challenge&&!explained&&unexplained>1?-2:0):(question.challenge?(explained?2:unexplained>1?-5:0):remark==='reaffirm'?-1:1);
 const trust=press?clamp(prior.trust+engagement+communication.trust+forecastTrust+assessment,0,100):prior.trust;
 const s=record.origin;
 const fundamentals=.38*(s.inflation-2)+.25*(s.growth-s.capacity)-.016*(s.stress-30);
 const dotSurprise=stage!=='decision'&&record.dots?(.7*record.dots.median+.3*record.dots.mean)-prior.expected:0;
 const policySurprise=record.rate-(record.watch?.expected??(.65*s.rate+.35*prior.expected));
 const credibleTone=question.challenge&&!explained?.35:1;
 const repeated=remark===prior.remark?.55:1;
 const spokenPath=transcript?.holdGuidance?clamp((record.rate-prior.expected)*.16,-.06,.06):publicGuidanceShift(transcript?.tone??0,prior.trust);
 const statement=press?credibleTone*repeated*(transcript?spokenPath:remark==='prices'?.06*Math.sign(s.inflation-2):remark==='activity'?.06*Math.sign(s.growth-s.capacity):0):0;
 const expected=clamp(prior.expected+.26*(record.rate-prior.expected)+.24*fundamentals+.24*policySurprise+(.18+.18*trust/100)*dotSurprise+statement+communication.expectations,0,10);
 const uncertainty=Math.max(0,70-(optics?.confidence??70))*.004+Math.max(0,72-(optics?.independence??72))*.003;
 const termPremium=.18+.004*(100-trust)+.004*(s.stress-30)+uncertainty;
 const marketYield=clamp(.35*record.rate+.65*expected+termPremium,0,12);
 return {expected,yield:marketYield,trust,unexplained,dotSurprise,policySurprise,explained,remark,communication,forecastTrust,
 shift:expected-prior.expected,yieldShift:marketYield-prior.yield};
}
export function communicationLegacy(records,market){
 const released=records.filter(r=>r.dots), communicated=records.filter(r=>r.market);
 const above=released.filter(r=>middle(r.dots.player)>r.rate).length;
 const below=released.filter(r=>middle(r.dots.player)<r.rate).length;
 const flexible=communicated.filter(r=>r.question.challenge&&r.market.explained).length;
 const volatility=communicated.length?mean(communicated.map(r=>Math.abs(r.market.shift))):null;
 const title=!released.length?'':market.unexplained>=2?'상충하는 신호를 남긴 총재':
 above>=3?'높은 금리 경로를 제시한 총재':below>=3?'낮은 금리 경로를 제시한 총재':
 flexible>=2?'여건에 맞춰 전망을 조정한 총재':market.trust>=73&&volatility<.20?'시장 기대를 안정적으로 관리한 총재':'조건부 경로를 제시한 총재';
 return {title,above,below,flexible,volatility,trust:market.trust,unexplained:market.unexplained,releases:released.length};
}

import {communicationEffect} from './abilities.mjs';

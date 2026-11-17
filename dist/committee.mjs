import {clamp} from './economy.mjs';
import {seededDraw} from './scenarios.mjs';
import {researchEvidence} from './abilities.mjs';

export const backgrounds={
 scholar:{name:'저명한 경제학자',focus:'모형과 통계',argument:'모형의 경로와 관측 지표를 대조한다',government:'추정과 관측을 구분해 독립적 판단 근거를 제시한다',rebuttal:'기대물가와 실측 물가를 함께 대조해 전망의 전제를 검증한다',bonus:'model'},
 official:{name:'경제 관료',focus:'위기관리와 정책 조율',argument:'정책수단별 효과와 부작용을 구분한다',government:'재정 집행과 금융안정 대응의 역할을 나눈다',rebuttal:'유동성 지원과 기준금리의 역할을 나눠 금융 위험을 검토한다',bonus:'stability'},
 politician:{name:'경제 전문가 출신 정치인',focus:'국민 생활과 협상',argument:'가계·기업이 실제로 부담하는 비용을 비교한다',government:'생활비와 고용 위험을 기준으로 공조 조건을 협의한다',rebuttal:'이자 부담과 고용의 상충을 가계와 기업 관점에서 설명한다',bonus:'households'},
};
const entries=[
 ['서윤정','물가 연구','물가 목표 우선',.85,.32,.16,.12,.8,.42,.76,'model',true,.35],
 ['강현우','노동경제','고용과 내수',.35,.95,.22,.10,.65,.68,.54,'households',true,-.25],
 ['윤서진','은행 감독','부채·주택 과열 점검',.42,.30,.78,.19,.82,.64,.66,'stability',true,.10],
 ['정민석','국제금융','외환시장 안정',.45,.48,.15,.62,.85,.54,.64,'stability',false,.11],
 ['한지영','산업경제','경기와 물가의 균형',.55,.65,.36,.16,.67,.73,.49,'model',false,0],
 ['백도현','통화정책','기대물가와 정책 여력',.64,.42,.44,.28,.91,.43,.69,'model',true,.22],
 ['김태준','채권시장','인플레이션 위험 조기 대응',.94,.28,.32,.41,.90,.35,.91,'model',true,.52],
 ['문하린','가계금융','상환 부담과 소비 안정',.35,.76,.47,.19,.64,.81,.48,'households',false,-.36],
 ['오세림','성장·생산성','투자 여력의 장기 보전',.43,.87,.25,.25,.78,.70,.55,'model',false,-.20],
 ['이지후','금융위기 연구','신용경색 대응 우선',.50,.50,.95,.20,.87,.65,.71,'stability',false,-.05],
 ['최다빈','국제거시경제','수입물가와 환율 위험',.78,.44,.27,.89,.84,.51,.77,'model',false,.32],
 ['박준서','지역 및 중소기업','지역고용과 기업 자금조달',.31,.93,.40,.15,.72,.78,.52,'households',false,-.42],
];
export const memberPool=entries.map(([name,career,philosophy,p,g,f,x,independence,flexibility,resistance,evidence,deputy,bias],id)=>({id,name,career,philosophy,weights:[p,g,f,x],independence,flexibility,resistance,evidence,deputy,bias}));
export function selectRoster(seed){
 const ordered=[...memberPool].sort((a,b)=>seededDraw(seed,a.id,59827)-seededDraw(seed,b.id,59827));
 const deputy=ordered.find(m=>m.deputy);
 return [deputy,...ordered.filter(m=>m!==deputy).slice(0,5)].map(m=>m.id);
}
export const getCommittee=game=>(game.roster??[0,1,2,3,4,5]).map(id=>memberPool[id]);
export const evidenceNames={model:'모형·기대물가',stability:'금융안정·정책 조합',households:'가계 부담·고용'};
const principles=[
 ['기대물가가 목표를 벗어나면 조기 대응',s=>.24*(s.expectations-2)],
 ['일자리 악화가 내수에 번지면 완화',s=>-.36*Math.max(0,s.unemployment-3.2)],
 ['대출 과열과 신용경색은 따로 대응',s=>.015*(s.imbalance-40)-.026*Math.max(0,s.stress-39)],
 ['원화 약세와 조달 여건을 함께 점검',s=>.003*(s.fx-1440)+.08*(s.fed-s.rate)],
 ['투자와 소비가 엇갈릴 때는 내수 확인',s=>.18*(s.consumption-s.investment)],
 ['이미 집행된 긴축의 시차를 반영',s=>-.24*(s.gaps.at(1)??0)],
 ['기대물가가 고착되면 조기 긴축',s=>.30*Math.max(0,s.expectations-2.2)-.16*Math.max(0,1.55-s.growth)],
 ['차주의 이자 부담과 소비를 우선 검증',s=>-.21*Math.max(0,s.loan-4.15)],
 ['설비투자 위축이 장기 성장에 미칠 영향 점검',s=>.21*(s.investment-s.capacity)],
 ['자금 경색에는 유동성 공급과 금리를 구분',s=>-.045*Math.max(0,s.stress-36)],
 ['유가·환율 상승의 물가 전이를 확인',s=>.008*(s.oil-75)+.002*(s.fx-1440)],
 ['소비 부진과 중소기업 자금비용의 동반 악화 점검',s=>.15*(s.consumption-1.7)-.13*(s.loan-4.07)],
];
export const policyPrinciple=id=>principles[id][0];
export const policyPressure=(id,s)=>clamp(principles[id][1](s),-.32,.32);
export function evidenceStrength(s,d,method){
 const direction=Math.sign(d);
 const prices=.65*(s.inflation-2)+.8*(s.expectations-2);
 const activity=s.growth-s.capacity;
 const stress=Math.max(0,s.stress-32);
 const imbalance=(s.imbalance-40)*.05+(s.debt-3)*.16;
 const pressures={model:prices+.65*activity,stability:imbalance-stress*.10+(s.fx-1440)*.007,households:.55*prices+.90*activity-.35*(s.loan-4.07)};
 const hold=.36+Math.min(.62,Math.max(0,prices)*Math.max(0,-activity)*.75+stress*.011);
 return d===0?hold:clamp(direction*pressures[method],0,1.75);
}
export function persuasionCase(game,member,initialVote,proposal,method,follow){
 const profile=backgrounds[game.background]??backgrounds.scholar;
 const fit=evidenceStrength(game.state,proposal,method);
 const specialist=follow==='specialist'&&profile.bonus===method;
 const report=researchEvidence(game,proposal,method);
 const mediation=game.context?.ability?.choice==='mediation'&&method===member.evidence?.08:0;
 const strength=fit*(.68+(member.evidence===method?.18:0)+(profile.bonus===method?.24:0))
 +member.flexibility*.17+(game.memberTrust?.[member.id]??55)*.002
 +(specialist?Math.min(.28,fit*.24):follow==='crosscheck'?Math.min(.22,fit*.18):0)+(fit>=.32&&follow!=='insist'?report+mediation:0);
 const bar=.48+member.resistance*.53+Math.abs(member.bias)*.24;
 const changed=initialVote!==proposal&&fit>=.32&&strength>=bar;
 const final=changed?initialVote+Math.sign(proposal-initialVote)*.25:initialVote;
 const justified=fit>=.46&&(follow==='crosscheck'||specialist);
 const trustBefore=game.memberTrust?.[member.id]??55;
 const outcome=changed?'근거가 기존 판단의 문턱을 넘어 한 단계 조정했습니다.':initialVote===proposal?'이미 같은 안을 지지했습니다.':fit<.32?'현재 지표가 제안한 방향을 뒷받침하지 않았습니다.':'근거가 위원의 반론을 뒤집기에 부족했습니다.';
 return {id:member.id,name:member.name,method,follow,proposal,initial:initialVote,final,changed,justified,fit,trustBefore,outcome,
 proof:(method==='model'?'물가 '+game.state.inflation.toFixed(2)+'%, 기대물가 '+game.state.expectations.toFixed(2)+'%':method==='stability'?'금융 위험 '+game.state.stress.toFixed(0)+'점, 부채·주택 과열 '+game.state.imbalance.toFixed(0)+'점':'경기 흐름 '+game.state.growth.toFixed(2)+'점, 은행 대출금리 '+game.state.loan.toFixed(2)+'%'),
 objection:member.philosophy+' 관점에서 '+evidenceNames[member.evidence]+' 근거와 기존 정책의 부작용을 더 확인해야 합니다.'};
}
export function memberMemory(game,record,next){
 const trust={...game.memberTrust};
 const decisions=record.persuasion??[];
 for(const p of decisions){
 const score=evidenceStrength(next,p.proposal,p.method);
 p.afterEvidence=score;
 const adjustment=p.justified?(score>=.32?4:1):-3;
 trust[p.id]=clamp((trust[p.id]??55)+adjustment,0,100);
 p.trustAfter=trust[p.id];
 }
 return trust;
}
export function voteRunoff(votes){
 const ranking=[-.25,0,.25].map(move=>({move,count:votes.filter(v=>v.vote===move).length})).sort((a,b)=>b.count-a.count||Math.abs(a.move)-Math.abs(b.move)||a.move-b.move);
 if(ranking[0].count>=4)return {change:ranking[0].move,runoff:null};
 const options=ranking.slice(0,2).map(r=>r.move);
 const runoff=votes.map(v=>({...v,preferred:v.vote,vote:options.includes(v.vote)?v.vote:[...options].sort((a,b)=>Math.abs(a-v.vote)-Math.abs(b-v.vote)||Math.abs(a)-Math.abs(b))[0]}));
 const change=options.find(m=>runoff.filter(v=>v.vote===m).length>=4);
 return {change,runoff};
}


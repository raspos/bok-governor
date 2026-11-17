import {calm,project,clamp} from './economy.mjs';

export const abilities={
 scholar:{name:'경제분석 보고서',options:{prices:'물가 경로와 예상 물가상승률 검증',activity:'경기 하락과 기존 금리 부담 분석'},cost:'보고서 작성에 이번 회의의 개별 설득 기회 한 번을 사용합니다.'},
 official:{name:'정책 조율 회의',options:{liquidity:'담보부 유동성 공급과 금리 판단을 분리',buffers:'대출 위험 점검과 금리 판단을 분리',mediation:'위원 간 쟁점과 정부 공조 범위를 조정'},cost:'정책 조율에 이번 회의의 개별 설득 기회 한 번을 사용합니다.'},
 politician:{name:'대국민 특별 담화',options:{prices:'생활비 부담과 물가 안정 조건을 설명',activity:'고용·이자 부담과 재검토 조건을 설명'},cost:'담화에 설득 기회 한 번을 사용합니다. 이후 설명과 어긋나는 신호는 신뢰를 낮출 수 있습니다.'},
};
export const abilityLimit=2;
export const abilityUses=g=>g.records.filter(r=>r.ability).length;
export const persuasionLeft=g=>2-(g.context?.persuasion?.length??0)-(g.context?.ability?1:0);
export function abilityStatus(g){
 const spec=abilities[g.background];
 if(!spec)return null;
 return {...spec,remaining:abilityLimit-abilityUses(g),available:abilityUses(g)<abilityLimit&&!g.context?.ability&&persuasionLeft(g)>0};
}
export function activateAbility(g,choice){
 const spec=abilityStatus(g);
 if(g.phase!=='meeting'||!spec?.available||!Object.hasOwn(spec.options,choice))throw Error('Invalid ability use');
 const s=g.state;
 if(g.background==='official'&&choice!=='mediation'&&(!g.context?.events?.length||choice===g.context.response))throw Error('Policy mix requires a new response to active incidents');
 const action={kind:g.background,choice};
 if(g.background==='scholar'){
 const run=(rate,shocks)=>project(s,clamp(rate,0,10),shocks).at(-1);
 const central=run(s.rate,[calm,calm]);
 const downside=run(s.rate,[{...calm,world:-.6,oil:7},{...calm,world:-.3,oil:4}]);
 const lower=run(s.rate-.25,[calm,calm]),higher=run(s.rate+.25,[calm,calm]);
 action.report={key:choice==='prices'?'inflation':'growth',central:central[choice==='prices'?'inflation':'growth'],
 adverse:downside[choice==='prices'?'inflation':'growth'],lower:lower[choice==='prices'?'inflation':'growth'],higher:higher[choice==='prices'?'inflation':'growth']};
 }
 if(g.background==='politician'){
 action.grounded=choice==='prices'?Math.abs(s.inflation-2)>.25||Math.abs(s.expectations-2)>.25:s.growth<s.capacity-.2||s.loan>4.8;
 }
 return {...g,context:{...g.context,ability:action}};
}
export function researchEvidence(g,proposal,method){
 const action=g.context?.ability;
 if(action?.kind!=='scholar')return 0;
 if(action.choice==='prices'&&method!=='model'||action.choice==='activity'&&method!=='households')return 0;
 const r=action.report;
 const direction=proposal>0?r.central-r.higher:proposal<0?r.lower-r.central:Math.abs(r.adverse-r.central);
 return clamp(direction*1.45,0,.26);
}
export function communicationEffect(record,remark){
 const a=record.ability;
 if(a?.kind!=='politician')return {trust:0,expectations:0,approval:0};
 const inconsistent=remark==='reaffirm'||remark!==a.choice&&remark!=='conditional';
 if(inconsistent)return {trust:-2,expectations:0,approval:0};
 if(!a.grounded)return {trust:-1,expectations:0,approval:0};
 return {trust:0,expectations:a.choice==='prices'?.045*Math.sign(record.origin.inflation-2):-.045,approval:.65};
}


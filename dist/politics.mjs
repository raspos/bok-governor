import {clamp} from './economy.mjs';
import {seededDraw} from './scenarios.mjs';

export const constituencies={mortgage:'주택담보대출 차주',shops:'자영업자',youth:'청년·취업준비생',savers:'은퇴자·예금자',firms:'중소기업 경영자',consumers:'일반 소비자'};
export function openingPolitics(){return {approval:55,groups:Object.fromEntries(Object.keys(constituencies).map(k=>[k,55])),independence:72,coordination:60,confidence:70,grounded:0,concessions:0};}
const officialCharacters={
 president:['대통령 한서원','비공개 회동','내수 상황이 좋지 않습니다. 이자 부담이 크다는 목소리도 많은데요. 금리를 내릴 여지가 있는지 한은에서는 어떻게 보십니까?'],
 minister:['재정경제부장관 민태경','공식 입장 발표','현재 금리가 경기 회복을 지연시키고 있습니다. 통화정책의 근거를 공개해 주십시오.'],
 hearing:['국회 기획재정위원 강예린','국정감사','의결과 전망의 근거를 설명해 주십시오.'],
 adviser:['대통령실 경제수석 유정민','경제정책 협의','정책 목표는 다르지만 부처별 대응 시점은 조율할 수 있습니다.'],
 official:['정부 경제정책조정관 송정호','민생대책 브리핑','정부가 집행하는 민생지원이 수요와 물가에 미칠 영향을 함께 점검합시다.'],
};
export const politicalReplies={
 president:{consider:'경기 진단에 동의하고 인하 필요성을 검토한다',evidence:'물가 안정 위험과 인하의 조건을 설명한다',public:'금통위의 독립적 의결을 공개적으로 강조한다',coordinate:'재정과 통화정책의 역할을 나눈 대안을 제시한다'},
 minister:{public:'공식 입장을 발표한다',evidence:'물가·금융 위험에 근거해 반박한다',coordinate:'비공개 정책협의를 제안한다',wait:'추가 지표까지 설명을 유보한다'},
 hearing:{evidence:'물가와 성장의 상충 및 당시 의결 근거를 설명한다',coordinate:'재정과 통화정책의 역할 및 공조 범위를 설명한다',forecast:'점도표의 전제와 이후 경제 여건의 변화를 설명한다',wait:'추가 설명을 유보한다'},
 adviser:{coordinate:'공조 범위와 금통위의 판단 기준을 합의한다',evidence:'금리 조정의 조건을 전달한다',wait:'새 경제지표를 확인한 뒤 회신한다'},
 official:{coordinate:'추경의 수요·물가 영향을 공동 점검한다',evidence:'추경 효과를 경제전망에 반영하겠다고 설명한다',wait:'집행 자료를 기다린다'},
};
export function pressureOdds(s,p){
 const weakness=Math.max(0,s.capacity-s.growth)+.45*Math.max(0,1.6-s.consumption);
 return clamp(.06+.29*weakness+.014*Math.max(0,55-p.approval)+.006*Math.max(0,60-p.coordination),.06,.82);
}
export function governmentEvent(game,events){
 const s=game.state,p=game.politics??openingPolitics();
 const records=game.records;
 const cut=[...records].reverse().find(r=>r.change<0&&r.origin.inflation>2.15);
 const dot=[...records].reverse().find(r=>r.dots);
 const divergence=dot&&Math.abs(dot.dots.median-s.rate)>=.5;
 const roll=seededDraw(game.seed,s.month,31987);
 const previous=records.at(-1)?.government?.event.id;
 let id;
 const pressure=p.coordination>58?'president':'minister';
 if(previous!=='hearing'&&(cut||divergence)&&s.month>=6&&roll<.23+.009*Math.max(0,55-p.approval))id='hearing';
 else if(previous!==pressure&&s.growth<s.capacity&&roll<pressureOdds(s,p))id=pressure;
 else if(previous!=='official'&&events.some(e=>e.id==='fiscal'&&e.start===s.month))id='official';
 else if(previous!=='adviser'&&s.month>1&&roll>.91)id='adviser';
 if(!id)return null;
 const [person,title,opening]=officialCharacters[id];
 const question=id==='hearing'?(divergence?dot.date+' 발표 중앙값 '+dot.dots.median.toFixed(2)+'%와 현재 '+s.rate.toFixed(2)+'%의 차이를 설명해 주십시오.':cut.date+' 회의 때 물가 '+cut.origin.inflation.toFixed(2)+'%에서 인하를 의결한 근거는 무엇입니까?'):opening;
 return {id,person,title,question,divergence:!!divergence};
}
export function governmentReply(game,reply){
 const event=game.context?.government;
 if(!event||!Object.hasOwn(politicalReplies[event.id],reply))throw Error('Invalid government response');
 const s=game.state;
 const room=s.inflation<2.4&&s.growth<s.capacity-.2&&s.imbalance<48;
 const tension=Math.abs(s.inflation-2)>.25||Math.abs(s.growth-s.capacity)>.25||s.stress>37||s.imbalance>44;
 const justified=reply==='evidence'&&tension||reply==='coordinate'&&(tension||event.id==='official')||reply==='consider'&&room||reply==='forecast'&&event.divergence;
 const concession=reply==='consider'&&!room;
 const cooperation=reply==='coordinate'?(game.background==='official'?8:game.background==='politician'?7:6):reply==='consider'?4:reply==='public'?-5:reply==='evidence'?1:-1;
 return {event,reply,justified,concession,cooperation};
}
export function updatePolitics(prior,record,after){
 const before=record.origin;
 const shift=(k)=>after[k]-before[k];
 const living=-3*(Math.abs(after.inflation-2)-Math.abs(before.inflation-2))+.8*shift('consumption');
 const jobs=1.6*shift('growth')-3*shift('unemployment');
 const loan=shift('loan'), home=shift('housing'), risk=shift('stress');
 const income=1.3*shift('growth')-.65*shift('inflation');
 const publicStyle=record.background==='politician'?.42:record.background==='scholar'?.13:.24;
 const explanations=(record.market.remark!=='reaffirm'&&(!record.question.challenge||record.market.explained)?publicStyle:0)+(record.market.explained?.7:0)+(record.government?.justified?.7:0)+(record.market.communication?.approval??0)+(record.pressSummary?.approval??0);
 const changes={mortgage:living+income-6*loan-.35*home-.15*risk,shops:living+jobs-4*loan-.22*risk,
 youth:living+1.55*jobs-.85*home-.14*risk,savers:living+5*loan-.10*risk,
 firms:income+jobs-4.4*loan-.29*risk,consumers:living+income+.65*jobs-.3*Math.max(0,risk)};
 const groups=Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,clamp(prior.groups[k]+v+explanations,0,100)]));
 const approval=Object.values(groups).reduce((sum,v)=>sum+v,0)/6;
 const interaction=record.government;
 const pressureDistortion=interaction?.concession&&record.change<0;
 const independence=clamp(prior.independence+(pressureDistortion?-7:interaction?.justified?2:interaction?.reply==='public'?-1:0),0,100);
 const coordination=clamp(prior.coordination+(interaction?.cooperation??0)+(record.ability?.choice==='mediation'&&interaction?.justified?2:0)+(record.pressSummary?.government??0),0,100);
 const confidence=clamp(.72*prior.confidence+.23*record.market.trust+.05*independence-.13*Math.max(0,risk)-4*Math.abs(record.market.shift),0,100);
 const factors=[{name:'생활비·실질소득 여건',v:living+income},{name:'성장·고용',v:jobs},{name:'대출 이자 부담',v:-4*loan},{name:'주택·금융시장',v:-.6*home-.2*risk},{name:'정책 설명',v:explanations}].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,3);
 return {approval,groups,independence,coordination,confidence,grounded:prior.grounded+(interaction?.justified?1:0),concessions:prior.concessions+(pressureDistortion?1:0),factors};
}

export function requestsReview(game,record){
 const p=game.politics??openingPolitics(),s=record.origin;
 return record.change>=0&&s.growth<s.capacity-.45&&p.coordination<53&&p.approval<55
 && seededDraw(game.seed,s.month,93299)<.07;
}
export function reconsider(record,ballots,runoff){
 if(ballots.length!==7||ballots.some(v=>![-.25,0,.25].includes(v)))throw Error('Invalid reconsideration');
 const original=record.change;
 const support=ballots.filter(v=>v===original).length;
 if(support>=5){
 const s=record.origin;
 const approved=Math.abs(s.inflation-2)>.55||s.stress>45||s.growth>s.capacity-.6;
 return {support,president:approved?'확정':'불채택',change:approved?original:0,ballots,original};
 }
 if(runoff.length!==7||runoff.some(v=>v===original||![-.25,0,.25].includes(v)))throw Error('Invalid substitute vote');
 const replacement=[...runoff].sort((a,b)=>a-b)[3];
 return {support,president:null,change:replacement,ballots,original,runoff};
}


import {openingPolitics} from './politics.mjs';
import {project} from './economy.mjs';
import {scenarioShocks} from './scenarios.mjs';

export function historicalVerdict(game,analysis){
 const months=game.path.slice(1);
 const annual=fn=>months.reduce((sum,s)=>sum+fn(s),0)/months.length;
 const p=game.politics??openingPolitics(), trust=game.market?.trust??70;
 const latest=analysis.played.at(-1);
 const score={inflationError:annual(s=>Math.abs(s.inflation-2)),growthGap:annual(s=>s.growth-s.capacity),
 stress:annual(s=>s.stress),fxVolatility:annual(s=>Math.abs(s.fx-game.path[s.month-1].fx)),
 loan:game.state.debtStock-100,trust,approval:p.approval,independence:p.independence,coordination:p.coordination,confidence:p.confidence};
 const assisted=game.records.filter(r=>{
 if(!r.incidents?.length||r.response!=='liquidity'||!r.baseShocks)return false;
 const count=r.endMonth-r.origin.month;
 const control=project(r.origin,r.rate,scenarioShocks(r.baseShocks,r.origin.month,r.incidents,'observe',r.origin).slice(0,count)).at(-1);
 return control.stress-game.path[r.endMonth].stress>=1;
 }).length;
 const durable=Math.abs(latest.inflation-2)<.55&&latest.stress<44&&latest.imbalance<48;
 const balanced=score.inflationError<.55&&score.growthGap>-.5&&score.stress<43&&score.fxVolatility<18;
 const fragility=game.state.imbalance>=49||latest.imbalance>=50;
 const negotiations=game.records.flatMap(r=>r.persuasion??[]);
 const convinced=negotiations.filter(n=>n.changed&&n.justified).length;
 const memberTrust=Object.values(game.memberTrust??{});
 const groundedPressure=game.records.filter(r=>r.government?.justified&&['president','minister','hearing'].includes(r.government.event.id)).length;
 let title;
 if(score.inflationError>.85&&score.growthGap<-.45)title='잃어버린 회복의 총재';
 else if(fragility)title=score.growthGap>-.35?'회복 뒤에 위험을 남긴 총재':'부채와 주택 과열에 발목 잡힌 총재';
 else if(assisted>=2&&months.some(s=>s.stress>=41)&&score.stress<48&&score.fxVolatility<20)title='위기의 소방수';
 else if(score.inflationError<.28&&score.growthGap<-.55&&durable)title='물가 안정과 회복의 비용';
 else if(balanced&&durable)title='연착륙의 설계자';
 else if(score.growthGap>-.48&&game.state.inflation>2.30)title='회복을 지켰으나 물가를 남긴 총재';
 else title='갈림길에 선 총재';

 let stewardship='위원회 정례 운영을 이어간 임기';
 if(p.concessions>=1&&(trust<68||p.independence<67)&&(!balanced||fragility))stewardship='정치에 휘둘린 총재';
 else if(p.approval>=59&&fragility&&score.inflationError>=.45)stewardship='여론에 흔들린 총재';
 else if(convinced>=4&&balanced&&durable&&memberTrust.some(v=>v>=64))stewardship='금통위의 마에스트로';
 else if(negotiations.length>=4&&convinced===0&&memberTrust.some(v=>v<49)&&!balanced)stewardship='합의를 잃어버린 총재';
 else if(game.background==='official'&&assisted>=2&&p.grounded>=2&&balanced)stewardship='위기를 조율한 관료';
 else if(game.background==='scholar'&&convinced>=2&&p.independence>=74&&durable)stewardship='원칙의 경제학자';
 else if(game.background==='politician'&&p.approval>=57&&trust>=75&&balanced)stewardship='국민과 소통한 총재';
 else if(p.independence>=76&&groundedPressure>=2&&durable&&trust>=71)stewardship=p.approval<53?'고독한 원칙주의자':'중앙은행 독립성의 수호자';
 else if(p.approval<53&&durable&&Math.abs(latest.inflation-2)<Math.abs(game.state.inflation-2))stewardship='인기 없는 개혁가';
 else if(p.coordination>=68&&p.confidence>=68&&p.grounded>=2&&balanced)stewardship='정부와 시장 사이의 조정자';
 else if(p.approval>=58&&balanced&&durable)stewardship='국민의 총재';
 else if(trust>=76&&p.confidence>=71&&balanced)stewardship='시장의 신뢰를 얻은 총재';
 const success=score.inflationError<.45?'연중 물가가 목표 부근을 유지했습니다.':
 assisted?'유동성 공급이 '+assisted+'개 회의 구간에서 무대응보다 금융 위험을 낮췄습니다.':
 score.growthGap>-.35?'실질 GDP 성장률이 잠재성장률 부근을 유지하며 견조했습니다.':'금리 결정과 설명을 여덟 회의 기록으로 남겼습니다.';
 const cost=fragility?'주택·신용 불균형이 2029년에도 부담으로 남았습니다.':
 score.growthGap<-.35?'연중 성장이 잠재성장률을 밑돌며 GDP갭 마이너스가 심화되고 회복이 지연됐습니다.':
 p.confidence<65?'시장 신뢰가 약해져 금리 경로의 위험 프리미엄이 확대됐습니다.':
 score.inflationError>.55?'연중 목표에서 벗어난 물가가 생활비 부담을 남겼습니다.':'2029년 평가는 후임 정책과 새로운 외부 충격에도 영향을 받습니다.';
 const actions=game.records.filter(r=>r.ability);
 const decisive=game.records.filter(r=>r.persuasionDecisive).length;
 const verified=game.records.flatMap(r=>r.verified??[]);
 const correct=verified.filter(r=>r.forecast===r.actual).length;
 const government=game.records.filter(r=>r.government);
 const justified=government.filter(r=>r.government.justified).length;
 const polls=game.records.filter(r=>r.poll);
 const approvalShift=polls.length?polls.at(-1).poll.approval-55:0;
 const style=actions.length?{scholar:'보고서로 전망의 전제를 검증한 임기',official:'정책 조합과 공조를 조정한 임기',politician:'정책 비용을 공개적으로 설명한 임기'}[game.background]:'위원회 정례 절차를 중심으로 운영한 임기';
 const communication=analysis.communication;
 const subtitle=style+' · 고유 행동 '+actions.length+'회 · 표결을 바꾼 설득 '+decisive+'회 · 물가 전망 적중 '+correct+'/'+verified.length+'회 · 근거를 제시한 정부 답변 '+justified+'/'+government.length+'회 · 가상 지지도 변화 '+approvalShift.toFixed(1)+'점 · 근거가 부족한 상충 신호 '+communication.unexplained+'회';
 return {title,stewardship,score,success,cost,assisted,convinced,attempts:negotiations.length,subtitle,decisive};
}


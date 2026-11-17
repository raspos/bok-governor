import {clamp,metrics,derivedMacro} from './economy.mjs';
import {goalForecast,goalMet} from './goals.mjs';

const num=(n,u='%')=>Number(n).toFixed(2)+u;
const money=n=>Math.round(n).toLocaleString('ko-KR')+'원';
const moveWord=n=>n>0?'인상':n<0?'인하':'동결';
const outlets={decision:'통화정책 출입기자',macro:'경제부 기자',markets:'금융시장 기자',stability:'금융안정 담당 기자',communication:'채권시장 담당 기자',government:'정책부 기자'};

export function openingStatement(record){
 const r=record,s=r.origin;
 const macro=derivedMacro(s);
 const stats=r.review?('공식 재의에서 기존 안에 '+r.review.support+'명이 찬성했습니다. '+(r.review.president?'대통령 최종 판단은 '+r.review.president+'입니다.':'대체안 결선을 거쳤습니다.')):null;
 const actual=r.runoff??r.votes;
 const votes=['인상','동결','인하'].map((k,i)=>k+' '+actual.filter(x=>x.vote===[.25,0,-.25][i]).length+'표').join(' · ');
 const adopted=r.change>0?'현재·예상 물가와 금융위험을 함께 살폈습니다. 금리 상승에 따른 이자 부담도 점검하겠습니다.':r.change<0?'경기와 자금조달 여건을 살폈습니다. 환율과 부채 부담이 커지는지도 확인하겠습니다.':'지금 금리의 영향이 이어지는 가운데 물가와 경기 중 어느 위험이 더 커지는지 확인하겠습니다.';
 return {intro:'공보관 · 통화정책방향 기자간담회를 시작합니다.',rate:'오늘 기준금리는 '+num(s.rate)+'에서 '+num(r.rate)+'로 '+(r.change?'조정했습니다.':'유지했습니다.'),
 vote:stats??((r.runoff?'결선 표결 · ':'표결 · ')+votes),
 economy:'소비자물가 상승률 '+num(s.inflation)+', 실질 GDP 성장률 전망 '+num(macro.gdpForecast)+' (직전대비 '+(macro.gdpRevision>=0?'+':'')+num(macro.gdpRevision,'%p')+', GDP갭률 '+num(macro.gdpGap)+')입니다. 원/달러 환율은 '+money(s.fx)+', 미국 기준금리는 '+num(s.fed)+'입니다. 가계신용 증가율은 '+num(s.debt)+', 금융위험은 '+num(s.stress,'/100')+'입니다.',
 reasoning:adopted+' 6개월 물가상승률 방향 전망은 '+r.forecast+'입니다. 다음 결정은 새 지표와 위험을 살핀 뒤 위원회에서 논의하겠습니다.'};
}
function questions(r,records,inaugural){
 const s=r.origin, last=records.at(-1), old=last?.origin??s;
 const macro=derivedMacro(s,last?.origin);
 const incident=id=>r.incidents?.some(e=>e.id===id);
 const groups=[];
 const add=(id,tag,priority,question,evidence)=>groups.push({id,tag,priority,question,evidence});
 const watch=r.watch;
 const actual=r.change>0?'raise':r.change<0?'cut':'hold';
 const favorite=watch?.favorite;
 const word={raise:'인상',hold:'동결',cut:'인하'};
 if(watch&&favorite!==actual)add('surprise','decision',110,'BOK워치에서 '+word[favorite]+'이 '+watch.probabilities[favorite]+'%였는데 오늘은 '+word[actual]+'입니다. 시장은 다르게 봤는데요. 위원회는 뭘 더 중요하게 봤습니까?','시장은 '+num(watch.expected)+'를 예상했지만, 오늘 결정은 '+num(r.rate)+'입니다. 위원들이 본 건 물가 '+num(s.inflation)+'와 성장률 전망 '+num(macro.gdpForecast)+', GDP갭률 '+num(macro.gdpGap)+'을 비롯한 국내 경제 여건입니다.');
 else if(r.change&&last?.change===r.change)add('streak','decision',106,'두 회의 연속 '+moveWord(r.change)+'입니다. 같은 방향으로 더 움직일 조건은 무엇입니까?','두 차례 결정이 소비와 대출에 미치는 영향을 확인하고 다음 의결을 논의하겠습니다.');
 else if(!r.review&&new Set((r.runoff??r.votes).map(v=>v.vote)).size>1)add('split','decision',103,'총재님, 표가 갈렸는데요. 회의에서 어떤 점을 두고 의견이 달랐습니까?','다른 금리 의견도 있었습니다. 다만 표결 숫자만 보고 위원 한 분 한 분의 이유를 제가 대신 말씀드리긴 어렵습니다.');
 else add('decision','decision',100,'오늘 '+moveWord(r.change)+'을 결정하는 데 어떤 지표를 가장 중요하게 봤습니까?','소비자물가 상승률 '+num(s.inflation)+'와 성장률 전망 '+num(macro.gdpForecast)+', 금융위험 '+num(s.stress,'/100')+'을 함께 봤습니다.');
 if(r.dots||r.question?.prior)add('dots','communication',r.dots?96:53,'점도표 중앙값 '+num(r.dots?.median??r.question.prior.median)+'인데요. 오늘 금리 '+num(r.rate)+'에서 다음 회의에 움직일 수 있다는 뜻인가요?','지금 여건이 이어진다는 전제에서 위원들이 6개월 뒤를 내다본 겁니다. 다음 회의에서 언제, 어느 쪽으로 움직일지는 그때 지표를 보고 판단하겠습니다.');
 if(r.goal){
 const g=r.goal,unit=metrics[g.key][1]==='%'?'%':'/100';
 const target=(g.min!==null&&g.limit!==null?num(g.min,unit)+'~'+num(g.limit,unit):g.limit!==null?num(g.limit,unit)+' 이하':num(g.min,unit)+' 이상');
 const forecast=goalForecast(s,g.months).find(x=>x.rate===r.rate)?.center[g.key];
 add('target','communication',94,'이번에 내건 목표, 다음 평가 때까지 달성할 수 있다고 보십니까?','이번 평가의 목표는 '+metrics[g.key][0]+' '+target+'입니다. 의결 금리의 무충격 기준 전망은 '+num(forecast,unit)+'이고 대외 충격에 따라 달라질 수 있습니다.');
 const item=groups.at(-1);item.target=target;item.canMeet=goalMet(g,forecast);
 }
 const priority=inaugural?.answers.find(a=>a.topic==='priority');
 if(!last&&priority)add('inaugural','communication',99,'취임 때 이렇게 말씀하셨죠. “'+priority.text+'” 오늘 결정에 그 판단을 어떻게 반영하셨습니까?','올해도 그 문제를 중요하게 보고 있습니다. 오늘은 물가 '+num(s.inflation)+'와 은행 대출금리 '+num(s.loan)+'를 함께 놓고 위원들과 논의했습니다.');
 const check=(last?.verified??[]).find(v=>v.actual!==v.forecast);
 if(check)add('error','communication',97,check.date+'의 물가 방향은 '+check.forecast+'으로 제시했는데 확인된 결과는 '+check.actual+'이었습니다. 어느 전제를 다시 보십니까?','이전 전망과 실현 방향이 달랐습니다. 유가·수요·환율의 영향을 나눠 다시 보겠습니다.');
 const prior=last?.conference?.answers.find(a=>a.signal!==0);
 if(prior&&Math.abs(s.inflation-old.inflation)>.1)add('memory','communication',86,'지난 회의에서 '+(prior.signal>0?'인상':'인하')+' 검토 조건을 밝혔습니다. 이후 물가상승률이 '+num(old.inflation)+'에서 '+num(s.inflation)+'로 바뀌었는데 판단도 바뀌었습니까?','지난 회의 조건과 이번 지표를 비교하고 있습니다. 판단을 바꿀 경우 달라진 전제를 함께 밝히겠습니다.');
 if(incident('chips'))add('export','macro',88,'반도체 호황이 이어지는데 민간소비 증가율은 '+num(macro.privateConsumption)+'입니다. 수출 개선이 내수로 이어졌다고 평가하십니까?','수출 호황과 소비 회복을 구분해야 합니다. 내수와 고용으로 퍼지는지 시차를 두고 확인하겠습니다.');
 if(macro.gdpGap<-0.5||s.growth<s.capacity-.3)add('slump','macro',82,'성장률 전망이 '+num(macro.gdpForecast)+'로 낮아지고 GDP갭률도 '+num(macro.gdpGap)+'로 마이너스가 심화되고 있습니다. 현재 금리가 경기 부담을 키우는 것 아닙니까?','대출금리 '+num(s.loan)+'가 가계와 기업에 주는 부담을 봅니다. 단기 지표만으로 저성장 고착화를 단정할 수는 없습니다.');
 if(s.inflation>2.2)add('prices','macro',80,'물가상승률이 '+num(s.inflation)+'입니다. 목표 복귀가 늦어질 가능성과 근원물가 흐름을 어떻게 봅니까?','전체 물가의 모형값은 '+num(s.inflation)+'입니다. 이 발표에서는 근원물가 수치를 따로 제시할 수 없고 공급과 수요 요인을 구분해 보겠습니다.');
 if(s.fx-old.fx>15)add('fx','markets',92,'원/달러가 '+money(old.fx)+'에서 '+money(s.fx)+'로 올랐습니다. 외국인 자금이 빠졌다고 보고 계십니까?','환율 상승은 수입 비용을 높일 수 있습니다. 환율 숫자만으로 외국인 자금 흐름을 확인할 수는 없습니다.');
 if(last?.watchResult?.reaction.longBps>15)add('bonds','markets',87,'직전 회의 직후 장기금리가 '+num(last.watchResult.reaction.longBps,'bp')+' 올랐습니다. 정책금리 전망 외에 어떤 요인을 보십니까?','장기금리는 정책 경로뿐 아니라 금융위험과 장기 자금 수급에도 반응합니다.');
 if(incident('oil')||incident('war'))add('oil','markets',91,'기록된 유가 공급 충격이 물가에 먼저 반영됩니까, 가계 구매력에 먼저 반영됩니까?','브렌트유 모형 가격은 배럴당 '+num(s.oil,'달러')+'입니다. 에너지 비용 상승과 구매력 약화를 함께 살펴야 합니다.');
 if(incident('fed')||s.fed!==old.fed)add('fed','markets',84,'미국 금리 모형값이 '+num(s.fed)+'입니다. 미국의 결정에 맞춰 움직일 필요가 있습니까?','금리차가 환율에 미치는 영향을 살피되 국내 물가와 금융 여건을 종합해 판단하겠습니다.');
 if(incident('finance')||s.stress>45)add('credit','stability',98,'금융위험 '+num(s.stress,'/100')+'입니다. 자금 공급과 기준금리로 해결해야 할 문제가 어떻게 다릅니까?','금리는 경제 전반에 영향을 주고 단기 자금 대책은 시장 기능에 초점을 둡니다. 두 수단의 효과와 비용을 따로 점검하겠습니다.');
 if(s.debt>=4||s.housing>=2)add('debt','stability',75,'가계신용 연율이 '+num(s.debt)+', 주택가격 흐름 값은 '+num(s.housing)+'입니다. 서울 주택과 자영업자 연체까지 악화됐다고 보십니까?','전국 모형의 주택·신용 수치입니다. 서울 지역이나 연체율은 이 수치로 확인할 수 없습니다. 은행 대출금리와 대출 증가를 함께 살피겠습니다.');
 if(incident('fiscal'))add('fiscal','government',95,'공개된 추가경정예산이 내수를 떠받칠 경우, 위원회는 물가 판단을 어떻게 바꿀 계획입니까?','재정의 규모와 집행 시점이 중요합니다. 그 수요 효과와 물가 영향을 확인한 뒤 위원회가 독립적으로 결정하겠습니다.');
 const politics=r.government?.event?.id;
 if(politics==='hearing'||politics==='minister')add('independence','government',89,politics==='hearing'?'국회의 경기 대응 요구가 금리 판단에 얼마나 영향을 줬습니까?':'정부와 경기 진단이 다를 수 있습니다. 정부의 인하 요구가 들어와도 금리 결정 기준을 지키실 겁니까?','정부의 정책 효과는 경제 전망에 반영하되 기준금리는 위원회가 공개 지표와 표결로 결정합니다.');
 add('framework','macro',1,'다음 의결 전까지 어떤 자료가 새로 나오면 판단을 바꾸겠습니까?','소비자물가와 경제성장률 전망, 금융위험이 함께 움직이는지 확인하겠습니다.');
 add('balance','stability',0,'대출이자는 '+num(s.loan)+'입니다. 총재가 지켜볼 금융 비용은 무엇입니까?','가계와 기업의 조달 부담, 대출 증가와 금융시장 기능을 함께 보겠습니다.');
 return groups.sort((a,b)=>b.priority-a.priority).slice(0,3);
}

export function conferenceFor(game){
 const saved=game.pending.conference;
 if(saved)return {...saved,queue:saved.queue.slice(0,Math.max(3,saved.answers.length))};
 return {opening:openingStatement(game.pending),queue:questions(game.pending,game.records,game.inaugural),answers:[],followed:false};
}
export function conferenceChoices(game,item){
 const s=game.pending.origin;
 const perspective={
 decision:{
 scholar:' 다음 물가 지표가 이번 판단에 깔린 전망과 맞는지 보겠습니다.',
 official:' 오늘 결정이 은행 대출금리에 반영되는 속도를 보겠습니다.',
 politician:' 가계와 자영업자의 이자 부담이 어떻게 달라지는지 보겠습니다.'
 },
 stability:{
 scholar:' 금융위험 지표와 신용 증가세가 함께 움직이는지 확인하겠습니다.',
 official:' 단기 자금 지원 이후에도 금융기관의 조달 여건이 어려운지 확인하겠습니다.',
 politician:' 중소기업이 만기 대출을 연장하는 데 어려움이 있는지 살피겠습니다.'
 }
 };
 const frame=perspective[item.tag]?.[game.background]??'';
 const condition=item.tag==='stability'||item.tag==='markets'?'금융위험과 환율이 안정되는지를 ':item.tag==='macro'?'다음 물가와 소비 지표를 ':'새 물가·성장·금융지표를 ';
 const move=s.inflation>2.45?1:s.growth<s.capacity-.3&&s.inflation<2.3?-1:0;
 const moveText=move>0?'물가 압력이 이어지면 추가 인상을 검토하겠습니다.':move<0?'성장 둔화가 깊어지고 물가가 안정되면 인하를 검토하겠습니다.':'현 수준의 영향을 먼저 확인하겠습니다. 새 지표에 따라 동결 여부를 다시 논의하겠습니다.';
 const macro=derivedMacro(s);
 const evidence=item.id==='follow'?(item.prompt==='pledge'?'유가나 환율이 달라지면 물가 경로를 다시 계산해야 합니다. 수치 목표는 관측값에 따라 재검토하겠습니다.':move>0?'전년 동월 대비 물가 '+num(s.inflation)+'와 기대인플레이션 '+num(s.expectations)+'를 함께 보겠습니다. 두 지표가 높은 수준에 머무는지 확인하겠습니다.':move<0?'성장률 전망 '+num(macro.gdpForecast)+'과 민간소비 증가율 '+num(macro.privateConsumption)+'가 더 약해져도 물가 안정이 이어지는지 보겠습니다.':'대출금리 '+num(s.loan)+'가 내수를 얼마나 누르는지, 물가 '+num(s.inflation)+'가 목표에 가까워지는지를 함께 확인하겠습니다.'):item.evidence;
 const common=[
 {id:'explain',label:'수치와 근거를 들어 답한다',text:evidence+frame,signal:0,kind:'evidence'},
 {id:'guide',label:move?'다음 금리 조정을 검토할 조건을 밝힌다':'동결을 재검토할 조건을 밝힌다',text:evidence+' '+moveText,signal:move,kind:'guidance'},
 {id:'caution',label:'추가 확인이 필요한 위험을 밝힌다',text:condition+'확인한 뒤 판단하겠습니다. 지금 나온 수치만으로는 방향을 정하기 어렵습니다.',signal:0,kind:'caution'}
 ];
 if(item.id==='target')common[1]={id:'pledge',label:'목표 달성을 확약한다',text:'이번 평가에서 정책 목표('+item.target+')를 달성하겠습니다.',signal:0,kind:'pledge',unsupported:!item.canMeet};
 return common;
}
export function answerConference(game,choice){
 if(game.phase!=='press')throw Error('Not in conference');
 const c=conferenceFor(game), item=c.queue[c.answers.length];
 if(!item)throw Error('Conference already answered');
 const selected=conferenceChoices(game,item).find(a=>a.id===choice);
 if(!selected)throw Error('Invalid press answer');
 const answers=[...c.answers,{...selected,topic:item.id,tag:item.tag,question:item.question,reporter:outlets[item.tag]}];
 const follow=answers.length<c.queue.length&&!c.followed&&(['pledge','guide'].includes(choice)||choice==='caution'&&['surprise','dots','error'].includes(item.id));
 const question=choice==='pledge'?'유가나 환율이 예상과 다르면 방금 말씀하신 수치도 수정하실 수 있습니까?':choice==='guide'?'그럼 어떤 숫자를 보면 됩니까? 물가가 어느 정도 움직여야 판단이 달라지나요?':'그럼 다음 회의 전까지 시장은 뭘 눈여겨봐야 합니까?';
 const queue=follow?[...c.queue.slice(0,answers.length),{id:'follow',tag:item.tag,question,prompt:choice,evidence:item.evidence},...c.queue.slice(answers.length,c.queue.length-1)]:c.queue;
 return {...game,pending:{...game.pending,conference:{...c,queue,answers,followed:c.followed||follow}}};
}
export function conferenceSummary(c){
 if(!c)return null;
 if(c.answers.length!==c.queue.length)throw Error('Answer the conference questions first');
 const guidance=c.answers.filter(a=>a.kind==='guidance');
 const grounded=c.answers.filter(a=>a.kind==='evidence'||a.kind==='guidance').length;
 const pledge=c.answers.find(a=>a.kind==='pledge');
 const net=guidance.reduce((sum,a)=>sum+a.signal,0);
 const conflicting=guidance.some(a=>a.signal>0)&&guidance.some(a=>a.signal<0);
 const tone=Math.sign(net);
 const correction=c.answers.find(a=>a.topic==='error'&&a.kind==='evidence');
 const headline=tone>0?'총재, 물가 압력 이어지면 인상 검토':tone<0?'총재, 경기 부진과 물가 안정 시 인하 검토':pledge?'총재, 회의 구간 정책 목표 달성 확약':correction?'총재, 이전 물가 전망과 실현 방향 차이 설명':guidance.length?'총재, 현 금리 효과 살핀 뒤 새 지표로 판단':'총재, 금리 의결 배경과 점검할 지표 설명';
 const quote=(tone?guidance.find(a=>a.signal===tone):pledge??correction??guidance.at(-1))?.text??c.answers[0].text;
 return {tone,holdGuidance:guidance.length>0&&guidance.every(a=>a.signal===0),headline,quote,grounded,pledged:!!pledge,trust:clamp((grounded>=2?1:0)-(pledge?.unsupported?2:0)-(conflicting?2:0),-3,1),
 approval:grounded>=2?.25:0,government:c.answers.some(a=>a.tag==='government'&&a.kind!=='caution')?.3:0};
}
export const pressReporter=item=>outlets[item.tag];



import {startInaugural,answerInaugural,inauguralQuestions} from './inaugural.mjs';
import {openFrontPage} from './newspaper.mjs';
import {conferenceFor,conferenceChoices,answerConference,pressReporter} from './press.mjs';
import {metrics,project,calm,neutralRate} from './economy.mjs';
import {start,opinions,decide,onward,compare,moves,label,briefs,meetingImpact,reassess,legacyKeys,submitDots,conclude,begin,briefing,respondCrisis,respondGovernment,resolveReview,negotiate} from './game.mjs';
import {dates,scheduleSource} from './schedule.mjs';

import {rateLevels,horizon,openingMarket} from './dots.mjs';
import {incidents,crisisResponses,startScenarios} from './scenarios.mjs';
import {politicalReplies,constituencies,openingPolitics} from './politics.mjs';
import {backgrounds,evidenceNames,getCommittee} from './committee.mjs';
import {historicalVerdict} from './verdict.mjs';
import {currentWatch,watchOutcomes,watchOutcomeLabel} from './watch.mjs';
import {policyPrinciple} from './committee.mjs';
import {chooseGoal,goalOptions,goalPeriod,goalForecast,goalDifficulty,policyMetrics,metricNotes} from './goals.mjs';
import {abilityStatus,activateAbility,persuasionLeft} from './abilities.mjs';
const notice='게임의 전략성과 플레이 경험을 높이기 위해 실제 통화정책의 파급시차를 1~2개월로 압축했습니다. 게임 속 경제지표의 변화 시점과 크기는 실제 경제에 대한 예측이 아닙니다.';
const main=document.querySelector('#main');
const dock=document.querySelector('#game-dock');
const typeVariant=globalThis.location?.hash.match(/^#type=([abc])$/)?.[1]??'a';
if(document.documentElement)document.documentElement.dataset.type=typeVariant;
const key='bok-governor-v2';
let game;
try {
 const saved=JSON.parse(localStorage.getItem(key));
 if(saved?.state && ['setup','scenario','inaugural','office','crisis','government','meeting','review','dots','press','result','newspaper','end'].includes(saved.phase) && Array.isArray(saved.records) && Array.isArray(saved.path))game=saved;
} catch {}
const newGame=()=>({...start(crypto.getRandomValues(new Uint32Array(1))[0]),phase:'setup'});
game??=newGame();
let titleOpen=game.phase==='setup'||game.phase==='scenario'||globalThis.performance?.getEntriesByType?.('navigation')[0]?.type==='navigate';
let savedTerm=(game.phase==='setup'||game.phase==='scenario')?null:game;
try{document.documentElement?.classList.toggle('reduce-motion',localStorage.getItem('bok-reduce-motion')==='1');}catch{}
let selectedMember=null,argumentMethod=null,meetingStep=game.context?.uiStep??0;
const alternativeTo=change=>moves.find(d=>d!==change);
let focus=game.context?.draft?.focus??'prices', forecast=game.context?.draft?.forecast??'하락', proposal=game.context?.draft?.proposal??0, alternative=alternativeTo(game.records.at(-1)?.change), metric='inflation', saveMessage='';
const value=(k,n)=>n.toLocaleString('ko-KR',{maximumFractionDigits:k==='fx'?0:2,minimumFractionDigits:k==='fx'||k==='stress'?0:2})+metrics[k][1];
const signed=n=>(n>0?'+':'')+n.toFixed(2);
const radio=(name,items,current)=>'<div class="choice">'+items.map(([v,t])=>'<label><input type="radio" '+(name==='goalKey'?'required ':'')+'name="'+name+'" value="'+v+'" '+(String(v)===String(current)?'checked':'')+'>'+t+'</label>').join('')+'</div>';
const button=(action,title,primary=true)=>'<button class="'+(primary?'primary':'secondary')+'" data-action="'+action+'">'+title+'</button>';
function commit(next){
 game=next;
 if(next.phase!=='setup'&&next.phase!=='scenario')savedTerm=next;
 if(game.phase==='result'&&alternative===game.records.at(-1).change)alternative=alternativeTo(game.records.at(-1).change);
 try{localStorage.setItem(key,JSON.stringify(next));saveMessage='';}catch{saveMessage='브라우저 저장을 사용할 수 없습니다. 이 탭에서 플레이를 계속할 수 있습니다.';}
 render(true);
}
function chart(k,series){
 const ns=series.flat().map(s=>s[k]);
 const min=Math.min(...ns), max=Math.max(...ns);
 const colors=['#91642d','#376781'];
 const paths=series.map((path,j)=>{
 const points=path.map((s,i)=>[12+376*i/Math.max(1,path.length-1),113-94*(s[k]-min)/(max-min||1)]);
 return '<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+colors[j]+'" stroke-width="3"/>'+points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="'+colors[j]+'"/>').join('');
 });
 return '<svg class="chart" viewBox="0 0 400 132" role="img" aria-label="'+metrics[k][0]+' 추세"><path d="M12 19H388 M12 65H388 M12 113H388" stroke="#dfd6c8" fill="none"/>'+paths.join('')+'</svg><div class="row muted"><span>'+value(k,min)+'</span><span>'+value(k,max)+'</span></div>';
}
function targetValue(k,n){return k==='stress'?n.toFixed(1)+'/100':value(k,n);}
function targetBoundary(g){
 const {key,limit,min}=g;
 if(min!==null&&limit!==null)return targetValue(key,min)+' ~ '+targetValue(key,limit);
 return limit!==null?targetValue(key,limit)+' 이하':targetValue(key,min)+' 이상';
}
const targetDelta=(k,n)=>signed(n)+(metrics[k][1]==='%'?'%p':'점');
function goalPanel(){
 const g=game.context?.goal,term=goalPeriod(game.turn,game.state);
 return '<section class="panel goal-panel"><div class="eyebrow">정책 목표</div><h2>무엇을 얼마나 개선할까요?</h2><p>'+term.label+'까지 · 모형 '+term.months+'개월</p>'+
 (g?'<p class="goal-number">'+metrics[g.key][0]+' <strong>'+targetValue(g.key,g.from)+' → '+targetBoundary(g)+'</strong></p>':'<p>수치 목표를 저장하면 금리안별 전망을 비교할 수 있습니다.</p>')+
 '<form id="goal-form"><fieldset><legend>이번 회의에서 우선할 수치</legend>'+radio('goalKey',goalOptions(game.state).map(o=>[o.key,o.name+' · '+targetBoundary(o)]),g?.key)+'</fieldset><button class="secondary" type="submit">'+(g?'목표 변경':'목표 저장')+'</button></form><p class="muted">회의 구간을 평가하는 내부 기준입니다. 한국은행의 중기 물가안정목표는 2%입니다.</p></section>';
}
function policyPreview(){
 const s=game.state,g=game.context?.goal,term=goalPeriod(game.turn,s);
 const rows=goalForecast(s,term.months),chosen=rows.find(r=>r.move===proposal),held=rows.find(r=>r.move===0);
 const effects=policyMetrics.map(k=>metrics[k][0]+' '+targetDelta(k,chosen.center[k]-held.center[k])).join(' · ');
 const market=game.context?.watch??currentWatch(game);

 const table=g?'<div class="goal-table forecast-choices" aria-label="금리안별 목표 지표 전망">'+rows.map(r=>'<article '+(r.move===proposal?'class="forecast-selected"':'')+'><h4>'+value('rate',r.rate)+(r.move===proposal?' · 제안':'')+'</h4><strong>'+targetValue(g.key,r.center[g.key])+'</strong><small>충격 범위 '+r.range[g.key].map(n=>targetValue(g.key,n)).join(' ~ ')+'</small><small>동결 대비 '+policyMetrics.filter(k=>k!==g.key).map(k=>metrics[k][0]+' '+targetDelta(k,r.center[k]-held.center[k])).join(' · ')+'</small></article>').join('')+'</div><p>'+goalDifficulty(g,rows)+'</p>':'';

 return '<h3>제안이 통과된다면 · '+value('rate',chosen.rate)+'</h3>'+table+'<p>동결 전망과의 차이 · '+effects+'</p><p>시장 예상 '+value('rate',market.expected)+' 대비 제안 '+signed(chosen.rate-market.expected)+'%p</p><p class="muted">기준 전망은 추가 충격 없음, 범위는 두 유가·수요·금융위험 가정을 포함합니다. 범위는 예측 확률과 다릅니다. 시행 금리는 위원회 표결로 확정됩니다.</p>';
}
function goalOutcome(record){
 const g=record?.goal,v=record?.goalResult;
 if(!g||!v)return '';
 return '<section class="panel goal-panel"><div class="eyebrow">'+record.date+' 회의</div><h2>정책 목표 · '+(v.met?'달성':'미달')+'</h2><p class="goal-number"><strong>'+metrics[g.key][0]+' '+targetValue(g.key,g.from)+' → '+targetValue(g.key,v.actual)+'</strong> · 목표 '+targetBoundary(g)+'</p>'+
 '<p>총재 제안 '+label(record.proposal)+' · 의결 금리 '+value('rate',record.rate)+'</p><p>변화의 비교 기준 · 동결·무충격 '+targetDelta(g.key,v.carry)+' · 금리 제안 '+targetDelta(g.key,v.proposal)+' · 의결과 제안의 차이 '+targetDelta(g.key,v.vote)+' · 충격과 위기 대응 '+targetDelta(g.key,v.shock)+'</p>'+
 '<p>다른 지표의 회의 전후 변화 · '+Object.entries(v.effects).map(([k,n])=>metrics[k][0]+' '+targetDelta(k,n)).join(' · ')+'</p><p class="muted">동결·무충격에서 시작해 금리 제안, 실제 의결, 기록된 충격과 대응을 순서대로 추가한 비교입니다.</p></section>';
}
function goalEnd(records){
 const selected=records.filter(r=>r.goalResult);
 if(!selected.length)return '';
 return '<section class="panel goal-panel"><h2>임기 중 목표와 시행 결과</h2><p class="muted">역사적 평가는 임기 중 실제 경기·물가·금융 성과를 중심으로 합니다.</p>'+selected.map(r=>'<details><summary>'+r.date+' · '+metrics[r.goal.key][0]+' · '+(r.goalResult.met?'달성':'미달')+'</summary>'+goalOutcome(r)+'</details>').join('')+'</section>';
}
function newspaperAgenda(){
 const a=game.records.at(-1)?.article;
 if(a?.next!==dates[game.turn])return '';
 return '<aside class="panel agenda"><div class="eyebrow">직전 중앙일보 1면 · '+a.date+'</div><h2>'+a.headline+'</h2><p>'+a.issue+'</p></aside>';
}
function indicators(s){
 return '<section class="metrics" aria-label="경제지표">'+['rate','inflation','growth','fx','stress'].map(k=>'<button class="metric" data-metric="'+k+'"><span>'+metrics[k][0]+'</span><strong>'+value(k,s[k])+'</strong><span>'+({rate:'한국은행',inflation:'전년 동월 대비 모형값',growth:s.growth<s.capacity?'평상시보다 약한 경기':'평상시 수준 이상',fx:'미 달러당',stress:'모형 지수'})[k]+'</span></button>').join('')+'</section>';
}
function reports(){
 const s=game.state;
 const baseline=project(s,s.rate,Array.from({length:3},()=>(calm))).at(-1);
 return '<div class="grid"><section class="panel"><div class="eyebrow">조사국</div><h2>경제전망</h2><p>3개월간 금리 동결과 추가 충격 없음 가정 시 물가 '+value('inflation',baseline.inflation)+', 경기 흐름 '+value('growth',baseline.growth)+'.</p><div class="muted">실업률 '+value('unemployment',s.unemployment)+' · 가계신용 증가율(연율) '+value('debt',s.debt)+'</div></section><section class="panel"><div class="eyebrow">금융시장국</div><h2>시장과 금융안정</h2><p>미국 실효금리 '+value('fed',s.fed)+' · 은행 대출금리 '+value('loan',s.loan)+'. 주택가격 증가율 '+value('housing',s.housing)+'.</p><div class="muted">원화 약세는 수입물가에, 대출금리는 가계와 기업의 상환 부담에 영향을 줍니다.</div></section></div>';
}

function office(){
 const rate=value('rate',game.state.rate);
 return '<section class="office-scene"><div class="office-caption"><div class="eyebrow">한국은행 · '+dates[game.turn]+'</div><h1>총재 집무실</h1><p>현재 기준금리 <strong>'+rate+'</strong> · 제'+(game.turn+1)+'차 금통위</p></div><div class="office-hotspots">'+
 button('office-report','책상 · 경제전망 보고서',false)+'<button type="button" class="secondary" data-view="watch">모니터 · BOK워치</button>'+button('office-phone','전화기 · 정부 연락',false)+'<button type="button" class="secondary" data-view="logs">서류함 · 정책 기록</button>'+button('meeting','회의 자료 · 금통위 입장')+'</div></section>'+newspaperAgenda()+(game.turn===0?'<p class="muted">'+notice+'</p>':'');
}
function showOfficeDocument(kind,trigger){
 const doc=document.createElement('dialog');
 doc.className='office-document';
 const contact=game.records.findLast(r=>r.government)?.government;
 const body=kind==='office-report'?'<p class="document-meta">조사국 · '+dates[game.turn]+' 기준 · 금통위 회의 자료</p>'+indicators(game.state)+riskBrief()+reports():contact?'<p>'+contact.event.person+' · '+contact.event.title+'</p><blockquote>'+contact.event.question+'</blockquote>':'<p>기록된 정부 연락이 없습니다.</p>';
 doc.innerHTML='<div class="row"><h2>'+(kind==='office-report'?'조사국 경제전망':'정부 연락 기록')+'</h2><form method="dialog"><button class="secondary">닫기</button></form></div>'+body;
 doc.addEventListener('close',()=>{doc.remove();trigger.focus();},{once:true});
 document.body.append(doc);doc.showModal();
}
function showBallot(record){
 if(!document.createElement)return;
 const modal=document.createElement('dialog');
 modal.className='ballot-scene';
 const votes=record.runoff??record.votes;
 modal.innerHTML='<div class="ballot-heading"><div class="eyebrow">금융통화위원회 · '+record.date+'</div><h2>표결 공개</h2></div><ol class="ballot-roll">'+votes.map((v,i)=>'<li style="--ballot-index:'+i+'"><strong>'+v.name+'</strong><span>'+label(v.vote)+'</span></li>').join('')+'</ol><p class="ballot-rate">기준금리 <strong>'+value('rate',record.origin.rate)+' → '+value('rate',record.rate)+'</strong> · '+signed(record.change)+'%p</p><form method="dialog"><button class="primary">표결 닫기 · 계속</button></form>'+button('scorecard','경제 성적표',false);
 modal.addEventListener('close',()=>{modal.remove();main.focus();},{once:true});
 document.body.append(modal);modal.showModal();
}

function memberPortrait(id){
 return '<span class="member-portrait cast-portrait" style="--cast-x:'+((id%5)*25)+'%;--cast-y:'+(Math.floor(id/5)*50)+'%" aria-hidden="true"></span>';
}
function councilSeats(){
 const governor=12+Math.max(0,['scholar','official','politician'].indexOf(game.background));
 return '<div class="council-room'+(selectedMember!==null?' has-speaker':'')+'"><div class="council-chair">'+memberPortrait(governor)+'<strong>총재</strong></div><div class="council-seats" id="members">'+members()+'</div></div>';
}
function members(){
 return opinions(game.state,focus,proposal,forecast,game.market,game).map((v,i)=>'<button class="council-person seat-'+i+(selectedMember===v.id?' speaking':'')+'" type="button" data-action="member-'+v.id+'" aria-pressed="'+(selectedMember===v.id)+'">'+memberPortrait(v.id)+'<span><strong>'+v.name+'</strong> <small>'+label(v.vote)+(v.persuaded?' · 의견 수정':'')+'</small></span></button>').join('');
}
const meetingSteps=['경제 상황','수치 목표','금리안 비교','위원 입장','설득과 수정','최종 의결'];
function stepButton(n,title){
 return '<button type="button" class="secondary" data-action="step-'+n+'">'+title+'</button>';
}
function meeting(){
 const s=game.state;
 const panel=(n,content)=>'<section class="meeting-stage" '+(n===meetingStep?'':'hidden')+' aria-label="'+meetingSteps[n]+'">'+content+'</section>';
 const required=game.context?.goal;
 const controls='<div class="stage-actions">'+(meetingStep>0?stepButton(meetingStep-1,'이전'):'')+(meetingStep<5?stepButton(meetingStep+1,meetingSteps[meetingStep+1]+' →'):'')+'</div>';
 const shortcuts=meetingStep===2&&game.turn>0?'<div class="stage-actions">'+stepButton(4,'위원과 논의')+stepButton(5,'최종 의결로')+'</div>':'';
 const proposalOptions=moves.filter(x=>s.rate+x>=0&&s.rate+x<=10).map(x=>[x,'기준금리 '+label(x)+' 제안 · '+value('rate',s.rate+x)]);
 const grounds='<fieldset><legend>위원에게 제시할 근거</legend>'+radio('focus',Object.entries(briefs),focus)+'</fieldset>';
 const dossier=meetingStep===0?'<details class="council-report"><summary>조사국 경제보고서 펼치기</summary>'+newspaperAgenda()+goalOutcome(game.records.at(-1))+indicators(s)+watchForecastPanel(game.context?.watch??currentWatch(game),null,true)+'</details>':'';
 const cue=['조사국 보고를 검토하고 이번 회의에서 우선할 지표를 정합니다.','어느 지표를 우선하시겠습니까?','회의 자료에서 금리별 예상 경로를 대조합니다.','좌석을 선택해 위원의 근거를 듣습니다.','의견이 다른 위원에게 근거를 제시할 수 있습니다.','총재의 금리안을 제출하고 표결을 공개합니다.'][meetingStep];
 return '<section class="council-scene"><header class="council-title"><div><div class="eyebrow">'+dates[game.turn]+' · 금융통화위원회</div><h1>금통위 회의실</h1></div><p>기준금리 <strong>'+value('rate',s.rate)+'</strong></p></header>'+councilSeats()+
 (selectedMember!==null?dialoguePanel():'<div class="council-voice"><strong>'+(['조사국','총재','조사국','의사국','의사국','의사국'][meetingStep])+'</strong><p>'+cue+'</p></div>')+
 '<details class="council-agenda"><summary>회의 안건 · '+(meetingStep+1)+'/6 · '+meetingSteps[meetingStep]+'</summary><ol>'+meetingSteps.map((title,n)=>'<li '+(n===meetingStep?'aria-current="step"':'')+'>'+stepButton(n,(n+1)+'. '+title)+'</li>').join('')+'</ol></details>'+dossier+
 panel(1,goalPanel())+
 '<form id="decision" class="panel decision-desk">'+panel(2,'<fieldset><legend>총재가 제안할 기준금리</legend>'+radio('proposal',proposalOptions,proposal)+'</fieldset><div id="policy-preview" aria-live="polite">'+policyPreview()+'</div>')+
 panel(4,grounds)+
 panel(5,required?'<h2>기준금리 '+value('rate',s.rate+proposal)+' 제안</h2><p>현재 금리 '+value('rate',s.rate)+' · '+label(proposal)+' · 제시한 근거 '+briefs[focus]+'</p><fieldset><legend>향후 6개월 물가 전망</legend>'+radio('forecast',['하락','보합','상승'].map(x=>[x,x]),forecast)+'</fieldset><button class="primary" type="submit">금리안 제출 및 표결</button>':'<h2>먼저 이번 회의의 목표를 정하세요</h2>'+stepButton(1,'수치 목표 선택'))+'</form>'+
 (meetingStep===4?'<div class="council-ability">'+abilityPanel()+'</div>':'')+shortcuts+controls+'</section>';
}
function comparison(r){
 const actual=project(r.origin,r.rate,r.shocks.slice(0,6));
 const alt=compare(r,alternative);
 const a=actual.at(-1), b=alt.at(-1);
 const unit=metrics[metric][1]==='%'?'%p':metrics[metric][1];
 return '<section class="panel"><div class="eyebrow">평행세계</div><h2>같은 충격, 다른 결정</h2><p class="muted">두 경로는 같은 외부 충격을 받고 각 금리를 6개월간 유지합니다. 이후 회의 결정은 반영하지 않습니다.</p><div class="row"><label>비교 결정 <select id="alternative">'+moves.map(d=>'<option value="'+d+'" '+(d===alternative?'selected':'')+'>'+label(d)+'</option>').join('')+'</select></label><label>지표 <select id="metric-select">'+Object.keys(metrics).map(k=>'<option value="'+k+'" '+(k===metric?'selected':'')+'>'+metrics[k][0]+'</option>').join('')+'</select></label></div>'+chart(metric,[actual,alt])+'<div class="key"><span>의결 금리 유지 '+value(metric,a[metric])+'</span><span style="color:#376781">비교 금리 유지 '+value(metric,b[metric])+'</span></div><p class="muted">비교 금리 경로 − 의결 금리 경로 · 1개월 '+signed(alt[1][metric]-actual[1][metric])+' '+unit+' · 2개월 '+signed(alt[2][metric]-actual[2][metric])+' '+unit+' · 6개월 '+signed(b[metric]-a[metric])+' '+unit+'</p></section>';
}
const difference=(k,a,b)=>signed(a[k]-b[k])+(metrics[k][1]==='%'?'%p':metrics[k][1]==='/100'?'점':metrics[k][1]);
function result(){
 const r=game.records.at(-1), o=r.origin;
 const {actual:s,held,shocks}=meetingImpact(r);
 const withoutShocks=project(o,r.rate,shocks.map(e=>({...calm,sensitivity:e.sensitivity}))).at(-1);
 const months=r.endMonth-o.month;
 const changes=['inflation','growth','fx','stress','consumption','investment','debt'];
 return '<div class="eyebrow">'+r.date+' / 통화정책방향 의결</div><h1>기준금리 '+value('rate',r.rate)+'</h1><p>총재 제안 '+label(r.proposal)+' · 위원회 결정 '+label(r.change)+' · 물가 전망 '+r.forecast+'</p>'+(r.proposal!==r.change?'<aside class="verdict-turn"><strong>총재 제안 미채택</strong><p>총재는 '+label(r.proposal)+'을 제안했습니다. 실제 적용 금리는 '+value('rate',r.rate)+'입니다.</p></aside>':'')+'<div class="advance-action">'+button('next','신문 1면 보기')+'</div>'+marketPanel(r)+goalOutcome(r)+watchAfter(r)+debateRecord(r)+'<div class="grid"><section class="panel"><h2>표결 기록</h2><table class="table"><thead><tr><th>위원</th><th>최초</th><th>최종</th>'+(r.runoff?'<th>결선</th>':'')+'</tr></thead><tbody>'+r.votes.map((v,i)=>'<tr><td>'+v.name+'</td><td>'+label(v.initial??v.vote)+'</td><td>'+label(v.vote)+'</td>'+(r.runoff?'<td>'+label(r.runoff[i].vote)+'</td>':'')+'</tr>').join('')+'</tbody></table><p class="muted">일곱 위원 중 과반이 찬성한 안으로 의결합니다. 과반이 없을 때는 득표 상위 두 안의 게임 내 결선을 사용합니다.</p></section><section class="panel"><h2>'+months+'개월 뒤</h2><table class="table impact-table"><thead><tr><th scope="col">지표</th><th>회의 전</th><th>결과</th><th>동결 대비</th><th>무충격 대비</th></tr></thead><tbody>'+changes.map(k=>'<tr><th scope="row">'+metrics[k][0]+'</th><td>'+value(k,o[k])+'</td><td>'+value(k,s[k])+'</td><td>'+difference(k,s,held)+'</td><td>'+difference(k,s,withoutShocks)+'</td></tr>').join('')+'</tbody></table><p class="muted">동결 대비는 이번 회의의 결정 효과입니다. 무충격 대비는 같은 금리에서 외부 충격을 빼고 비교한 값입니다. 두 차이는 상호작용을 포함합니다.</p><p>경기를 자극하거나 누르지 않는 모형 금리와의 차이 '+signed(r.rate-neutralRate)+'%p · 기존 금리 수준과 금융 여건은 다음 달에도 영향을 줍니다.</p></section></div>'+priorPolicy(r)+(r.poll?politicalReport(r.poll,'국민 평가 · 정책 신뢰 '+r.market.trust+'/100'):'')+'<div id="comparison">'+comparison(r)+'</div>';
}
function log(){
 return '<section class="panel"><div class="eyebrow">총재실 기록</div><h2>정책 일지</h2>'+(game.records.length?'<table class="table"><thead><tr><th>회의</th><th>제안</th><th>의결 금리</th><th>물가 전망</th></tr></thead><tbody>'+game.records.map(r=>'<tr><td>'+r.date+'</td><td>'+label(r.proposal)+'</td><td>'+value('rate',r.rate)+'</td><td>'+r.forecast+'</td></tr>').join('')+'</tbody></table>':'<p>첫 회의가 끝나면 이곳에 정책 기록이 쌓입니다.</p>')+'<p class="muted">재현 시드 '+game.seed+'</p></section>';
}
function model(){
 const guide='<section class="panel play-guide"><h1>게임 방법</h1><ol><li>총재 출신을 고르고 신년 기자회견에서 세 질문에 답합니다. 집무실에서 경제전망과 BOK워치를 확인합니다.</li><li>금통위에서 물가·경기·가계신용·금융위험 중 우선할 목표를 정합니다. 금리안별 전망을 비교하고 필요하면 위원을 설득합니다.</li><li>금리안을 제출하면 총재와 위원 여섯 명의 표로 결정합니다. 2·5·8·11월에는 6개월 뒤 금리 전망도 제시합니다.</li><li>기자회견에서 답변한 뒤 시장 반응과 중앙일보 1면을 읽고 다음 회의로 갑니다.</li><li>여덟 차례 금통위를 마치면 2029년 평가에서 임기 중 선택과 결과를 돌아봅니다.</li></ol><p>하단 경제 성적표에서 추이와 목표를 확인할 수 있습니다. 메뉴에서 저장하고 타이틀의 이어하기로 복귀하세요.</p></section>';
 return guide+'<section class="panel"><div class="eyebrow">데이터와 방법</div><h2>시뮬레이션 가정</h2><p>경기 흐름은 매월 갱신되는 게임 내부 점수입니다. 경제 기초체력을 뺀 차이를 점으로 표시합니다. 실제 GDP 성장률을 계산하는 지표와 구분합니다. 물가상승률은 현재 모형 수치이며 예상 물가상승률은 경제 주체의 전망 상태입니다. 시장 예상 금리는 정책금리와 별도로 형성됩니다.</p><p>2027년 수치는 가상입니다. 경제 엔진은 한국은행이 설명하는 금리·환율·신용 경로를 참고합니다. 계수와 초기 상태는 시나리오 가정이며, 경기 흐름은 월별 모형 지표입니다.</p><p>초기값 설정에 참고한 2026년 10월 기준금리 3.00%, 소비자물가 전년 동월 대비 2.8%, 9월 신규 대출금리 4.57%, 10월 미국 실효금리 3.88%는 당시 공표된 관측치입니다.</p><p>'+notice+'</p><p>중립 기준 2.50% 대비 금리 수준의 가중합이 성장·물가에 영향을 줍니다. 1~2개월에 직접 효과가 집중되고 성장에는 3개월, 물가에는 4개월까지 작은 가중치가 이어집니다. 금리 변경에 대한 시장 반응은 한 번 적용합니다. 부채 잔액·부채·주택 과열·기대물가·경제 기초체력은 매월 갱신합니다.</p><a href="'+scheduleSource+'">한국은행 2027년 회의 공지</a> · <a href="https://www.bok.or.kr/eng/main/contents.do?menuNo=400024">한국은행 통화정책 파급 경로</a> · <a href="https://fred.stlouisfed.org/series/FEDFUNDS">FRED FEDFUNDS</a></section>';
}
function ending(){
 const analysis=reassess(game), s=game.state;
 const snapshots=[s,analysis.played[12],analysis.played[24]];
 const latest=snapshots[2], control=analysis.legacyControl[24], calmEnd=analysis.calmFuture[24];
 const inherited=legacyKeys.map(k=>'<tr><td>'+metrics[k][0]+'</td><td>'+value(k,s[k])+'</td><td>'+difference(k,s,analysis.baseline)+'</td></tr>').join('');
 const outcomes=['inflation','growth','stress','fx'].map(k=>'<tr><td>'+metrics[k][0]+'</td>'+snapshots.map(t=>'<td>'+value(k,t[k])+'</td>').join('')+'</tr>').join('');
 const attribution=['inflation','growth','stress','debtStock','imbalance'].map(k=>'<tr><td>'+metrics[k][0]+'</td><td>'+difference(k,latest,control)+'</td><td>'+difference(k,latest,calmEnd)+'</td></tr>').join('');
 return '<section class="end"><div class="eyebrow">2027년 / 여덟 회의 결산</div><h1>어떤 총재로 남을 것인가.</h1><p>물가 '+value('inflation',s.inflation)+' · 경기 흐름 '+value('growth',s.growth)+' · 금융위험 '+value('stress',s.stress)+'</p>'+button('review','마지막 결정 비교',false)+' '+button('reset','새 임기 시작')+'</section>'+endNewspaper(analysis)+lastPolicyReview(analysis)+newspaperArchive()+inauguralReview()+goalEnd(game.records)+pressArchive(game.records)+watchEnd(analysis)+'<div class="grid"><section class="panel"><h2>2027년 정책이 남긴 유산</h2><table class="table"><thead><tr><th>상태</th><th>12월 말</th><th>연중 동결 대비</th></tr></thead><tbody>'+inherited+'</tbody></table><p class="muted">비교 기준은 같은 2027년 충격 아래 시작 금리를 유지한 경제입니다.</p></section><section class="panel"><h2>2029년 역사적 재평가</h2><table class="table"><thead><tr><th>지표</th><th>2027</th><th>2028</th><th>2029</th></tr></thead><tbody>'+outcomes+'</tbody></table><p class="muted">2028~2029년은 공통 후임 정책으로 중립금리 '+value('rate',neutralRate)+'를 유지하는 가상 경로입니다.</p></section></div><section class="panel"><h2>2029년 성과를 바꾼 요인</h2><table class="table"><thead><tr><th>지표</th><th>물려준 경제 상태의 영향</th><th>2028~2029년 충격의 영향</th></tr></thead><tbody>'+attribution+'</tbody></table><p class="muted">유산의 영향은 2027년 말에 네 가지 누적 상태만 연중 동결 수준으로 바꾼 경로와 비교합니다. 외부 충격의 영향은 같은 유산에서 2028~2029년 충격을 제거한 경로와 비교합니다.</p></section>'+communicationEnding(analysis.communication)+'<div id="comparison">'+comparison(game.records.at(-1))+'</div>';
}
function dotRows(release,previous){
 const bounds=[release.current,previous?.current??release.current,...release.counts.map(r=>r.rate),...(previous?.counts??[]).map(r=>r.rate)];
 const levels=rateLevels.filter(r=>r>=Math.min(...bounds)&&r<=Math.max(...bounds)).reverse();
 return '<div class="dot-charts">'+[release,previous].filter(Boolean).map(d=>{
 const counts=new Map(d.counts.map(row=>[row.rate,row.count]));
 const rows=levels.map(rate=>{
 const count=counts.get(rate)??0;
 const markers=[rate===d.current?'현행':'',rate===d.median?'중앙값':''].filter(Boolean).join(' · ');
 return '<div class="dot-row '+(rate===d.current?'dot-current':'')+'"><span>'+value('rate',rate)+'</span><span class="dot-track" aria-label="'+count+'개">'+Array.from({length:count},()=>'<i aria-hidden="true"></i>').join('')+'</span><span class="dot-count">'+count+'</span></div>'+(markers?'<div class="dot-marker">'+value('rate',rate)+' '+markers+'</div>':'');
 }).join('');
 return '<section><h3>'+d.date.slice(0,7)+' 발표</h3><p class="muted">'+d.target+' 기준금리 수준</p><div class="dot-axis">기준금리 <span>점 개수 →</span></div>'+rows+'<p class="muted">인하 '+d.lower+' · 동결 '+d.same+' · 인상 '+d.higher+' / 21점</p></section>';
 }).join('')+'</div>';
}
function officialDots(release,previous){
 return '<section class="panel dot-panel"><h2>6개월 후 조건부 금리전망</h2>'+
 (previous?'<p>직전 발표 대비 중앙값 '+signed(release.median-previous.median)+'%p · 인하 '+(release.lower-previous.lower)+'점 · 동결 '+(release.same-previous.same)+'점 · 인상 '+(release.higher-previous.higher)+'점</p>':'')+
 dotRows(release,previous)+'<p class="muted">7명의 위원이 각각 제시한 3개 점의 익명 집계입니다. 각 점은 경제 여건에 따른 전망이며 미래 금리 결정이나 약속을 뜻하지 않습니다. 전망 분포는 각 발표의 현행 금리를 기준으로 읽습니다.</p></section>';
}
function dotsEntry(){
 const r=game.pending;
 const options=rateLevels.map(rate=>'<option value="'+rate+'" '+(rate===r.rate?'selected':'')+'>'+value('rate',rate)+'</option>').join('');
 const market=game.market??openingMarket;
 const previous=game.records.filter(x=>x.dots).at(-1)?.dots;
 return '<section class="panel"><div class="eyebrow">'+r.date+' / 기준금리 '+value('rate',r.rate)+'</div><h1>총재의 점도표</h1><p>'+horizon(r.date)+'의 기준금리 수준을 세 개의 점으로 제시합니다. 한 금리 수준에 여러 점을 둘 수 있습니다.</p><p class="muted">발표 전 시장의 6개월 예상 금리 '+value('rate',market.expected)+(previous?' · 직전 점도표 중앙값 '+value('rate',previous.median):'')+'</p><form id="dot-form"><div class="dot-inputs">'+[1,2,3].map(n=>'<label>전망 '+n+' <select name="dot-'+n+'">'+options+'</select></label>').join('')+'</div><button class="primary" type="submit">21점 집계 및 발표</button></form></section>';
}

function pressArchive(records){
 return '<section><h2>임기 중 공개 발언</h2>'+records.filter(r=>r.conference?.answers.length).map(r=>'<details class="panel"><summary>'+r.date+' 기자회견 기록</summary><p>'+r.pressSummary.headline+'</p>'+pressTranscript(r.conference)+'</details>').join('')+'</section>';
}
function pressTranscript(c){
 return '<ol class="press-transcript">'+c.answers.map(a=>'<li><strong>'+a.reporter+'</strong><p>'+a.question+'</p><blockquote>'+a.text+'</blockquote></li>').join('')+'</ol>';
}

function inauguralScreen(){
 const r=game.inaugural, n=r.answers.length, q=inauguralQuestions(r.indicators, r.scenario??game.scenario??'standard')[n];
 return '<section class="panel inaugural"><div class="eyebrow">2027년 1월 · 게임 속 가상 기자간담회</div><h1>한국은행 총재 신년 기자간담회</h1><figure class="press-stage"><div class="scene scene-press" aria-hidden="true"></div><figcaption>'+backgrounds[game.background].name+' 출신 신임 총재</figcaption></figure><section class="press-question"><div class="eyebrow">질문 '+(n+1)+' / 3</div><h2>'+q.reporter+'</h2>'+
 (n===0?'<p class="muted">매파는 물가를 잡기 위해 금리를 높게 유지하는 데, 비둘기파는 경기 여건을 고려해 금리를 낮추는 데 상대적으로 적극적인 입장입니다.</p>':'<p class="muted">말씀 감사합니다. '+(n===1?'올해 중점 현안도 여쭙겠습니다.':'마지막으로 경기 진단을 여쭙겠습니다.')+'</p>')+'<p>'+q.question+'</p>'+
 (n===1?'<p class="muted">올해 중점과 별도로, 한국은행의 통화정책은 물가안정을 우선합니다.</p>':'')+
 '<form id="inaugural-form"><fieldset><legend>총재의 답변</legend>'+q.choices.map(a=>'<label class="press-option"><input type="radio" name="answer" value="'+a.id+'" required><span><strong>'+a.label+'</strong><small>'+a.text+'</small></span></label>').join('')+'</fieldset><button class="primary" type="submit">'+(n===2?'답변하고 집무실 입장':'답변하고 다음 질문')+'</button></form></section></section>';
}
function inauguralReview(){
 const r=game.inaugural;
 if(!r)return '';
 const enacted=game.records.map(x=>value('rate',x.rate)).join(' → ');
 return '<section class="panel"><h2>취임 발언과 실제 임기</h2><p>'+r.date+' · 당시 기준금리 '+value('rate',r.rate)+'</p>'+r.answers.map(a=>'<blockquote>'+a.text+'</blockquote>').join('')+'<p>실제 의결 경로 '+enacted+'</p><p>취임 발언과 실제 의결을 비교해 정책이 여건에 따라 어떻게 달라졌는지 확인할 수 있습니다.</p></section>';
}
function pressScreen(){
 const r=game.pending,c=conferenceFor(game),q=c.queue[c.answers.length];
 const choices=q?conferenceChoices(game,q):[];
 return '<section class="panel"><div class="eyebrow">'+r.date+' · 가상 기자간담회</div><h1>기자회견</h1><figure class="press-stage"><div class="scene scene-press" aria-hidden="true"></div><figcaption>한국은행 총재석 · '+(backgrounds[game.background]?.name??'총재')+'</figcaption></figure><details class="press-opening" '+(game.turn===0&&!c.answers.length?'open':'')+'><summary>총재 모두발언 · '+value('rate',r.rate)+'</summary><p>'+Object.values(c.opening).join('</p><p>')+'</p></details>'+
 (q?'<section class="press-question" aria-live="polite"><h2>'+(q.id==='follow'?'추가 질문 · '+pressReporter(q):pressReporter(q))+'</h2><p>'+q.question+'</p><form id="qa-form"><fieldset><legend>총재 답변</legend>'+choices.map((a,i)=>'<label class="press-option"><input type="radio" name="answer" value="'+a.id+'" '+(i===0?'checked':'')+'><span><strong>'+a.label+'</strong><small>'+a.text+'</small></span></label>').join('')+'</fieldset><button class="primary" type="submit">이 답변 발표</button></form></section>':'<form id="press-form"><button class="primary" type="submit">기자회견 종료 및 시장 반응 보기</button></form>')+
 (c.answers.length?'<details><summary>발표한 답변 '+c.answers.length+'건</summary>'+pressTranscript(c)+'</details>':'')+'</section>'+
 (r.dots?officialDots(r.dots,game.records.filter(item=>item.dots).at(-1)?.dots):'');
}

function newspaperArchive(){
 const articles=game.records.filter(r=>r.article);
 return articles.length?'<section class="panel newspaper-archive"><h2>2027년 중앙일보 1면 연대기</h2>'+articles.map(r=>'<details><summary>'+r.article.date+' · '+r.article.headline+'</summary><p>당시 의결 '+value('rate',r.rate)+(r.goalResult?' · 목표 '+(r.goalResult.met?'달성':'미달'):'')+'</p>'+r.article.body.map(p=>'<p>'+p+'</p>').join('')+'</details>').join('')+'</section>':'';
}
function newspaperScreen(){
 const a=game.records.at(-1).article;
 const date=new Intl.DateTimeFormat('ko-KR',{dateStyle:'full',timeZone:'UTC'}).format(new Date(a.date));
 const featured=a.indicators.find(i=>i.key===a.topic);
 const number=featured?'<p class="front-highlight"><span>'+featured.name+'</span><strong>'+featured.before.toFixed(2)+featured.unit+' → '+featured.after.toFixed(2)+featured.unit+'</strong></p>':'';
 const rows=a.indicators.slice(0,5).map(i=>'<li><strong>'+i.name+'</strong><span>'+i.before.toFixed(2)+i.unit+' → '+i.after.toFixed(2)+i.unit+'</span></li>').join('');
 const forecast=a.watch?'<h2>다음 금통위 전망 · '+a.next+'</h2><p>BOK워치 · '+a.watch.asOf+' 기준 · 가상 시장 전망</p><p>'+watchOutcomes.map(k=>watchOutcomeLabel(k)+' '+a.watch.probabilities[k]+'%').join(' · ')+'</p>':'<h2>후임 정책에 남은 과제</h2>';
 return (a.flash?'<aside class="verdict-turn"><strong>긴급 속보</strong><p>'+a.flash+'</p></aside>':'')+
 '<article class="front-page"><header><p>종합 1면 · 2027년 게임 속 가상 기사</p><div class="masthead joongang-logo" role="img" aria-label="중앙일보"></div><p>'+date+'</p></header><h1>'+a.headline+'</h1><p class="front-deck">'+a.secondary.join('<br>')+'</p><div class="front-columns"><div class="front-story">'+a.body.map(p=>'<p>'+p+'</p>').join('')+'</div><aside><h2>회의 전 → 발행일</h2>'+number+(a.trend?.length?chart(a.topic,[a.trend]):'')+'<details><summary>다른 경제지표</summary><ul class="front-figures">'+rows+'</ul></details></aside></div><footer>'+forecast+'<p>'+a.issue+'</p>'+button('next',a.next?'다음 금통위로 이동':'2029년 역사적 재평가')+'</footer></article>';
}
function marketPanel(r){
 const m=r.market;
 if(!m)return '';
 const explanation=r.question.challenge?(m.explained?'여건 변화에 근거한 설명이 전망 수정의 신뢰를 뒷받침했습니다.':'직전 경로와 차이가 나는 신호에 대해 시장이 충분한 근거를 확인하지 못했습니다.'):'';
 const previous=game.records.at(-2)?.market?.trust, before=game.records.at(-3)?.market?.trust;
 const change=Number.isFinite(previous)&&m.trust!==previous?(m.trust>previous?'직전 회의보다 신뢰가 높아졌습니다.':'직전 회의보다 신뢰가 낮아졌습니다.'):'직전 회의 대비 신뢰 변화 없음';
 const recovery=Number.isFinite(before)&&previous<before&&m.trust>previous?'<p class="trust-recovery">직전 신뢰 하락 이후 '+(m.trust-previous)+'점 회복</p>':'';
 return '<section class="panel dot-panel"><h2>발표 직후 시장 반응</h2>'+recovery+'<p>6개월 예상 기준금리 '+value('rate',m.expected)+' ('+signed(m.shift)+'%p) · 단기 시장금리 '+value('rate',m.yield)+' ('+signed(m.yieldShift)+'%p) · 정책 신뢰 '+m.trust+'/100</p><p>'+ (Number.isFinite(previous)?change:'')+'</p><p class="muted">'+(r.dots?'점도표 기준 기존 기대와의 격차 '+signed(m.dotSurprise)+'%p · ':'')+'의결 금리의 예상 대비 차이 '+signed(m.policySurprise)+'%p. '+explanation+'</p></section>';
}
function dotHistory(){
 const releases=game.records.filter(r=>r.dots).map(r=>r.dots);
 return '<h1>점도표 발표 이력</h1>'+(releases.length?releases.map((r,i)=>officialDots(r,releases[i-1])).reverse().join(''):'<p>2·5·8·11월 회의에서 공식 조건부 전망을 발표합니다.</p>');
}
function communicationEnding(e){
 if(!e.releases)return '';
 return '<section class="panel dot-panel"><h2>'+e.title+'</h2><p>총재 전망 중앙값 기준 · 현행 금리보다 높은 발표 '+e.above+'회 · 낮은 발표 '+e.below+'회 · 여건을 설명한 전망 수정 '+e.flexible+'회</p><p>2027년 말 정책 신뢰 '+e.trust+'/100 · 발표 직후 예상금리 평균 변동 '+e.volatility.toFixed(2)+'%p · 근거가 부족한 상충 신호 '+e.unexplained+'회</p><p class="muted">2029년 재평가에 남긴 소통 기록입니다. 이후의 모형 금리는 후임 정책 가정에 따릅니다.</p></section>';
}
function setupScreen(){
 return '<section class="panel"><div class="eyebrow">2027년 임명</div><h1>어떤 총재로 시작할 것인가</h1><p>당신은 한국은행 총재입니다. 2027년 여덟 차례 금통위에서 물가, 경기, 금융안정 사이에서 판단해야 합니다. 기준금리는 위원회가 표결로 결정합니다.</p><p>위원에게 근거를 제시하고 정부 요구에 대응하세요. 결정의 결과는 중앙일보 1면과 2029년 역사적 평가에 남습니다.</p><div class="backgrounds">'+Object.entries(backgrounds).map(([id,b],i)=>'<article>'+memberPortrait(12+i)+'<h2>'+b.name+'</h2><p>'+b.focus+'</p><p class="muted">'+b.argument+'</p>'+button('background-'+id,'이 출신으로 선택')+'</article>').join('')+'</div></section>';
}
function scenarioScreen(){
 const bg=backgrounds[game.background]??backgrounds.scholar;
 const cards=Object.values(startScenarios).map(sc=>{
  const s=sc.state;
  const badge=sc.recommended?'<span class="badge scenario-badge">추천 · 균형</span>':'';
  return '<article class="scenario-card'+(sc.recommended?' recommended-card':'')+'">'+
  '<div class="row"><h2>'+sc.name+'</h2>'+badge+'</div>'+
  '<p class="scenario-subtitle"><strong>'+sc.subtitle+'</strong></p>'+
  '<div class="scenario-metrics-preview">'+
   '<span>물가 '+value('inflation',s.inflation)+'</span>'+
   '<span>경기 '+value('growth',s.growth)+'</span>'+
   '<span>환율 '+Math.round(s.fx).toLocaleString('ko-KR')+'원</span>'+
   '<span>위험 '+Math.round(s.stress)+'점</span>'+
  '</div>'+
  '<p class="scenario-dilemma"><strong>핵심 고민:</strong> '+sc.dilemma+'</p>'+
  '<p class="muted">'+sc.desc+'</p>'+
  button('scenario-'+sc.id,'이 환경으로 임기 시작')+'</article>';
 }).join('');

 const randomCard='<article class="scenario-card scenario-random-card">'+
 '<div class="row"><h2>🎲 무작위 시나리오</h2><span class="badge">도전</span></div>'+
 '<p class="scenario-subtitle"><strong>무작위 경제 여건에서 시작</strong></p>'+
 '<p>기본 및 5개 경제 시나리오 중 하나가 무작위로 배정됩니다. 첫 회의까지 어떤 상황인지 예측할 수 없습니다.</p>'+
 button('scenario-random','무작위로 시작',false)+'</article>';

 return '<section class="panel scenario-panel"><div class="eyebrow">2027년 대한민국 경제 여건 선택</div>'+
 '<h1>어떤 경제 상황에서 출발할 것인가</h1>'+
 '<p>선택한 총재: <strong>'+bg.name+'</strong> ('+bg.focus+')</p>'+
 '<p>경제 환경에 따라 <strong>초기 경제지표, 시장 전망(BOK워치), 위원들의 판단과 취임 기자회견 쟁점</strong>이 달라집니다.</p>'+
 '<div class="scenario-grid">'+cards+randomCard+'</div>'+
 '<div class="stage-actions">'+button('back-setup','← 총재 출신 다시 선택',false)+'</div></section>';
}
function riskBrief(g=game){
 const b=briefing(g),last=g.records.at(-1);
 const previous=last?'<p class="muted">직전 의결 '+value('rate',last.rate)+' · 회의 이후 물가 '+difference('inflation',g.state,last.origin)+' · 성장 '+difference('growth',g.state,last.origin)+' · 외환 '+difference('fx',g.state,last.origin)+'</p>':'';
 const late=g.turn>=6?'<p class="muted">남은 의결 '+(8-g.turn)+'회 · 11월 금리의 누적 효과와 2028년 5월 조건부 전망은 역사 평가에서 다시 확인합니다.</p>':'';
 return '<section class="panel risk-brief"><h2>'+b.title+'</h2><p>'+b.detail+'</p>'+'<p class="muted">경기 흐름 − 기초체력 '+signed(g.state.growth-g.state.capacity)+'점 · 예상 물가상승률 '+value('expectations',g.state.expectations)+'</p>'+previous+late+(g.market?'<p class="muted">시장이 반영한 6개월 예상 금리 '+value('rate',g.market.expected)+' · 단기 시장금리 '+value('rate',g.market.yield)+'</p>':'')+'</section>';
}
function crisisScreen(){
 const events=game.context.events;
 return '<section class="panel crisis"><div class="eyebrow">긴급 경제 속보 / '+dates[game.turn]+'</div><h1>위기 대응 회의</h1><div class="crisis-backdrop" aria-hidden="true"></div>'+
 events.map(e=>{const d=incidents[e.id];return '<h2>'+d.title+'</h2><p>'+d.why+' · 남은 영향 '+(e.start+d.duration-game.state.month)+'개월</p>';}).join('')+
 '<form id="crisis-form"><fieldset><legend>금리 표결에 앞선 시장 대응</legend>'+radio('response',Object.entries(crisisResponses).map(([k,[title,desc]])=>[k,'<span><strong>'+title+'</strong><br><small>'+desc+'</small></span>']),'observe')+'</fieldset><button class="primary" type="submit">대응 방침 확정</button></form></section>';
}
function governmentScreen(){
 const e=game.context.government,b=backgrounds[game.background];
 const replies=Object.entries(politicalReplies[e.id]).map(([k,v])=>[k,k==='coordinate'&&b?b.government:v]);
 return '<section class="panel government '+(e.id==='president'?'government-president':e.id==='hearing'?'government-hearing':'government-ministry')+'"><div class="eyebrow">'+e.title+' / '+dates[game.turn]+'</div><h1>'+e.person+'</h1><div class="political-backdrop" aria-hidden="true"></div><div class="government-document"><span>'+(e.id==='president'?'대통령실 · 비공개 회동 기록':e.id==='hearing'?'국회 · 공개 질의 기록':'정부 · 정책 연락')+'</span><blockquote>“'+e.question+'”</blockquote></div><p>물가 '+value('inflation',game.state.inflation)+' · 경기 흐름 '+value('growth',game.state.growth)+' · 가계신용 증가율(연율) '+value('debt',game.state.debt)+'</p><form id="government-form"><fieldset><legend>총재 답변</legend>'+radio('governmentReply',replies,replies[0][0])+'</fieldset><button class="primary" type="submit">답변하고 금통위 입장</button></form></section>';
}
function reviewScreen(){
 const r=game.pending;
 return '<section class="panel crisis"><div class="eyebrow">공식 공표 / 한국은행법 제92조</div><h1>금통위 재의 요구</h1><p>재정경제부장관이 정부 경제정책과의 상충을 이유로 '+value('rate',r.rate)+' 의결의 재의를 요구했습니다. 같은 안을 위원 5명 이상이 다시 찬성하면 대통령이 최종 결정합니다.</p><form id="review-form"><fieldset><legend>재의에서 행사할 총재의 표</legend>'+radio('motion',moves.map(d=>[d,label(d)]),r.change)+'</fieldset><button class="primary" type="submit">재의 표결 실시</button></form></section>';
}
function politicalReport(p,heading='국민 평가 · 가상 여론 지표'){
 if(!p)return '';
 return '<section class="panel political-report '+(p.change<=-2?'poll-drop':'')+'"><div class="eyebrow">중앙일보 / 게임 시뮬레이션</div><h2>'+(p.change<=-2?'하락한 지지도 · ':'')+heading+'</h2><p>국민 지지도 <strong>'+p.approval.toFixed(1)+'/100</strong>'+(Number.isFinite(p.change)?' ('+signed(p.change)+'점)':'')+' · 독립성 인식 '+p.independence.toFixed(1)+' · 정부 공조 '+p.coordination.toFixed(1)+' · 금융시장 신뢰 '+p.confidence.toFixed(1)+'</p><table class="table"><thead><tr><th>계층</th><th>가상 지지도</th></tr></thead><tbody>'+Object.entries(constituencies).map(([k,v])=>'<tr><td>'+v+'</td><td>'+p.groups[k].toFixed(1)+'</td></tr>').join('')+'</tbody></table><p class="muted">'+(p.factors??[]).map(f=>f.name+' '+signed(f.v)).join(' · ')+'</p></section>';
}
function priorPolicy(r){
 const s=r.origin;
 const base=project(s,r.rate,r.shocks.slice(0,r.endMonth-s.month)).at(-1);
 const washed={...s,gaps:s.gaps.map(()=>0)};
 const noCarry=project(washed,r.rate,r.shocks.slice(0,r.endMonth-s.month)).at(-1);
 const nextRisk=briefing(game);
 const events=(r.incidents??[]).map(e=>incidents[e.id]?.title).filter(Boolean);
 const noNewIncidents=r.baseShocks?project(s,r.rate,r.baseShocks.slice(0,r.endMonth-s.month)).at(-1):null;
 return '<section class="panel risk-brief"><h2>다음 회의에 남은 쟁점</h2><p>'+nextRisk.title+' · '+nextRisk.detail+'</p><p>과거 금리가 경기를 자극하거나 억제한 누적 영향 · 물가 '+difference('inflation',base,noCarry)+' · 성장 '+difference('growth',base,noCarry)+'</p>'+(events.length?'<p>이번 구간 사건 · '+events.join(' · ')+' / 대응 '+crisisResponses[r.response][0]+'</p><p class="muted">사건과 대응을 제외한 경로 대비 · 물가 '+difference('inflation',base,noNewIncidents)+' · 성장 '+difference('growth',base,noNewIncidents)+' · 금융 위험 '+difference('stress',base,noNewIncidents)+'</p>':'')+(r.government?'<p class="muted">정부 협의 · '+(r.government.justified?'경제적 근거를 제시했습니다.':'경제적 근거가 충분히 전달되지 않았습니다.')+'</p>':'')+(r.review?'<p>재의 · 동일 안 '+r.review.support+'표 · '+(r.review.president?'대통령 '+r.review.president:'대체안 결선')+'</p>':'')+'</section>';
}
function endNewspaper(analysis){
 const verdict=historicalVerdict(game,analysis), s=verdict.score;
 const scores=[['2% 물가 목표와의 평균 거리',s.inflationError,'%p'],['기초체력 대비 평균 경기 흐름',s.growthGap,'점'],['평균 금융위험',s.stress,'점'],['월평균 환율 변동 폭',s.fxVolatility,'원'],['연말 정책 신뢰',s.trust,'점'],['위험을 낮춘 유동성 대응',verdict.assisted,'회']];
 const meetings=game.records.map(r=>'<li><time>'+r.date+'</time> <strong>'+value('rate',r.rate)+'</strong> <span>'+label(r.change)+'</span></li>').join('');
 return '<article class="newspaper front-page"><header><p>회고 특집 1면 · 2029년 게임 속 가상 기사</p><div class="masthead joongang-logo" role="img" aria-label="중앙일보"></div><p>2029년 12월</p></header><h2>'+verdict.title+'</h2><p>'+verdict.success+' '+verdict.cost+'</p><p class="muted">'+verdict.stewardship+'</p><p class="muted">'+verdict.subtitle+'</p><p>총재 출신 '+(backgrounds[game.background]?.name??'기존 임기')+' · 근거에 따라 바뀐 위원 판단 '+verdict.convinced+'/'+verdict.attempts+'회</p><p class="muted">당신은 인기 있는 총재였는가, 아니면 역사에 남을 총재였는가?</p></article><div class="grid"><section class="panel"><h2>2027년 통화정책 성적표</h2><table class="table"><thead><tr><th>항목</th><th>결과</th></tr></thead><tbody>'+scores.map(([name,n,unit])=>'<tr><td>'+name+'</td><td>'+n.toFixed(2)+unit+'</td></tr>').join('')+'</tbody></table></section><section class="panel"><h2>8번의 기준금리 결정</h2><ol class="timeline">'+meetings+'</ol></section></div>'+politicalReport(game.politics,'2027년 말 지지도와 독립성');
}
function abilityPanel(){
 const a=abilityStatus(game);
 if(!a)return '';
 const current=game.context?.ability;
 if(current){
 const r=current.report;
 const effect=r?'두 달 모형 시나리오 · '+metrics[r.key][0]+' · 동결 '+value(r.key,r.central)+' · 인하 '+value(r.key,r.lower)+' · 인상 '+value(r.key,r.higher)+' · 유가·수요 충격을 넣은 동결 '+value(r.key,r.adverse):
 current.kind==='official'?'선택한 조합을 금리 표결과 따로 적용합니다.':'기자회견에서 담화와 같은 근거를 설명하면 시장이 예상하는 금리에 반영됩니다.';
 return '<section class="panel ability"><h2>'+a.name+'</h2><p>'+a.options[current.choice]+'</p><p class="muted">'+effect+'</p></section>';
 }
 if(!a.available)return '<section class="panel ability"><h2>'+a.name+'</h2><p class="muted">남은 임기 사용 '+a.remaining+'회 · 이번 회의에 사용할 수 없습니다.</p></section>';
 const choices=Object.entries(a.options).filter(([key])=>game.background!=='official'||key==='mediation'||game.context?.events?.length&&key!==game.context.response);
 return '<section class="panel ability"><h2>'+a.name+'</h2><p>남은 임기 사용 '+a.remaining+'회. '+a.cost+'</p><form id="ability-form"><fieldset><legend>총재의 고유 행동</legend>'+radio('abilityChoice',choices,choices[0][0])+'</fieldset><button class="secondary" type="submit">이 방침 실행</button></form></section>';
}
function lastPolicyReview(analysis){
 const latest=analysis.played.at(-1), held=analysis.novemberHold, d=analysis.finalDot;
 const baseline=meetingImpact(game.records.at(-1)).held;
 return '<section class="panel legacy-brief"><h2>11월 결정이 남긴 차이</h2><p>11월 동결 대안 대비 2027년 말 · 물가 '+difference('inflation',game.state,baseline)+' · 경기 흐름 '+difference('growth',game.state,baseline)+'</p><p>같은 후임 금리와 외부 충격을 적용한 2029년 말 · 물가 '+difference('inflation',latest,held)+' · 경기 흐름 '+difference('growth',latest,held)+' · 가계부채 '+difference('debtStock',latest,held)+'</p>'+
 (d?'<p>'+d.target+' 조건부 점도표 중앙값 '+value('rate',d.median)+' · 11월 발표 뒤 시장 예상 '+(d.expected===null?'기록 없음':value('rate',d.expected))+' · 후임 경로의 가정 금리 '+value('rate',d.successorRate)+'</p><p class="muted">점도표와 시장 예상은 인계 시점의 소통 기록입니다. 후임 금리는 시뮬레이션 가정입니다.</p>':'')+'</section>';
}
function watchNumbers(f){
 return '<div class="watch-probabilities">'+watchOutcomes.map(k=>'<span class="watch-'+k+'">'+watchOutcomeLabel(k)+' <strong>'+f.probabilities[k]+'%</strong></span>').join('')+'</div><div class="watch-bar" aria-hidden="true">'+watchOutcomes.map(k=>'<i class="watch-'+k+'" style="width:'+f.probabilities[k]+'%"></i>').join('')+'</div>';
}
function watchForecastPanel(f,previous,compact=false){
 if(!f)return '';
 const ranked=[...watchOutcomes].sort((a,b)=>f.probabilities[b]-f.probabilities[a]);
 const highest=ranked[0], second=ranked[1], probability=f.probabilities[highest];
 const tied=ranked.filter(k=>f.probabilities[k]===probability);
 const lead=tied.length>1?tied.map(watchOutcomeLabel).join('·')+' 전망 동률':'다음 회의 금리 '+watchOutcomeLabel(highest)+' 확률';
 const close=tied.length===1&&probability-f.probabilities[second]<=5?'<p class="watch-close">'+watchOutcomeLabel(highest)+(highest==='cut'?'와 ':'과 ')+watchOutcomeLabel(second)+' 전망이 팽팽합니다.</p>':'';
 const delta=previous?watchOutcomes.map(k=>watchOutcomeLabel(k)+' '+signed(f.probabilities[k]-previous.probabilities[k])+'%p').join(' · '):'';
 const factors=(f.factors??[]).map(x=>'<li>'+x.name+' '+(x.value>.03?'요인이 금리 인상 전망에 힘을 보탰습니다.':x.value<-.03?'요인이 금리 인하 전망에 힘을 보탰습니다.':'요인의 영향은 작았습니다.')+'</li>').join('');
 return '<section class="panel watch-panel"><div class="eyebrow">BOK워치 · 2027 가상 시장</div><h2>'+f.date+' 금통위</h2><p class="muted">관측 기준 '+f.asOf+' · 회의까지 '+f.span+'일</p><div class="watch-hero"><strong>'+probability+'%</strong><span>'+lead+'</span></div>'+close+watchNumbers(f)+'<p>시장 예상 기준금리 <strong>'+value('rate',f.expected)+'</strong></p><p>현재 기준금리 '+value('rate',f.rate)+'</p>'+
 (compact?'<p class="muted">주요 요인 · '+(f.factors?.[0]?.name??'공개 시장 지표')+'</p><button type="button" class="secondary" data-view="watch">시장 전망 자세히</button>':(delta?'<p>직전 발표 뒤 대비 '+delta+'</p>':'')+'<h3>전망을 움직인 요인</h3><ul>'+factors+'</ul><details class="watch-pressure"><summary>보조 지표 · 단기 인상 압력</summary><p class="muted">0~100 지수 · 7일 '+f.pressure7+' · 30일 '+f.pressure30+'. 다음 회의 확률과 별도로 표시합니다. 실제 BOK워치 서비스와 별개로 게임 지표를 사용합니다.</p></details>')+'</section>';
}
function watchPlot(points){
 if(points.length<2)return '';
 const graph=watchOutcomes.map(k=>'<polyline class="watch-'+k+'" points="'+points.map((v,i)=>(12+276*i/(points.length-1))+','+(110-v.probabilities[k])).join(' ')+'" fill="none" stroke-width="2.5"/>').join('');
 return '<section class="panel watch-panel"><h2>회의 직전 전망 추이</h2><svg viewBox="0 0 300 122" class="watch-chart" role="img" aria-label="회의별 가상 인상, 동결, 인하 확률"><path d="M12 10H288 M12 60H288 M12 110H288" stroke="#c6bcaa" stroke-width="1"/>'+graph+'</svg><p class="muted">'+points.map(f=>f.date.slice(5,7)+'월 '+f.probabilities.raise+'/'+f.probabilities.hold+'/'+f.probabilities.cut+'%').join(' · ')+' (인상/동결/인하)</p></section>';
}
function watchScreen(){
 const last=game.records.at(-1), current=(game.phase==='newspaper'?last?.article?.watch??last?.watch:null)??game.pending?.watch??game.context?.watch??(game.phase==='end'||game.phase==='result'?last?.watch:currentWatch(game));
 const historical=game.records.flatMap(r=>r.watch?[r.watch]:[]);
 const history=current&&historical.at(-1)?.date!==current.date?[...historical,current]:historical;
 const prior=game.records.find(r=>r.watchResult?.next?.press.date===current?.date)?.watchResult.next.press;
 const style={scholar:'경제분석 보고서의 충격 시나리오와 시장의 주요 요인을 대조하세요.',official:'공개된 재정 정책과 시장 위험이 금리 기대를 어느 방향으로 움직이는지 확인하세요.',politician:'국민 평가와 시장이 예상하는 금리의 차이를 살펴보고 담화에서 비용을 설명할 수 있습니다.'};
 return '<div class="market-terminal"><h1>BOK워치</h1>'+(current?watchForecastPanel(current,prior):'<p>이 저장의 이전 회의에는 공개 전망 기록이 없습니다.</p>')+(style[game.background]?'<p class="muted">'+style[game.background]+'</p>':'')+watchPlot(history)+game.records.flatMap(r=>r.watchResult?['<details class="panel watch-panel watch-record"><summary>'+r.date+' 저장된 전망과 의결</summary>'+watchAfter(r)+'</details>']:[]).reverse().join('')+'</div>';
}
function watchAfter(r){
 const w=r.watchResult;
 if(!w)return '';
 const q=w.reaction;
 const snapshots=w.next?([['의결 공개',w.next.decision],...(r.dots?[['점도표 공개',w.next.dots]]:[]),['기자회견 뒤',w.next.press]]):[];
 const table=snapshots.length?'<table class="table"><thead><tr><th>다음 회의 전망 시점</th><th>인상</th><th>동결</th><th>인하</th></tr></thead><tbody>'+snapshots.map(([stage,f])=>'<tr><td>'+stage+'</td>'+watchOutcomes.map(k=>'<td>'+f.probabilities[k]+'%</td>').join('')+'</tr>').join('')+'</tbody></table>':'<p>후임 경로에 대한 시장이 예상하는 금리 · 의결 공개 '+value('rate',w.terminalAnchor.decision)+' · 점도표 공개 '+value('rate',w.terminalAnchor.dots)+' · 기자회견 뒤 '+value('rate',w.terminalAnchor.press)+'</p>';
 const headline=w.headline?'<aside class="verdict-turn"><div class="eyebrow">시장 속보</div><h3>시장의 예상과 엇갈린 '+watchOutcomeLabel(w.actual)+' 의결</h3><p>BOK워치가 사전에 발표한 '+watchOutcomeLabel(w.before.favorite)+' 확률 '+w.before.probabilities[w.before.favorite]+'%.</p></aside>':'';
 return '<section class="panel watch-panel"><div class="eyebrow">BOK워치 · 가상 시장</div><h2>예상과 의결의 차이</h2>'+headline+(r.pressSummary?'<aside class="verdict-turn"><h3>'+r.pressSummary.headline+'</h3><blockquote>'+r.pressSummary.quote+'</blockquote></aside>':'')+
 '<p>회의 직전 시장 우세 전망 '+watchOutcomeLabel(w.before.favorite)+' '+w.before.probabilities[w.before.favorite]+'% · 실제 '+watchOutcomeLabel(w.actual)+' (사전 '+w.actualProbability+'%) · 예상 대비 금리 '+signed(w.surprise)+'%p</p>'+
 (r.noActionRate!==undefined&&!r.review?'<p class="muted">총재가 동결표를 던지고 회의 내 개입을 제외한 비교 표결 '+value('rate',r.noActionRate)+' · 같은 회의 전 경제·시장 상태</p>':'')+
 '<div class="watch-reaction"><span>단기금리 '+signed(q.shortBps)+'bp</span><span>장기 국채금리 '+signed(q.longBps)+'bp</span><span>원/달러 '+signed(q.fxWon)+'원</span><span>주가 '+signed(q.stocksPct)+'%</span><span>변동성 +'+q.volatility.toFixed(2)+'점</span></div>'+table+
 '<p class="muted">발표 직후 가상 시세 반응입니다. 다음 회의 전망 비교는 같은 관측 시점에서 공개 정보만 순서대로 바꿉니다.</p></section>';
}
function watchEnd(analysis){
 const w=analysis.watch;
 if(!w?.count)return '';
 return '<section class="panel watch-panel"><div class="eyebrow">BOK워치 · 임기 회고</div><h2>시장은 무엇을 예상했나</h2><p>기록 '+w.count+'회 · 큰 예상 차이 '+w.surprises+'회 · 확률 전망의 오차 점수 '+w.brier.toFixed(3)+' (낮을수록 좋음)</p><table class="table"><thead><tr><th>회의</th><th>사전 인상/동결/인하</th><th>의결</th></tr></thead><tbody>'+w.rows.map(r=>'<tr><td>'+r.before.date+'</td><td>'+watchOutcomes.map(k=>r.before.probabilities[k]).join('/')+'%</td><td>'+watchOutcomeLabel(r.actual)+'</td></tr>').join('')+'</tbody></table><p class="muted">단일 임기의 적중만으로 확률 보정을 판단하지 않습니다. 경제 성과와 정책 신뢰는 별도 역사 평가에 남습니다.</p></section>';
}
function debateRecord(r){
 const reports=(r.persuasion??[]).map(p=>'<li><strong>'+p.name+' '+label(p.initial)+' → '+label(p.final)+'</strong> · '+(p.outcome??'')+(p.trustAfter===undefined?'':' · 정책적 신뢰 '+p.trustBefore+' → '+p.trustAfter+' · 이 기록은 다음 설득에 반영됩니다')+'</li>').join('');
 const forecast=(r.verified??[]).map(f=>f.date+' 전망 '+f.forecast+' / 6개월 결과 '+f.actual).join(' · ');
 const pivots=(r.influence??[]).filter(p=>p.withoutRate!==r.rate);
 const pivotalText=pivots.map(x=>{
 const p=r.persuasion.find(a=>a.id===x.id);
 return '<p>'+p.name+' 위원은 '+label(p.initial)+'에서 '+label(p.final)+'로 표를 옮겼습니다. 그 설득만 제외하면 의결 금리는 '+value('rate',x.withoutRate)+'였습니다.</p>';
 }).join('');
 const decisive=r.persuasionDecisive?'<aside class="verdict-turn"><div class="eyebrow">표결의 전환점</div><h3>설득이 의결을 바꿨습니다</h3>'+(pivotalText||'<p>개별 설득을 모두 제외하면 의결 금리는 '+value('rate',r.noPersuasionRate)+'였습니다.</p>')+'</aside>':'';
 return reports||forecast||decisive?'<section class="panel debate-turn"><h2>토론과 전망 기록</h2>'+decisive+(reports?'<ul>'+reports+'</ul>':'')+(forecast?'<p>검증된 물가 전망 · '+forecast+'</p>':'')+'</section>':'';
}
function dialoguePanel(){
 if(game.phase!=='meeting'||selectedMember===null)return '';
 const member=getCommittee(game).find(m=>m.id===selectedMember);
 if(!member)return '';
 const opinion=opinions(game.state,focus,proposal,forecast,game.market,game).find(m=>m.id===selectedMember);
 const before=game.context?.persuasion??[];
 const active=before.find(p=>p.id===member.id);
 const history=game.records.flatMap(r=>r.votes.filter(v=>v.name===member.name).map(v=>r.date+' '+label(v.vote))).slice(-4);
 const profile=backgrounds[game.background]??backgrounds.scholar;
 const tone={model:'어떤 관측치가 전망을 뒤집었습니까?',stability:'금리 판단과 시장 대응을 분리해 설명해 주십시오.',households:'그 선택의 비용은 차주와 고용에 어떻게 돌아갑니까?'};
 const priorTalk=game.records.flatMap(r=>(r.persuasion??[]).filter(p=>p.id===member.id)).at(-1);
 const stated=game.inaugural?.answers.find(a=>a.topic==='priority');
 const opening=stated&&game.turn===0?'취임 때 '+stated.label+'을 특히 보겠다고 하셨죠. 그때와 비교해 이번 제안의 근거는 뭡니까? ':'';
 const counter=opening+(priorTalk?'지난 대화에선 '+label(priorTalk.final)+' 의견을 밝혔습니다. 이번 판단은 달라진 지표에 달렸습니다. ':'')+tone[member.evidence]+' '+opinion.detail;
 const g=game.context?.goal;
 const policyCase=g?goalForecast(game.state,g.months).find(r=>r.move===proposal):null;
 const goalEvidence=g?'<p>총재의 목표 '+metrics[g.key][0]+' '+targetBoundary(g)+' · '+label(proposal)+' 기준 전망 '+targetValue(g.key,policyCase.center[g.key])+' · 경기 흐름 '+value('growth',policyCase.center.growth)+' · 금융위험 '+value('stress',policyCase.center.stress)+'</p>':'';
 return '<section class="panel dialogue character-scene"><div class="row"><div class="speaker">'+memberPortrait(member.id)+'<h2>'+member.name+' '+opinion.role+'</h2></div>'+button('close-member','닫기',false)+'</div><p>'+member.career+' · '+member.philosophy+' · '+policyPrinciple(member.id)+' · 정책적 신뢰 '+(game.memberTrust?.[member.id]??55)+'/100</p><p>현재 견해 '+label(opinion.vote)+' · '+opinion.detail+'</p><p class="muted">최근 투표 '+(history.join(' · ')||'기록 없음')+'</p>'+goalEvidence+
 (active?'<p class="persuasion-result '+(active.changed?'persuasion-changed':'persuasion-held')+'"><strong>'+(active.changed?'위원 의견 변경':'위원이 기존 의견 유지')+'</strong><br><strong>'+label(active.initial)+' → '+label(active.final)+'</strong> · '+(active.outcome??'이 회의의 설득 기록입니다.')+'<br>'+active.proof+'</p>'+(active.firstHardShift?'<aside class="debate-turn"><strong>회의의 전환점</strong><p>“'+member.philosophy+' 원칙은 그대로입니다. 이번에는 제시한 지표를 반영해 표를 한 단계 옮기겠습니다.”</p></aside>':''):opinion.vote===proposal?'<p>현재 안에 동의합니다. 의견이 다른 위원을 선택할 수 있습니다.</p>':persuasionLeft(game)<=0?'<p>이번 회의에 남은 개별 설득 기회가 없습니다.</p>':
 '<form id="persuasion-form">'+(argumentMethod?'<p><strong>총재</strong> · '+profile.argument+' ('+evidenceNames[argumentMethod]+')</p><blockquote>'+counter+'</blockquote><fieldset><legend>추가 답변</legend>'+radio('follow',[['crosscheck','현재 지표와 반대 증거를 함께 검토한다'],['insist','기존 정책 주장을 재확인한다'],...(argumentMethod===profile.bonus?[['specialist',profile.rebuttal]]:[])],'crosscheck')+'</fieldset><button class="primary" type="submit">위원의 최종 판단 확인</button>':
 '<fieldset><legend>설득 근거 · 남은 행동 '+persuasionLeft(game)+'회</legend>'+radio('method',Object.entries(evidenceNames).map(([k,v])=>[k,k===profile.bonus?v+' · '+profile.argument:v]),profile.bonus)+'</fieldset><button class="primary" type="submit">근거 제시</button>')+'</form>')+'</section>';
}

const scoreLabels={
 approval:'국민 지지도',trust:'정책 신뢰',independence:'중앙은행 독립성 인식',coordination:'정부와의 정책 공조',yield:'단기 시장금리'
};
const scoreGroups=[
 ['거시경제',['inflation','growth','consumption','investment']],
 ['금융시장',['rate','yield','fx']],
 ['금융안정',['debt','debtStock','housing','stress']],
 ['정책 평가',['approval','trust','independence','coordination']]
];
function scoreSnapshot(state,market,politics){
 return {...state,yield:market?.yield,trust:market?.trust,approval:politics?.approval,independence:politics?.independence,coordination:politics?.coordination};
}
function scoreSnapshots(){
 const completed=game.records.at(-1);
 const previous=game.records.at(-2);
 const origin=scoreSnapshot(game.path[0],openingMarket,openingPolitics());
 const prior=completed?scoreSnapshot(completed.origin,previous?.market??openingMarket,previous?.politics??openingPolitics()):origin;
 const current=scoreSnapshot(game.state,game.market,game.politics);
 if(['dots','press'].includes(game.phase)&&game.pending)current.rate=game.pending.rate;
 return [origin,prior,current];
}
function scoreValue(k,n){
 if(!Number.isFinite(n))return '기록 없음';
 if(k==='yield')return n.toFixed(2)+'%';
 return metrics[k]?value(k,n):n.toFixed(1)+'점';
}
function scoreChange(k,from,to){
 if(!Number.isFinite(from)||!Number.isFinite(to))return '—';
 const delta=Number((to-from).toFixed(2));
 const unit=k==='yield'||metrics[k]?.[1]==='%'?'%p':k==='fx'?'원':'점';
 return delta===0?'→ 보합':(delta>0?'↑ ':'↓ ')+Math.abs(delta).toFixed(2)+unit;
}
function economicHud(){
 if(game.phase==='setup'||game.phase==='scenario')return '';
 const [,prev,now]=scoreSnapshots();
 const observed=game.state.month?new Date(Date.UTC(2027,game.state.month,0)).toISOString().slice(0,10):'2027-01-01';
 const item=k=>'<span><small>'+(metrics[k]?.[0]??scoreLabels[k])+'</small> <strong>'+scoreValue(k,now[k])+'</strong><small> '+scoreChange(k,prev[k],now[k])+'</small></span>';
 return '<section class="economic-hud" aria-label="상시 경제지표"><div class="hud-core"><span><small>관측 기준</small> <strong>'+observed+'</strong></span>'+['rate','inflation','fx'].map(item).join('')+button('scorecard','경제 성적표',false)+'</div><div class="hud-more" aria-label="경기와 정책 평가">'+['growth','approval','trust'].map(item).join('')+'<span class="hud-gdp">GDP 성장률 전망 · 모형 미산출</span></div></section>';
}
function scoreTable(){
 const snapshots=scoreSnapshots();
 const watch=['result','newspaper','end'].includes(game.phase)?(game.records.at(-1)?.article?.watch??game.records.at(-1)?.watchResult?.next?.press):game.context?.watch??currentWatch(game);
 return '<p>경제지표는 모형의 관측값입니다. GDP 성장률 전망은 산출하지 않으며 경기 흐름은 별도의 점수입니다.</p>'+
 scoreGroups.map(([title,ks])=>'<section><h3>'+title+'</h3><table class="table"><thead><tr><th>지표</th><th>취임</th><th>직전 회의 전</th><th>현재</th><th>직전 대비</th></tr></thead><tbody>'+ks.map(k=>'<tr><th scope="row">'+(metrics[k]?.[0]??scoreLabels[k])+'</th>'+snapshots.map(s=>'<td>'+scoreValue(k,s[k])+'</td>').join('')+'<td>'+scoreChange(k,snapshots[1][k],snapshots[2][k])+'</td></tr>').join('')+'</tbody></table></section>').join('')+
 (watch?'<section><h3>BOK워치 · '+watch.date+' 회의</h3><p>전망 기준 '+watch.asOf+' · 예상 기준금리 '+scoreValue('rate',watch.expected)+'</p>'+watchNumbers(watch)+'</section>':'');
}
function scoreGoals(){
 const pending=game.pending&&game.phase==='review'?{...game.pending,rate:undefined}:game.pending;
 const rows=game.records.concat(pending?[pending]:game.phase==='meeting'&&game.context?.goal?[{date:dates[game.turn],origin:game.state,goal:game.context.goal,proposal:game.context.draft?.proposal}]:[]);
 const actual=rows.filter(r=>r.goal);
 if(!actual.length)return '<p>설정한 회의 목표가 없습니다.</p>';
 return actual.map(r=>{
 const g=r.goal,o=r.goalResult,shock=(r.incidents??[]).map(e=>incidents[e.id]?.title).filter(Boolean);
 return '<section class="score-goal"><h3>'+r.date+' · '+g.name+'</h3><p>목표 '+targetBoundary(g)+' · 실제 '+(o?targetValue(g.key,o.actual):'평가 대기')+(o?' · '+(o.met?'달성':'미달'):'')+'</p><p>당시 '+scoreValue('rate',r.origin.rate)+' · 제안 '+(Number.isFinite(r.proposal)?scoreValue('rate',r.origin.rate+r.proposal):'기록 대기')+' · 의결 '+scoreValue('rate',r.rate)+'</p>'+
 (o?'<p>동결·무충격 '+targetDelta(g.key,o.carry)+' · 제안 '+targetDelta(g.key,o.proposal)+' · 의결과 제안 차이 '+targetDelta(g.key,o.vote)+' · 충격 및 대응 '+targetDelta(g.key,o.shock)+'</p><p>다른 지표 변화 · '+Object.entries(o.effects).map(([k,n])=>metrics[k][0]+' '+targetDelta(k,n)).join(' · ')+'</p>':'')+(shock.length&&o?'<p>공개 사건 · '+shock.join(' · ')+'</p>':'')+'</section>';
 }).join('');
}
function scoreTrends(){
 const series=[
 ...['inflation','rate','growth','fx','debtStock'].map(k=>[k,game.path.map(s=>({month:s.month,[k]:s[k]}))]),
 ...['approval','trust'].map(k=>[k,[{month:0,[k]:k==='approval'?openingPolitics().approval:openingMarket.trust},...game.records.map(r=>({month:r.endMonth,[k]:k==='approval'?r.politics?.approval:r.market?.trust}))].filter(s=>Number.isFinite(s[k]))])
 ];
 const eventRows=game.records.map(r=>'<li>'+r.date+' 의결 '+scoreValue('rate',r.rate)+(r.incidents?.length?' · '+r.incidents.map(e=>String(e.start+1)+'월 '+(incidents[e.id]?.title??'공개 충격')).join(' · '):'')+'</li>').join('');
 return '<p>GDP 성장률 전망은 미산출입니다. 경기 흐름은 게임에서 소비·투자 등 경기 여건을 비교하는 내부 지표입니다. 사건과 의결 시점이 겹쳐도 인과관계로 단정할 수 없습니다.</p>'+series.map(([k,items])=>{
 const ns=items.map(s=>s[k]), min=Math.min(...ns),max=Math.max(...ns), span=Math.max(1,game.state.month);
 const x=m=>12+376*m/span;
 const eventMarks=[...new Set(game.records.flatMap(r=>(r.incidents??[]).map(e=>e.start)))].map(month=>'<circle cx="'+x(month)+'" cy="17" r="4" fill="#a14f38"><title>'+String(month+1)+'월 공개 충격</title></circle>').join('');
 const grid=game.records.map(r=>'<path d="M'+x(r.origin.month)+' 18V112" stroke="#9b8662" stroke-dasharray="3 3"><title>'+r.date+' 의결 '+scoreValue('rate',r.rate)+'</title></path>').join('');
 const path=items.map(s=>x(s.month)+','+(112-94*(s[k]-min)/(max-min||1))).join(' ');
 return '<section class="score-trend"><h3>'+(metrics[k]?.[0]??scoreLabels[k])+'</h3><svg viewBox="0 0 400 132" role="img" aria-label="모형 관측 추이 및 의결 시점">'+grid+eventMarks+'<polyline points="'+path+'" fill="none" stroke="#316f6c" stroke-width="3"/></svg><p>취임 '+scoreValue(k,ns[0])+' · 최근 '+scoreValue(k,ns.at(-1))+'</p></section>';
 }).join('')+'<h3>의결과 공개 충격 기록</h3><ul>'+eventRows+'</ul>';
}
function showScorecard(trigger){
 if(document.querySelector('.scorecard[open]'))return;
 const parent=document.querySelector('dialog[open]:last-of-type')??document.body;
 const dlg=document.createElement('dialog');dlg.className='scorecard';
 dlg.setAttribute('aria-label','경제 성적표');
 dlg.innerHTML='<div class="row"><h2>경제 성적표</h2><form method="dialog"><button class="secondary">닫기</button></form></div><div class="score-tabs" role="group" aria-label="성적표 보기"><button type="button" data-score-tab="0" aria-pressed="true">현재와 비교</button><button type="button" data-score-tab="1" aria-pressed="false">회의 목표</button><button type="button" data-score-tab="2" aria-pressed="false">지표 추이</button></div><div class="score-content">'+scoreTable()+'</div>';
 const tabs=[scoreTable,scoreGoals,scoreTrends];
 dlg.addEventListener('click',e=>{
 const tab=e.target.closest('[data-score-tab]');if(!tab)return;
 for(const b of dlg.querySelectorAll('[data-score-tab]'))b.setAttribute('aria-pressed',String(b===tab));
 dlg.querySelector('.score-content').innerHTML=tabs[Number(tab.dataset.scoreTab)]();
 });
 dlg.addEventListener('close',()=>{dlg.remove();trigger?.focus();},{once:true});
 parent.append(dlg);dlg.showModal();
}

function showGameOverlay(title,body,trigger,kind='game-document'){
 const dialog=document.createElement('dialog');
 dialog.className=kind;
 dialog.setAttribute('aria-label',title);
 dialog.innerHTML=body;
 dialog.addEventListener('close',()=>{dialog.remove();trigger?.focus();},{once:true});
 (trigger?.closest?.('dialog')??document.body).append(dialog);dialog.showModal();
}
function docOverlay(kind,trigger){
 const data={watch:['BOK워치',watchScreen],dots:['점도표 이력',dotHistory],logs:['정책 결정 기록',log],model:['게임 방법',model]};
 const [title,content]=data[kind];
 showGameOverlay(title,'<div class="overlay-toolbar"><form method="dialog"><button class="secondary">닫기</button></form></div>'+content(),trigger);
}
function pauseGame(trigger){
 if(document.querySelector('dialog[open]'))return;
 showGameOverlay('일시정지','<h2>일시정지</h2><div class="pause-actions"><form method="dialog"><button class="primary">게임 계속하기</button></form>'+button('scorecard','경제 성적표',false)+'<button class="secondary" data-view="logs">정책 결정 기록</button><button class="secondary" data-view="watch">BOK워치</button><button class="secondary" data-view="dots">점도표 이력</button><button class="secondary" data-view="model">게임 방법</button>'+button('save','저장하기',false)+button('settings','설정',false)+button('home-title','타이틀 화면으로',false)+'</div><p class="pause-status" role="status"></p>',trigger,'pause-menu');
}
function titleScreen(){
 return '<section class="title-scene"><div class="title-copy"><p class="eyebrow">2027 · 통화정책 전략 시뮬레이션</p><h1 class="title-wordmark"><span class="title-korean" aria-label="한은 총재"><span>한은</span> <span>총재</span></span><small lang="en">Governor of the Bank of Korea</small></h1><p>금리는 당신이 결정한다.<br>그 대가는 경제가 치른다.</p><div class="title-actions">'+button('new-term','새 게임')+(savedTerm?button('resume-term','이어하기',false):'')+'<button class="secondary" data-view="model">게임 방법</button>'+button('settings','설정',false)+'</div></div></section>';
}
function render(focusMain=false){
 const scenes={setup:setupScreen,scenario:scenarioScreen,inaugural:inauguralScreen,office,crisis:crisisScreen,government:governmentScreen,meeting,review:reviewScreen,dots:dotsEntry,press:pressScreen,result,newspaper:newspaperScreen,end:ending};
 const playing=!titleOpen&&game.phase!=='setup'&&game.phase!=='scenario';
 const step=playing&&game.turn<dates.length?'<p class="game-step">'+(game.turn+1)+' / 8차 회의</p>':'';
 main.innerHTML=titleOpen?titleScreen():step+(saveMessage?'<p role="status">'+saveMessage+'</p>':'')+scenes[game.phase]();
 if(dock)dock.innerHTML=playing?economicHud()+button('pause','메뉴',false):'';
 if(focusMain)main.focus();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(!b)return;
 if(b.dataset.view){docOverlay(b.dataset.view,b);return;}
 if(b.dataset.metric){
 const k=b.dataset.metric;
 const dialog=document.createElement('dialog');
 dialog.innerHTML='<div class="row"><h2>'+metrics[k][0]+'</h2><form method="dialog"><button class="secondary">닫기</button></form></div>'+'<p class="muted">'+metricNotes[k]+'</p>'+chart(k,[game.path])+'<p>현재 '+value(k,game.state[k])+' · 가상 시뮬레이션</p>';
 dialog.addEventListener('close',()=>{dialog.remove();b.focus();},{once:true});
 (b.closest('dialog')??document.body).append(dialog);dialog.showModal();return;
 }
 const action=b.dataset.action??'';
 if(action==='pause'){pauseGame(b);return;}
 if(action==='settings'){
 const reduced=localStorage.getItem('bok-reduce-motion')==='1';
 showGameOverlay('설정','<h2>설정</h2><form method="dialog"><label><input type="checkbox" id="motion-setting" '+(reduced?'checked':'')+'> 화면 전환 효과 줄이기</label><p><button class="primary">닫기</button></p></form>',b);return;
 }
 if(action==='save'){
 const status=b.closest('dialog').querySelector('[role="status"]');
 try{localStorage.setItem(key,JSON.stringify(game));status.textContent='현재 진행 상황을 저장했습니다.';}catch{status.textContent='브라우저 저장을 사용할 수 없습니다.';}
 return;
 }
 if(action==='home-title'){b.closest('dialog').close();titleOpen=true;render(true);return;}
 if(action==='resume-term'&&savedTerm){
 game=savedTerm;meetingStep=game.context?.uiStep??0;
 proposal=game.context?.draft?.proposal??0;focus=game.context?.draft?.focus??'prices';forecast=game.context?.draft?.forecast??'하락';
 selectedMember=null;argumentMethod=null;titleOpen=false;render(true);return;
 }
 if(action==='new-term'){game=newGame();titleOpen=false;render(true);return;}
 if(action.startsWith('background-')){commit({...game,background:action.slice(11),phase:'scenario'});return;}
 if(action==='back-setup'){commit({...game,phase:'setup'});return;}
 if(action.startsWith('scenario-')){
  const scId=action.slice(9);
  const bg=game.background??'scholar';
  const started=start(game.seed,bg,scId);
  commit(startInaugural(started));
  return;
 }
 if(action.startsWith('step-')){
 meetingStep=Number(action.slice(5));selectedMember=null;argumentMethod=null;
 commit({...game,context:{...game.context,uiStep:meetingStep}});return;
 }
 if(action.startsWith('member-')){meetingStep=4;selectedMember=Number(action.slice(7));argumentMethod=null;render();document.querySelector('.dialogue')?.scrollIntoView?.({block:'nearest'});return;}
 if(action==='scorecard'){showScorecard(b);return;}
 if(action==='office-report'||action==='office-phone'){showOfficeDocument(action,b);return;}
 if(action==='close-member'){const id=selectedMember;selectedMember=null;argumentMethod=null;render();document.querySelector('[data-action="member-'+id+'"]')?.focus();return;}
 switch(action){
 case 'meeting':meetingStep=game.turn===0?0:1;{const next=begin(game);commit({...next,context:{...next.context,uiStep:meetingStep}});}break;
 case 'next':if(game.phase==='result'){commit(openFrontPage(game));break;} selectedMember=null;argumentMethod=null;focus='prices';forecast='하락';proposal=0;commit(onward(game));break;
 case 'review':document.querySelector('#comparison').scrollIntoView();break;
 case 'reset':titleOpen=true;render(true);break;
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!titleOpen&&game.phase!=='setup'&&game.phase!=='scenario'&&!document.querySelector('dialog[open]')){e.preventDefault();pauseGame(document.activeElement);return;}
 if(e.altKey&&e.code==='KeyE'&&!titleOpen&&game.phase!=='setup'&&game.phase!=='scenario'){
 e.preventDefault();showScorecard(document.activeElement);
 }
});
document.addEventListener('change',e=>{
 const {name,id,value:v}=e.target;
 if(id==='motion-setting'){const on=e.target.checked;document.documentElement.classList.toggle('reduce-motion',on);try{localStorage.setItem('bok-reduce-motion',on?'1':'0');}catch{}return;}
 if(name==='focus'){focus=v;document.querySelector('#members').innerHTML=members();}
 if(name==='forecast'){forecast=v;document.querySelector('#members').innerHTML=members();}
 if(name==='proposal'){proposal=Number(v);document.querySelector('#members').innerHTML=members();const panel=document.querySelector('#policy-preview');if(panel)panel.innerHTML=policyPreview();}
 if(['proposal','focus','forecast'].includes(name)&&game.phase==='meeting'){
 game={...game,context:{...game.context,draft:{proposal,focus,forecast}}};
 try{localStorage.setItem(key,JSON.stringify(game));}catch{}
 }
 if(id==='alternative'||id==='metric-select'){
 if(id==='alternative')alternative=Number(v);else metric=v;
 document.querySelector('#comparison').innerHTML=comparison(game.records.at(-1));
 document.getElementById(id).focus();
 }
});
document.addEventListener('submit',e=>{
 const form=e.target;
 if(form.id==='goal-form'){
 e.preventDefault();
 meetingStep=2;const selected=chooseGoal(game,form.elements.goalKey.value);commit({...selected,context:{...selected.context,uiStep:2}});return;
 }
 if(form.id==='ability-form'){
 e.preventDefault();
 commit(activateAbility(game,form.elements.abilityChoice.value));return;
 }
 if(form.id==='crisis-form'||form.id==='government-form'||form.id==='review-form'){
 e.preventDefault();
 const next=form.id==='crisis-form'?respondCrisis(game,form.elements.response.value):form.id==='government-form'?respondGovernment(game,form.elements.governmentReply.value):resolveReview(game,Number(form.elements.motion.value));
 commit(next);if(form.id==='review-form')showBallot(next.pending);return;
 }
 if(form.id==='persuasion-form'){
 e.preventDefault();
 if(!argumentMethod){argumentMethod=form.elements.method.value;render();document.querySelector('.dialogue')?.scrollIntoView({block:'nearest'});return;}
 const next=negotiate(game,selectedMember,proposal,focus,forecast,argumentMethod,form.elements.follow.value);
 argumentMethod=null;commit(next);document.querySelector('.dialogue')?.scrollIntoView({block:'nearest'});return;
 }
 if(e.target.id==='dot-form'){
 e.preventDefault();
 commit(submitDots(game,[1,2,3].map(n=>Number(e.target.elements['dot-'+n].value))));
 return;
 }
 if(form.id==='inaugural-form'){
 e.preventDefault();commit(answerInaugural(game,form.elements.answer.value));return;
 }
 if(form.id==='qa-form'){
 e.preventDefault();commit(answerConference(game,form.elements.answer.value));document.querySelector('.press-question h2')?.scrollIntoView?.({block:'nearest'});return;
 }
 if(e.target.id==='press-form'){
 e.preventDefault();
 commit(conclude(game,'conditional'));
 return;
 }
 if(e.target.id!=='decision')return;
 e.preventDefault();
 if(!game.context?.goal){meetingStep=1;commit({...game,context:{...game.context,uiStep:1}});return;}
 const next=decide(game,proposal,focus,forecast);
 selectedMember=null;argumentMethod=null;
 alternative=moves.find(d=>d!==next.pending.change);
 commit(next);
 if(next.phase!=='review')showBallot(next.pending);
});
render();



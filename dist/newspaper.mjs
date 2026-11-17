import {dates} from './schedule.mjs';
import {calm,metrics,project,derivedMacro} from './economy.mjs';
import {incidents} from './scenarios.mjs';
import {forecastWatch,publicWatchSnapshot} from './watch.mjs';

const articleIndicators=['inflation','growth','debt','stress','fx','loan','consumption','investment','expectations','fed','oil'];
export function frontPage(game){
 const r=game.records.at(-1), s=game.state, o=r.origin;
 const next=dates[game.turn+1]??null;
 const date=new Date(Date.UTC(2027,s.month,0)).toISOString().slice(0,10);
 const events=(r.incidents??[]).filter(e=>incidents[e.id]&&e.start<s.month);
 const names=events.map(e=>incidents[e.id].title);
 const m=k=>s[k]-o[k];
 const priceMove=Number((Number(s.inflation.toFixed(2))-Number(o.inflation.toFixed(2))).toFixed(2));
 const priceDirection=priceMove===0?'그대로였다':Math.abs(priceMove).toFixed(2)+'%포인트 '+(priceMove>0?'올랐다':'내렸다');
 const priceContext=s.inflation.toFixed(2)==='2.00'?'표시값 기준으로 2% 목표에 도달했다.':'발행일 상승률은 2% 목표를 '+(s.inflation>2?'웃돈다.':'밑돈다.');
 const scored=[
 [100*Number(events.some(e=>e.id==='finance'))+Math.max(0,m('stress'))*4,'stress',events.some(e=>e.id==='finance')?'자금시장 덮친 신용 경색…한은, 금리냐 유동성이냐':'금융위험 커졌다…돈 빌리기 더 어려워지나','자금 공급으로 시장 기능을 지킬 필요와 신용 위험을 억제할 필요가 맞선다.'],
 [Math.max(0,m('fx'))*.85,'fx','원화값 밀리자 수입비용 비상…한은의 고민 깊어졌다','환율이 수입물가에 미칠 영향과 내수의 이자 부담을 함께 살펴야 한다.'],
 [s.inflation>2.3&&s.growth<s.capacity-.2&&m('growth')<0?25+Math.max(0,-m('growth'))*35:0,'inflation','물가는 목표 위, 성장률은 둔화…한은의 진퇴양난','물가를 억제하는 정책이 취약한 내수에 줄 부담도 따져야 한다.'],
 [Math.abs(s.inflation-2)<Math.abs(o.inflation-2)&&m('growth')>.05?25+m('growth')*26:0,'growth','물가 2%에 한발 더…성장률 반등, 이번엔 이어질까','물가가 2%에 가까워지는 흐름과 소비·신용의 회복 속도를 함께 살펴야 한다.'],
 [Math.max(0,m('debt'))*27,'debt','빨라진 가계대출…경기 살리다 빚 커질라','내수 지원이 추가 차입과 금융위험으로 번지는지 확인할 필요가 있다.'],
 [Math.max(.1,Math.abs(m('inflation'))*32),'inflation',priceMove>0?'빨라진 물가…경기 떠받칠 여력 줄어드나':priceMove<0?'물가 오름세 한풀 꺾였다…내수도 살아날까':'물가 제자리…가계는 이자 부담 언제 덜까','이번 변화가 일시적인지 확인하면서 가계와 기업의 자금 부담을 살펴야 한다.'],
 ];
 let [,key,headline,issue]=scored.sort((a,b)=>b[0]-a[0])[0];
 const months=s.month-o.month;
 const quiet=Array.from({length:months},()=>calm);
 const policy=project(o,r.rate,quiet).at(-1);
 const held=project(o,o.rate,quiet).at(-1);
 const unit=metrics[key][1], delta=unit==='%'?'%p':unit==='/100'?'/100':unit;
 const measure=k=>metrics[k][0]+' '+o[k].toFixed(2)+(metrics[k][1]==='/100'?'/100':metrics[k][1])+' → '+s[k].toFixed(2)+(metrics[k][1]==='/100'?'/100':metrics[k][1]);
 const publishedGoal=r.conference?.answers.some(a=>a.topic==='target'&&a.kind!=='caution');
 const gov=r.government?.event?.id;
 const publicEvent=gov==='minister'?'재정경제부는 현 금리가 경기 회복을 늦춘다는 입장을 공개했다.':gov==='hearing'?'국회 국정감사에서 의결과 전망 근거를 질의했다.':null;
 const watch=next?forecastWatch(publicWatchSnapshot(s,game.market,r,next,events,date)):null;
 const direction=r.rate>o.rate?'인상':r.rate<o.rate?'인하':'동결';

 const consumer=m('consumption');
 const recovering=consumer>.05;
 const weakening=consumer<-.05;
 const crossesTarget=o.inflation<2&&s.inflation>=2;
 if(key==='growth'){
  headline=crossesTarget?'물가 2%선 넘어섰다…되살아난 경기에 남은 변수':
   r.rate<o.rate?'금리 인하 뒤 경기 반등…물가도 2%선에 다가섰다':
   '금리 '+direction+' 속 경기 개선…물가 2%선에 한발 더';
  issue=crossesTarget?'회복세가 이어지는 가운데 물가가 목표를 다시 벗어날 위험을 살펴야 한다.':'소비 회복이 이어지는지와 물가가 2% 근처에 안착하는지를 함께 살펴야 한다.';
 }else if(key==='inflation'&&priceMove<0&&!headline.includes('진퇴양난')){
  headline=weakening?'물가 식는데 소비도 뒷걸음…내수에 켜진 경고등':
   recovering?'물가 오름세 둔화에도 소비 반등…엇갈린 경제 신호':headline;
  issue=weakening?'물가 둔화가 소비 위축과 함께 이어지는지 살펴야 한다.':'물가 수준과 소비 회복의 지속성을 함께 확인해야 한다.';
 }
 const previousHeadline=game.records.at(-2)?.article?.headline;
 if(headline===previousHeadline){
  const mark=key==='fx'?Math.round(s.fx).toLocaleString('ko-KR')+'원':s[key].toFixed(2)+(metrics[key][1]==='/100'?'/100':metrics[key][1]);
  headline=headline.split('…')[0]+'…'+metrics[key][0]+' '+mark;
 }
 const comparisonSentence=(n,reference)=>{
  const rounded=Number(n.toFixed(2));
  return reference+(rounded===0?'와 값이 같았다.':'와 비교해 '+Math.abs(rounded).toFixed(2)+delta+' '+(rounded>0?'높았다.':'낮았다.'));
 };
 const macroS=derivedMacro(s,o);
 const macroO=derivedMacro(o);
 const secondary=[measure('inflation')+' · 실질 GDP 성장률 전망 '+macroS.gdpForecast.toFixed(1)+'%', '직전 의결 '+r.rate.toFixed(2)+'% '+direction+(names.length?' · '+names[0]:'')];
 const leads={
 stress:'가계와 기업이 돈을 빌리기 어려워질 수 있다는 점이 이번 회의 이후 부각됐다. 기준금리 조정과 자금시장 대응은 영향 범위가 다르다.',
 fx:'달러를 사는 데 드는 원화가 늘었다. 원유 등 달러로 결제하는 품목의 원화 비용이 커질 수 있어 국내 물가에도 부담이다.',
 growth:crossesTarget?'경제성장률 전망은 개선됐지만 물가상승률이 2%선을 넘어섰다. 다음 회의는 회복의 속도와 물가 압력을 함께 판단해야 한다.':r.rate<o.rate?'금리 인하 이후 성장률 전망이 개선됐다. 같은 기간 물가상승률도 2%에 가까워졌다.':'금리 '+direction+' 기간 경제성장률 전망이 개선됐다. 소비와 투자 지표를 보면 회복이 어느 부문에서 시작됐는지 가늠할 수 있다.',
 debt:'신용 증가가 소비 회복을 뒷받침할 수 있지만 상환 부담도 남긴다. 대출금리와 경기 지표를 함께 볼 필요가 있다.',
 inflation:s.growth<s.capacity-.2&&s.inflation>2.3?'물가가 2%를 웃도는 가운데 경제성장률도 둔화됐다. 물가 대응에 무게를 두면 내수 부담이 커질 수 있다.':weakening?'민간소비 증가율도 하락했다. 물가 상승세가 둔화된 구간이라도 가계의 소비 여건이 나아졌다고 판단하기는 어렵다.':recovering?'민간소비 증가율이 개선됐다. 생활비와 대출 이자 부담이 어느 정도 줄었는지는 별도 지표로 확인해야 한다.':'민간소비는 큰 변화가 없었다. 물가상승률 변화가 생활비에 같은 폭으로 반영되지는 않는다.',
 };
 const inaugural=game.records.length===1?game.inaugural?.answers.find(a=>a.topic==='priority'):null;
 const body=[
  leads[key],
  '전년 동월 대비 물가상승률은 '+o.inflation.toFixed(2)+'%에서 '+s.inflation.toFixed(2)+'%로 '+priceDirection+'. '+priceContext+(key==='inflation'?'':' 이번 1면이 주목한 지표는 '+measure(key)+'이다.'),
  '직전 금통위는 기준금리를 '+r.rate.toFixed(2)+'%로 '+direction+'했다. '+(r.rate===o.rate?'동결을 선택해 이번 금리안과 동결 경로는 일치한다.':'새 충격이 없다는 가정에서 '+metrics[key][0]+' 모형값은 '+comparisonSentence(policy[key]-held[key],'동결 경로'))+' 실제 관측값은 '+comparisonSentence(s[key]-policy[key],'무충격 경로')+(names.length?' 이 기간 공개된 사건에는 '+names.join(' · ')+'이 포함됐다.':''),
  '은행 대출금리는 '+o.loan.toFixed(2)+'%에서 '+s.loan.toFixed(2)+'%로 움직였다. 민간소비 증가율은 '+macroO.privateConsumption.toFixed(1)+'%에서 '+macroS.privateConsumption.toFixed(1)+'%로 '+(recovering?'개선됐다.':weakening?'약해졌다.':'큰 변화가 없었다.')+(r.poll?' 게임 속 가상 여론조사의 국민 지지도는 '+r.poll.approval.toFixed(1)+'점이다.':'')+(publicEvent?' '+publicEvent:''),
  ...(inaugural?['신년 기자간담회에서 총재는 '+inaugural.label+'에 중점을 두겠다고 밝혔다. 당시 발언은 “'+inaugural.text+'”였다. 첫 의결 금리는 '+r.rate.toFixed(2)+'%다.']:[]),
  ...(publishedGoal&&r.goalResult?['기자회견에서 공개한 단기 목표는 '+(r.goalResult.met?'달성':'미달')+'했다. 이 평가는 게임의 해당 기간 관측값에 따른 것이다.']:[]),
  ...(r.watchResult?['의결 금리는 사전 시장 예상 금리와 '+(Math.abs(r.watchResult.surprise)<.005?'소수점 둘째 자리까지 같았다.':Math.abs(r.watchResult.surprise).toFixed(2)+'%p 차이가 났다.')]:[]),
  (next?'다음 금통위에서 ':'후임 총재는 ')+issue,
 ];
 const flash=events.find(e=>['finance','oil','fed','ai'].includes(e.id)&&e.start===o.month);
 return {date,topic:key,meeting:r.date,next,headline,secondary,body,issue,watch,shocks:names,flash:flash?incidents[flash.id].title:null,
 trend:game.path.slice(o.month,s.month+1).map(row=>({[key]:row[key]})),
 indicators:articleIndicators.map(k=>({key:k,name:metrics[k][0],unit:metrics[k][1],before:o[k],after:s[k]}))};
}

export function openFrontPage(game){
 if(game.phase!=='result')throw Error('No completed meeting');
 const records=game.records.slice(), last=records.at(-1);
 records[records.length-1]={...last,article:last.article??frontPage(game)};
 return {...game,records,phase:'newspaper'};
}



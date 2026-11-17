
import {initial} from './economy.mjs';
import {openingMarket} from './dots.mjs';

export const startScenarios={
 standard:{
  id:'standard',
  name:'기본 시나리오',
  subtitle:'물가 2.80% · 성장률 전망 2.1%',
  dilemma:'물가 안정과 경기 둔화의 균형 · 중립 기조를 모색할까',
  desc:'기준금리 3.00%, 소비자물가 상승률 2.80%, 연간 실질 GDP 성장률 전망 2.1%. 물가 안정과 경기 둔화의 갈림길에서 통화정책을 시작합니다.',
  recommended:true,
  state:{...initial},
  market:{...openingMarket}
 },
 inflation:{
  id:'inflation',
  name:'① 물가와의 전쟁',
  subtitle:'물가 3.70% · 성장률 전망 1.4%',
  dilemma:'물가 3%대와 성장 둔화 · 금리를 더 올려야 하나',
  desc:'소비자물가 상승률 3.70%, 기대인플레이션 3.20%, 연간 실질 GDP 성장률 전망 1.4%. 고물가 고착화 위험 속에 경기는 둔화되고 있습니다.',
  state:{month:0,rate:3.25,fed:4.00,inflation:3.7,growth:1.3,fx:1460,stress:35,unemployment:3.2,debt:3.8,housing:1.2,loan:4.90,oil:85,consumption:1.3,investment:1.4,debtStock:100,imbalance:38,expectations:3.2,capacity:1.8,gaps:[.75,.75,.75]},
  market:{...openingMarket,expected:3.40,yield:3.48},
  inauguralQ3:{
   question:'총재님, 소비자물가 상승률이 3%대 후반까지 오르며 서민 물가 부담이 극심합니다. 당장 가장 걱정하시는 위험 요인은 무엇입니까?',
   choices:[
    {id:'prices',label:'고물가 고착화',text:s=>'소비자물가 상승률이 '+s.inflation.toFixed(2)+'%에 달하고 기대인플레이션도 '+s.expectations.toFixed(2)+'%입니다. 임금과 물가의 연쇄 상승을 차단하는 것이 최우선입니다.'},
    {id:'activity',label:'내수 급랭 위험',text:s=>'물가를 잡기 위한 긴축 기조 속에서 민간소비와 설비투자가 과도하게 얼어붙지 않는지 면밀히 점검하고 있습니다.'},
    {id:'markets',label:'차주 이자 부담',text:s=>'대출금리가 '+s.loan.toFixed(2)+'%까지 오르며 취약계층의 원리금 상환 부담이 가중되는 점을 우려하고 있습니다.'}
   ]
  }
 },
 stagnation:{
  id:'stagnation',
  name:'② 침체의 그림자',
  subtitle:'물가 1.40% · 성장률 전망 0.9%',
  dilemma:'물가 안정과 소비·투자 부진 · 금리를 내려 경기를 살릴까',
  desc:'소비자물가 상승률 1.40%, 성장률 전망 0.9%. 물가는 목표를 밑돌고 민간소비와 설비투자가 동반 위축되고 있습니다.',
  state:{month:0,rate:2.75,fed:3.50,inflation:1.4,growth:0.8,fx:1410,stress:30,unemployment:3.8,debt:2.2,housing:-0.5,loan:4.25,oil:68,consumption:0.9,investment:0.9,debtStock:100,imbalance:34,expectations:1.6,capacity:1.8,gaps:[.25,.25,.25]},
  market:{...openingMarket,expected:2.50,yield:2.55},
  inauguralQ3:{
   question:'총재님, 물가는 안정됐지만 소비와 설비투자가 동시에 얼어붙으며 경기 침체 우려가 팽배합니다. 지금 경제에서 가장 우려하시는 부분은 무엇입니까?',
   choices:[
    {id:'activity',label:'내수 침체 장기화',text:s=>'실질 GDP 성장률 전망이 0.9%로 떨어지고 GDP갭률도 마이너스가 심화되고 있습니다. 소비와 투자의 동반 위축이 고착화되는 것을 가장 경계합니다.'},
    {id:'prices',label:'디플레이션 압력',text:s=>'소비자물가 상승률이 '+s.inflation.toFixed(2)+'%로 목표인 2%를 밑돌고 있습니다. 저물가-저성장의 덫에 빠지지 않도록 유의해야 합니다.'},
    {id:'markets',label:'고용 악화와 실업',text:s=>'실업률이 '+s.unemployment.toFixed(2)+'%로 올라서고 있습니다. 일자리 위축이 가계 소득 감소로 이어지는 악순환을 차단해야 합니다.'}
   ]
  }
 },
 fx:{
  id:'fx',
  name:'③ 흔들리는 원화',
  subtitle:'환율 1,530원 · 수입물가 불안',
  dilemma:'환율 급등과 수입물가 불안 · 경기보다 환율과 물가를 우선할까',
  desc:'원/달러 환율 1,530원, 미 연준 고금리 유지. 환율 급등이 수입물가를 거세게 압박합니다.',
  state:{month:0,rate:3,fed:4.25,inflation:3.3,growth:1.5,fx:1530,stress:42,unemployment:3.2,debt:4.0,housing:1.5,loan:4.75,oil:86,consumption:1.4,investment:1.6,debtStock:100,imbalance:40,expectations:2.9,capacity:1.9,gaps:[.5,.5,.5]},
  market:{...openingMarket,expected:3.15,yield:3.22},
  inauguralQ3:{
   question:'총재님, 원화값이 급격히 떨어지면서 물가 불안도 커지고 있는데요. 지금 한국 경제에서 가장 걱정하시는 부분은 무엇입니까?',
   choices:[
    {id:'markets',label:'외환시장 변동성',text:s=>'원/달러 환율이 '+Math.round(s.fx)+'원대까지 치솟았습니다. 외환시장의 쏠림 현상과 대외 신인도 악영향을 면밀히 주시하고 있습니다.'},
    {id:'prices',label:'수입물가 전이',text:s=>'환율 상승으로 원유와 원자재 수입단가가 급등해 국내 소비자물가로 전이되는 2차 파급효과를 크게 우려합니다.'},
    {id:'activity',label:'기업 조달비용 상승',text:s=>'외화 차입 여건 악화와 금융위험 '+Math.round(s.stress)+'점이 기업들의 자금 조달에 부담을 주는 상황입니다.'}
   ]
  }
 },
 debt:{
  id:'debt',
  name:'④ 빚의 경고',
  subtitle:'가계신용 7.20% · 금융시장 불안',
  dilemma:'가계부채 증가와 금융시장 불안 · 금리와 금융안정 대응을 어떻게 조합할까',
  desc:'가계신용 증가율 7.20%, 부동산 과열. 부채 누적과 금융불균형이 심각한 경고음을 냅니다.',
  state:{month:0,rate:3,fed:3.88,inflation:2.4,growth:1.9,fx:1430,stress:48,unemployment:3.0,debt:7.2,housing:4.5,loan:4.65,oil:75,consumption:2.1,investment:2.0,debtStock:108,imbalance:58,expectations:2.4,capacity:1.9,gaps:[.5,.5,.5]},
  market:{...openingMarket,expected:3.10,yield:3.15},
  inauguralQ3:{
   question:'총재님, 가계대출 증가율이 7%를 넘고 부동산 과열 경고가 잇따르고 있습니다. 금융안정 측면에서 가장 경계하시는 것은 무엇입니까?',
   choices:[
    {id:'markets',label:'금융불균형 누적',text:s=>'가계신용 증가율이 연율 '+s.debt.toFixed(2)+'%, 부채·주택 과열 지수가 '+Math.round(s.imbalance)+'점에 달합니다. 자산 가격 거품과 부채 누증을 선제적으로 억제해야 합니다.'},
    {id:'activity',label:'원리금 상환 부담',text:s=>'누적된 가계부채가 향후 금리 변동 시 소비 위축과 금융기관 건전성 악화로 이어질 잠재적 뇌관이 되고 있습니다.'},
    {id:'prices',label:'자산발 유동성 압력',text:s=>'시장에 풀린 풍부한 유동성이 부동산 등 자산시장으로 쏠리며 물가 안정 기반을 위협하는 상황을 경계합니다.'}
   ]
  }
 },
 chips:{
  id:'chips',
  name:'⑤ 반도체의 역설',
  subtitle:'설비투자 호황 · 내수 부진',
  dilemma:'수출·투자 호황과 내수 부진 · 호황을 믿고 긴축할 수 있을까',
  desc:'반도체 호황으로 설비투자 호조(성장률 전망 2.6%)이나, 민간소비는 극심한 부진에 빠져 있습니다.',
  state:{month:0,rate:3,fed:3.88,inflation:2.6,growth:2.6,fx:1400,stress:28,unemployment:3.3,debt:4.2,housing:1.8,loan:4.60,oil:73,consumption:1.1,investment:3.4,debtStock:100,imbalance:39,expectations:2.4,capacity:2.1,gaps:[.5,.5,.5]},
  market:{...openingMarket,expected:2.95,yield:3.00},
  inauguralQ3:{
   question:'총재님, 반도체 등 수출은 사상 최대 호황이지만 골목상권과 내수는 꽁꽁 얼어붙어 양극화가 극심합니다. 이 엇갈린 신호 속에서 무엇을 가장 걱정하십니까?',
   choices:[
    {id:'activity',label:'내수·소비 양극화',text:s=>'설비투자는 호황이지만 민간소비는 크게 위축되어 있습니다. 수출 온기가 내수로 퍼지지 않는 괴리를 가장 걱정합니다.'},
    {id:'prices',label:'착시로 인한 실기',text:s=>'외형 성장률 전망 2.6%라는 착시에 가려져 체감 경기와 서민 생활의 고통을 놓치는 정책적 실수를 경계합니다.'},
    {id:'markets',label:'단일 품목 의존성',text:s=>'반도체 단일 사이클에 경제가 좌우되는 만큼, 호황 이후 닥쳐올 수 있는 대외 충격에 대비한 정책 여력을 비축해야 합니다.'}
   ]
  }
 }
};

export const incidents={
 war:{title:'중동 분쟁으로 해상 운송 차질',why:'원유 공급과 운송 여건이 악화됐습니다.',duration:3,base:.13,impact:{oil:11,world:-.17,risk:2}},
 tariffs:{title:'주요 교역국의 관세 인상',why:'수출 주문이 줄고 공급 비용이 높아졌습니다.',duration:3,base:.16,impact:{world:-.57,oil:2,risk:1.4}},
 finance:{title:'글로벌 금융시장 신용 경색',why:'금융기관이 자금 조달을 줄이고 있습니다.',duration:3,base:.09,impact:{world:-.65,risk:9}},
 oil:{title:'국제유가 급등',why:'원유 재고 감소로 수입단가가 상승했습니다.',duration:2,base:.16,impact:{oil:13,world:-.13}},
 ai:{title:'AI 투자 거품 붕괴',why:'설비 투자와 기술주 자금 조달이 위축됐습니다.',duration:3,base:.13,impact:{world:-.73,risk:4}},
 fed:{title:'미국 연준의 예상 밖 긴축',why:'달러 조달 비용이 올라 원화와 내수 모두 압박을 받고 있습니다.',duration:2,base:.18,impact:{fed:.5,world:-.27,risk:4}},
 chips:{title:'반도체 수출 호황',why:'수출 주문과 설비 투자가 개선됐습니다. 내수 회복은 별도로 확인해야 합니다.',duration:3,base:.2,impact:{world:.67,oil:1.5,risk:-1}},
 fiscal:{title:'정부, 민생 지원 추경 집행',why:'정부 지출로 수요가 늘고 물가에도 상방 압력이 생깁니다.',duration:3,base:.16,impact:{world:.52,demandPrices:.09}},
};
export const crisisResponses={
 observe:['지표와 자금시장 모니터링','정책 여력을 보존합니다. 충격은 그대로 반영됩니다.'],
 liquidity:['적격 담보 단기 유동성 공급','시장 위험을 완화합니다. 신용 팽창과 안정도에 따라 비용이 커집니다.'],
 buffers:['위험 점검과 대출 심사 공조','과잉 신용을 억제합니다. 단기 자금조달과 내수는 약해질 수 있습니다.'],
};
export function seededDraw(seed,month,salt){
 let n=(seed^Math.imul(month+1,0x9e3779b1)^salt)>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
 return ((n^(n>>>16))>>>0)/4294967296;
}
export function activeIncidents(game){
 const s=game.state,m=s.month;
 const history=game.records.at(-1)?.incidents??[];
 const continuing=history.filter(e=>e.start+incidents[e.id].duration>m);
 const risk={war:s.oil>80?.08:0,tariffs:s.growth<s.capacity?.05:0,
 finance:Math.max(0,s.stress-30)*.009+Math.max(0,s.imbalance-40)*.003,
 oil:s.oil>80?.07:0,ai:s.investment>2.3?.08:0,fed:s.fed>3.7?.07:0,
 chips:s.investment>2?.07:0,fiscal:s.consumption<1.5?.19:0};
 const candidates=Object.entries(incidents).filter(([id])=>!continuing.some(e=>e.id===id))
 .map(([id,d],i)=>({id,margin:d.base+(risk[id]??0)-seededDraw(game.seed,m,14021+i*131)}))
 .filter(x=>x.margin>0).sort((a,b)=>b.margin-a.margin);
 const chosen=candidates[0];
 return chosen&&continuing.length<2?[...continuing,{id:chosen.id,start:m}]:continuing;
}
export function scenarioShocks(base,month,events,response,s){
 return base.map((raw,i)=>{
 const shock={...raw};
 const active=events.filter(e=>month+i>=e.start&&month+i<e.start+incidents[e.id].duration);
 for(const e of active){
 const age=month+i-e.start;
 for(const [k,v] of Object.entries(incidents[e.id].impact)){
 const fade=k==='fed'?(age===0?1:0):Math.pow(.67,age);
 shock[k]=(shock[k]??0)+v*fade;
 }
 }
 const ids=active.map(e=>e.id);
 if(ids.includes('war')&&ids.includes('oil'))shock.oil-=3;
 if(ids.includes('finance')&&(ids.includes('ai')||ids.includes('fed')))shock.risk+=2;
 if(active.length&&i<2){
 const fade=i===0?1:.45;
 if(response==='liquidity'){
 shock.risk-=Math.max(1,Math.min(7,2+(s.stress-26)*.25+Math.max(0,shock.risk)*.35))*fade;
 shock.creditImpulse=(.16+Math.max(0,s.imbalance-40)*.023)*fade;
 }
 if(response==='buffers'){
 shock.world-=.20*fade;
 shock.creditImpulse=-.28*fade;
 }
 }
 return shock;
 });
}
export function dilemma(s,shocks=[]){
 const latest=shocks.at(-1);
 if(s.stress>=41)return {title:'자금시장의 균열',detail:'자금경색을 완화하면 단기 위험이 줄지만, 광범위한 신용지원은 부채 부담을 키울 수 있습니다.'};
 if((latest?.fed??0)>=.25&&s.growth<s.capacity||s.fx>1470&&s.growth<s.capacity)return {title:'원화 방어와 내수 회복',detail:'달러 조달 여건이 불리합니다. 경기 지원을 위한 완화가 환율 부담을 키울 수 있습니다.'};
 if(s.inflation>2.35&&s.growth<s.capacity-.2)return {title:'물가 안정과 경기 하방',detail:'물가는 목표를 웃돌지만 성장률 전망과 GDP갭은 하방 압력을 받고 있습니다.'};
 if(s.inflation<2.3&&(s.imbalance>43||s.housing>2))return {title:'완화와 부채 위험',detail:'물가 여건은 완화에 유리하지만 주택과 신용을 함께 확인해야 합니다.'};
 if(s.growth>s.capacity+.17&&s.investment>s.consumption+.2)return {title:'수출·투자와 내수의 온도차',detail:'설비투자는 견조하지만 민간소비 회복세가 이를 따라가지 못하고 있습니다.'};
 if(s.growth<s.capacity-.2)return {title:'회복을 앞당길 것인가',detail:'성장세가 둔화되고 있습니다. 이전 결정이 대출과 소비, GDP갭률에 미친 효과를 확인할 시점입니다.'};
 return {title:'다음 충격에 대비한 정책 여력',detail:'지금의 금리 수준을 유지할 때와 정책 여력을 미리 사용할 때의 비용을 비교하십시오.'};
}


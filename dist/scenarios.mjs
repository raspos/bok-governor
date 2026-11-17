
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
 if(s.inflation>2.35&&s.growth<s.capacity-.2)return {title:'물가 안정과 경기 하방',detail:'물가는 목표를 웃돌지만 성장은 경제 기초체력을 밑돕니다.'};
 if(s.inflation<2.3&&(s.imbalance>43||s.housing>2))return {title:'완화와 부채 위험',detail:'물가 여건은 완화에 유리하지만 주택과 신용을 함께 확인해야 합니다.'};
 if(s.growth>s.capacity+.17&&s.investment>s.consumption+.2)return {title:'수출·투자와 내수의 온도차',detail:'성장과 투자는 견조합니다. 소비가 같은 속도로 회복됐는지 확인하십시오.'};
 if(s.growth<s.capacity-.2)return {title:'회복을 앞당길 것인가',detail:'경기가 약합니다. 이전 결정이 쌓이며 대출과 소비에 미친 효과를 확인할 시점입니다.'};
 return {title:'다음 충격에 대비한 정책 여력',detail:'지금의 금리 수준을 유지할 때와 정책 여력을 미리 사용할 때의 비용을 비교하십시오.'};
}


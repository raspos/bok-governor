export const neutralRate=2.5;
export const calm=Object.freeze({oil:0,world:0,fed:0,risk:0,sensitivity:1});
export const initial = Object.freeze({month:0, rate:3, fed:3.88, inflation:2.8, growth:1.8, fx:1440, stress:32, unemployment:3.1, debt:4.6, housing:2.4, loan:4.57, oil:75, consumption:1.7, investment:1.8, debtStock:100, imbalance:40, expectations:2.5, capacity:1.9, gaps:Object.freeze([.5,.5,.5])});
export const metrics = {rate:['기준금리','%'], inflation:['물가상승률','%'], growth:['경기 흐름','점'], fx:['원/달러 환율','원'], stress:['금융위험','/100'], unemployment:['실업률','%'], debt:['가계신용 증가율','%'], housing:['주택가격 증가율','%'], loan:['은행 대출금리','%'], oil:['브렌트유','달러'], fed:['미국 연방기금 실효금리','%']};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
Object.assign(metrics,{consumption:['소비 흐름','점'],investment:['투자 흐름','점'],debtStock:['가계부채 잔액 지수','점'],imbalance:['부채·주택 과열','/100'],expectations:['예상 물가상승률','%'],capacity:['경제 기초체력','점']});
export function tape(seed,count=12){
 let s=seed>>>0;
 const draw=()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
 return Array.from({length:count},()=>{
 const oil=(draw()-.5)*10, world=(draw()-.5)*.6, fedMove=draw();
 return {oil,world,fed:fedMove<.12?.25:fedMove>.88?-.25:0,risk:(draw()-.5)*8,sensitivity:.8+.4*draw()};
 });
}
export function advance(s,rate,e){
 if(!Number.isFinite(rate)||rate<0||rate>10)throw new RangeError('Invalid policy rate');
 // The change moves markets once. The level feeds the distributed lag each month.
 const delta=rate-s.rate;
 const gaps=[rate-neutralRate,...s.gaps].slice(0,4);
 const lag=weights=>weights.reduce((sum,w,i)=>sum+w*(gaps[i]??0),0);
 const fed=clamp(s.fed+e.fed,0,10);
 const fx=clamp(s.fx+.12*(1440-s.fx)+18*e.fed-22*delta+.66*e.oil+1.3*e.risk,900,2200);
 const oil=clamp(s.oil+.22*(75-s.oil)+e.oil,20,180);
 const stress=clamp(30+.76*(s.stress-30)+e.risk+delta*(s.stress>60?12:4)-1.4*e.world+.045*(s.imbalance-40),0,100);
 const loan=clamp(s.loan+.64*delta+.008*(stress-s.stress)+.2*(rate+1.57-s.loan),0,15);
 const demand=lag([.26,.16,.065]);
 const prices=lag([.14,.14,.05,.025]);
 const growth=clamp(s.capacity+.75*(s.growth-s.capacity)-e.sensitivity*(s.stress>60?1.55:1)*demand+.36*e.world-.007*e.oil-.008*Math.max(0,stress-40),-6,8);
 const inflation=clamp(2+.79*(s.inflation-2)+.05*(s.expectations-2)+.045*(s.growth-s.capacity)-e.sensitivity*prices+.011*e.oil+.002*(fx-s.fx)+(e.demandPrices??0),-3,12);
 const consumption=clamp(1.9+.71*(s.consumption-1.9)-.78*e.sensitivity*demand+.24*e.world-.009*e.oil-.004*(s.debtStock-100),-7,9);
 const investmentTrend=1.9+.35*(s.capacity-1.9);
 const investment=clamp(investmentTrend+.69*(s.investment-investmentTrend)-1.18*e.sensitivity*demand+.54*e.world-.011*(stress-30),-10,12);
 const debt=clamp(3+.78*(s.debt-3)-.18*(loan-4.07)+.14*(growth-1.9)+(e.creditImpulse??0),-8,18);
 const housing=clamp(1+.8*(s.housing-1)-.23*(s.loan-4.07)+.2*(growth-1.9),-15,20);
 return {month:s.month+1,rate,fed,fx,oil,stress,loan,growth,inflation,
 consumption,investment,debt,housing,gaps,
 unemployment:clamp(3.1+.83*(s.unemployment-3.1)-.08*(s.growth-1.9),1,14),
 debtStock:s.debtStock*Math.pow(1+debt/100,1/12),
 imbalance:clamp(40+.96*(s.imbalance-40)+.45*(debt-3)+.27*(housing-1),0,100),
 expectations:clamp(2+.94*(s.expectations-2)+.038*(inflation-2),0,10),
 capacity:clamp(1.9+.984*(s.capacity-1.9)+.027*(investment-1.9)-.0012*Math.max(0,stress-45),.2,3.5)};
}
export function project(s,rate,shocks){return shocks.reduce((path,e)=>[...path,advance(path.at(-1),rate,e)],[s]);}


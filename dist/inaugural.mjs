import {publicGuidanceShift} from './dots.mjs';

export function inauguralQuestions(state){
 const number=n=>n.toFixed(2);
 const inflation=number(state.inflation);
 const inflationReading=state.inflation>2?'물가상승률이 '+inflation+'%로 아직 목표보다 높습니다.':'물가상승률은 '+inflation+'%입니다. 지금 수치만으로 물가 위험이 사라졌다고 보긴 어렵습니다.';
 return [
 {id:'stance',reporter:'통화정책 출입기자',question:'총재님, 취임 축하드립니다. 해외에서는 총재님을 매파라고 보는 시각이 있는데요. 물가를 잡으려면 금리를 높은 수준에 두는 게 맞다고 보십니까?',choices:[
 {id:'prices',label:'물가안정에 무게',text:'지금은 물가를 안정시키는 게 중요하다고 봅니다. 물가가 제대로 잡히지 않으면 금리를 내리기도 어렵습니다.',tone:1},
 {id:'activity',label:'경기 부담에 무게',text:'물가도 중요합니다. 다만 경기가 지나치게 위축되지 않도록 지금 금리가 가계와 기업에 주는 부담도 봐야 합니다.',tone:-1},
 {id:'conditional',label:'매파·비둘기파 구분보다 경제 상황',text:'매파냐 비둘기파냐 하는 구분에 큰 의미를 두진 않습니다. 경제 상황이 달라지면 필요한 결정도 달라지는 거죠.',tone:0}
 ]},
 {id:'priority',reporter:'경제부 기자',question:'올해 한은이 특히 신경 써야 할 문제가 여럿 있을 텐데요. 하나만 꼽는다면 뭘 가장 눈여겨보시겠습니까?',choices:[
 {id:'prices',label:'물가안정',text:'물가안정입니다. 물가가 안정돼야 가계나 기업도 앞으로 얼마나 쓰고 투자할지 계획을 세울 수 있거든요.'},
 {id:'markets',label:'금융안정',text:'올해는 금융안정을 특히 눈여겨보겠습니다. 가계 빚이 늘거나 돈이 제때 돌지 않으면 그 영향이 경제 전체로 번질 수 있습니다.'},
 {id:'activity',label:'성장',text:'올해는 경기 회복에 특히 신경을 쓰겠습니다. 소비와 투자가 살아날 여건이 되는지 먼저 보려고 합니다.'}
 ]},
 {id:'diagnosis',reporter:'경제부 기자',question:'마지막으로 하나만 더 여쭐게요. 지금 한국 경제를 어떻게 보고 계십니까? 당장 가장 걱정되는 게 뭡니까?',choices:[
 {id:'prices',label:'물가 위험',text:inflationReading+' 앞으로 물가가 다시 오를 가능성은 계속 봐야 합니다.'},
 {id:'activity',label:'경기 둔화',text:'가계 대출금리가 '+number(state.loan)+'%입니다. 이자 부담 속에서도 소비가 버틸지, 기업이 투자를 이어갈 수 있을지 보고 있습니다.'},
 {id:'markets',label:'금융시장 불안',text:'가계신용 증가율은 연율 '+number(state.debt)+'%입니다. 지금 그 숫자 하나로 위기를 말할 수는 없지만, 빚이 쌓이는 속도와 시장의 자금 사정을 같이 봐야 합니다.'}
 ]}
 ];
}

export function startInaugural(game){
 return {...game,phase:'inaugural',inaugural:{date:'2027-01-01',rate:game.state.rate,indicators:{...game.state},answers:[]}};
}

export function answerInaugural(game,id){
 if(game.phase!=='inaugural')throw Error('Inaugural conference is closed');
 const record=game.inaugural;
 const question=inauguralQuestions(record.indicators)[record.answers.length];
 const choice=question.choices.find(item=>item.id===id);
 if(!choice)throw Error('Invalid inaugural answer');
 const answers=[...record.answers,{...choice,topic:question.id,question:question.question,reporter:question.reporter}];
 if(answers.length<3)return {...game,inaugural:{...record,answers}};
 const market={...game.market,expected:game.market.expected+publicGuidanceShift(answers[0].tone,game.market.trust)};
 return {...game,phase:'office',inaugural:{...record,answers},market};
}

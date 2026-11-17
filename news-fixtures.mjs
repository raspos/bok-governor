import {start,begin,decide,conclude,onward,respondCrisis,respondGovernment,submitDots,resolveReview} from './dist/game.mjs';
import {chooseGoal} from './dist/goals.mjs';
import {frontPage,openFrontPage} from './dist/newspaper.mjs';
import {politicalReplies} from './dist/politics.mjs';
export function* newsSessions(){
 for(const background of ['scholar','official','politician'])for(let seed=1;seed<=30;seed++){
 let game=start(seed,background);
 for(let turn=0;turn<8;turn++){
  game=begin(game);
  if(game.phase==='crisis')game=respondCrisis(game,'liquidity');
  if(game.phase==='government')game=respondGovernment(game,Object.keys(politicalReplies[game.context.government.id])[0]);
  game=chooseGoal(game,'inflation');
  game=decide(game,turn%3===0?.25:0,'prices','하락');
  if(game.phase==='review')game=resolveReview(game,game.pending.change);
  if(game.phase==='dots')game=submitDots(game,Array(3).fill(game.pending.rate));
  game=conclude(game,'conditional');
  yield game;
  game=onward(openFrontPage(game));
 }
 }
}


export function newsCases(){
 const found={};
 for(const g of newsSessions()){
  const a=frontPage(g);
  const category=a.topic==='growth'?'recovery':(a.headline.includes('경기는 뒷걸음')||a.headline.includes('진퇴양난'))?'stagflation':a.flash?.includes('신용 경색')?'crisis':null;
  if(category&&!found[category])found[category]=openFrontPage(g);
  if(Object.keys(found).length===3)break;
 }
 return found;
}


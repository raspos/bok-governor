import test from 'node:test';
import assert from 'node:assert/strict';
import {frontPage,openFrontPage} from './dist/newspaper.mjs';
import {onward} from './dist/game.mjs';
import {newsSessions,newsCases} from './news-fixtures.mjs';
import {forecastWatch,publicWatchSnapshot} from './dist/watch.mjs';

test('front page uses observed results, preserves market state and survives save/reload',()=>{
 const g=newsSessions().next().value;
 const r=g.records.at(-1);
 const published=openFrontPage(g);
 const a=published.records.at(-1).article;
 assert.equal(published.market,g.market);
 assert.equal(published.state,g.state);
 assert.equal(a.watch.asOf,a.date);
 assert.ok(a.date<a.next);
 assert.deepEqual(a.watch,forecastWatch(publicWatchSnapshot(g.state,g.market,r,a.next,r.incidents,a.date)));
 assert.equal(a.indicators.find(x=>x.key==='inflation').after,g.state.inflation);
 assert.match(a.body.join(' '),new RegExp(r.rate.toFixed(2)));
 assert.match(a.body.join(' '),/무충격/);
 const saved=JSON.parse(JSON.stringify(published));
 assert.deepEqual(onward(saved).records.at(-1).article,a);
 assert.equal(g.records.at(-1).article,undefined);
});

test('private goals, persuasion and presidential contacts stay out of the news',()=>{
 const g=newsSessions().next().value;
 const r=g.records.at(-1);
 const draft=frontPage(g);
 const privateGame={...g,seed:9909,records:[{...r,goalResult:{met:true},persuasion:[{proof:'PRIVATE'}],government:{event:{id:'president'},reply:'PRIVATE'}}]};
 assert.deepEqual(frontPage(privateGame),draft);
 const disclosed={...privateGame,records:[{...privateGame.records[0],conference:{answers:[{topic:'target',kind:'evidence'}]}}]};
 assert.match(frontPage(disclosed).body.join(' '),/공개한 단기 목표는 달성/);
});

test('replayed economic paths yield distinct angles across the three backgrounds',()=>{
 const cases=newsCases();
 assert.deepEqual(Object.keys(cases).sort(),['crisis','recovery','stagflation']);
 assert.equal(new Set(Object.values(cases).map(g=>g.records.at(-1).article.body[0])).size,3);
});
test('the front page distinguishes the direction of inflation from distance to target',()=>{
 const cases=newsCases();
 const recovery=cases.recovery.records.at(-1).article;
 const slowdown=cases.stagflation.records.at(-1).article;
 assert.match(recovery.body.join(' '),/1\.67%에서 1\.71%로 0\.04%포인트 올랐다.*2% 목표를 밑돈다/);
 assert.match(slowdown.body.join(' '),/2\.80%에서 2\.44%로 0\.36%포인트 내렸다.*2% 목표를 웃돈다/);
 assert.match(cases.crisis.records.at(-1).article.flash,/신용 경색/);
});
test('published terms vary consecutive headlines and use natural comparison sentences',()=>{
 let checked=0;
 for(const g of newsSessions()){
  const article=frontPage(g);
  const previous=g.records.at(-2)?.article;
  if(previous)assert.notEqual(article.headline,previous.headline);
  assert.doesNotMatch(article.body.join(' '),/(원|점)(였다|로,|는 가계)|\+0\.00/);
  if(++checked===80)break;
 }
 assert.equal(checked,80);
});

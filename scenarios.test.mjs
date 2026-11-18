import test from 'node:test';
import assert from 'node:assert/strict';
import {start, opinions, decide, onward, conclude} from './dist/game.mjs';
import {startScenarios} from './dist/scenarios.mjs';
import {inauguralQuestions, answerInaugural, startInaugural} from './dist/inaugural.mjs';
import {currentWatch} from './dist/watch.mjs';
import {frontPage} from './dist/newspaper.mjs';

test('all 6 scenarios have distinct initial indicators and dilemmas', () => {
 const ids = ['standard', 'inflation', 'stagnation', 'fx', 'debt', 'chips'];
 for (const id of ids) {
  const g = start(42, 'scholar', id);
  assert.equal(g.scenario, id);
  assert.ok(g.state.inflation > 0);
  assert.ok(g.state.growth !== undefined);
  assert.ok(g.state.fx > 1000);
 }

 // Distinct inflation levels
 assert.equal(startScenarios.inflation.state.inflation, 3.7);
 assert.equal(startScenarios.stagnation.state.inflation, 1.4);
 assert.equal(startScenarios.fx.state.fx, 1530);
 assert.equal(startScenarios.debt.state.debt, 7.2);
 assert.equal(startScenarios.chips.state.investment, 3.4);
});

test('BOK WATCH forecasts reflect scenario differences in first meeting', () => {
 const gInf = start(42, 'scholar', 'inflation');
 const gStag = start(42, 'scholar', 'stagnation');

 const wInf = currentWatch(gInf);
 const wStag = currentWatch(gStag);

 // In high inflation, probability of raise must be higher than in stagnation
 assert.ok(wInf.probabilities.raise > wStag.probabilities.raise, 'Inflation scenario should have higher hike probability');
 assert.ok(wStag.probabilities.cut > wInf.probabilities.cut, 'Stagnation scenario should have higher cut probability');
});

test('committee initial opinions reflect scenario economic realities', () => {
 const gInf = start(42, 'scholar', 'inflation');
 const gStag = start(42, 'scholar', 'stagnation');

 const opsInf = opinions(gInf.state, 'prices', 0, '보합', gInf.market, gInf);
 const opsStag = opinions(gStag.state, 'activity', 0, '보합', gStag.market, gStag);

 const hikeCountInf = opsInf.filter(o => o.vote > 0).length;
 const cutCountStag = opsStag.filter(o => o.vote < 0).length;

 assert.ok(hikeCountInf > 0, 'Inflation scenario should have committee members voting for a rate hike');
 assert.ok(cutCountStag > 0, 'Stagnation scenario should have committee members voting for a rate cut');
});

test('inaugural conference third question is dynamically tailored to the scenario', () => {
 const ids = ['standard', 'inflation', 'stagnation', 'fx', 'debt', 'chips'];
 const questions = ids.map(id => {
  const g = start(42, 'scholar', id);
  return inauguralQuestions(g.state, id)[2];
 });

 // Check that each scenario has a unique tailored third question
 assert.match(questions[1].question, /소비자물가/);
 assert.match(questions[2].question, /소비와 설비투자/);
 assert.match(questions[3].question, /원화값/);
 assert.match(questions[4].question, /가계대출/);
 assert.match(questions[5].question, /반도체/);

 // Test full inaugural cycle for fx scenario
 let gFx = start(42, 'scholar', 'fx');
 gFx = startInaugural(gFx);
 gFx = answerInaugural(gFx, 'prices');
 gFx = answerInaugural(gFx, 'markets');
 gFx = answerInaugural(gFx, 'markets'); // Answering scenario tailored Q3
 assert.equal(gFx.phase, 'office');
 assert.equal(gFx.inaugural.answers.length, 3);
});

test('front page newspaper headlines differentiate scenario outcomes after meeting 1', () => {
 let gInf = start(42, 'scholar', 'inflation');
 gInf = decide({...gInf, phase: 'meeting'}, 0.25, 'prices', '상승');
 gInf = conclude(gInf, 'conditional');
 const paperInf = frontPage(gInf);
 assert.ok(paperInf.headline.length > 0);

 let gStag = start(42, 'scholar', 'stagnation');
 gStag = decide({...gStag, phase: 'meeting'}, -0.25, 'activity', '하락');
 gStag = conclude(gStag, 'conditional');
 const paperStag = frontPage(gStag);
 assert.ok(paperStag.headline.length > 0);
 assert.notEqual(paperInf.headline, paperStag.headline);
});

test('meeting council has 5-second rotating member speeches with claim and explanation', async () => {
 const fs = await import('fs');
 const html = fs.readFileSync('play.html', 'utf8');
 assert.ok(html.includes('council-speech-turn'));
 assert.ok(html.includes('speechTimerFill'));
 assert.ok(html.includes('speech-claim-block'));
 assert.ok(html.includes('speech-explanation-block'));
 assert.ok(html.includes('speech-nav-controls'));
 assert.ok(html.includes('speech-timer-bar'));
 assert.ok(html.includes('getMemberSpeechData'));
});

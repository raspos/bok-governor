import test from 'node:test';
import assert from 'node:assert/strict';
import {start,begin,decide,conclude} from './dist/game.mjs';
import {startInaugural,inauguralQuestions,answerInaugural} from './dist/inaugural.mjs';
import {conferenceFor} from './dist/press.mjs';
import {frontPage} from './dist/newspaper.mjs';

test('inaugural answers save individually and affect public expectations once',()=>{
 for(const role of ['scholar','official','politician']){
  const original=start(21,role);
  const opening=startInaugural(original);
  assert.equal(inauguralQuestions(opening.inaugural.indicators).length,3);
  const first=answerInaugural(opening,'prices');
  const resumed=JSON.parse(JSON.stringify(first));
  const second=answerInaugural(resumed,'markets');
  assert.deepEqual(second.market,original.market);
  const done=answerInaugural(second,'activity');
  assert.equal(done.phase,'office');
  assert.deepEqual(done.state,original.state);
  assert.equal(done.inaugural.rate,original.state.rate);
  assert.ok(done.market.expected>original.market.expected);
  assert.throws(()=>answerInaugural(done,'prices'),/closed/);
  const pre=begin(done);
  assert.notDeepEqual(pre.context.watch.probabilities,begin(original).context.watch.probabilities);
  const pending=decide({...pre,phase:'meeting'},0,'prices','하락');
  assert.ok(conferenceFor(pending).queue.some(q=>q.question.includes(done.inaugural.answers[1].text)));
  const result=conclude(pending,'conditional');
  assert.ok(frontPage(result).body.some(p=>p.includes(done.inaugural.answers[1].text)));
 }
});
test('diagnoses use recorded data and avoid alleging above-target inflation at low rates',()=>{
 const base=start(1).state;
 const q=inauguralQuestions({...base,inflation:1.2});
 assert.match(q[2].choices[0].text,/1\.20%/);
 assert.doesNotMatch(q[2].choices[0].text,/목표보다 높/);
});

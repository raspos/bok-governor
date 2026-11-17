import test from 'node:test';
import assert from 'node:assert/strict';
import {activateAbility,abilityStatus,persuasionLeft,communicationEffect} from './dist/abilities.mjs';
import {initial} from './dist/economy.mjs';
import {openingPolitics,pressureOdds} from './dist/politics.mjs';
import {start,decide,conclude,reassess} from './dist/game.mjs';
import {getCommittee,policyPressure} from './dist/committee.mjs';
import {historicalVerdict} from './dist/verdict.mjs';
import {simulate} from './balance.mjs';

const meeting=profile=>({...start(1,profile),phase:'meeting',context:{events:[]}});
test('governor ability consumes one debate slot and has a two-use term limit',()=>{
 const s=meeting('scholar');
 const g=activateAbility(s,'prices');
 assert.equal(persuasionLeft(g),1);
 assert.equal(g.state,s.state);
 assert.throws(()=>activateAbility(g,'activity'));
 assert.equal(abilityStatus({...s,records:[{ability:{}},{ability:{}}]}).available,false);
 assert.throws(()=>activateAbility({...s,context:{...s.context,persuasion:[{},{}]}},'prices'));
 assert.ok(g.context.ability.report.higher<g.context.ability.report.lower);
 assert.notEqual(g.context.ability.report.central,g.context.ability.report.adverse);
});
test('official policy mix changes event transmission, with the same rate vote',()=>{
 const g={...meeting('official'),context:{events:[{id:'finance',start:0}],response:'observe'}};
 assert.throws(()=>activateAbility(meeting('official'),'liquidity'));
 const a=decide(activateAbility(g,'liquidity'),0,'markets','보합');
 const b=decide(g,0,'markets','보합');
 assert.deepEqual(a.pending.votes,b.pending.votes);
 const supported=conclude(a,'conditional'),control=conclude(b,'conditional');
 assert.equal(supported.state.rate,control.state.rate);
 assert.ok(supported.state.stress<control.state.stress);
 assert.ok(supported.state.debt>control.state.debt);
});
test('consistent public address changes expectations; contradiction can cost trust',()=>{
 const g=meeting('politician');
 const withSpeech=activateAbility(g,'prices');
 const a=decide(withSpeech,0,'prices','하락');
 const b=decide(g,0,'prices','하락');
 assert.ok(communicationEffect(a.pending,'prices').approval>0);
 assert.ok(communicationEffect(a.pending,'activity').trust<0);
 const identical=conclude(b,'prices'), consistent=conclude(a,'prices');
 assert.deepEqual(identical.state,consistent.state);
 assert.ok(consistent.market.expected>identical.market.expected);
 assert.ok(consistent.politics.approval>identical.politics.approval);
 assert.ok(conclude(a,'activity').market.trust<consistent.market.trust);
});
test('roster principles respond specifically to stress and foreign conditions',()=>{
 const g=meeting('scholar');
 assert.equal(getCommittee(g).length,6);
 assert.ok(policyPressure(9,{...initial,stress:48})<policyPressure(9,initial));
 assert.equal(policyPressure(0,{...initial,stress:48}),policyPressure(0,initial));
 assert.ok(policyPressure(3,{...initial,fx:1500})>policyPressure(3,initial));
});
test('actual records show successful and failed persuasion, a decisive vote and delayed forecast checks',()=>{
 const g=simulate(2654435761,'scholar','prices');
 assert.deepEqual(g,simulate(2654435761,'scholar','prices'));
 assert.ok(g.records.some(r=>r.persuasionDecisive));
 const changed=g.records.find(r=>r.persuasionDecisive);
 assert.notEqual(changed.noPersuasionRate,changed.rate);
 assert.ok(changed.persuasion.some(p=>p.changed));
 assert.ok((changed.runoff??changed.votes).filter(v=>v.vote===changed.change).length>=4);
 const attempts=g.records.flatMap(r=>r.persuasion);
 assert.ok(attempts.some(p=>p.trustAfter>p.trustBefore));
 const failure=simulate(1013904226,'scholar','prices').records.flatMap(r=>r.persuasion).find(p=>!p.changed&&p.trustAfter<p.trustBefore);
 assert.ok(failure);
 assert.ok(g.records.flatMap(r=>r.verified).length>0);
 const analysis=reassess(g),result=historicalVerdict(g,analysis);
 assert.ok(result.subtitle.includes('고유 행동 2회'));
 assert.equal(analysis.played.at(-1).month,36);
});
test('lower approval raises pressure odds without setting trust or rates',()=>{
 const politics=openingPolitics();
 const s={...initial,growth:.9};
 const healthy=pressureOdds(s,politics), low=pressureOdds(s,{...politics,approval:35});
 assert.ok(low>healthy);
 assert.equal(s.rate,initial.rate);
});


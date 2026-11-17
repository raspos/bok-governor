import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from './dist/economy.mjs';
import {aggregate,horizon,memberDots,marketResponse,openingMarket,pressQuestion,isRelease} from './dist/dots.mjs';
import {start,decide,submitDots,conclude,onward,reassess} from './dist/game.mjs';

const call=g=>decide({...g,phase:'meeting'},0,'prices','하락');

test('four anonymous releases store 21 quarter-point dots, with a May 2028 horizon',()=>{
 let g=start(81);
 for(let i=0;i<8;i++){
 const next=call(g);
 const releasing=[1,3,5,7].includes(i);
 assert.equal(isRelease(next.pending.date),releasing);
 assert.equal(next.phase,releasing?'dots':'press');
 if(releasing){
 const r=next.pending.rate;
 const points=[r-.25,r,r+.25];
 assert.throws(()=>submitDots(next,[r,r+.1,r]));
 assert.throws(()=>submitDots(next,[r]));
 const pending=JSON.parse(JSON.stringify(next));
 const printed=submitDots(pending,points);
 assert.deepEqual(printed.pending.votes,next.pending.votes);
 assert.equal(printed.pending.rate,r);
 assert.equal(printed.pending.dots.members.length,6);
 assert.ok(printed.pending.dots.members.every(row=>row.length===3));
 assert.deepEqual(printed.pending.dots.player,points);
 assert.equal(printed.pending.dots.counts.reduce((n,row)=>n+row.count,0),21);
 assert.ok(printed.pending.dots.counts.every(row=>Number.isInteger(row.rate*4)));
 g=conclude(printed,'conditional');
 }else{
 assert.throws(()=>submitDots(next,[3,3,3]));
 assert.equal(next.pending.internalDots.length,6);
 assert.equal(next.pending.dots,undefined);
 g=conclude(next,'conditional');
 }
 g=onward(JSON.parse(JSON.stringify(g)));
 }
 const releases=g.records.flatMap(r=>r.dots?[r.dots.target]:[]);
 assert.deepEqual(releases,['2027-08','2027-11','2028-02','2028-05']);
 assert.equal(horizon('2027-11-25'),'2028-05');
 assert.equal(reassess(g).communication.releases,4);
 assert.ok(reassess(g).communication.title);
});
test('distribution counts and median use dots, including repeated levels',()=>{
 const result=aggregate([...Array(9).fill(2.75),...Array(3).fill(3),...Array(9).fill(3.25)],3);
 assert.deepEqual([result.lower,result.same,result.higher,result.median],[9,3,9,3]);
 assert.deepEqual(aggregate(Array(21).fill(3),3).counts,[{rate:3,count:21}]);
 assert.throws(()=>aggregate(Array(21).fill(3.01),3));
});
test('inflation and contraction alter committee outlooks in heterogeneous ways',()=>{
 const prefs=[[.85,.32,.16,.12],[.35,.95,.22,.10]];
 const hot=memberDots({...initial,inflation:4},prefs);
 const slump=memberDots({...initial,growth:-1,stress:45},prefs);
 assert.ok(hot.every((row,i)=>row[1]>slump[i][1]));
 assert.notEqual(hot[0][1]-slump[0][1],hot[1][1]-slump[1][1]);
});
test('changing governor dots changes market pricing while current votes and macro path stay fixed',()=>{
 const jan=conclude(call(start(5)),'conditional');
 const feb=call(onward(jan));
 const high=conclude(submitDots(feb,[5,5,5]),'conditional');
 const low=conclude(submitDots(feb,[1,1,1]),'conditional');
 assert.deepEqual(high.state,low.state);
 assert.deepEqual(high.records[1].votes,low.records[1].votes);
 assert.ok(high.market.expected>low.market.expected);
 assert.ok(high.market.yield>low.market.yield);
 const statement=conclude(submitDots(feb,[5,5,5]),'prices');
 assert.notEqual(statement.market.expected,high.market.expected);
});
test('evidence-supported revisions keep trust; repeat unexplained conflicts lose it',()=>{
 const old={origin:initial,dots:{median:3}};
 const changed={origin:{...initial,inflation:3.3},rate:2.5};
 const question=pressQuestion([old],changed);
 assert.equal(question.challenge,true);
 assert.ok(question.credible.includes('prices'));
 const supported=marketResponse(openingMarket,changed,question,'prices');
 const unsupported=marketResponse(openingMarket,changed,question,'reaffirm');
 assert.ok(supported.trust>=openingMarket.trust);
 assert.equal(unsupported.trust,openingMarket.trust);
 const repeated=marketResponse(unsupported,changed,question,'reaffirm');
 assert.ok(repeated.trust<unsupported.trust);
 assert.equal(repeated.unexplained,2);
});


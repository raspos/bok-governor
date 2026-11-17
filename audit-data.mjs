import {readFileSync} from 'node:fs';
const series=[
 ['FEDFUNDS','2026-10-01','% (NSA)'],
 ['EXKOUS','2026-10-01','KRW / USD (NSA)'],
 ['POILBREUSDM','2026-09-01','USD / barrel (NSA)'],
];
for(const [id,last,unit] of series){
 const [header,...lines]=readFileSync(new URL('./data/'+id+'.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
 if(header!=='observation_date,'+id)throw Error('Header mismatch: '+id);
 let previous;
 const changes=[];
 for(const [i,line] of lines.entries()){
 const [date,raw,...rest]=line.split(',');
 const expected=new Date(Date.UTC(2007,i,1)).toISOString().slice(0,10);
 if(date!==expected||!/^[-+]?\d+(\.\d+)?$/.test(raw)||rest.length)throw Error('Invalid observation: '+line);
 const n=Number(raw);
 if(previous!==undefined)changes.push(Math.abs(n-previous));
 previous=n;
 }
 if(lines.at(-1).split(',')[0]!==last)throw Error('Unexpected end date: '+id);
 changes.sort((a,b)=>a-b);
 console.log(id,lines.length,'2007-01-01',last,unit,'median |monthly change|',changes[Math.floor(changes.length/2)].toFixed(3));
}


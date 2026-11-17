import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('./dist/',import.meta.url);
const mime={html:'text/html; charset=utf-8',css:'text/css',mjs:'text/javascript',jpg:'image/jpeg',png:'image/png',woff2:'font/woff2',webp:'image/webp'};
const port=Number(process.argv[2]??4173);
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=path==='/'?'index.html':path.slice(1);
 if(!/^[a-z0-9.-]+$/i.test(file)||file.startsWith('.')){res.writeHead(404).end();return;}
 try{
 const data=await readFile(new URL(file,root));
 res.writeHead(200,{'Content-Type':mime[file.split('.').at(-1)]??'application/octet-stream'}).end(data);
 }catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));


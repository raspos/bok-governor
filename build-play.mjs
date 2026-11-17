import {readFile,writeFile} from 'node:fs/promises';
const dist=new URL('./dist/',import.meta.url);
const read=(name,encoding)=>readFile(new URL(name,dist),encoding);
const artwork=['office.jpg','board.jpg','press-v2.jpg','governors.jpg','joongang-logo.png','committee-portraits.jpg','office52.jpg','board52.jpg','president52.jpg','hearing52.jpg','crisis52.jpg','ministry52.jpg','council-chamber.jpg','council-cast.png','office-rebuild.jpg','press-rebuild.jpg','president-rebuild.jpg','pretendard.woff2','noto-serif-kr.woff2','paperlogy.woff2'];
const [html,css,assets,...modules]=await Promise.all([
 read('index.html','utf8'),read('style.css','utf8'),Promise.all(artwork.map(name=>read(name))),
 ...['schedule.mjs','economy.mjs','goals.mjs','abilities.mjs','dots.mjs','scenarios.mjs','politics.mjs','committee.mjs','watch.mjs','press.mjs','inaugural.mjs','newspaper.mjs','game.mjs','verdict.mjs','ui.mjs'].map(name=>read(name,'utf8')),
]);
const styles=artwork.reduce((source,name,i)=>source.replaceAll('./'+name,(name.endsWith('.woff2')?'data:font/woff2':'data:image/'+(name.endsWith('.png')?'png':'jpeg'))+';base64,'+assets[i].toString('base64')),css);
const js=modules.map(source=>source.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const page=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+styles+'</style>')
 .replace('<script type="module" src="./ui.mjs"></script>','')
 .replace('href="./"','href="./play.html"')
 .replace('</body>','<script>'+js.replaceAll('</script','<\\/script')+'</script></body>');
await writeFile(new URL('./play.html',import.meta.url),page);






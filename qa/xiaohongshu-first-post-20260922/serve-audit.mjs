import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const allowed=['/public/','/deliverables/xiaohongshu-z-lady/','/qa/xiaohongshu-first-post-20260922/'];
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try {
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!['GET','HEAD'].includes(req.method)||!allowed.some(s=>p.startsWith(s))||p.includes('..')||p.includes('\\')||p.split('/').some(s=>s.startsWith('.'))) {res.writeHead(403).end();return;}
  let path=resolve(root,'.'+p); if((await stat(path)).isDirectory())path=resolve(path,'index.html');
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);
 } catch {res.writeHead(404).end('Not found');}
}).listen(4183,'127.0.0.1',()=>console.log('Audit preview: http://127.0.0.1:4183'));

import {readFile,writeFile,readdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const posts=[
 {dir:'01-Z女士',name:'第一篇 · Z 女士',renewed:[1,2,3,4],labels:['封面与职业','资料如何整理','桌面作品展示','手机浏览','大图与视频','咨询入口']},
 {dir:'02-胡海燕',name:'第二篇 · 胡海燕',renewed:[1,2,5,6],labels:['线上画廊封面','作品与经历','作品列表','手机浏览','全图与翻页','咨询入口']},
 {dir:'03-运营简历示意',name:'第三篇 · 运营简历示意',renewed:[1,2,3,4,5,6],labels:['运营主题封面','同内容前后对照','职责与材料','展开内容排期','手机浏览','咨询入口']}
];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const hash=b=>createHash('sha256').update(b).digest('hex');
const css=`:root{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#172b4d;background:#f4f6fa}*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1240px;margin:auto;padding:32px}header{padding-bottom:18px}h1{font-size:32px;margin:0 0 12px}p{line-height:1.8}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#244cbd;text-underline-offset:4px}section{padding:20px 0 36px;border-top:1px solid #d5ddeb}h2{font-size:24px;margin:0 0 10px}.meta{font-size:14px;color:#576780;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.tile{margin:0;min-width:0}.tile img{display:block;width:100%;height:auto;aspect-ratio:3/4;object-fit:contain;box-shadow:0 4px 15px #152a4a15}.tile a{display:block}.tile figcaption{font-size:13px;line-height:1.7;margin-top:10px}.tile small{color:#65748a}.links{display:flex;flex-wrap:wrap;gap:22px;margin:20px 0}details{background:#fff;border:1px solid #d5ddeb;padding:15px 18px;border-radius:8px}summary{cursor:pointer;font-weight:600}textarea{display:block;width:100%;min-height:280px;font:15px/1.8 inherit;color:#20324b;border:1px solid #ccd4df;border-radius:4px;padding:14px;margin:14px 0;background:#fff;resize:vertical}button{font:inherit;border:0;background:#244cbd;color:#fff;padding:10px 18px;border-radius:6px;cursor:pointer}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #bc791a;outline-offset:4px}.copy-status{font-size:13px;margin-left:12px}footer{font-size:13px;color:#65748a;padding-top:0}@media(max-width:900px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:520px){header,main,footer{padding:22px 18px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:26px}h2{font-size:21px}.links{gap:14px}}`;
const script=`document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const t=document.getElementById(b.dataset.copy);const status=b.nextElementSibling;try{await navigator.clipboard.writeText(t.value);status.textContent='文案已复制';}catch{t.focus();t.select();status.textContent='已选中文案，请按 Ctrl+C 复制';}}));`;
const manifest={version:'v3',date:'2026-09-22',total_images:18,regenerated:14,retained:4,posts:[]};
const sections=[];
for(let i=0;i<posts.length;i++){
 const p=posts[i];
 const files=(await readdir(join(root,p.dir,'images'))).filter(n=>n.endsWith('.png')).sort();
 if(files.length!==6)throw new Error(p.dir+' 图片数不是6');
 const copy=(await readFile(join(root,p.dir,'发布文案_直接复制.txt'),'utf8')).replace(/^\uFEFF/,'').trim();
 const md=await readFile(join(root,p.dir,'发布文案.md'),'utf8');
 const title=copy.split(/\r?\n/)[0];
 for(const [field,re] of [['标题',/## 标题\s+([\s\S]*?)\s+## 正文/],['正文',/## 正文\s+([\s\S]*?)\s+## 标签/],['标签',/## 标签\s+([\s\S]*?)\s+## 六张/]]){const m=md.match(re);if(!m||!copy.replaceAll('\r','').includes(m[1].trim().replaceAll('\r','')))throw new Error(p.dir+' '+field+' MD/TXT不一致');}
 const items=[];
 for(let j=0;j<files.length;j++){
  const file=files[j];if(!file.startsWith(String(j+1).padStart(2,'0')+'-'))throw new Error('图片顺序异常 '+file);
  const b=await readFile(join(root,p.dir,'images',file));
  if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('PNG签名不正确');
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20);
  if(width!==1086||height!==1448)throw new Error(p.dir+'/'+file+' 尺寸不一致');
  items.push({file,role:p.labels[j],status:p.renewed.includes(j+1)?'重制':'保留',width,height,bytes:b.length,sha256:hash(b)});
 }
 const rows=items.map((m,j)=>`${String(j+1).padStart(2,'0')} ${m.file} — ${m.role}${j===0?'（封面）':''}`).join('\n');
 await writeFile(join(root,p.dir,'发布顺序.txt'),`${p.name}\n标题：${title}\n\n${rows}\n\n按01到06上传全部六张，01设为封面。\n标题填标题栏；正文和标签填正文栏。\n使用本目录图片与文案，不混用旧版。\n`,'utf8');
 const section=(prefix,local=false)=>`<section id="post${i+1}"><h2>${esc(p.name)}</h2><p class="meta">${esc(title)} · 6 张 · 1086 × 1448</p><div class="grid">${items.map((m,j)=>`<figure class="tile"><a href="${prefix}images/${m.file}" target="_blank" rel="noopener"><img src="${prefix}images/${m.file}" alt="${esc(p.name+' 第'+(j+1)+'张 '+m.role)}" width="1086" height="1448"></a><figcaption>${String(j+1).padStart(2,'0')} · ${m.role}<br><small>${m.status}${j===0?' · 发布封面':''}</small></figcaption></figure>`).join('')}</div><div class="links"><a href="${prefix}发布文案_直接复制.txt">打开纯文本</a><a href="${prefix}发布文案.md">发布说明</a><a href="${prefix}发布顺序.txt">图片顺序</a>${local?'':`<a href="${prefix}index.html">打开本篇预览</a>`}</div><details><summary>展开标题、正文与标签</summary><textarea id="copy${i}" readonly aria-label="${esc(p.name+'发布文案')}">${esc(copy)}</textarea><button type="button" data-copy="copy${i}">复制文案</button><span class="copy-status" role="status"></span></details></section>`;
 sections.push(section(p.dir+'/'));
 await writeFile(join(root,p.dir,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} · 一页映发布包</title><style>${css}</style><header><h1>${esc(p.name)}</h1><p>按 01—06 上传六张，01 设为封面。点击图片查看原图。</p></header><main>${section('',true)}</main><script>${script}</script></html>`,'utf8');
 manifest.posts.push({directory:p.dir,title,images:items,copy_sha256:hash(await readFile(join(root,p.dir,'发布文案_直接复制.txt')))});
}
await writeFile(join(root,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一页映 · 前三篇新版发布包</title><style>${css}</style><header><h1>一页映 · 前三篇新版</h1><p>18 张图与配套文案。按篇目选择，六张顺序已编号。点击图片可打开原图。</p><nav>${posts.map((p,i)=>`<a href="#post${i+1}">${p.name}</a>`).join('')}</nav></header><main>${sections.join('')}</main><footer>本目录为本轮新版发布入口。制作记录与来源另存于各篇目录，发布时只选 images 中六张图片。</footer><script>${script}</script></html>`,'utf8');
await writeFile(join(root,'文件核验清单.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(JSON.stringify({status:'passed',posts:manifest.posts.length,images:18,size:'1086×1448',md_txt:'identical'},null,2));

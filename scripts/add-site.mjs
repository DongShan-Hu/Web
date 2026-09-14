import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectRoot, publicRoot } from './check.mjs';

const args = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!['--slug', '--name', '--type', '--summary'].includes(key) || !value || value.startsWith('--')) throw new Error('参数格式错误。使用 --slug 客户名称 --name 显示名称 --type company|resume|engineering --summary 介绍');
  args[key.slice(2)] = value;
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug || '')) throw new Error('--slug 只允许小写字母、数字和中间的短横线');
if (!args.name?.trim() || !['company', 'resume', 'engineering'].includes(args.type)) throw new Error('请提供 --name，并选择 --type company、resume 或 engineering');
const target = resolve(publicRoot, 'sites', args.slug);
const manifestPath = resolve(publicRoot, 'sites.json');
const sites = JSON.parse(await readFile(manifestPath, 'utf8'));
if (sites.some(site => site.slug === args.slug)) throw new Error('这个站点名称已经存在');
try { await access(target); throw new Error('目标目录已存在，请手动整理，避免覆盖'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const summary = args.summary || ({ company: '公司介绍与业务展示', resume: '个人经历、能力与作品', engineering: '工程项目与实施成果' }[args.type]);
const source = await readFile(resolve(projectRoot, 'templates', args.type, 'index.html'), 'utf8');
const css = await readFile(resolve(projectRoot, 'templates', 'styles.css'), 'utf8');
const html = source.replaceAll('{{name}}', escape(args.name)).replaceAll('{{summary}}', escape(summary));
await mkdir(target, { recursive: false });
await writeFile(resolve(target, 'index.html'), html);
await writeFile(resolve(target, 'styles.css'), css);
sites.push({ slug: args.slug, name: args.name, category: args.type, summary, tags: [], updated: new Date().toISOString().slice(0, 10), listed: false });
await writeFile(manifestPath, `${JSON.stringify(sites, null, 2)}\n`);
console.log(`已创建 public/sites/${args.slug}/。请填写实际内容，检查后在 sites.json 中把 listed 改成 true。`);
console.log('listed=false 仅隐藏主站卡片；部署后知道路径的人仍能访问，未公开内容请留在本地。');

import { readdir, readFile, stat, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const publicRoot = resolve(projectRoot, 'public');
export async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`禁止发布符号链接：${relative(projectRoot, path)}`);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}
function inside(root, target) {
  const rel = relative(root, target);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !resolve(target).startsWith('\\\\');
}
async function checkReference(from, raw) {
  if (!raw || /^(?:https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(raw) || /[{}$]/.test(raw)) return;
  const ref = decodeURIComponent(raw.split(/[?#]/)[0]);
  if (!ref) return;
  const target = resolve(ref.startsWith('/') ? publicRoot : dirname(from), ref.startsWith('/') ? `.${ref}` : ref);
  if (!inside(publicRoot, target)) throw new Error(`引用越界：${relative(publicRoot, from)} → ${ref}`);
  let info;
  try { info = await stat(target); } catch { throw new Error(`缺少文件：${relative(publicRoot, from)} → ${ref}`); }
  if (info.isDirectory()) await stat(resolve(target, 'index.html'));
}
export async function check() {
  const files = await walk(publicRoot);
  const sites = JSON.parse(await readFile(resolve(publicRoot, 'sites.json'), 'utf8'));
  if (!Array.isArray(sites)) throw new Error('sites.json 必须是数组');
  const slugs = new Set();
  const categories = new Set(['company', 'resume', 'portfolio', 'engineering']);
  for (const site of sites) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(site.slug) || slugs.has(site.slug)) throw new Error('站点 slug 非法或重复');
    slugs.add(site.slug);
    if (!categories.has(site.category) || typeof site.name !== 'string' || !site.name.trim() || typeof site.summary !== 'string' || !Array.isArray(site.tags) || !site.tags.every(tag => typeof tag === 'string') || typeof site.listed !== 'boolean') throw new Error(`${site.slug} 的目录信息不完整`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(site.updated) || Number.isNaN(Date.parse(site.updated)) || new Date(site.updated).toISOString().slice(0, 10) !== site.updated) throw new Error(`${site.slug} 的更新日期非法`);
    await stat(resolve(publicRoot, 'sites', site.slug, 'index.html'));
    if (site.cover) {
      if (!/^sites\/[a-z0-9-]+\/[a-zA-Z0-9/_.-]+$/.test(site.cover) || site.cover.split('/').includes('..')) throw new Error(`${site.slug} 的封面路径非法`);
      await checkReference(resolve(publicRoot, 'index.html'), site.cover);
    }
  }
  let totalBytes = 0;
  for (const file of files) {
    const rel = relative(publicRoot, file);
    if (rel.split(sep).some(part => part.startsWith('.')) || /\.(?:pem|key|zip|pptx?)$/i.test(file)) throw new Error(`不应发布到网站的文件：${rel}`);
    const info = await lstat(file);
    totalBytes += info.size;
    if (info.size >= 100 * 1024 * 1024) throw new Error(`${rel} 超过 GitHub 单文件限制，请使用对象存储`);
    if (!inside(await realpath(publicRoot), await realpath(file))) throw new Error(`真实路径越界：${rel}`);
    if (!['.html', '.css', '.js'].includes(extname(file))) continue;
    const content = await readFile(file, 'utf8');
    if (/\{\{(?:name|summary|slug)\}\}/.test(content)) throw new Error(`${rel} 仍含模板占位符`);
    if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    if (file.endsWith('.html')) {
      if (!/<html\b[^>]*lang=/i.test(content) || !/<title>[^<]+<\/title>/i.test(content) || !/name=["']viewport["']/i.test(content)) throw new Error(`${rel} 缺少语言、标题或移动端 viewport`);
      for (const match of content.matchAll(/(?:src|href|poster)=["']([^"']+)["']/gi)) await checkReference(file, match[1]);
    }
    if (file.endsWith('.js')) for (const match of content.matchAll(/["'`]((?:assets|media)\/[^"'`\s]+)["'`]/g)) await checkReference(file, match[1]);
    if (file.endsWith('.css')) for (const match of content.matchAll(/url\(["']?([^"')]+)["']?\)/g)) await checkReference(file, match[1]);
  }
  console.log(`检查通过：${sites.length} 个站点，${files.length} 个网站文件，${(totalBytes / 1024 / 1024).toFixed(1)} MB。`);
  return files;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) check().catch(error => { console.error(error.message); process.exitCode = 1; });

import { cp, rm } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { check, projectRoot, publicRoot } from './check.mjs';

await check();
const output = resolve(projectRoot, 'dist');
if (relative(projectRoot, output) !== 'dist') throw new Error('构建目录必须是项目内的 dist');
await rm(output, { recursive: true, force: true });
await cp(publicRoot, output, { recursive: true });
console.log('构建完成：dist/ 可直接上传到 Nginx 或宝塔网站根目录。');

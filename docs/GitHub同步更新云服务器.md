# GitHub 同步与云服务器更新

本文记录码页集当前云服务器的实际部署方式，适用于从 GitHub 拉取最新主站代码并完成线上更新。

## 当前服务器配置

| 项目 | 当前值 |
| --- | --- |
| 系统 | Ubuntu 22.04 |
| 公网 IP | `134.195.211.122` |
| GitHub 仓库 | `https://github.com/DongShan-Hu/Web.git` |
| 服务器仓库目录 | `/home/dongshan/workspace/Web` |
| 发布分支 | `main` |
| 网站文件目录 | `/home/dongshan/workspace/Web/public` |
| 部署方式 | 原生 Nginx 静态网站 |
| Docker | 当前未使用 |

Nginx 直接读取仓库内的 `public/`。因此拉取代码后静态文件会立即更新，不需要执行 `npm install`、`npm run build` 或 Docker 重建。

线上地址：

- 主站：<https://www.yiyeying.com/>（<https://yiyeying.com/> 同样可访问）
- 张红作品集：<https://zhanghong.yiyeying.com/>
- 胡海燕作品集：<https://huhaiyan.yiyeying.com/>

域名统一在 `deploy/domain.env` 配置（当前 `PRIMARY_DOMAIN="yiyeying.com"`，HTTPS 由 Cloudflare 代理提供）。

## 日常更新流程

先通过 SSH 登录服务器，然后进入实际仓库目录：

```sh
cd /home/dongshan/workspace/Web
```

### 1. 更新前检查

```sh
git status --short
git branch --show-current
git remote get-url origin
git log -1 --oneline
```

正常状态应满足：

- `git status --short` 没有输出；
- 当前分支为 `main`；
- 远程地址为 `https://github.com/DongShan-Hu/Web.git`。

如果 `git status --short` 有输出，说明服务器存在未提交修改。此时不要直接拉取，也不要执行 `git reset --hard`，应先确认这些修改是否需要保留。

### 2. 保存旧版本并拉取更新

```sh
OLD_SHA=$(git rev-parse HEAD)
echo "更新前版本：$OLD_SHA"

git switch main
git pull --ff-only origin main

git rev-parse --short HEAD
```

保存终端打印的旧提交 SHA，以便出现问题时回退。`--ff-only` 可以防止服务器意外产生合并提交。

### 3. 检查 Nginx 并验证网站

```sh
nginx -t
systemctl reload nginx

curl -fsS -H "Host: $(. deploy/domain.env && echo $PRIMARY_DOMAIN)" \
  http://127.0.0.1/healthz

curl -I "http://$(. deploy/domain.env && echo $PRIMARY_DOMAIN)/"
curl -I "http://zhang-hong.$(. deploy/domain.env && echo $PRIMARY_DOMAIN)/"
```

预期结果：

- `nginx -t` 显示配置检查成功；
- 健康检查返回 `ok`；
- 主站和作品集返回 `HTTP/1.1 200 OK`。

最后在浏览器打开主站并按 `Ctrl + F5` 强制刷新，检查首页、导航、案例和手机布局。

## 快速确认部署方式

需要再次确认 Nginx 是否仍然读取当前仓库时执行：

```sh
nginx -T 2>/dev/null | grep -F "/home/dongshan/workspace/Web"
```

正常情况下会看到：

```text
root /home/dongshan/workspace/Web/public;
```

当前服务器没有运行本项目的 Docker Compose 服务，因此日常更新不要执行 `docker compose up`。

## 更新失败时

### 服务器有未提交修改

```sh
git status --short
git diff
```

先查看修改内容并保存必要文件，再决定如何处理。不要为了拉取更新而直接强制覆盖。

### `git pull --ff-only` 失败

```sh
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

保留输出并检查分支是否偏离远程。不要改用强制拉取。

### 页面仍显示旧版本

1. 执行 `git rev-parse --short HEAD`，确认服务器已经是目标提交；
2. 执行 `curl -I`，确认网站返回 200；
3. 浏览器按 `Ctrl + F5` 强制刷新；
4. 使用手机流量再次访问，排除本地缓存影响。

## 回退到更新前版本

将下面的 `<旧提交SHA>` 替换为更新前记录的实际值：

```sh
cd /home/dongshan/workspace/Web
git status --short
git switch --detach <旧提交SHA>

nginx -t
systemctl reload nginx
```

回退后重新验证主站和作品集。恢复跟随主分支时执行：

```sh
cd /home/dongshan/workspace/Web
git switch main
git pull --ff-only origin main

nginx -t
systemctl reload nginx
```

## 安全边界

- 不要把服务器密码、SSH 私钥、GitHub 令牌或 `.env` 上传到仓库；
- 不要在未检查 `git status` 的情况下覆盖服务器文件；
- 不要使用 `git reset --hard` 处理未知修改；
- 只有 `nginx -t` 通过后才重载 Nginx；
- 客户站文件位于 `public/sites/`，更新主站时仍需确认客户目录没有意外变化。

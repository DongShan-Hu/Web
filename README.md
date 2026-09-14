# 东山展示 / Web

在自己的服务器上托管多个客户的展示网站：公司介绍、个人简历、作品集与工程项目。主站提供分类与搜索，每个客户使用独立目录；网站内容由你制作并通过 Git 更新。

当前收录 **张红的灯光与合成作品集**，保留图集、视频、网页简历与一页 PDF。原始 PPT、大型源素材与历史压缩包不收录到此仓库。

## 访问结构

```text
http://134.195.211.122.sslip.io/              主站
http://zhang-hong.134.195.211.122.sslip.io/   第一个作品集
http://客户名称.134.195.211.122.sslip.io/     后续展示站点
```

客户使用独立子域名。IP 本身不能直接加客户前缀，暂用 [sslip.io 公共 DNS](https://nip.io/) 将域名解析到服务器公网 IP。主站也可以通过 `http://134.195.211.122/` 访问。

购买域名后将主域名与 `*` 的 A 记录指向服务器，在 Nginx 更新域名规则与 HTTPS，并把 `public/config.js` 的 `customerDomain` 改为你的主域名；客户地址变成 `客户名称.你的域名`。本地预览沿用 `/sites/客户名称/`，文件目录与公网子域名相互独立。

## 本地预览

安装 Node.js 22 或以上，在项目目录运行（无第三方依赖，不需要 `npm install`）：

```sh
npm run dev
```

打开 `http://127.0.0.1:4173`。预览地址只在本机可访问，交付客户需要实际部署。

```sh
npm run check  # 检查目录、脚本语法与图片/视频链接
npm run build  # 检查后生成可上传的 dist/
```

## 添加客户站点

```sh
npm run site:add -- --slug acme --name "客户公司" --type company --summary "公司业务与项目介绍"
```

模板类型：`company` 公司介绍、`resume` 个人简历、`engineering` 工程展示。模板是起步稿，需要填写真实内容与图片。

1. 编辑 `public/sites/acme/` 内的页面与素材。
2. 编辑 `public/sites.json` 内的名称、介绍、标签、封面与日期。
3. 确认完成后把 `listed` 改为 `true`，主站才显示卡片。
4. 运行 `npm run check`，提交 Git，再更新服务器。

`listed: false` 仅隐藏目录卡片，不提供访问保护。尚未公开的内容请保留在本地，不上传服务器。

已有网站也可直接复制到 `public/sites/客户名称/` 并在 `sites.json` 登记。页面内部建议使用相对资源路径，兼容本地目录预览和公网子域名。详见 [客户站点维护](docs/客户站点维护.md)。

## 部署

**已装 Docker 的 Linux 服务器：**

```sh
git clone https://github.com/DongShan-Hu/Web.git
cd Web
cp .env.example .env
sudo docker compose config
sudo docker compose up -d --build
curl -f http://127.0.0.1/healthz
```

开放云平台安全组的 TCP 80 后，用公网 IP 访问。80 已被宝塔或 Nginx 使用时，先读部署文档，不要停掉已有网站。

**当前 Ubuntu 22.04 服务器的原生 Nginx 部署：** 先确认 80 端口状态，再在服务器克隆到 `/opt/dongshan-web`，运行 `bash deploy/install-nginx-ubuntu.sh`。脚本配置主站与客户子域名，并先检查 Nginx 语法再重载。

**宝塔或现有 Nginx：** 主站根目录对应 `public/`，每个客户子域名对应 `public/sites/客户名称/`。Node.js 不需要安装在服务器上。

安装、端口检查、更新、回退、域名与 HTTPS：[服务器部署指南](docs/服务器部署.md)。

## 目录

```text
public/                  唯一对外发布的网站根目录
  index.html             主站
  sites.json             客户站点目录
  sites/zhang-hong/       已有作品集，资源路径保持不变
templates/               三类待编辑的起步模板，不直接发布
scripts/                 本地预览、检查、构建与添加站点
deploy/nginx.conf        Docker 内的 Nginx 配置
Dockerfile, compose.yaml 自有服务器部署配置
docs/                    中文部署与维护说明
```

这是静态托管项目，第一版通过代码维护站点，不包含登录、数据库、在线建站或在线管理后台。Docker 镜像只包含 `public/`；Nginx 提供视频 Range 请求、真实 404 与静态资源缓存。

源代码与作品素材分别保留原有归属；仓库没有授予第三方复制客户作品的许可。

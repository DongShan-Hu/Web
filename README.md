# 码页集 / Web

码页集帮助求职者把简历、项目经历和作品图片整理成专业的个人展示网页，并提供专属链接、访问码和二维码。根目录是服务介绍与资料收集客户端；每个正式交付的客户网站使用独立目录，由同一套模板与客户数据生成并通过 Git 更新。

当前客户端包含服务首页、案例、套餐、五步资料收集、交付预览和发布成功 6 个可演示页面。已交付站点中保留 **张红的灯光与合成作品集**，其图集、视频、网页简历与一页 PDF 均不受主站改版影响。

## 访问结构

```text
http://134.195.211.122.sslip.io/              主站
http://zhang-hong.134.195.211.122.sslip.io/   第一个作品集
http://客户名称.134.195.211.122.sslip.io/     后续展示站点
```

客户使用独立子域名。IP 本身不能直接加客户前缀，暂用 [sslip.io 公共 DNS](https://nip.io/) 将域名解析到服务器公网 IP。主站也可以通过 `http://134.195.211.122/` 访问。

购买域名后**只需修改 `deploy/domain.env` 一处**，再执行 `bash deploy/apply-domain.sh`，Nginx 配置与 `public/config.js` 会一起重新生成。DNS 把主域名与 `*` 的 A 记录指向服务器即可，客户地址变成 `客户名称.你的域名`。本地预览沿用 `/sites/客户名称/`，文件目录与公网子域名相互独立。完整步骤见 [购买域名后](docs/服务器部署.md)。

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

安装、端口检查、域名与 HTTPS：[服务器部署指南](docs/服务器部署.md)。当前云服务器从 GitHub 拉取代码、验证和回退的准确命令见 [GitHub 同步与云服务器更新](docs/GitHub同步更新云服务器.md)。

## 目录

```text
public/                  唯一对外发布的网站根目录
  index.html             码页集客户端入口
  app.js                 六个客户端页面与模拟交互
  styles.css             客户端视觉与响应式样式
  assets/                主站视觉素材
  sites.json             客户站点目录
  sites/
    zhang-hong/          已有作品集，资源路径保持不变
    客户-slug/           后续客户按需创建独立目录
templates/               三类待编辑的起步模板，不直接发布
scripts/                 本地预览、检查、构建与添加站点
deploy/nginx.conf        Docker 内的 Nginx 配置（由 domain.env 生成）
deploy/domain.env        域名唯一配置源，换域名只改这里
deploy/apply-domain.sh   从 domain.env 生成 Nginx 配置与 public/config.js
Dockerfile, compose.yaml 自有服务器部署配置
docs/                    中文部署与维护说明
```

这是静态托管 MVP。主站已采用深靛蓝、蓝紫、折射玻璃与多端作品展示，首页、案例、套餐、资料整理、预览与交付确认保持一致。`public/studio.css` 是主站的强化视觉层，首页提供首屏、作品编排、移动体验三种真实案例截图的交互展示。客户独立网站（包括 `public/sites/zhang-hong/`）不受主站样式影响。

套餐选择、表单与预览仍是本地演示，不代表真实订单或已发布网站。文字输入自动保存在当前浏览器；图片仅记录文件名，未上传。访问码只记录交付偏好，必须接入服务端验证后才有保护能力。正式上线后才能生成真实分享链接与二维码，当前不提供模拟可扫描码。Docker 镜像只包含 `public/`；Nginx 提供视频 Range 请求、真实 404 与静态资源缓存。

主站本轮视觉与交互检查见 [design-qa.md](design-qa.md)，实际浏览器截图位于 `qa/`，不会随 `public/` 发布。

主站的案例与内容区采用开放式编排、错落作品图及少量宋体强调。`public/studio-motion.js` 负责区块入场与首屏设备的轻微指针响应；`public/responsive-preview.js` 提供按需打开的真实作品集预览，可拖动宽度或切换手机、平板、桌面，直接触发客户页面的响应式布局。预览关闭或离开首页时卸载，初次进入首页不会加载整个客户站。系统减少动态偏好会关闭新增位移动画。

源代码与作品素材分别保留原有归属；仓库没有授予第三方复制客户作品的许可。

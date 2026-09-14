#!/usr/bin/env bash
set -euo pipefail

# 在 Ubuntu 22.04 服务器的仓库目录执行：sudo bash deploy/install-nginx-ubuntu.sh
if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo 或 root 执行。" >&2
  exit 1
fi
. /etc/os-release
if [ "${ID:-}" != "ubuntu" ]; then
  echo "此脚本适用于 Ubuntu；其他系统使用部署文档。" >&2
  exit 1
fi
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
if [ ! -f "$repo_root/public/index.html" ] || [ ! -f "$repo_root/public/sites.json" ]; then
  echo "网站文件不完整，请先完整克隆仓库。" >&2
  exit 1
fi
if [[ "$repo_root" == /root/* ]]; then
  echo "仓库在 /root 下，Nginx 无法读取。请克隆到 /home/dongshan/workspace/Web。" >&2
  exit 1
fi
if [[ ! "$repo_root" =~ ^/[a-zA-Z0-9/_-]+$ ]]; then
  echo "部署目录请只使用英文、数字、下划线和短横线。" >&2
  exit 1
fi
if [ ! -d /etc/nginx ]; then
  if ss -lntp | grep -qE ':80[[:space:]]'; then
    echo "80 端口已有其他服务。请按部署文档接入已有服务。" >&2
    exit 1
  fi
  apt-get update
  apt-get install -y nginx
fi
if [ ! -d /etc/nginx/conf.d ]; then
  echo "不是标准 Ubuntu Nginx 安装（可能使用宝塔），请使用部署文档接入。" >&2
  exit 1
fi
nginx_user="$(awk '$1 == "user" { gsub(/;/, "", $2); print $2; exit }' /etc/nginx/nginx.conf)"
if [[ ! "$nginx_user" =~ ^[a-z_][a-z0-9_-]*\$?$ ]] || ! id "$nginx_user" >/dev/null 2>&1; then
  echo "无法确定 Nginx 运行用户，请检查 /etc/nginx/nginx.conf。" >&2
  exit 1
fi
if [[ "$repo_root" == /home/* ]] && ! runuser -u "$nginx_user" -- test -r "$repo_root/public/index.html"; then
  if ! command -v setfacl >/dev/null 2>&1; then
    apt-get update
    apt-get install -y acl
  fi
  parent_dir="$repo_root"
  while [ "$parent_dir" != / ]; do
    if ! runuser -u "$nginx_user" -- test -x "$parent_dir"; then
      setfacl -m "u:$nginx_user:--x" -- "$parent_dir"
    fi
    parent_dir="$(dirname -- "$parent_dir")"
  done
  setfacl -R -P -m "u:$nginx_user:rX" -- "$repo_root/public"
fi
if ! runuser -u "$nginx_user" -- test -r "$repo_root/public/index.html"; then
  echo "Nginx 无法读取 public/index.html，请检查项目目录权限。" >&2
  exit 1
fi
config_path=/etc/nginx/conf.d/dongshan-web.conf
previous_config=''
if [ -e "$config_path" ]; then
  previous_config="$config_path.backup-$(date +%Y%m%d-%H%M%S)"
  cp -- "$config_path" "$previous_config"
fi
sed "s#/usr/share/nginx/html#$repo_root/public#g" "$repo_root/deploy/nginx.conf" > "$config_path"
if ! nginx -t; then
  if [ -n "$previous_config" ]; then cp -- "$previous_config" "$config_path"; else rm -- "$config_path"; fi
  echo '配置检查失败，已恢复原配置，未重载 Nginx。' >&2
  exit 1
fi
systemctl enable nginx
if ! systemctl is-active --quiet nginx; then systemctl start nginx; fi
systemctl reload nginx
curl -fsS -H 'Host: 134.195.211.122.sslip.io' http://127.0.0.1/healthz
curl -fsS -H 'Host: 134.195.211.122.sslip.io' http://127.0.0.1/ >/dev/null
if [ -f "$repo_root/public/sites/zhang-hong/index.html" ]; then
  curl -fsS -H 'Host: zhang-hong.134.195.211.122.sslip.io' http://127.0.0.1/ >/dev/null
  curl -fsS -H 'Host: zhang-hong.134.195.211.122.sslip.io' http://127.0.0.1/resume.html >/dev/null
  echo "张红简历与作品集：http://zhang-hong.134.195.211.122.sslip.io/"
  echo "张红文字简历：http://zhang-hong.134.195.211.122.sslip.io/resume.html"
fi
echo "主站：http://134.195.211.122.sslip.io/"
echo "客户站点地址：客户名称.134.195.211.122.sslip.io（添加客户内容后可访问）"

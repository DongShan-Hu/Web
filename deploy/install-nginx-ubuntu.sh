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
if [ ! -f "$repo_root/public/index.html" ] || [ ! -f "$repo_root/public/sites/zhang-hong/index.html" ]; then
  echo "网站文件不完整，请先完整克隆仓库。" >&2
  exit 1
fi
if [[ "$repo_root" == /root/* ]]; then
  echo "仓库在 /root 下，Nginx 无法读取。请克隆到 /opt/dongshan-web。" >&2
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
config_path=/etc/nginx/conf.d/dongshan-web.conf
if [ -e "$config_path" ]; then
  cp -- "$config_path" "$config_path.backup-$(date +%Y%m%d-%H%M%S)"
fi
sed "s#/usr/share/nginx/html#$repo_root/public#g" "$repo_root/deploy/nginx.conf" > "$config_path"
nginx -t
systemctl enable nginx
if ! systemctl is-active --quiet nginx; then systemctl start nginx; fi
systemctl reload nginx
curl -fsS -H 'Host: 134.195.211.122.sslip.io' http://127.0.0.1/healthz
echo "主站：http://134.195.211.122.sslip.io/"
echo "作品集：http://zhang-hong.134.195.211.122.sslip.io/"

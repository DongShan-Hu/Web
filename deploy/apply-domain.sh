#!/usr/bin/env bash
# 把 deploy/domain.env 渲染成 Nginx 配置与 public/config.js。
# 换域名时只改 deploy/domain.env，然后执行：bash deploy/apply-domain.sh
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"

if [ ! -f "$script_dir/domain.env" ]; then
  echo "缺少 deploy/domain.env。" >&2
  exit 1
fi

# shellcheck disable=SC1091
. "$script_dir/domain.env"

: "${PRIMARY_DOMAIN:?domain.env 缺少 PRIMARY_DOMAIN}"
: "${SERVER_IP:?domain.env 缺少 SERVER_IP}"
PUBLIC_SCHEME="${PUBLIC_SCHEME:-http}"

# 校验：只允许域名/IP 合法字符，防止注入到 Nginx 配置。
if [[ ! "$PRIMARY_DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo "PRIMARY_DOMAIN 含非法字符：$PRIMARY_DOMAIN" >&2
  exit 1
fi
if [[ ! "$SERVER_IP" =~ ^[0-9.]+$ ]]; then
  echo "SERVER_IP 含非法字符：$SERVER_IP" >&2
  exit 1
fi
if [[ ! "$PUBLIC_SCHEME" =~ ^https?$ ]]; then
  echo "PUBLIC_SCHEME 只能是 http 或 https。" >&2
  exit 1
fi

# 主域名转义为 Nginx map 正则（点号需转义）。
escaped_domain="$(printf '%s' "$PRIMARY_DOMAIN" | sed 's/\./\\./g')"

# 目录名含连字符的站点（如 zhang-hong），其子域名为去连字符形态（zhanghong），
# 需要生成一条精确映射；其余子域由下方正则直接映射同名目录。
map_extra=""
if [ -d "$repo_root/public/sites" ]; then
  for dir in "$repo_root/public/sites"/*/ ; do
    [ -d "$dir" ] || continue
    slug="$(basename "$dir")"
    case "$slug" in
      *-*)
        compact="$(printf '%s' "$slug" | tr -d '-')"
        # map 的精确匹配是字面字符串，这里必须用未转义的主域名。
        map_extra="${map_extra}    ${compact}.${PRIMARY_DOMAIN} /usr/share/nginx/html/sites/${slug};
"
        ;;
    esac
  done
fi

# server_name 列表：IP、主域名、www 前缀，以及附加域名。
server_names="$SERVER_IP $PRIMARY_DOMAIN www.$PRIMARY_DOMAIN"
if [ -n "${EXTRA_DOMAINS:-}" ]; then
  extra="$(printf '%s' "$EXTRA_DOMAINS" | tr ',' ' ' | tr -s ' ')"
  server_names="$server_names $extra"
fi

# 客户子域名通配，仅在主域名不是纯 IP 形态时添加。
if [[ "$PRIMARY_DOMAIN" =~ [a-zA-Z] ]]; then
  server_names="$server_names *.$PRIMARY_DOMAIN"
fi

cat > "$repo_root/deploy/nginx.conf" <<EOF
# 此文件由 deploy/apply-domain.sh 从 deploy/domain.env 生成，请勿手工编辑。
# 修改域名请编辑 deploy/domain.env 后重新执行该脚本。
map \$host \$showcase_root {
    default /usr/share/nginx/html;
${map_extra}    ~^(?<site_slug>[a-z0-9]+(?:-[a-z0-9]+)*)\\.${escaped_domain}\$ /usr/share/nginx/html/sites/\$site_slug;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${server_names};
    root \$showcase_root;
    index index.html;
    charset utf-8;
    server_tokens off;
    autoindex off;
    absolute_redirect off;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json image/svg+xml;
    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }
    location ~ /\\. {
        deny all;
    }
    location ~* \\.(?:html|json|css|js)\$ {
        expires -1;
        try_files \$uri =404;
    }
    location ~* \\.(?:webp|png|jpe?g|gif|svg|ico|woff2?|mp4|webm|pdf)\$ {
        expires 1h;
        try_files \$uri =404;
    }
    location / {
        expires -1;
        try_files \$uri \$uri/ =404;
    }
    error_page 404 /404.html;
    location = /404.html {
        internal;
        root /usr/share/nginx/html;
    }
}
EOF

cat > "$repo_root/public/config.js" <<EOF
// 此文件由 deploy/apply-domain.sh 从 deploy/domain.env 生成，请勿手工编辑。
window.SHOWCASE_CONFIG = {
  scheme: '${PUBLIC_SCHEME}',
  customerDomain: '${PRIMARY_DOMAIN}',
  serverIp: '${SERVER_IP}',
  mainSiteUrl: '${PUBLIC_SCHEME}://${PRIMARY_DOMAIN}/',
  customerUrlTemplate: '${PUBLIC_SCHEME}://{slug}.${PRIMARY_DOMAIN}/'
};
EOF

echo "已生成："
echo "  deploy/nginx.conf"
echo "  public/config.js"
echo ""
echo "当前地址："
echo "  主站      ${PUBLIC_SCHEME}://${PRIMARY_DOMAIN}/"
echo "  作品集    ${PUBLIC_SCHEME}://zhanghong.${PRIMARY_DOMAIN}/"
echo "  客户模板  ${PUBLIC_SCHEME}://客户slug.${PRIMARY_DOMAIN}/"

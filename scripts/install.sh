#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

PROJECT_DIR="${PROJECT_DIR:-$HOME/Email-Management-Panel}"
DEFAULT_PORT="3000"
DEFAULT_PROXY_SKIP="n"

install_base_tools() {
  if ! command -v curl >/dev/null 2>&1; then
    $SUDO apt-get update
    $SUDO apt-get install -y curl
  fi

  if ! command -v git >/dev/null 2>&1; then
    $SUDO apt-get update
    $SUDO apt-get install -y git
  fi
}

install_nodejs() {
  if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
    if [[ "$NODE_MAJOR" -ge 20 ]]; then
      echo "检测到 Node.js $(node -v)，跳过安装 Node.js。"
      return
    fi
  fi

  echo "安装 Node.js 20 ..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
  $SUDO apt-get install -y nodejs
}

setup_nginx() {
  local domain="$1"
  local app_port="$2"

  $SUDO apt-get install -y nginx

  $SUDO tee /etc/nginx/sites-available/email-panel >/dev/null <<NGINXEOF
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

  $SUDO ln -sf /etc/nginx/sites-available/email-panel /etc/nginx/sites-enabled/email-panel
  $SUDO nginx -t
  $SUDO systemctl restart nginx
}

install_base_tools

read -rp "服务端口 [${DEFAULT_PORT}]: " APP_PORT
APP_PORT="${APP_PORT:-$DEFAULT_PORT}"

read -rp "WebUI 登录密码（留空则不启用登录）: " WEBUI_PASSWORD_INPUT

read -rp "是否配置 Nginx 反向代理? (y/N): " ENABLE_NGINX
ENABLE_NGINX="${ENABLE_NGINX:-$DEFAULT_PROXY_SKIP}"

DOMAIN=""
if [[ "$ENABLE_NGINX" =~ ^[Yy]$ ]]; then
  read -rp "请输入绑定域名（如 panel.example.com）: " DOMAIN
fi

echo "[1/7] 安装系统构建依赖..."
$SUDO apt-get update
$SUDO apt-get install -y ca-certificates gnupg build-essential

echo "[2/7] 安装 Node.js 运行环境..."
install_nodejs

echo "[3/7] 安装 PM2..."
$SUDO npm i -g pm2

echo "[4/7] 拉取/更新项目..."
if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  git clone https://github.com/laijunquan216/Email-Management-Panel.git "$PROJECT_DIR"
else
  git -C "$PROJECT_DIR" pull --ff-only
fi

echo "[5/7] 安装依赖并构建前端..."
cd "$PROJECT_DIR"
npm install
cd web/MS_OAuth2API_Next_Web
npm install
npm run build
cd "$PROJECT_DIR"

echo "[6/7] 写入 .env 并启动 PM2..."
cat > "$PROJECT_DIR/.env" <<ENVEOF
## WebUI 登录密码（为空则关闭 WebUI 鉴权）
WEBUI_PASSWORD=${WEBUI_PASSWORD_INPUT}

## Redis 配置
USE_REDIS=0
REDIS_HOST=localhost
REDIS_PORT=50002

## 服务端口
PORT=${APP_PORT}
ENVEOF

pm2 delete email-panel >/dev/null 2>&1 || true
pm2 start "$PROJECT_DIR/main.js" --name email-panel
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" >/tmp/pm2-startup.log 2>&1 || true

echo "[7/7] 可选配置..."
if command -v ufw >/dev/null 2>&1; then
  $SUDO ufw allow "$APP_PORT" >/dev/null 2>&1 || true
fi

if [[ "$ENABLE_NGINX" =~ ^[Yy]$ ]]; then
  if [[ -z "$DOMAIN" ]]; then
    echo "你选择了 Nginx 反代，但未输入域名，已跳过 Nginx 配置。"
  else
    setup_nginx "$DOMAIN" "$APP_PORT"
    if command -v ufw >/dev/null 2>&1; then
      $SUDO ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    fi
  fi
fi

echo "========================================"
echo "安装完成 ✅"
echo "项目目录: $PROJECT_DIR"
echo "访问地址: http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo "PM2 状态: pm2 status"
echo "PM2 日志: pm2 logs email-panel"
if [[ "$ENABLE_NGINX" =~ ^[Yy]$ ]] && [[ -n "$DOMAIN" ]]; then
  echo "域名访问: http://${DOMAIN}"
fi
echo "========================================"

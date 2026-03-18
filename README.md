# Email-Management-Panel

邮箱管理面板 + 邮件 API 服务端，支持批量导入邮箱、查看收件箱/垃圾箱、清空邮箱、令牌检测等功能。

- 项目地址：<https://github.com/laijunquan216/Email-Management-Panel>
- 适用场景：在你自己的服务器上部署并管理 Outlook/O365 邮箱账号

---

## 功能概览

### 后端 API
- 获取最新邮件：`/api/mail_new`
- 获取全部邮件：`/api/mail_all`
- 清空邮箱：`/api/process-mailbox`
- 代理测试：`/api/test-proxy`

### WebUI 面板
- 批量导入邮箱（文件上传 / 粘贴）
- 批量导出 / 删除
- 收件箱 / 垃圾箱查看
- 备注字段在线编辑
- 令牌状态检测
- WebUI 密码登录鉴权（可选开启）

---

## 环境变量说明（`.env`）

```env
## WebUI 登录密码（为空则关闭 WebUI 鉴权）
WEBUI_PASSWORD=

## API 调用密码（为空则不校验）
API_PASSWORD=

## Redis 配置
USE_REDIS=0
REDIS_HOST=localhost
REDIS_PORT=50002

## 服务端口
PORT=3000
```

说明：
- `WEBUI_PASSWORD`：控制浏览器面板登录。
- `API_PASSWORD`：控制 API 访问口令（调用 `/api/*` 时传 `password` 字段）。
- 如果你只想保护面板访问，可仅设置 `WEBUI_PASSWORD`。

---

## 服务器安装教程（推荐）

下面以 **Ubuntu 22.04+** 为例：

### 1）安装 Node.js（建议 Node 20 LTS）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### 2）拉取项目

```bash
git clone https://github.com/laijunquan216/Email-Management-Panel.git
cd Email-Management-Panel
```

### 3）安装依赖

```bash
npm install
cd web/MS_OAuth2API_Next_Web && npm install && npm run build
cd ../../
```

> Web 前端打包后会输出到 `web/MS_OAuth2API_Next_Web/dist`，后端会直接托管该目录。

### 4）配置环境变量

```bash
cp .env .env.bak
nano .env
```

按需设置：
- `PORT=3000`
- `WEBUI_PASSWORD=你的面板密码`
- `API_PASSWORD=`（可留空）
- `USE_REDIS=0`（如使用 Redis 再改成 1）

### 5）启动服务（前台）

```bash
npm run start
```

启动后访问：
- `http://你的服务器IP:3000`

---

## 生产环境托管（PM2）

### 安装 PM2

```bash
sudo npm i -g pm2
```

### 启动并设置开机自启

```bash
pm2 start main.js --name email-panel
pm2 save
pm2 startup
```

### 常用命令

```bash
pm2 status
pm2 logs email-panel
pm2 restart email-panel
pm2 stop email-panel
```

---

## Nginx 反向代理（可选）

如果你希望通过域名访问并启用 HTTPS，可使用 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

建议再配合 Certbot 开启 HTTPS。

---

## API 文档

### 1) 获取最新的一封邮件
- 方法：`GET/POST`
- URL：`/api/mail_new`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`、`password`（当 `API_PASSWORD` 配置时需要）

### 2) 获取全部邮件
- 方法：`GET/POST`
- URL：`/api/mail_all`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`、`password`

### 3) 清空邮箱
- 方法：`GET/POST`
- URL：`/api/process-mailbox`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`、`password`

### 4) 代理测试
- 方法：`GET/POST`
- URL：`/api/test-proxy`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`（可传任意字符串）
- 可选参数：`socks5`、`http`、`password`

---

## 常见问题

### Q1：设置了 `WEBUI_PASSWORD` 但打开页面不需要密码？
请确认你访问的是当前服务实例，并清理浏览器 Cookie 后重试。

### Q2：请求 API 返回 401？
检查是否配置了 `API_PASSWORD`；如果已配置，调用 API 时需传 `password` 参数。

### Q3：导入后看不到数据？
检查导入分隔符是否与数据格式一致（默认 `----`）。

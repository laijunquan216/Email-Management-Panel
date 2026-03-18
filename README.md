# Email-Management-Panel

邮箱管理面板 + 邮件 API 服务端（支持 WebUI 登录鉴权）。

- 项目地址：<https://github.com/laijunquan216/Email-Management-Panel>
- 支持系统：Ubuntu / Debian

---

## 一键安装（推荐）

你说得对，手动部署太麻烦。现在直接提供一键脚本：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/laijunquan216/Email-Management-Panel/main/scripts/install.sh)
```

> 如果你是从本地仓库执行，也可以：
>
> ```bash
> chmod +x scripts/install.sh
> ./scripts/install.sh
> ```

### 一键脚本会做什么？

- 自动安装运行依赖（Node.js 20、git、build-essential、nginx、pm2）
- 自动拉取/更新项目代码
- 自动安装后端和前端依赖并打包 Web
- 安装时可交互设置：
  - 服务端口（默认 3000）
  - WebUI 登录密码（可留空）
  - Nginx 反向代理（可选，支持跳过）
- 自动用 PM2 后台常驻启动，并尝试设置开机自启

---

## 环境变量（精简版）

`.env` 示例：

```env
## WebUI 登录密码（为空则关闭 WebUI 鉴权）
WEBUI_PASSWORD=

## Redis 配置
USE_REDIS=0
REDIS_HOST=localhost
REDIS_PORT=50002

## 服务端口
PORT=3000
```

### 关于 `API_PASSWORD`

你提得很对：这个项目当前主要是 WebUI 场景，`API_PASSWORD` 会增加使用复杂度，且容易和邮箱密码概念混淆。**已移除 API_PASSWORD 机制**，只保留 WebUI 登录鉴权（`WEBUI_PASSWORD`）。

---

## 常用运维命令

```bash
pm2 status
pm2 logs email-panel
pm2 restart email-panel
pm2 stop email-panel
```

---

## API 文档

### 1) 获取最新的一封邮件
- 方法：`GET/POST`
- URL：`/api/mail_new`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`

### 2) 获取全部邮件
- 方法：`GET/POST`
- URL：`/api/mail_all`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`

### 3) 清空邮箱
- 方法：`GET/POST`
- URL：`/api/process-mailbox`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`
- 可选参数：`socks5`、`http`

### 4) 代理测试
- 方法：`GET/POST`
- URL：`/api/test-proxy`
- 必填参数：`refresh_token`、`client_id`、`email`、`mailbox`（可传任意字符串）
- 可选参数：`socks5`、`http`

---

## 手动安装（可选）

如果你不想用一键脚本，也可按以下手工部署：

```bash
git clone https://github.com/laijunquan216/Email-Management-Panel.git
cd Email-Management-Panel
npm install
cd web/MS_OAuth2API_Next_Web && npm install && npm run build && cd ../../
npm run start
```

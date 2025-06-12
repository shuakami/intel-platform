# 智瞻情报分析平台 - 部署教程

本教程将指导您如何将"智瞻情报分析平台"项目部署到您自己的服务器上，以便在生产环境中运行。

## 1. 服务器环境要求

在开始之前，请确保您的服务器（推荐使用 Linux, 如 Ubuntu 20.04 或更高版本）已安装以下软件：

*   **Node.js**: v18.x 或更高版本。
*   **Git**: 用于从代码仓库拉取代码。
*   **pnpm**: 本项目使用的包管理器。如果未安装，可通过 `npm install -g pnpm` 进行全局安装。
*   **(推荐) Nginx**: 用于设置反向代理和 HTTPS。
*   **(推荐) PM2**: 一个强大的 Node.js 进程管理器，用于保持应用持续运行。

## 2. 部署步骤

### 第1步：您需要解压项目压缩包

### 第2步：安装依赖

使用 pnpm 安装项目的所有依赖项。

```bash
pnpm install
```

### 第3步：配置环境变量

这是部署中最关键的一步。项目需要特定的环境变量才能正常工作。在项目根目录创建一个名为 `.env.local` 的文件：

```bash
touch .env.local
```

然后，编辑这个文件 (`nano .env.local`)，并填入以下内容。**请务必将占位符替换为您自己的真实值。**

```env
# 外部抓取服务的 API 端点
# 这是应用进行网页抓取所依赖的第三方服务
NEXT_PUBLIC_BASE_API=https://your-scrape-api-endpoint.com

# (可选) 外部抓取服务的 API 密钥
NEXT_PUBLIC_API_KEY=your_scrape_api_key

# 平台自身 LLM Handler 的配置
# 这是应用内置的 AI 功能（规划、综合、问答）所使用的语言模型 API
# 可以是 OpenAI，也可以是任何兼容 OpenAI 格式的 API 服务
LLM_API=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your_llm_api_key
LLM_API_MODEL=gpt-4-turbo
```

### 第4步：构建项目

运行 Next.js 的生产构建命令。这个命令会生成一个经过高度优化的版本，用于生产环境。

```bash
pnpm build
```

构建完成后，您会看到一个 `.next` 目录，其中包含了所有生产环境需要的文件。

### 第5步：启动应用

现在，您可以启动生产服务器了。

```bash
pnpm start
```

默认情况下，应用会启动在 `3000` 端口。您现在应该可以通过 `http://<您的服务器IP>:3000` 访问它。

## 3. (推荐) 使用 PM2 进行进程管理

直接使用 `pnpm start` 启动的应用，会在您关闭 SSH 会话后终止。为了让应用能在后台持续运行，并能自动重启，我们强烈推荐使用 PM2。

### 3.1. 安装 PM2

如果您的服务器上没有安装 PM2，请全局安装它：

```bash
npm install -g pm2
```

### 3.2. 使用 PM2 启动应用

使用以下命令来通过 PM2 启动您的应用：

```bash
pm2 start pnpm --name "zhizhan-platform" -- start
```

*   `--name "zhizhan-platform"`: 为您的应用进程指定一个易于识别的名称。

### 3.3. 常用 PM2 命令

*   `pm2 list`: 查看所有正在运行的应用的状态。
*   `pm2 stop zhizhan-platform`: 停止应用。
*   `pm2 restart zhizhan-platform`: 重启应用。
*   `pm2 logs zhizhan-platform`: 查看应用的实时日志。
*   `pm2 startup`: 设置 PM2 开机自启动。

## 4. (推荐) 配置 Nginx 反向代理

为了使用标准的 80 (HTTP) 和 443 (HTTPS) 端口，并方便地配置 SSL 证书，建议使用 Nginx 作为反向代理。

### 4.1. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 4.2. 配置 Nginx

创建一个新的 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/zhizhan-platform
```

将以下配置粘贴进去，并根据您的域名进行修改：

```nginx
server {
    listen 80;
    server_name your_domain.com; # 替换为您的域名

    location / {
        proxy_pass http://localhost:3000; # 将请求转发到 Next.js 应用
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3. 启用配置并重启 Nginx

```bash
# 创建软链接以启用该配置
sudo ln -s /etc/nginx/sites-available/zhizhan-platform /etc/nginx/sites-enabled/

# 测试 Nginx 配置是否有语法错误
sudo nginx -t

# 重启 Nginx 使配置生效
sudo systemctl restart nginx
```

现在，您应该可以通过您的域名直接访问"智瞻情报分析平台"了。

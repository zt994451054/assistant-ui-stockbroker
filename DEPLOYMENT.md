# 部署文档

本文档记录将 assistant-ui-stockbroker 部署到 VPS 的完整流程。

## 目标环境

| 项目 | 值 |
|------|-----|
| 服务器 | 170.106.192.159 |
| 操作系统 | Ubuntu 22.04 LTS |
| 域名 | assistant-demo.stareraai.cn |
| 反向代理 | Caddy（已预装） |
| 进程管理 | PM2 |
| 部署方式 | 直接部署（无 Docker，最省资源） |

---

## 一、前置检查

SSH 登录并检查服务器资源：

```bash
ssh ubuntu@170.106.192.159
# 密码: iQKub99DChyoyh8u

# 检查内存
free -h

# 检查磁盘
df -h /

# 检查已占用端口
ss -tlnp

# 检查 Node.js
node -v
```

**最低要求：** 可用内存 ≥ 800MB，磁盘剩余 ≥ 2GB。

---

## 二、服务器初始化（首次部署执行一次）

### 2.1 添加 Swap（防止内存峰值 OOM）

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 写入 fstab 使重启后自动挂载
echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab

# 验证
free -h | grep Swap
```

### 2.2 安装 pnpm

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 验证
pnpm -v
```

### 2.3 安装 PM2

```bash
sudo npm install -g pm2

# 验证
pm2 -v
```

---

## 三、部署代码

### 3.1 从本地 rsync 同步代码（推荐，跳过 node_modules）

在**本地机器**执行：

```bash
rsync -avz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='*.log' \
  -e "ssh" \
  /path/to/assistant-ui-stockbroker/ \
  ubuntu@170.106.192.159:~/assistant-ui-stockbroker/
```

### 3.2 或从 GitHub 克隆（仓库有代码时使用）

```bash
git clone https://github.com/zt994451054/assistant-ui-stockbroker.git ~/assistant-ui-stockbroker
cd ~/assistant-ui-stockbroker
```

---

## 四、配置环境变量

### 4.1 后端 `backend/.env`

```bash
cat > ~/assistant-ui-stockbroker/backend/.env << "EOF"
ANTHROPIC_API_KEY=sk-octopus-MQFDBfh6xbr7zNBCgdgPhVUo3gfoRdQROtJneUQR1z4NtxLF
ANTHROPIC_BASE_URL=https://octopus.stareraai.cn
FINANCIAL_DATASETS_API_KEY=5178fe44-0070-496a-8c9a-b41b18889df5
TAVILY_API_KEY=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
EOF
```

### 4.2 前端 `frontend/.env.local`

```bash
cat > ~/assistant-ui-stockbroker/frontend/.env.local << "EOF"
LANGGRAPH_API_URL=http://localhost:2024
NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=stockbroker
EOF
```

---

## 五、安装依赖 & 构建

```bash
export PNPM_HOME="/home/ubuntu/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

cd ~/assistant-ui-stockbroker

# 安装所有依赖
pnpm install

# 构建前端（生产模式，约 1-2 分钟）
cd frontend && pnpm build && cd ..
```

> ⚠️ 生产环境必须执行 `pnpm build`，**不要用 `pnpm dev`**（dev 模式内存占用 3x）。

---

## 六、启动服务（PM2）

```bash
# 启动 LangGraph 后端（端口 2024，仅本地访问）
pm2 start "npx @langchain/langgraph-cli dev --port 2024" \
  --name "langgraph" \
  --cwd ~/assistant-ui-stockbroker/backend \
  --interpreter none

# 启动 Next.js 前端（端口 3000）
pm2 start "node_modules/.bin/next start -p 3000" \
  --name "nextjs" \
  --cwd ~/assistant-ui-stockbroker/frontend \
  --interpreter none

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

验证服务状态：

```bash
pm2 list
curl -s -o /dev/null -w "Next.js: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "LangGraph: %{http_code}\n" http://localhost:2024/info
```

---

## 七、配置 Caddy 反向代理

编辑 `/etc/caddy/Caddyfile`：

```bash
sudo tee -a /etc/caddy/Caddyfile << "EOF"

assistant-demo.stareraai.cn {
    encode zstd gzip
    reverse_proxy localhost:3000
}
EOF
```

验证并重载：

```bash
# 验证配置语法
sudo caddy validate --config /etc/caddy/Caddyfile

# 热重载（不中断现有连接）
sudo systemctl reload caddy
```

> Caddy 会自动申请并续期 HTTPS 证书，无需手动配置。

---

## 八、更新部署（后续迭代）

### 代码有变更时

在**本地**执行 rsync 同步，然后服务器上重新构建并重启：

```bash
# 本地同步代码
rsync -avz \
  --exclude='node_modules' --exclude='.next' --exclude='.git' \
  -e "ssh" \
  /path/to/assistant-ui-stockbroker/ \
  ubuntu@170.106.192.159:~/assistant-ui-stockbroker/

# 服务器上执行
ssh ubuntu@170.106.192.159 << 'ENDSSH'
export PNPM_HOME="/home/ubuntu/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
cd ~/assistant-ui-stockbroker/frontend
pnpm build && pm2 restart nextjs
ENDSSH
```

### 仅后端变更时

```bash
ssh ubuntu@170.106.192.159 "pm2 restart langgraph"
```

---

## 九、日常运维

```bash
# 查看所有服务状态
pm2 list

# 查看实时日志
pm2 logs langgraph
pm2 logs nextjs

# 查看最近 100 行日志
pm2 logs --lines 100

# 重启单个服务
pm2 restart langgraph
pm2 restart nextjs

# 重启所有服务
pm2 restart all

# 查看内存/CPU 使用
pm2 monit

# 查看系统内存
free -h
```

---

## 十、架构说明

```
用户浏览器
    │ HTTPS (443)
    ▼
Caddy (assistant-demo.stareraai.cn)
    │ HTTP (localhost:3000)
    ▼
Next.js 前端 (PM2: nextjs)
    │ HTTP (localhost:2024)
    ▼
LangGraph 后端 (PM2: langgraph)
    │ HTTPS
    ▼
octopus.stareraai.cn:8782 (AI Proxy → Claude Sonnet)
    │
    ▼
Financial Datasets API + Tavily Search API
```

---

## 十一、资源占用参考

部署后实测数据：

| 服务 | 内存占用 |
|------|---------|
| LangGraph backend | ~220MB |
| Next.js (production) | ~75MB |
| Swap 使用 | ~108MB |
| 系统总内存已用 | ~1.6GB / 3.6GB |
| 剩余可用 | ~1.8GB |

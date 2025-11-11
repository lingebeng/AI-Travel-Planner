# AI Travel Planner - Docker 部署文档

## 📋 目录
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细配置说明](#详细配置说明)
- [运行和管理](#运行和管理)
- [故障排查](#故障排查)
- [API 密钥获取指南](#api-密钥获取指南)

---

## 🖥️ 系统要求

### 最低配置
- **操作系统**: Linux, macOS, Windows 10/11 (with WSL2)
- **Docker**: 20.10.0 或更高版本
- **Docker Compose**: 2.0.0 或更高版本
- **内存**: 最少 2GB RAM
- **磁盘空间**: 最少 5GB 可用空间

### 推荐配置
- **内存**: 4GB+ RAM
- **CPU**: 2 核心以上
- **磁盘空间**: 10GB+ 可用空间

### 安装 Docker

#### macOS
```bash
# 下载并安装 Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop

# 验证安装
docker --version
docker-compose --version
```

#### Linux (Ubuntu/Debian)
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker-compose --version
```

#### Windows
```bash
# 下载并安装 Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop
# 需要启用 WSL2

# 在 PowerShell 中验证安装
docker --version
docker-compose --version
```

---

## 🚀 快速开始

### 1. 克隆项目（如果还没有）
```bash
git clone <repository-url>
cd AI-Travel-Planner
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入真实的 API 密钥
# macOS/Linux
nano .env

# Windows
notepad .env
```

**必须配置的环境变量**：
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEEPSEEK_API_KEY=sk-xxxxx
AMAP_API_KEY=xxxxx
```

> ⚠️ **重要**: 不要将真实的 API 密钥提交到 Git 仓库！`.env` 文件已在 `.gitignore` 中。

### 3. 构建并启动服务

```bash
# 构建镜像并启动所有服务
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

### 4. 访问应用

- **前端应用**: http://localhost
- **后端 API**: http://localhost:5001

---

## ⚙️ 详细配置说明

### 环境变量详解

#### Supabase 配置
```env
# Supabase 项目 URL
SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Key（后端使用）
# ⚠️ 注意：这是服务端密钥，拥有完全权限，请妥善保管
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

获取方式：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 `Settings` → `API`
4. 复制 `URL` 和 `service_role` 密钥

#### DeepSeek API 配置
```env
# DeepSeek API Key（用于 AI 行程生成和预算分析）
DEEPSEEK_API_KEY=sk-xxxxx
```

获取方式：
1. 访问 [DeepSeek 平台](https://platform.deepseek.com)
2. 注册/登录账号
3. 进入 `API Keys` 页面
4. 创建新的 API Key

#### 高德地图 API 配置
```env
# 高德地图 API Key（用于地理位置和路线规划）
AMAP_API_KEY=xxxxx
```

获取方式：
1. 访问 [高德开放平台](https://console.amap.com)
2. 注册/登录账号
3. 进入 `应用管理` → `我的应用`
4. 创建新应用并获取 Key

### Docker Compose 服务说明

#### 后端服务 (backend)
- **端口**: 5001
- **镜像**: Python 3.12-slim
- **依赖**: ffmpeg, portaudio (用于语音处理)
- **健康检查**: 每 30 秒检查一次服务状态

#### 前端服务 (frontend)
- **端口**: 80
- **镜像**: Node 18 (构建) + Nginx (运行)
- **功能**:
  - 提供静态文件服务
  - 反向代理 API 请求到后端
  - SPA 路由支持

---

## 🔧 运行和管理

### 基本命令

#### 启动服务
```bash
# 前台运行（查看实时日志）
docker-compose up

# 后台运行
docker-compose up -d

# 重新构建并启动
docker-compose up --build -d
```

#### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止服务并删除 volumes（清理所有数据）
docker-compose down -v
```

#### 查看状态和日志
```bash
# 查看所有服务状态
docker-compose ps

# 查看所有服务日志
docker-compose logs

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend

# 查看最后 100 行日志
docker-compose logs --tail=100
```

#### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
```

#### 进入容器
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入前端容器
docker-compose exec frontend sh

# 以 root 用户进入
docker-compose exec -u root backend bash
```

#### 查看资源使用
```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
docker system df
```

### 更新应用

#### 方式一：完全重建
```bash
# 停止并删除容器
docker-compose down

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up --build -d
```

#### 方式二：仅重启服务
```bash
# 如果只修改了代码，没有修改 Dockerfile
docker-compose restart
```

#### 方式三：更新特定服务
```bash
# 只重建后端
docker-compose up -d --build backend

# 只重建前端
docker-compose up -d --build frontend
```

### 数据备份

```bash
# 导出后端数据卷
docker run --rm -v ai-travel-planner_backend-temp:/data -v $(pwd):/backup alpine tar czf /backup/backend-temp-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v ai-travel-planner_backend-temp:/data -v $(pwd):/backup alpine tar xzf /backup/backend-temp-backup.tar.gz -C /data
```

---

## 🐛 故障排查

### 常见问题

#### 1. 端口已被占用
**错误信息**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**解决方案**:
```bash
# 查看占用端口的进程
# macOS/Linux
lsof -i :80
lsof -i :5001

# Windows
netstat -ano | findstr :80
netstat -ano | findstr :5001

# 修改 docker-compose.yml 中的端口映射
# 例如将 "80:80" 改为 "8080:80"
```

#### 2. 容器无法启动
**症状**: 容器一启动就退出

**解决方案**:
```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 查看容器退出原因
docker-compose ps

# 检查环境变量是否正确配置
cat .env

# 重新构建镜像
docker-compose build --no-cache
```

#### 3. API 请求失败
**错误**: 前端无法连接到后端

**解决方案**:
```bash
# 检查后端服务是否正常运行
docker-compose ps backend

# 检查后端健康状态
curl http://localhost:5001/api/health

# 查看后端日志
docker-compose logs -f backend

# 检查网络连接
docker network inspect ai-travel-planner_app-network
```

#### 4. 语音识别失败
**错误**: "无法访问麦克风" 或 "语音识别失败"

**解决方案**:
- 确保浏览器有麦克风权限
- 使用 HTTPS 或 localhost（浏览器安全策略要求）
- 检查 ffmpeg 是否正确安装：
  ```bash
  docker-compose exec backend ffmpeg -version
  ```

#### 5. 数据库连接失败
**错误**: "Failed to connect to Supabase"

**解决方案**:
```bash
# 检查环境变量
docker-compose exec backend printenv | grep SUPABASE

# 验证 Supabase 连接
docker-compose exec backend python -c "
from app.config import Config
print(f'URL: {Config.SUPABASE_URL}')
print(f'Key: {Config.SUPABASE_SERVICE_KEY[:20]}...')
"

# 测试网络连接
docker-compose exec backend ping -c 3 supabase.com
```

#### 6. 构建失败
**错误**: 依赖安装失败或构建超时

**解决方案**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 使用国内镜像源（中国大陆用户）
# 在 backend/Dockerfile 中添加：
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 在 frontend/Dockerfile 中添加：
RUN npm config set registry https://registry.npmmirror.com

# 重新构建
docker-compose build --no-cache
```

### 健康检查

```bash
# 检查所有服务健康状态
docker-compose ps

# 手动测试后端健康检查
curl http://localhost:5001/api/health

# 手动测试前端
curl http://localhost/
```

### 日志级别调整

```bash
# 在 docker-compose.yml 中添加环境变量
environment:
  - LOG_LEVEL=DEBUG  # 可选：DEBUG, INFO, WARNING, ERROR

# 重启服务
docker-compose up -d
```

---

## 🔑 API 密钥获取指南

### 1. Supabase 配置

**步骤**：
1. 访问 https://supabase.com
2. 注册并创建新项目
3. 等待项目初始化完成（约 2 分钟）
4. 进入项目 Dashboard
5. 点击左侧 `Settings` → `API`
6. 复制以下信息：
   - `Project URL` → `SUPABASE_URL`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

**数据库设置**：
项目已包含必要的数据库迁移脚本：
- `backend/database/migrations/create_itineraries_table.sql`
- `backend/database/migrations/create_expenses_table.sql`

在 Supabase Dashboard 中执行这些 SQL 脚本：
1. 进入 `SQL Editor`
2. 创建新查询
3. 复制粘贴 SQL 内容
4. 点击 `Run` 执行

### 2. DeepSeek API

**步骤**：
1. 访问 https://platform.deepseek.com
2. 注册账号（支持手机号/邮箱）
3. 完成实名认证（中国大陆用户）
4. 进入 `API Keys` 管理页面
5. 点击 `创建 API Key`
6. 复制生成的密钥 → `DEEPSEEK_API_KEY`

**定价**：
- 新用户赠送免费额度
- 按 token 使用量计费
- 详见：https://platform.deepseek.com/pricing

### 3. 高德地图 API

**步骤**：
1. 访问 https://console.amap.com
2. 注册开发者账号
3. 完成个人/企业认证
4. 进入 `应用管理` → `我的应用`
5. 点击 `创建新应用`
6. 填写应用信息：
   - 应用名称：AI Travel Planner
   - 应用类型：Web 服务
7. 添加 Key：
   - 服务平台：Web 服务
   - IP 白名单：可不填（开发环境）
8. 复制生成的 Key → `AMAP_API_KEY`

**配额说明**：
- 个人开发者：每日 1 万次调用
- 企业用户：可申请更高配额

---

## 📊 性能优化

### 生产环境优化

#### 1. 使用环境变量优化
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - FLASK_ENV=production
      - WORKERS=4  # Gunicorn workers
      - THREADS=2  # 每个 worker 的线程数
```

#### 2. 资源限制
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

#### 3. 使用 Gunicorn（生产环境）
修改 `backend/Dockerfile` 的启动命令：
```dockerfile
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "run:app"]
```

### 监控和日志

#### 集成日志收集
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🚢 部署到生产环境

### 阿里云部署示例

#### 1. 准备服务器
```bash
# 连接到服务器
ssh user@your-server-ip

# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### 2. 上传代码
```bash
# 方式一：使用 Git
git clone <repository-url>
cd AI-Travel-Planner

# 方式二：使用 SCP
scp -r AI-Travel-Planner user@your-server-ip:/home/user/
```

#### 3. 配置环境变量
```bash
# 创建 .env 文件
nano .env
# 填入生产环境的 API 密钥
```

#### 4. 构建镜像
```bash
# 选项一：在服务器上构建
docker-compose build

# 选项二：使用 GitHub Actions 自动构建推送到阿里云容器镜像仓库
# 参考：https://help.aliyun.com/document_detail/257112.html
```

#### 5. 启动服务
```bash
docker-compose up -d
```

#### 6. 配置域名和 HTTPS
```bash
# 使用 Nginx 作为反向代理
# 使用 Let's Encrypt 获取 SSL 证书
```

### 容器镜像仓库

推送到阿里云容器镜像仓库：
```bash
# 登录
docker login --username=your-username registry.cn-hangzhou.aliyuncs.com

# 标记镜像
docker tag ai-travel-planner-backend:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-backend:latest
docker tag ai-travel-planner-frontend:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-frontend:latest

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-backend:latest
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-frontend:latest
```

---

## 📝 维护建议

### 定期维护任务

1. **每周**：
   - 检查容器运行状态
   - 查看错误日志
   - 监控资源使用

2. **每月**：
   - 更新 Docker 镜像
   - 清理未使用的镜像和容器
   - 备份重要数据

3. **每季度**：
   - 更新依赖包版本
   - 审查安全漏洞
   - 性能优化评估

### 清理命令
```bash
# 清理未使用的镜像
docker image prune -a

# 清理所有未使用的资源
docker system prune -a --volumes

# 查看空间占用
docker system df
```

---

## 🆘 获取帮助

- **项目文档**: 查看 `README.md` 和 `CLAUDE.md`
- **Issue 报告**: 在 GitHub 仓库提交 Issue
- **Docker 文档**: https://docs.docker.com
- **Docker Compose 文档**: https://docs.docker.com/compose

---

## 📄 许可证

本项目包含的所有代码和文档遵循项目根目录的 LICENSE 文件。

**API 密钥注意事项**：
- 所有 API 密钥必须妥善保管
- 不要将密钥提交到版本控制系统
- 定期轮换 API 密钥以提高安全性
- 在提交项目前，请确保 API 密钥有效期至少 3 个月

---

*最后更新：2025-11-09*

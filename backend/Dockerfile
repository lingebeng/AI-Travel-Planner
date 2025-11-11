# 使用 Python 3.12 官方镜像作为基础镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# 安装系统依赖（ffmpeg 用于音频处理，portaudio 用于语音识别）
RUN apt-get update && apt-get install -y \
    ffmpeg \
    portaudio19-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt ./

# 安装 Python 依赖
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# 复制应用代码
COPY . .

# 创建临时目录用于语音文件
RUN mkdir -p /tmp/ai_travel_planner

# 暴露端口
EXPOSE 5001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5001/api/health', timeout=5)" || exit 1

# 启动命令
CMD ["python", "run.py"]

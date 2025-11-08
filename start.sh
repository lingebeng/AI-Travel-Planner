#!/bin/bash

# AI Travel Planner 启动脚本

echo "🚀 启动 AI Travel Planner..."

# 启动后端
echo "📦 启动后端服务..."
cd backend
source .venv/bin/activate 2>/dev/null || python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -q
python run.py &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID) - http://localhost:5001"

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID) - http://localhost:5173"

echo ""
echo "🎉 AI Travel Planner 已成功启动!"
echo "📍 前端地址: http://localhost:5173"
echo "📍 后端API: http://localhost:5001"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
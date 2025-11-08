@echo off
echo ========================================
echo    AI Travel Planner 启动脚本
echo ========================================

echo.
echo [1] 启动后端服务...
cd backend
call .venv\Scripts\activate.bat 2>nul || (
    echo 创建虚拟环境...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)
echo 安装后端依赖...
pip install -r requirements.txt -q
echo 启动后端服务器...
start /B python run.py
echo 后端已启动: http://localhost:5001

timeout /t 3 /nobreak >nul

echo.
echo [2] 启动前端服务...
cd ..\frontend
echo 安装前端依赖...
call npm install --silent
echo 启动前端服务器...
start /B npm run dev
echo 前端已启动: http://localhost:5173

echo.
echo ========================================
echo    启动成功！
echo    前端: http://localhost:5173
echo    后端: http://localhost:5001
echo ========================================
echo.
echo 按任意键退出...
pause >nul
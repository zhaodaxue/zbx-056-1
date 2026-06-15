@echo off
echo ========================================
echo 爆破振动监测点布设复核系统
echo ========================================
echo.
echo 正在启动 Docker 容器...
echo.

docker-compose up -d --build

echo.
echo ========================================
echo 服务启动完成！
echo 前端地址: http://localhost:8080
echo 后端地址: http://localhost:3002
echo ========================================
pause

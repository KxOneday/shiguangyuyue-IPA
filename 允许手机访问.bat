@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在放行 8123 端口（允许手机/局域网访问）...
netsh advfirewall firewall add rule name="Daoshuri Web (8123)" dir=in action=allow protocol=TCP localport=8123
if %errorlevel%==0 (
  echo.
  echo ✓ 已放行成功！现在手机可以访问了。
) else (
  echo.
  echo ✗ 放行失败。请确认：右键本文件 - 以管理员身份运行。
)
echo.
pause

@echo off
echo ==========================================
echo   Chess Professional Edition
echo   Starting Python AI Server...
echo ==========================================
echo.
cd python
pip install flask flask-cors >nul 2>&1
echo Server: http://localhost:5000
echo.
python server.py
pause
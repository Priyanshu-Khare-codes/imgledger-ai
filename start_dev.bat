@echo off
REM HH Goa Task 3 — Start both backend and frontend
REM Usage: start_dev.bat

echo.
echo ==========================================
echo    HH GOA TASK 3 — Starting Servers
echo ==========================================
echo.
echo [1/2] Starting FastAPI backend on :8000 ...
start "HH-GOA-Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Next.js frontend on :3000 ...
start "HH-GOA-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers launching in separate windows.
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:3000
echo   API docs : http://localhost:8000/docs
echo.

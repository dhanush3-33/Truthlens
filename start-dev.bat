@echo off
REM TruthLens AI — start backend + frontend together
start "TruthLens Backend" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\python.exe app.py"
timeout /t 3 /nobreak >nul
start "TruthLens Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Backend:  http://127.0.0.1:5001
echo Frontend: http://localhost:5173

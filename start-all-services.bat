@echo off
echo Starting CodeArena Services...
echo.

echo [1/7] Starting API Gateway...
start "API Gateway" cmd /k "cd services\api-gateway && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/7] Starting Submission Service...
start "Submission Service" cmd /k "cd services\submission-service && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/7] Starting WebSocket Service...
start "WebSocket Service" cmd /k "cd services\websocket-service && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/7] Starting AI Review Service...
start "AI Review Service" cmd /k "cd services\ai-review-service && npm run dev"
timeout /t 3 /nobreak >nul

echo [5/7] Starting Problem Service (Java)...
start "Problem Service" cmd /k "cd services\problem-service && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [6/7] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo All services started!
echo.
echo Access Points:
echo - Frontend: http://localhost:5174
echo - API Gateway: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul

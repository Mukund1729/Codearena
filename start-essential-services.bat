@echo off
echo Starting Essential CodeArena Services...
echo.

echo [1/3] Starting API Gateway (includes Supabase Auth)...
start "API Gateway" cmd /k "cd services\api-gateway && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Problem Service (Java) - for Codeforces/Kattis problems...
start "Problem Service" cmd /k "cd services\problem-service && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Essential services started!
echo.
echo Access Points:
echo - Frontend: http://localhost:5174
echo - API Gateway: http://localhost:3000
echo.
echo Note: Problems are fetched from Codeforces and Kattis APIs
echo Authentication uses Supabase
echo.
echo Press any key to close this window...
pause >nul

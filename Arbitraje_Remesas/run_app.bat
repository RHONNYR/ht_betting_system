@echo off
echo ==========================================
echo Iniciando Sistema de Arbitraje y Remesas
echo ==========================================
cd /d "%~dp0"
call ..\.venv\Scripts\activate.bat
echo Inicializando y sembrando base de datos...
python seed.py
echo.
echo Iniciando servidor web FastAPI...
echo Puedes acceder en tu PC ingresando a: http://localhost:8000
echo O en tu celular usando la IP local de tu PC (ejemplo: http://192.168.x.x:8000)
echo ==========================================
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause

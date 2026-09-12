@echo off
chcp 65001 >nul
title SavoirIA Dubbing - Serveur
cd /d "%~dp0"

:: Si venv n'existe pas, lancer l'installation
if not exist "venv\Scripts\activate.bat" (
    echo Environnement non installé. Démarrage de l'installateur...
    call Installer_Windows.bat
)

:: Vérifier si le serveur tourne déjà sur le port 7860
netstat -ano | findstr :7860 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Démarrage du studio d'IA en arrière-plan...
    start "" /B venv\Scripts\python.exe app.py
    
    :: Attente de la disponibilité du port 7860 (jusqu'à 25s)
    for /L %%i in (1,1,25) do (
        timeout /t 1 /nobreak >nul
        netstat -ano | findstr :7860 >nul 2>&1
        if !ERRORLEVEL! EQU 0 goto READY
    )
)

:READY
start http://localhost:7860

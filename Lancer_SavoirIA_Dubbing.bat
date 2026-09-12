@echo off
chcp 65001 >nul
title SavoirIA Dubbing - Serveur
cd /d "%~dp0"

:: Si venv n'existe pas, lancer l'installation
if not exist "venv\Scripts\activate.bat" (
    echo Environnement non installé. Démarrage de l'installateur...
    call Installer_Windows.bat
)

:: Empêcher la mise en veille Windows pendant le traitement
:: powercfg /change monitor-timeout-ac 0 = écran ne s'éteint jamais (sur secteur)
:: powercfg /change standby-timeout-ac 0 = pas de mise en veille (sur secteur)
echo [SavoirIA] Désactivation de la mise en veille Windows...
powercfg /change standby-timeout-ac 0 2>nul
powercfg /change standby-timeout-dc 0 2>nul

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
echo [SavoirIA] Le Mac/PC restera éveillé tant que l'application tourne.
echo [SavoirIA] Utilisez Arreter_SavoirIA_Dubbing.bat pour arrêter et restaurer la veille.

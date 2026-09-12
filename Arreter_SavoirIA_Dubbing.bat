@echo off
chcp 65001 >nul
title SavoirIA Dubbing - Arrêt
echo =======================================================
echo     ⚡ Arrêt de SavoirIA Dubbing en cours...
echo =======================================================
echo.

setlocal enabledelayedexpansion
set FOUND=0

:: Recherche du processus écoutant sur le port 7860
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7860') do (
    set PID=%%a
    if not "!PID!"=="0" (
        echo Fermeture du processus PID !PID!...
        taskkill /F /PID !PID! >nul 2>&1
        set FOUND=1
    )
)

if "%FOUND%"=="1" (
    echo [OK] SavoirIA Dubbing a été arrêté proprement.
) else (
    echo [INFO] Aucun processus SavoirIA Dubbing n'était en cours d'exécution.
)

:: Restaurer les paramètres de veille par défaut
echo Restauration des paramètres de veille...
powercfg /change standby-timeout-ac 30 2>nul
powercfg /change standby-timeout-dc 15 2>nul
echo [OK] Paramètres de veille restaurés (30min secteur / 15min batterie).

echo.
timeout /t 3 >nul

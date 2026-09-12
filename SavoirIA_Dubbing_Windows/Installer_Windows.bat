@echo off
chcp 65001 >nul
title SavoirIA Dubbing - Installation Windows
echo =======================================================
echo     ⚡ SavoirIA Dubbing - Installateur Windows
echo            Créé par Ghislain Muntu
echo =======================================================
echo.

:: 1. Vérification de Python
echo [1/5] Vérification de Python...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Python n'est pas détecté sur votre système !
    echo Veuillez installer Python 3.10, 3.11 ou 3.12 depuis :
    echo https://www.python.org/downloads/
    echo Assurez-vous de cocher "Add python.exe to PATH" lors de l'installation.
    pause
    exit /b 1
)
python --version
echo [OK] Python est disponible.
echo.

:: 2. Vérification de FFmpeg
echo [2/5] Vérification de FFmpeg...
where ffmpeg >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] FFmpeg n'est pas détecté. Tentative d'installation via Windows Package Manager (winget)...
    winget install -e --id Gyan.FFmpeg >nul 2>&1
    where ffmpeg >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ATTENTION] FFmpeg n'a pas pu être installé automatiquement.
        echo Veuillez installer FFmpeg manuellement ou exécuter dans PowerShell :
        echo   winget install Gyan.FFmpeg
    ) else (
        echo [OK] FFmpeg a été installé avec succès !
    )
) else (
    echo [OK] FFmpeg est déjà installé.
)
echo.

:: 3. Création de l'environnement virtuel (venv)
echo [3/5] Configuration de l'environnement virtuel Python...
if not exist "venv" (
    python -m venv venv
    echo [OK] Environnement venv créé.
) else (
    echo [OK] Environnement venv déjà existant.
)
echo.

:: 4. Installation des dépendances
echo [4/5] Installation des dépendances IA (Gradio, Whisper, F5-TTS, Gemini, etc.)...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip

:: Détection GPU NVIDIA pour PyTorch CUDA
echo Détection de carte graphique NVIDIA...
where nvidia-smi >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [NVIDIA DÉTECTÉ] Installation de PyTorch avec accélération matérielle CUDA...
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
) else (
    echo [CPU DÉTECTÉ] Installation de PyTorch version CPU...
    pip install torch torchaudio
)

pip install -r requirements.txt
echo [OK] Toutes les dépendances sont installées avec succès.
echo.

:: 5. Création du raccourci sur le Bureau
echo [5/5] Création du raccourci sur votre Bureau...
call Creer_Raccourci_Bureau.bat >nul 2>&1
echo [OK] Raccourci créé sur le Bureau !
echo.

echo =======================================================
echo    🎉 Installation terminée avec succès !
echo    Vous pouvez maintenant lancer l'application avec :
echo    - "Lancer_En_Arriere_Plan.vbs" (Sans fenêtre noire)
echo    - Ou via le raccourci sur votre Bureau !
echo =======================================================
pause

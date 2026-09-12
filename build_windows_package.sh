#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/SavoirIA_Dubbing_Windows"
ZIP_NAME="SavoirIA_Dubbing_Windows.zip"

echo "🔨 Préparation du package Windows..."
rm -rf "$DIST_DIR" "$PROJECT_DIR/$ZIP_NAME"
mkdir -p "$DIST_DIR"

# Copie des fichiers sources et scripts Windows
cp "$PROJECT_DIR/app.py" "$DIST_DIR/"
cp "$PROJECT_DIR/main.py" "$DIST_DIR/"
cp "$PROJECT_DIR/utils.py" "$DIST_DIR/"
cp "$PROJECT_DIR/requirements.txt" "$DIST_DIR/"
cp "$PROJECT_DIR/Installer_Windows.bat" "$DIST_DIR/"
cp "$PROJECT_DIR/Lancer_SavoirIA_Dubbing.bat" "$DIST_DIR/"
cp "$PROJECT_DIR/Lancer_En_Arriere_Plan.vbs" "$DIST_DIR/"
cp "$PROJECT_DIR/Arreter_SavoirIA_Dubbing.bat" "$DIST_DIR/"
cp "$PROJECT_DIR/Creer_Raccourci_Bureau.bat" "$DIST_DIR/"
cp "$PROJECT_DIR/GUIDE_INSTALLATION_WINDOWS.md" "$DIST_DIR/"
cp "$PROJECT_DIR/icon.ico" "$DIST_DIR/"

# Création des dossiers vides nécessaires
mkdir -p "$DIST_DIR/input" "$DIST_DIR/temp" "$DIST_DIR/output"

# Compression en archive ZIP
echo "📦 Compression dans $ZIP_NAME..."
cd "$PROJECT_DIR"
zip -r -q "$ZIP_NAME" "SavoirIA_Dubbing_Windows"

echo "✅ Archive Windows prête : $PROJECT_DIR/$ZIP_NAME"

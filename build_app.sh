#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="SavoirIA Dubbing.app"
APP_DIR="$PROJECT_DIR/$APP_NAME"

echo "🔨 Construction de $APP_NAME..."

# Nettoyage précédent
rm -rf "$APP_DIR" "$PROJECT_DIR/SavoirIA_Dubbing_Mac.zip"

# Arborescence macOS .app
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# 1. Copie de l'icône
if [ -f "$PROJECT_DIR/AppIcon.icns" ]; then
    cp "$PROJECT_DIR/AppIcon.icns" "$APP_DIR/Contents/Resources/AppIcon.icns"
fi

# 2. Fichier PkgInfo
echo -n "APPL????" > "$APP_DIR/Contents/PkgInfo"

# 3. Info.plist
cat << 'EOF' > "$APP_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.ghislainmuntu.savoiria-dubbing</string>
    <key>CFBundleName</key>
    <string>SavoirIA Dubbing</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>3.0</string>
    <key>CFBundleVersion</key>
    <string>3.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

# 4. Script Launcher
cat << 'EOF' > "$APP_DIR/Contents/MacOS/launcher"
#!/bin/bash
PROJECT_DIR="/Users/gmuntu/Downloads/dubbing_project"
cd "$PROJECT_DIR" || exit 1

# Vérifier si l'application tourne déjà sur le port 7860
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7860 2>/dev/null || true)

if [ "$STATUS_CODE" != "200" ]; then
    mkdir -p "$PROJECT_DIR/temp"
    
    # Lancer l'app Python en arrière-plan
    nohup "$PROJECT_DIR/venv/bin/python" "$PROJECT_DIR/app.py" > "$PROJECT_DIR/temp/app_gui.log" 2>&1 &
    APP_PID=$!
    
    # caffeinate empêche la mise en veille tant que le processus Python tourne
    # -d : empêche le display sleep
    # -i : empêche le idle sleep
    # -m : empêche le disk sleep
    # -s : empêche le system sleep (même couvercle fermé, sur secteur)
    # -u : simule une activité utilisateur
    # -w : se termine quand le processus spécifié se termine
    nohup caffeinate -dimsu -w $APP_PID > /dev/null 2>&1 &
    
    # Attendre que le serveur démarre
    for i in {1..30}; do
        sleep 1
        STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7860 2>/dev/null || true)
        if [ "$STATUS_CODE" = "200" ]; then
            break
        fi
    done
fi

# Ouvrir directement dans le navigateur par défaut de macOS
open "http://localhost:7860"

# Notification macOS élégante
osascript -e 'display notification "Studio de doublage ouvert sur http://localhost:7860 ! Le Mac restera éveillé pendant le traitement." with title "SavoirIA Dubbing" subtitle "Créé par Ghislain Muntu"' 2>/dev/null || true
EOF

chmod +x "$APP_DIR/Contents/MacOS/launcher"

# 5. Création de l'archive ZIP téléchargeable
echo "📦 Compression de l'application en ZIP..."
cd "$PROJECT_DIR"
zip -r -q "SavoirIA_Dubbing_Mac.zip" "$APP_NAME"

echo "✅ Application macOS prête : $APP_DIR"
echo "✅ Archive ZIP prête : $PROJECT_DIR/SavoirIA_Dubbing_Mac.zip"

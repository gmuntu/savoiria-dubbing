#!/bin/bash
echo "Arrêt de SavoirIA Dubbing en cours..."
PIDS=$(lsof -ti :7860 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
        kill -9 $pid 2>/dev/null || true
        echo "✅ Processus arrêté (PID: $pid)"
    done
    echo "✅ SavoirIA Dubbing a été arrêté proprement."
    osascript -e 'display notification "Le serveur SavoirIA Dubbing a été arrêté." with title "SavoirIA Dubbing"' 2>/dev/null || true
else
    echo "ℹ️ SavoirIA Dubbing n'était pas en cours d'exécution."
fi

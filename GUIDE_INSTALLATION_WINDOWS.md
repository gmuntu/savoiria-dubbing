# ⚡ SavoirIA Dubbing — Guide d'Installation Windows
> **Créé par Ghislain Muntu**

Ce guide vous accompagne pas à pas pour installer et utiliser **SavoirIA Dubbing** sur n'importe quel ordinateur sous Windows 10 ou Windows 11.

---

## 1. Prérequis (En 2 minutes)

1. **Python 3.10, 3.11 ou 3.12** :
   * Téléchargez Python depuis le site officiel : [https://www.python.org/downloads/](https://www.python.org/downloads/)
   * ⚠️ **IMPORTANT LORS DE L'INSTALLATION** : Cochez impérativement la case en bas :  
     ☑️ **"Add python.exe to PATH"** *(Ajouter Python aux variables d'environnement)*.

2. **FFmpeg** (Outil multimédia requis) :
   * Ouvrez un terminal PowerShell ou Invite de commandes et tapez simplement :
     ```cmd
     winget install Gyan.FFmpeg
     ```
   * *(L'installateur automatique `Installer_Windows.bat` tente également de l'installer pour vous).*

---

## 2. Installation en 1 Clic

1. Décompressez l'archive **`SavoirIA_Dubbing_Windows.zip`** dans le dossier de votre choix (par exemple dans `C:\SavoirIA_Dubbing` ou vos Documents).
2. Faites un double-clic sur :
   👉 **`Installer_Windows.bat`**
3. L'installateur va :
   * Configurer l'environnement virtuel.
   * Détecter si vous possédez une carte graphique **NVIDIA** pour activer l'accélération matérielle **CUDA** (sinon mode CPU optimisé).
   * Télécharger et installer toutes les bibliothèques d'intelligence artificielle nécessaires.
   * Créer automatiquement une icône raccourci **SavoirIA Dubbing** sur votre Bureau !

---

## 3. Lancer l'Application (100% en Arrière-Plan)

Pour démarrer votre studio de doublage sans aucune fenêtre noire :
* Double-cliquez simplement sur le raccourci sur votre Bureau ou sur :
  👉 **`Lancer_En_Arriere_Plan.vbs`**

L'application démarre discrètement en arrière-plan et votre navigateur web s'ouvre directement sur :
🌐 **http://localhost:7860**

---

## 4. Arrêter l'Application

Quand vous avez terminé votre session de doublage :
* Double-cliquez simplement sur :
  👉 **`Arreter_SavoirIA_Dubbing.bat`**
* Cela libère immédiatement la mémoire vive et coupe le serveur proprement.

---

## 5. Mode 100% Hors-Ligne & Local
* Dans l'interface, choisissez **Ollama (Local gemma4:e2b)** comme moteur de traduction et déposez votre vidéo locale pour un traitement 100% privé sans connexion Internet.

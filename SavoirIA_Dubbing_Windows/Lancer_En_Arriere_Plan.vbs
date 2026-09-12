' Lanceur Silencieux en Arrière-Plan pour Windows (Sans fenêtre noire)
' SavoirIA Dubbing - Créé par Ghislain Muntu

Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory

' Exécution masquée (0 = fenêtre cachée, False = exécution asynchrone)
WshShell.Run "cmd.exe /c Lancer_SavoirIA_Dubbing.bat", 0, False

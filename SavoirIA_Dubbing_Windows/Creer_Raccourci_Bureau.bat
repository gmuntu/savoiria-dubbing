@echo off
set SCRIPT="%TEMP%\CreateShortcut_%RANDOM%.vbs"
set TARGET=%~dp0Lancer_En_Arriere_Plan.vbs
set ICON=%~dp0icon.ico
set SHORTCUT=%USERPROFILE%\Desktop\SavoirIA Dubbing.lnk

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%SHORTCUT%" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "wscript.exe" >> %SCRIPT%
echo oLink.Arguments = """%TARGET%""" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "SavoirIA Dubbing - Doublage Vidéo par IA" >> %SCRIPT%
if exist "%ICON%" (
    echo oLink.IconLocation = "%ICON%, 0" >> %SCRIPT%
)
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

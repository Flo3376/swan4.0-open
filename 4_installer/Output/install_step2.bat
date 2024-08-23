@echo off
setlocal

:: Définir le chemin de téléchargement par défaut
set DOWNLOAD_PATH=%UserProfile%\Downloads

:: Afficher la liste des sources de packages
echo Listing current package sources...
winget source list
echo.

:: Installation de Node.js
echo Step 2: Installing Node.js LTS...
winget install OpenJS.NodeJS.LTS
echo.

:: Installation de Git
echo Step 3: Installing Git...
winget install --id Git.Git -e --source winget
echo.

:: Installation du .NET SDK
echo Step 4: Installing .NET SDK 8...
winget install Microsoft.DotNet.SDK.8
echo.

:: Installation de FFmpeg
echo Step 5: Installing FFmpeg...
winget install ffmpeg
echo.

:: Installation de Sound Exchange (Sox)
echo Step 6: Installing Sound Exchange (Sox)...
:: Exécuter l'installateur téléchargé
"%DOWNLOAD_PATH%\sox-14.4.2-win32.exe"
echo.

:: Finalisation de l'installation et mise à jour du chemin système pour FFmpeg
echo Step 7: Finalizing installation and updating system PATH...
setx Path "%Path%;%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-7.0.2-full_build\bin"

:: Pause pour permettre à l'utilisateur de voir les résultats
echo Press any key to continue...
pause

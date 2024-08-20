@echo off
setlocal

:: Vérifier si un argument a été fourni
if "%~1"=="" (
    echo Aucun argument fourni, démarrage à l'étape 1.
    set STEP=1
) else (
    set STEP=%1
    echo Argument fourni, démarrage à l'étape %STEP%.
)

:: Diriger vers l'étape appropriée
goto :STEP_%STEP%

:STEP_1
echo.
echo Étape 1: Création du répertoire de téléchargement...
echo.
:: Création du répertoire ou seront stocké les fichier à télécharger
if not exist ".\download" mkdir ".\download"
call :NEXT_STEP 2
goto :EOF

:STEP_2
echo Étape 2: Téléchargement de node js...
::powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi -OutFile .\download\node-v20.11.1-x64.msi"
curl -L -o .\download\node-v20.11.1-x64.msi "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"



call :NEXT_STEP 3
goto :EOF

:STEP_3
echo Étape 3: Téléchargement de Sound Exchange...
::powershell -Command "Invoke-WebRequest -Uri https://netcologne.dl.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2-win32.exe?viasf=1 -OutFile .\download\sox-14.4.2-win32.exe"
curl -L -o .\download\sox-14.4.2-win32.exe "https://netcologne.dl.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2-win32.exe?viasf=1"
call :NEXT_STEP 4
goto :EOF

:STEP_4
echo Étape 4: Téléchargement de Microsoft dotnet-sdk-8...
::powershell -Command "Invoke-WebRequest -Uri https://download.visualstudio.microsoft.com/download/pr/d1adccfa-62de-4306-9410-178eafb4eeeb/48e3746867707de33ef01036f6afc2c6/dotnet-sdk-8.0.303-win-x64.exe -OutFile .\download\dotnet-sdk-8.0.303-win-x64.exe"
curl -L -o .\download\dotnet-sdk-8.0.303-win-x64.exe "https://download.visualstudio.microsoft.com/download/pr/d1adccfa-62de-4306-9410-178eafb4eeeb/48e3746867707de33ef01036f6afc2c6/dotnet-sdk-8.0.303-win-x64.exe"
call :NEXT_STEP 5
goto :EOF

:STEP_5
echo Étape 5: Téléchargement de Git...
::powershell -Command "Invoke-WebRequest -Uri https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe -OutFile .\download\Git-2.46.0-64-bit.exe"
curl -L -o .\download\Git-2.46.0-64-bit.exe "hhttps://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe"

call :NEXT_STEP 6
goto :EOF


:STEP_6
echo Étape 6: Installation de NodeJS...
set INSTALL_DIR=%~dp0download
start /wait msiexec /i ".\%INSTALL_DIR%\node-v20.11.1-x64.msi" /qn
call :NEXT_STEP 7
goto :EOF

:STEP_7
echo Étape 7: Installation de Git...
start /wait ".\%INSTALL_DIR%\Git-2.46.0-64-bit.exe" /SILENT
call :NEXT_STEP 8
goto :EOF

:STEP_8
echo Étape 8: Installation du SDK .NET...
start /wait ".\%INSTALL_DIR%\dotnet-sdk-8.0.303-win-x64.exe" /SILENT
call :NEXT_STEP 9
goto :EOF

:STEP_9
echo Étape 9: Installation de Sound Exchange...
start /wait ".\%INSTALL_DIR%\sox-14.4.2-win32.exe" /S
call :NEXT_STEP 10
goto :EOF

:STEP_10
echo Étape 10: Installation d FFMPEG...
winget install ffmpeg
call :NEXT_STEP 11
goto :EOF

:STEP_10
echo Étape 10: Installation d FFMPEG...
winget install ffmpeg
call :NEXT_STEP 11
goto :EOF

:STEP_11
echo Étape 11: Installation d FFMPEG...
winget install ffmpeg
goto :EOF

:NEXT_STEP
set /A STEP=%1
echo Passage à l'étape %STEP%...
goto :STEP_%STEP%

:EOF
endlocal
echo Processus terminé.
pause

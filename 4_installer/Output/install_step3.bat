@echo off
setlocal

:: Définir les chemins d'accès nécessaires
set APP_DIR=%CD%
set TMP_DIR=%APP_DIR%\TempRepo

:: Vérifier et créer un répertoire temporaire si nécessaire
if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"

:: Cloner le dépôt Git dans le répertoire temporaire
echo Cloning the repository into a temporary directory...
cd /d "%TMP_DIR%"
git clone https://github.com/Flo3376/swan4.0-open.git .

:: Copier les fichiers du dépôt temporaire vers le répertoire final
echo Copying files to the final directory...
xcopy "%TMP_DIR%\*" "%APP_DIR%" /E /H /K /Y

:: Nettoyer le répertoire temporaire
echo Cleaning up temporary directory...
cd /d "%APP_DIR%"
rd /s /q "%TMP_DIR%"

:: Copier les fichiers de configuration dans leurs emplacements appropriés
echo Copying configuration files...
copy /Y "%APP_DIR%\core\config\config-example.yaml" "%APP_DIR%\core\config\config.yaml"
copy /Y "%APP_DIR%\core\data\cookies-example.json" "%APP_DIR%\core\data\cookies.json"
copy /Y "%APP_DIR%\core\config\lexicon-example.yaml" "%APP_DIR%\core\config\lexicon.yaml"

:: Configurer le répertoire sécurisé pour Git
echo Configuring the secure directory for Git...
git config --global --add safe.directory "%APP_DIR%"

:: Installer les packages npm nécessaires
echo Installing npm packages...
npm install

:: Indiquer que le processus est terminé et mettre en pause pour permettre à l'utilisateur de voir les résultats
echo Process completed.
pause

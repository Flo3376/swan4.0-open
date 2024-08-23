@echo off
setlocal
:: Définir les chemins d'accès nécessaires
set "APP_DIR=%~dp0"

:: Message d'avertissement sur les opérations destructives
echo ATTENTION: This operation is destructive. If the files are already in place, any modifications will be lost and Swan will return to its initial state.
echo Please confirm each file replacement to proceed.
echo Press any key to continue...
pause > nul

:: Copier les fichiers de configuration dans leurs emplacements appropriés avec demande de confirmation pour chaque fichier
echo Copying configuration files...
copy "%APP_DIR%core\config\config-exemple.yaml" "%APP_DIR%core\config\config.yaml"
copy "%APP_DIR%core\data\cookies-exemple.json" "%APP_DIR%core\data\cookies.json"
copy "%APP_DIR%core\config\lexique-exemple.yaml" "%APP_DIR%core\config\lexique.yaml"

echo Process completed.
pause

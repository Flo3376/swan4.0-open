@echo off
setlocal
:: Définir les chemins d'accès nécessaires
set APP_DIR=%CD%

:: Message d'avertissement sur les opérations destructives
echo ATTENTION: This operation is destructive. If the files are already in place, any modifications will be lost and Swan will return to its initial state.
echo Please confirm each file replacement to proceed.
echo Press any key to continue...
pause > nul

:: Copier les fichiers de configuration dans leurs emplacements appropriés avec demande de confirmation pour chaque fichier
echo Copying configuration files...
copy "\core\config\config-example.yaml" "\core\config\config.yaml"
copy "\core\data\cookies-example.json" "\core\data\cookies.json"
copy "\core\config\lexicon-example.yaml" "\core\config\lexicon.yaml"

echo Process completed.
pause

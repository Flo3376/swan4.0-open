@echo off
echo Exécution de swan.js en tant qu'administrateur...
pushd %~dp0
node swan.js
echo.
echo Script terminé, appuyez sur une touche pour fermer.
popd
pause > nul

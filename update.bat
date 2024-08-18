@echo off
echo Exécution de swan.js en tant qu'administrateur...
pushd %~dp0
git pull
echo.
echo Script terminé, appuyez sur une touche pour fermer.
popd
pause > nul

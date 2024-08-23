@echo off
echo Lancement de la M.A.J...
pushd %~dp0
git pull
echo.
echo Maj Finie, appuyez sur une touche pour fermer.
popd
pause > nul

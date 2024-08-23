@echo off
:: Mise à jour des sources de packages avec Winget
echo Step 1: Updating package sources...
echo.

:: Affichage de la liste des sources actuelles
echo Current package sources:
winget source list
echo.

:: Mise à jour des sources de packages
echo Updating package sources...
winget source update
echo.

:: Affichage de la liste des sources après mise à jour
echo Updated package sources:
winget source list
echo.

:: Pause pour permettre à l'utilisateur de voir les résultats
echo Press any key to continue...
pause
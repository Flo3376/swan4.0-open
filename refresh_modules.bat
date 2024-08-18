@echo off
echo Suppression du repertoire node_modules...
rmdir /s /q node_modules
echo Repertoire node_modules supprime.

echo Installation des packages npm...
npm install
echo Installation terminee.
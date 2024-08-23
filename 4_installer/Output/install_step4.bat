@echo off
setlocal

:: Chemin où le batch est situé, utilisé pour les raccourcis
set APP_DIR=%~dp0

:: Créer des raccourcis sur le bureau
call :CreateShortcut "Configurer Swan" "%USERPROFILE%\Desktop\Configure Swan.lnk" "%windir%\explorer.exe" "http://127.0.0.1:2954/config" "%APP_DIR%icon_11.ico"
call :CreateShortcut "Personaliser Swan" "%USERPROFILE%\Desktop\Personalize Swan.lnk" "%windir%\explorer.exe" "http://127.0.0.1:2954/lexique" "%APP_DIR%icon_11.ico"
call :CreateShortcut "Swan" "%USERPROFILE%\Desktop\Swan.lnk" "%comspec%" "/c ""%APP_DIR%launch_swan.bat""" "%APP_DIR%icon_10.ico"
call :CreateShortcut "Update" "%USERPROFILE%\Desktop\Update.lnk" "%comspec%" "/c ""%APP_DIR%update.bat""" "%APP_DIR%icon_01.ico"

exit /b

:CreateShortcut
setlocal
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\temp.vbs"
echo sLinkFile = "%~2" >> "%temp%\temp.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\temp.vbs"
echo oLink.TargetPath = "%~3" >> "%temp%\temp.vbs"
echo oLink.Arguments = "%~4" >> "%temp%\temp.vbs"
echo oLink.IconLocation = "%~5" >> "%temp%\temp.vbs"
echo oLink.Save >> "%temp%\temp.vbs"
cscript /nologo "%temp%\temp.vbs"
del "%temp%\temp.vbs"
endlocal
goto :eof
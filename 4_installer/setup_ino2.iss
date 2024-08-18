; Second Installateur - Configuration et déploiement
#define IDPPath ""
#include IDPPath + "idp.iss"

[Setup]
AppName=Swan4.0
AppVersion=1.0
DefaultDirName={userdocs}\Swan4.0
OutputBaseFilename=Swan_install_part2
SetupIconFile=icons\icon_00.ico
PrivilegesRequired=admin  
DefaultGroupName=Swan4.0
LanguageDetectionMethod=locale  

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "icons\icon_11.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icons\icon_01.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icons\icon_10.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icons\icon_00.ico"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{tmp}\TempRepo";  
Name: "{app}";  

[Run]
Filename: "{cmd}"; Parameters: "/C git clone https://github.com/Flo3376/swan4.0-open.git ""{tmp}\TempRepo"""; WorkingDir: "{app}"; StatusMsg: "Clonage du dépôt dans un répertoire temporaire...";
Filename: "{cmd}"; Parameters: "/C xcopy ""{tmp}\TempRepo\*"" ""{app}"" /E /H /K /Y"; WorkingDir: "{app}"; StatusMsg: "Copie des fichiers vers le répertoire final...";
Filename: "{cmd}"; Parameters: "/C cd /d ""{app}"" && npm install"; WorkingDir: "{app}"; StatusMsg: "Installation des packages npm...";

Filename: "{cmd}"; Parameters: "/C copy /Y ""{app}\core\config\config-exemple.yaml"" ""{app}\core\config\config.yaml"""; WorkingDir: "{app}\core\config"; Flags: runhidden; Description: "Copie du fichier de configuration"; StatusMsg: "Configuration de l'application..."
Filename: "{cmd}"; Parameters: "/C copy /Y ""{app}\core\data\cookies-exemple.json"" ""{app}\core\data\cookies.json"""; WorkingDir: "{app}\core\data"; Flags: runhidden; Description: "Copie du fichier de configuration"; StatusMsg: "Configuration de l'application..."
Filename: "{cmd}"; Parameters: "/C copy /Y ""{app}\core\config\lexique-exemple.yaml"" ""{app}\core\config\lexique.yaml"""; WorkingDir: "{app}\core\data"; Flags: runhidden; Description: "Copie du fichier de configuration"; StatusMsg: "Configuration de l'application..."
Filename: "{cmd}"; Parameters: "/C git config --global --add safe.directory ""{app}\Swan4.0"""; WorkingDir: "{app}\Swan4.0"; StatusMsg: "Configuration du répertoire sécurisé pour Git..."; Flags: runhidden

[Icons]
Name: "{commondesktop}\Configurer Swan"; Filename: "{win}\explorer.exe"; Parameters: """http://127.0.0.1:2954/config"""; IconFilename: "{app}\icon_11.ico"; Comment: "Configurer Swan";
Name: "{commondesktop}\Personaliser Swan"; Filename: "{win}\explorer.exe"; Parameters: """http://127.0.0.1:2954/lexique"""; IconFilename: "{app}\icon_11.ico"; Comment: "Personaliser Swan";
Name: "{commondesktop}\Swan"; Filename: "{cmd}"; Parameters: "/C ""{app}\launch_swan.bat"""; WorkingDir: "{app}"; IconFilename: "{app}\icon_10.ico"; Comment: "Swan";
Name: "{commondesktop}\Update"; Filename: "{cmd}"; Parameters: "/C ""{app}\update.bat"""; WorkingDir: "{app}"; IconFilename: "{app}\icon_01.ico"; Comment: "Update";
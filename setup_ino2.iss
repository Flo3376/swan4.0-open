; Second Installateur - Configuration et déploiement
#define IDPPath "4_installer\"
#include IDPPath + "\idp.iss"

[Setup]
AppName=Swan4.0
AppVersion=1.0
DefaultDirName={pf}\Swan4.0
OutputBaseFilename=Swan_install_part2
SetupIconFile=4_installer\icons\icon_00.ico
PrivilegesRequired=admin  
DefaultGroupName=Swan4.0
LanguageDetectionMethod=locale  

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "4_installer\icons\icon_11.ico"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{tmp}\TempRepo";  
Name: "{app}";  

[Run]
Filename: "{cmd}"; Parameters: "/C git clone https://github.com/Flo3376/swan4.0-open.git ""{tmp}\TempRepo"""; WorkingDir: "{app}"; StatusMsg: "Clonage du dépôt dans un répertoire temporaire...";
Filename: "{cmd}"; Parameters: "/C xcopy ""{tmp}\TempRepo\*"" ""{app}"" /E /H /K /Y"; WorkingDir: "{app}"; StatusMsg: "Copie des fichiers vers le répertoire final...";
Filename: "{cmd}"; Parameters: "/C cd /d ""{app}"" && npm install"; WorkingDir: "{app}"; StatusMsg: "Installation des packages npm...";

[Icons]
Name: "{commondesktop}\Configurer Swan"; Filename: "{win}\explorer.exe"; Parameters: """http://127.0.0.1:2954"""; IconFilename: "{app}\icon_11.ico"; Comment: "Configurer Swan";

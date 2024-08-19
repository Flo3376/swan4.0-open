; Premier Installateur - Prérequis
#define IDPPath ""
#include IDPPath + "idp.iss"

[Setup]
AppName=Swan4.0
AppVersion=1.0
DefaultDirName={userdocs}\Swan4.0
OutputBaseFilename=Swan_install_part1
SetupIconFile=icons\icon_00.ico
PrivilegesRequired=admin  
DefaultGroupName=Swan4.0
LanguageDetectionMethod=locale  

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "icons\icon_11.ico"; DestDir: "{app}"; Flags: ignoreversion

[Code]
procedure InitializeWizard();
begin
  idpAddFile('https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi', ExpandConstant('{tmp}\node-v20.11.1-x64.msi'));
  idpAddFile('https://deac-riga.dl.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2-win32.exe', ExpandConstant('{tmp}\sox-14.4.2-win32.exe'));
  idpAddFile('https://download.visualstudio.microsoft.com/download/pr/d1adccfa-62de-4306-9410-178eafb4eeeb/48e3746867707de33ef01036f6afc2c6/dotnet-sdk-8.0.303-win-x64.exe', ExpandConstant('{tmp}\dotnet-sdk-8.0.303-win-x64.exe'));
  idpAddFile('https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe', ExpandConstant('{tmp}\Git-2.46.0-64-bit.exe'));
  idpDownloadAfter(wpReady);
end;

[Run]
Filename: "msiexec.exe"; Parameters: "/i ""{tmp}\node-v20.11.1-x64.msi"" /qn"; StatusMsg: "Installation de Node.js..."; Flags: runhidden;
Filename: "{tmp}\Git-2.46.0-64-bit.exe"; Parameters: "/SILENT"; StatusMsg: "Installation de Git...";
Filename: "{tmp}\dotnet-sdk-8.0.303-win-x64.exe"; Parameters: "/SILENT"; StatusMsg: "Installation du SDK .NET...";
Filename: "{tmp}\sox-14.4.2-win32.exe"; Parameters: "/SILENT"; StatusMsg: "Installation de Sound Exchange...";
Filename: "{cmd}"; Parameters: "/C winget install ffmpeg"; WorkingDir: "{app}";  StatusMsg: "Installation de FFmpeg...";
Filename: "{cmd}"; Parameters: "/C setx Path ""%Path%;%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-7.0.2-full_build\bin"""; WorkingDir: "{app}"; Flags: runhidden; StatusMsg: "Installation de FFmpeg...";

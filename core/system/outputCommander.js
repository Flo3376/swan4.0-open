const path = require('path');
const { exec } = require('child_process');
// Importe le module 'colors' pour permettre la coloration des textes dans la console, améliorant la lisibilité des logs.
const colors = require('colors');
class InputController {
    constructor() { }

    // Dispatcher pour gérer les commandes entrantes
    handleCommand(command) {
        const { output, action, key, text, x, y, button, direction, amount, duration } = command;

        const exePath = './../exe/key_tape/keytape.exe';
        // Résolvez le chemin absolu de l'exécutable
        const resolvedExePath = path.resolve(__dirname, exePath);
        let cmd_command = '';

        switch (output) {
            case 'keyboard':
                // Définissez le chemin relatif de l'exécutable


                // Utilisez des guillemets pour encapsuler le chemin du fichier en cas d'espaces
                cmd_command = `"${resolvedExePath}" "action=${action}" input=${key} "delay=${duration}"`;
                console.log(cmd_command);

                exec(cmd_command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Erreur de sortie: ${stderr}`);
                        return;
                    }
                    console.log(`Sortie standard: ${stdout}`);
                });
                break;
            case 'mouse':
                // Utilisez des guillemets pour encapsuler le chemin du fichier en cas d'espaces
                cmd_command = `"${resolvedExePath}" "action=${action}" input=${key} "delay=${duration}"`;
                console.log(cmd_command);

                exec(cmd_command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Erreur de sortie: ${stderr}`);
                        return;
                    }
                    console.log(`Sortie standard: ${stdout}`);
                });
                break;
            default:
                console.error("Invalid output type");
        }
    }



}

module.exports = InputController;
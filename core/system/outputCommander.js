const path = require('path');
const { spawn } = require('child_process');
const killPID = require('tree-kill');
const axios = require('axios');
const colors = require('colors');

const KEY_SENDER = path.resolve(__dirname, '../exe/megatron/megatron.exe');
let PIDS = {};

function my_console(title = '', text = '', titleColor = 'gray', textColor = 'gray', indentation = 0) {

     // Ne rien faire si le texte est vide ou ne contient que des espaces
     if (text.trim() === '') {
        return;
    }
    
    // Créer la chaîne d'indentation pour le titre
    const titleIndent = ' '.repeat(indentation);
    
    // Créer l'indentation supplémentaire pour le texte
    const textIndent = ' '.repeat(indentation + 4); // 4 espaces supplémentaires pour le texte

    // Colorer le titre et l'afficher
    if (colors[titleColor]) {
        console.log(colors[titleColor](`${titleIndent}${title}`));
    } else {
        console.log(`${titleIndent}${title}`); // Si la couleur n'existe pas, on affiche sans couleur
    }

    // Diviser le texte en lignes et ajouter l'indentation
    const lines = text.split('\n');
    lines.forEach(line => {
        if (colors[textColor]) {
            console.log(colors[textColor](`${textIndent}${line}`));
        } else {
            console.log(`${textIndent}${line}`);
        }
    });
}

class OutputCommander {
    constructor() {}

    start(id) {
        return new Promise((resolve, reject) => {
            this.kill(id); // Assurez-vous qu'aucune instance précédente ne tourne

            let child = spawn(KEY_SENDER, []);

            child.stdout.on('data', data => {
                my_console("De Mégatron :",data.toString(),"cyan","white",4);
                //console.log(colors.cyan(`       Output from Megatron: `));
                //console.log(colors.cyan(`       ${data.toString()}`));
            });

            child.stderr.on('data', data => {
                my_console("De Mégatron :",data.toString(),"cyan","red",4);
                //console.error(`Error from ${id}: ${data.toString()}`);
            });

            child.on('close', code => {
                console.log(`Process ${id} closed with code ${code}`);
                delete PIDS[id]; // Supprime le PID de la liste une fois le processus terminé
            });

            child.on('error', err => {
                console.error(`Error starting process ${id}: ${err}`);
                reject(err);
            });

            PIDS[id] = child.pid;
            console.log(`Started process ${id} with PID ${child.pid}`);
            resolve(child.pid);
        });
    }

    kill(id) {
        let pid = PIDS[id];
        if (pid) {
            try {
                killPID(pid, err => {
                    if (err) {
                        console.error(`Failed to kill process ${id}: ${err}`);
                    } else {
                        console.log(`Process ${id} killed successfully`);
                        delete PIDS[id];
                    }
                });
            } catch (ex) {
                console.error(`Error killing process ${id}: ${ex}`);
            }
        } else {
            console.log(`No process found for ID ${id}`);
        }
    }

    handleCommand(command,action_code) {
        //console.log (command);
        const { output, type, action_input, duration } = command;
        const class_action="keysender";
        //const action_code=action_code;
        const params = new URLSearchParams({ type, action_input, duration,class_action ,action_code}).toString();
        const url = `http://127.0.0.1:2953?${params}`;
        
        axios.get(url)
            .then(response => {
                console.log(`Received response: ${response.data}`.green);
            })
            .catch(error => {
                console.error(`Error sending request: ${error.message}`.red);
            });
    }
}

module.exports = OutputCommander;
/*
console.log(colors.red('Ce texte est en rouge'));
console.log(colors.green('Ce texte est en vert'));
console.log(colors.yellow('Ce texte est en jaune'));
console.log(colors.blue('Ce texte est en bleu'));
console.log(colors.magenta('Ce texte est en magenta'));
console.log(colors.cyan('Ce texte est en cyan'));
console.log(colors.white('Ce texte est en blanc'));
console.log(colors.gray('Ce texte est en gris'));*/
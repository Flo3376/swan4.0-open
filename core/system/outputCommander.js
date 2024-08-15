const path = require('path');
const { spawn } = require('child_process');
const killPID = require('tree-kill');
const axios = require('axios');
const colors = require('colors');

const KEY_SENDER = path.resolve(__dirname, '../exe/key_sender/key_sender.exe');
let PIDS = {};

class OutputCommander {
    constructor() {}

    start(id) {
        return new Promise((resolve, reject) => {
            this.kill(id); // Assurez-vous qu'aucune instance précédente ne tourne

            let child = spawn(KEY_SENDER, []);

            child.stdout.on('data', data => {
                console.log(colors.cyan(`       Output from ${id}: `));
                console.log(colors.cyan(`       ${data.toString()}`));
            });

            child.stderr.on('data', data => {
                console.error(`Error from ${id}: ${data.toString()}`);
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

    handleCommand(command) {
        const { output, type, action_input, duration } = command;
        const params = new URLSearchParams({ output, type, action_input, duration }).toString();
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
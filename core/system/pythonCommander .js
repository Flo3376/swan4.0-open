const { exec } = require('child_process');
// Importe le module 'colors' pour permettre la coloration des textes dans la console, améliorant la lisibilité des logs.
const colors = require('colors');
class InputController {
    constructor() { }

    // Dispatcher pour gérer les commandes entrantes
    handleCommand(command) {
        const { output, action, key, text, x, y, button, direction, amount,duration } = command;

        switch (output) {
            case 'keyboard':
                this.runPythonScript(`test.py "${key}" "${duration}"`);
                //this.handleKeyboard(action, key, text);
                break;
            case 'mouse':
                this.handleMouse(action, x, y, button, direction, amount,duration);
                break;
            default:
                console.error("Invalid output type");
        }
    }

    // Gérer les actions de clavier
    handleKeyboard(action, key, text) {
        switch (action) {
            case 'pressKey':
                this.runPythonScript('press_key.py', [key]);
                break;
            case 'sendCombination':
                // Assumption: key is an array converted to a space-separated string
                this.runPythonScript('press_combination.py', [key.join(' ')]);
                break;
            case 'sendText':
                this.runPythonScript('send_text.py', [text]);
                break;
            case 'holdKey':
                // Assumption: text is the duration in ms
                this.runPythonScript('hold_key.py', [key, text]);
                break;
            default:
                console.error("Invalid keyboard action");
        }
    }

    // Gérer les actions de souris
    handleMouse(action, x, y, button, direction, amount,duration) {
        switch (action) {
            case 'move':
                this.runPythonScript('move_mouse.py', [x, y]);
                break;
            case 'click':
                if(duration=="short")
                {
                    this.runPythonScript('click_mouse.py', [button]);
                }
                else if(duration=="long")
                    {
                        this.runPythonScript(`click_mouse_long.py ${button}`);
                    }
                
                break;
            case 'scroll':
                this.runPythonScript('scroll_mouse.py', [direction, amount]);
                break;
            case 'drag':
                this.runPythonScript('drag_mouse.py', [x, y]);
                break;
            default:
                console.error("Invalid mouse action");
        }
    }
    // Function to run a Python script with arguments
    runPythonScript(scriptName) {
        const cmd = `python ./core/python/${scriptName}`;
        console.log(colors.magenta(`Commande envoyé : ${cmd}`));
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            console.log(`Stdout: ${stdout}`);
        });
    }

}

module.exports = InputController;
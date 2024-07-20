const robot = require("robotjs");

class InputController {
    constructor() { }

    // Dispatcher pour gérer les commandes entrantes
    handleCommand(command) {
        const { output, action, key, text, x, y, button, direction, amount } = command;

        switch (output) {
            case 'keyboard':
                this.handleKeyboard(action, key, text);
                break;
            case 'mouse':
                this.handleMouse(action, x, y, button, direction, amount);
                break;
            default:
                console.error("Invalid output type");
        }
    }

    // Gérer les actions de clavier
    handleKeyboard(action, key, text) {
        if (action !== "none" && key !== "none") {
            switch (action) {
                case 'pressKey':
                    this.sendKey(key);
                    break;
                case 'sendCombination':
                    this.sendCombination(key); // Assume key is an array here
                    break;
                case 'sendText':
                    this.sendText(text);
                    break;
                case 'holdKey':
                    this.holdKey(key, text); // Assume text is duration in ms here
                    break;
                default:
                    console.error("Invalid keyboard action");
            }
        }
        else{
            console.log("Aucune action prévue pour cette demande")
        }
    }

    // Gérer les actions de souris
    handleMouse(action, x, y, button, direction, amount) {
        switch (action) {
            case 'move':
                this.moveMouse(x, y);
                break;
            case 'click':
                this.clickMouse(button);
                break;
            case 'scroll':
                this.scrollMouse(direction, amount);
                break;
            case 'drag':
                this.dragMouse(x, y);
                break;
            default:
                console.error("Invalid mouse action");
        }
    }

    // Méthodes pour le clavier
    sendKey(key) {
        robot.keyTap(key);
    }

    sendCombination(keys) {
        keys.forEach(key => robot.keyToggle(key, 'down'));
        keys.forEach(key => robot.keyToggle(key, 'up'));
    }

    sendText(text) {
        robot.typeString(text);
    }

    holdKey(key, duration) {
        robot.keyToggle(key, 'down');
        setTimeout(() => robot.keyToggle(key, 'up'), duration);
    }

    // Méthodes pour la souris
    moveMouse(x, y) {
        robot.moveMouse(x, y);
    }

    clickMouse(button = 'left') {
        robot.mouseClick(button);
    }

    scrollMouse(direction, amount) {
        robot.scrollMouse(amount, direction);
    }

    dragMouse(x, y) {
        robot.dragMouse(x, y);
    }
}

module.exports = InputController;
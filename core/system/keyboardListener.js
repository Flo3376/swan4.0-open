const { GlobalKeyboardListener } = require('node-global-key-listener');
const colors = require('colors');

const state = {
    isButtonPressed: false
};

function initializeKeyboardListener(key_keyboard_Id) {
    const keyboardListener = new GlobalKeyboardListener();

    keyboardListener.addListener((e) => {
        if (e.name === key_keyboard_Id) {
            if (e.state === 'DOWN' && !state.isButtonPressed) {
                console.log();
                console.log(colors.magenta('1A-détection clavier : ')+ "keyboardListener.js");
                console.log(`       Touche ${key_keyboard_Id} enfoncée (front montant)`);
                console.log();
                state.isButtonPressed = true;
            } else if (e.state === 'UP' && state.isButtonPressed) {
                console.log(`       Touche ${key_keyboard_Id} relachée (front descendant)`);
                state.isButtonPressed = false;
            }
        }
    });
}

function getButtonState() {
    return state.isButtonPressed;
}

module.exports = {
    initializeKeyboardListener,
    getButtonState
};
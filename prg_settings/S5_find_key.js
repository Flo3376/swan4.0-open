const { GlobalKeyboardListener } = require('node-global-key-listener');

const keyboardListener = new GlobalKeyboardListener();

// Fonction pour gérer les frappes de clavier
keyboardListener.addListener((e) => {
  if (e.state === 'DOWN') { // Détecter seulement lorsque la touche est enfoncée
    
        console.log(`Code pour la touche: ${e.name}`);
        console.log(`       Scan Code ${e.scanCode}`);
        console.log(`       vKey: ${e.vKey}`);
        console.log(e);
        }
});

console.log('Appuyez sur une touche (utilisez Ctrl+C dans le terminal pour quitter)');
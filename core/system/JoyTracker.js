// Importation du module node-hid pour interagir avec les périphériques HID
const HID = require('node-hid');

// Variable pour garder l'état précédent du bouton pour détecter les changements d'état
let previousButtonState = 0;

// Objet pour maintenir l'état actuel du bouton (pressé ou non)
const state = {
    isButtonPressed: false
};

/**
 * Initialise un dispositif HID (joystick) basé sur les identifiants fournis.
 * @param {Object} joystick_address - Contient les identifiants nécessaires pour trouver le dispositif
 * @returns {Object|null} Retourne l'objet device s'il est trouvé, sinon null
 */
function initializeDevice(joystick_address) {
    // Récupère tous les dispositifs HID disponibles
    const devices = HID.devices();
    // Recherche un dispositif correspondant aux vendorId et productId fournis
    const deviceInfo = devices.find(d => d.vendorId === parseInt(joystick_address.vendorId) && d.productId === parseInt(joystick_address.productId));

    // Si un dispositif correspondant est trouvé
    if (deviceInfo) {
        // Crée une nouvelle instance HID pour le dispositif trouvé
        const device = new HID.HID(deviceInfo.path);
        // Commence à écouter les événements sur ce dispositif
        listenToDevice(device, joystick_address);
        // Retourne l'objet device pour des utilisations ultérieures
        return device;
    } else {
        // Log une erreur si aucun dispositif correspondant n'est trouvé
        console.error('Manette non trouvée');
        return null;
    }
}

/**
 * Attache des gestionnaires d'événements au dispositif HID pour écouter les données et les erreurs.
 * @param {Object} device - L'objet device HID
 * @param {Object} joystick_address - Contient les indices nécessaires pour interpréter les données du dispositif
 */
function listenToDevice(device, joystick_address) {
    // Gestionnaire pour l'événement 'data' qui est émis lorsque des données sont reçues du dispositif
    device.on('data', (data) => {
        // Extrait l'état du bouton basé sur l'indice tramId et applique un masque avec bp_Id
        const buttonState = data[parseInt(joystick_address.tramId)];
        const currentButtonState = buttonState & parseInt(joystick_address.bp_Id);

        // Vérifie si l'état du bouton a changé depuis la dernière vérification
        if (currentButtonState !== previousButtonState) {
            // Log l'état du bouton, pressé ou relâché
            console.log(currentButtonState ? 'Bouton appuyé' : 'Bouton relâché');
            // Met à jour l'état global du bouton
            state.isButtonPressed = !!currentButtonState;
            // Met à jour l'état précédent du bouton
            previousButtonState = currentButtonState;
        }
    });

    // Gestionnaire pour l'événement 'error' qui est émis en cas d'erreur avec le dispositif
    device.on('error', (err) => {
        // Log l'erreur avec le dispositif
        console.error('Erreur avec la manette:', err);
    });
}

/**
 * Renvoie l'état actuel du bouton (pressé ou non).
 * @returns {boolean} L'état du bouton
 */
function getButtonState() {
    return state.isButtonPressed;
}

// Exporte les fonctions pour qu'elles soient utilisées par d'autres modules
module.exports = {
    initializeDevice,
    getButtonState
};

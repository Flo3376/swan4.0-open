const HID = require('node-hid');

// Liste des périphériques HID connectés
const devices = HID.devices();

// Remplacez par le vendorId et le productId de votre manette
const vendorId = 13124; // Par exemple, pour une manette Virpil
const productId = 32971; // Par exemple, pour une manette Virpil

// Spécifiez l'octet à surveiller (index de la trame)
const sur_tram = 21; // Par exemple, surveiller le 21e octet

// Trouver la manette
const deviceInfo = devices.find(d => d.vendorId === vendorId && d.productId === productId);

if (!deviceInfo) {
    console.error('Manette non trouvée');
    process.exit(1); // Arrêter le programme si la manette n'est pas trouvée
}

// Ouvrir une connexion avec la manette
const device = new HID.HID(deviceInfo.path);

// Variable pour stocker l'état précédent de l'octet surveillé
let previousState = null;

// Écouter les événements de données
device.on('data', (data) => {
    const buttonState = data[sur_tram];

    // Si l'état précédent est défini et différent de l'état actuel, détecter les boutons
    if (previousState !== null && buttonState !== previousState) {
        console.log(`Changement détecté`);

        // Analysez les bits de l'octet pour identifier quel bouton est appuyé
        for (let i = 0; i < 8; i++) {
            const mask = 1 << i;
            if ((buttonState & mask) !== (previousState & mask)) {
                const buttonStateStr = (buttonState & mask) ? 'Appuyé' : 'Relâché';
                console.log(`Bouton ${i + 1}: ${buttonStateStr} (vendorId: ${vendorId}, productId: ${productId}, octet: ${sur_tram}, bit: 0x${mask.toString(16).padStart(2, '0')})\n`);
            }
        }
    }

    // Mettre à jour l'état précédent avec l'état actuel
    previousState = buttonState;
});

// Gérer les erreurs
device.on('error', (err) => {
    console.error('Erreur :', err);
});

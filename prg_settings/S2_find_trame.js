const HID = require('node-hid');

// Liste des périphériques HID connectés
const devices = HID.devices();

// Remplacez par le vendorId et le productId de votre manette
const vendorId = 5426; // Par exemple, pour une manette Virpil
const productId = 532; // Par exemple, pour une manette Virpil

// Trouver la manette
const deviceInfo = devices.find(d => d.vendorId === vendorId && d.productId === productId);

if (!deviceInfo) {
    console.error('Manette non trouvée');
    process.exit(1); // Arrêter le programme si la manette n'est pas trouvée
}

console.error('Manette trouvée, surveillance lancée.');

// Ouvrir une connexion avec la manette
const device = new HID.HID(deviceInfo.path);

// Variable pour stocker la trame précédente
let previousData = null;

// Variable pour stocker la dernière trame reçue
let currentData = null;

// Écouter les événements de données et stocker la dernière trame reçue
device.on('data', (data) => {
    currentData = Buffer.from(data);
});

// Vérifier les changements toutes les 500 ms
setInterval(() => {
    if (previousData && currentData) {
        // Comparer chaque octet de la trame actuelle avec la trame précédente
        currentData.forEach((byte, index) => {
            if (byte !== previousData[index]) {
                console.log(`Changement détecté à l'octet ${index}: ${previousData[index]} -> ${byte}`);
            }
        });
    }

    // Mettre à jour la trame précédente avec la trame actuelle
    previousData = currentData;
}, 500);

// Gérer les erreurs
device.on('error', (err) => {
    console.error('Erreur :', err);
});

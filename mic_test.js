const mic = require('mic');
const fs = require('fs');

// Configuration du micro
const micInstance = mic({
    rate: '16000', // Fréquence d'échantillonnage
    channels: '2', // Mono, changez à '2' pour stéréo si nécessaire
    debug: false, // Mode débogage désactivé
    exitOnSilence: 2, // Arrêter automatiquement après 6 secondes de silence
    fileType :'wav'
});

const micInputStream = micInstance.getAudioStream();
let outputFileStream = fs.createWriteStream('output.wav');

// Variables de seuil et d'état
const volumeThreshold = 4500; // Seuil de volume pour démarrer l'enregistrement
let isRecording = false;

// Fonction pour calculer le niveau de volume
function calculateVolume(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i += 2) {
        const intVal = data.readInt16LE(i); // Interprétation en 16 bits little-endian
        sum += intVal * intVal;
    }
    return Math.sqrt(sum / (data.length / 2));
}

// Gestion des données audio
micInputStream.on('data', (data) => {
    const volume = calculateVolume(data);
    console.log(`Volume: ${volume}`); // Pour débogage

    if (volume > volumeThreshold && !isRecording) {
        console.log('Début de l\'enregistrement');
        isRecording = true;
        micInputStream.pipe(outputFileStream);// Redirige le flux audio vers le fichier.
    } else if (volume < volumeThreshold && isRecording) {
        console.log('Fin de l\'enregistrement');
        isRecording = false;

        
        
        
        micInputStream.unpipe(outputFileStream);

        
    }
    console.log('data')
});

// Gestion des erreurs
micInputStream.on('error', (err) => {
    console.log('Erreur du micro: ' + err);
});

// Logs de statut du micro
micInputStream.on('startComplete', () => {
    console.log('Micro démarré');
});

micInputStream.on('stopComplete', () => {
    console.log('Micro arrêté');
});

micInputStream.on('silence', () => {
    console.log('Silence détecté');
});

// Démarrage du micro
micInstance.start();

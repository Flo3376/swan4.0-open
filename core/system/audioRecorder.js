const mic = require('mic');  // Importe le module mic pour la capture audio.
const fs2 = require('fs');   // Importe le module fs pour la gestion des fichiers.
const path = require('path'); // Importe le module path pour manipuler les chemins de fichiers.
const colors = require('colors'); // Importe le module colors pour ajouter des couleurs au texte du terminal.

let micInstance = null; // Variable pour stocker l'instance de micro actuelle.
let micInputStream = null; // Variable pour le flux d'entrée audio du micro.
let fileStream = null; // Variable pour le flux de fichier où l'audio est enregistré.
let fileName = null; // Variable pour le nom de fichier de l'enregistrement.

// Fonction pour démarrer l'enregistrement audio
function startRecording(path_file) {
    console.log(colors.magenta('2B-capture audio : ') + "audioRecorder.js");
    const dir = path.join(__dirname, `../../${path_file}`); // Définir le chemin du dossier où les audios seront sauvegardés.
    
    fileName = path.join(dir, `recording_${Date.now()}.wav`); // Crée le nom de fichier avec un timestamp.
    fileStream = fs2.createWriteStream(fileName); // Ouvre un flux d'écriture de fichier pour l'enregistrement.

    micInstance = mic({ // Configuration de l'instance de micro.
        rate: '16000', // Définit la fréquence d'échantillonnage à 16000 Hz.
        channels: '2', // Définit l'enregistrement stéréo.
        debug: false, // Désactive le mode débogage.
        exitOnSilence: 2, // Arrête l'enregistrement après 2 secondes de silence.
    });

    micInputStream = micInstance.getAudioStream(); // Obtient le flux d'audio du micro.

    micInputStream.pipe(fileStream); // Redirige le flux audio vers le fichier.

    micInstance.start(); // Démarre l'enregistrement.
}

// Fonction pour arrêter l'enregistrement
async function stopRecording() {
    if (micInstance) {
        micInstance.stop(); // Arrête l'enregistrement.
        console.log('       Enregistrement arrêté : ', fileName);
        console.log();
        micInstance = null; // Réinitialise l'instance de micro.
    }
    if (fileStream) {
        fileStream.end(); // Ferme le flux de fichier.
        fileStream = null; // Réinitialise le flux de fichier.
    }

    console.log(colors.magenta('3-Extraction du texte : ') + "audioRecorder.js");
    try {
        const stats = fs2.statSync(fileName); // Obtient les statistiques du fichier.
        if (stats.size < 75 * 1024) { // Vérifie si la taille du fichier est inférieure à 75 Ko.
            console.log(colors.yellow('       Fichier trop petit pour la transcription.') + " audioRecorder.js");
            fs2.unlinkSync(fileName); // Supprime le fichier s'il est trop petit.
            console.log(colors.red('       Fichier supprimé car insuffisant pour la transcription.'));
            return null; // Retourne null pour indiquer qu'aucun fichier valide n'est disponible.
        }
        return fileName; // Retourne le chemin du fichier enregistré.
    } catch (error) {
        console.error("Erreur lors de l'enregistrement ou de l'accès au fichier:", error);
    }
}

// Fonction pour vérifier si l'enregistrement est en cours
function isRecording() {
    return micInstance !== null; // Retourne vrai si l'instance de micro n'est pas nulle.
}

module.exports = {
    startRecording,
    stopRecording,
    isRecording
};

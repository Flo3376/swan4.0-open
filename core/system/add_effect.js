const ffmpeg = require('fluent-ffmpeg');

function make_effect(inputPath, effectType) {
    return new Promise((resolve, reject) => {
        // Si aucun effet n'est spécifié, retourner simplement le chemin d'entrée
        if (!effectType || effectType.toLowerCase() === 'none') {
            console.log(`Aucun effet demandé, retour du fichier original : ${inputPath}`);
            resolve(inputPath);
            return;
        }

        const outputPath = inputPath.replace(/\.mp3$/, `_${effectType}.mp3`);

        const effects = {
            'bocal': [
                'equalizer=f=1000:width_type=h:width=200:g=-10',
                'aecho=0.8:0.88:60:0.4'
            ],
            'small_speaker': [
                'highpass=f=300',
                'lowpass=f=3000'
            ],
            'radio': [
                'highpass=f=300',
                'lowpass=f=3000',
                'aecho=0.8:0.9:50:0.3'
            ],
            'telephone': [
                'equalizer=f=800:width_type=h:width=1400:g=-20',
                'compand=attacks=0.3:decays=1:soft-knee=6:points=-70/-70|-60/-20|0/-20:gain=0:volume=0.2:delay=0.3'
            ]
        };

        if (!effects[effectType]) {
            reject('Effet demandé non disponible.');
            return;
        }

        ffmpeg(inputPath)
            .audioFilters(...effects[effectType])
            .on('error', function(err) {
                reject('Erreur lors du traitement : ' + err.message);
            })
            .on('end', function() {
                console.log(`Fichier traité avec succès et enregistré sous : ${outputPath}`);
                resolve(outputPath);
            })
            .save(outputPath);
    });
}

module.exports = make_effect;

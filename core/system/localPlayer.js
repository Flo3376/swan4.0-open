const http = require('http');

// Fonction pour envoyer une requête GET pour ajouter un fichier audio
function addMusic(path, volume = 10) {
    const encodedPath = encodeURIComponent(path);
    const urlPath = `class_action=sound&action=playoradd&type=music&path=${encodedPath}&volume=${volume}`;

    const options = {
        hostname: '127.0.0.1',
        port: 2953,
        path: `/?${urlPath}`,
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            // Réception des données
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Fin de la réception
            res.on('end', () => {
                console.log(`Réponse pour ${path} :`, data);
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(`Erreur lors de la requête pour ${path} :`, error);
            reject(error);
        });

        req.end();
    });
}

// Fonction pour ajouter plusieurs musiques avec délai entre chaque
async function addMultipleMusics(paths, volume = 10, delay = 250) {
    // 1. Diviser le string en lignes
    const lines = paths.trim().split("\n").map(line => line.trim());    
    console.log(lines);
    // 2. Supprimer les guillemets (") autour des chemins
    const cleanPaths = lines.map(path => path.replace(/"/g, ''));
    console.log(cleanPaths);

    for (let i = 0; i < cleanPaths.length; i++) {
        const path = cleanPaths[i];
        console.log(`Ajout de la musique : ${path}`);
        await addMusic(path, volume); // Attendre la fin de la requête
        await new Promise(resolve => setTimeout(resolve, delay)); // Attendre le délai avant d'ajouter la suivante
    }
}

module.exports = {
    addMusic,
    addMultipleMusics
};

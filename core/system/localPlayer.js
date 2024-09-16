const http = require('http');

class LocalPlayer {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:2953'; // URL de base du serveur de contrôle local
    }

    // Méthode pour envoyer une requête GET
    sendRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: '127.0.0.1',
                port: 2953,
                path: `/${path}`,
                method: 'GET',
            };

            const req = http.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log(`Réponse pour ${path} :`, data);
                    resolve(data);
                });
            });

            req.on('error', (error) => {
                console.error(`Erreur lors de la requête pour ${path} :`, error);
                reject(error);
            });

            req.end();
        });
    }

    async addMusics(music)
    {
        // Ajouter plusieurs musiques avec 25% de volume et 250ms de délai entre chaque ajout

        console.log(music)
        this.addMultipleMusics(music, 5, 250)
        .then(() => console.log('Toutes les musiques ont été ajoutées avec succès'))
        .catch((err) => console.error('Erreur:', err));
    }

    // Méthode pour ajouter un fichier audio
    async addMusic(path, volume = 10) {
        const encodedPath = encodeURIComponent(path);
        const urlPath = `?class_action=sound&action=playoradd&type=music&path=${encodedPath}&volume=${volume}`;
        return this.sendRequest(urlPath);
    }

    // Méthode pour ajouter plusieurs musiques
    async addMultipleMusics(paths, volume = 10, delay = 250) {
        const lines = paths.trim().split("\n").map(line => line.trim());
        const cleanPaths = lines.map(path => path.replace(/"/g, ''));

        for (const path of cleanPaths) {
            console.log(`Ajout de la musique : ${path}`);
            await this.addMusic(path, volume);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Méthode pour mettre en pause la lecture
    async pause() {
        return this.sendRequest('?class_action=sound&action=pausemusic');
    }

    // Méthode pour reprendre la lecture
    async play() {
        return this.sendRequest('?class_action=sound&action=resumemusic');
    }

    // Méthode pour arrêter la lecture
    async stop() {
        return this.sendRequest('?class_action=sound&action=stopmusic');
    }

    // Méthode pour passer à la piste suivante
    async next_track() {
        return this.sendRequest('?class_action=sound&action=playnext');
    }

    // Méthode pour régler le volume
    async setVolume(volume) {
        return this.sendRequest(`?class_action=sound&action=setvolume&volume=${volume}&type=music`);
    }
}

module.exports = new LocalPlayer();

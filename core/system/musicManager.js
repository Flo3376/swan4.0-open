const SpotifyController = require('./spotify');
const localPlayer = require('./localPlayer');

class MusicManager {
    constructor(config) {
        this.config = config;
        this.currentPlayer = null;
        this.playerType = null;

        // Stocker les instances de chaque lecteur ici
        this.players = {
            spotify: new SpotifyController(config),
            local: localPlayer,
            // youtube: new YouTubePlayer(config)  // À ajouter plus tard
        };
    }

    // Méthode pour définir le lecteur actuel
    setPlayer(playerType) {
        if (this.players[playerType]) {
            if (this.players[playerType].isAvailable === false) {
                console.warn(`Le lecteur ${playerType} est hors service.`);
                this.currentPlayer = null;
                return;
            }
            this.playerType = playerType;
            this.currentPlayer = this.players[playerType];
            console.log(`Le lecteur actuel est : ${playerType}`);
        } else {
            console.error(`Lecteur inconnu : ${playerType}`);
        }
    }

    // Méthode pour vérifier l'existence d'une méthode
    _checkMethod(methodName) {
        if (this.currentPlayer && typeof this.currentPlayer[methodName] === 'function') {
            return true;
        } else {
            console.warn(`La méthode '${methodName}' n'est pas disponible pour le lecteur ${this.playerType}`);
            return false;
        }
    }

    // Méthode pour ajouter de la musique
    async addMusic(track) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('addMusic')) {
            try {
                await this.currentPlayer.addMusic(track);
                console.log(`Musique ajoutée avec succès sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de l'ajout de la musique sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour jouer la musique
    async play() {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('play')) {
            try {
                await this.currentPlayer.play();
                console.log(`Lecture démarrée sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de la lecture sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour mettre en pause la musique
    async pause() {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('pause')) {
            try {
                await this.currentPlayer.pause();
                console.log(`Lecture mise en pause sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de la pause sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour ajuster le volume
    async setVolume(volume) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('setVolume')) {
            try {
                await this.currentPlayer.setVolume(volume);
                console.log(`Volume réglé à ${volume}% sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors du réglage du volume sur ${this.playerType}:`, error);
            }
        }
    }
}

module.exports = MusicManager;

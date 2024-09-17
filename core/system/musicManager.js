const SpotifyController = require('./spotify');
const localPlayer = require('./localPlayer');
// const YouTubePlayer = require('./youtubePlayer');  // À implémenter plus tard
// const Deezzer = require('./Deezzer');  // À implémenter plus tard

class MusicManager {
    constructor(config) {
        this.config = config;
        this.currentPlayer = null;
        this.playerType = null;

        // Stocker les instances de chaque lecteur ici
        this.players = {
            spotify: new SpotifyController(config.spotify),
            local: localPlayer,
            // youtube: new YouTubePlayer(config)  // À ajouter plus tard
        };
        // Vérifier si un lecteur par défaut est défini dans la configuration
        const defaultPlayer = config.default_mm_player || 'local'; // 'local' comme valeur par défaut
        this.setPlayer(defaultPlayer);
    }

    // Méthode pour traiter une commande
    handleCommand(command, info = null, callback = null) {
        if (command.startsWith("mm_switch_to_")) {
            this._switchPlayer(command,callback);
            
        } else if (command.startsWith("mm_set_volume_")) {
            // Extraire le niveau de volume de la commande
            const volume = parseInt(command.split("_").pop(), 10);
            if (!isNaN(volume)) {
                this.setVolume(volume, callback);
            } else {
                console.error(`Commande de volume invalide : ${command}`);
                if (callback) callback(`Commande de volume invalide : ${command}`);
            }
        } else {
            // Autres commandes pour le lecteur actuel
            switch (command) {
                case 'mm_play':
                    this.play(callback);
                    break;
                case 'mm_next_track':
                    this.next_track(callback);
                    break;
                case 'mm_previous_track':
                    this.previous_track(callback);
                    break;
                case 'mm_pause':
                    this.pause(callback);
                    break;
                case 'mm_increase_volume':
                    this.increase_volume(callback);
                    break;
                case 'mm_decrease_volume':
                    this.decrease_volume(callback);
                    break;
                case 'mm_add_music':
                    if (info) {
                        this.addMusic(info, callback);
                    }
                    break;
                // Ajoute d'autres commandes ici
                default:
                    console.error(`Commande non reconnue : ${command}`);
                    if (callback) callback(`Commande non reconnue : ${command}`);
                    break;
            }
        }
    }

    // Méthode pour changer de lecteur
    _switchPlayer(command,callback) {
        const targetPlayer = command.split("_").pop(); // Récupère le nom du lecteur
        if (this.players[targetPlayer]) {
            this.setPlayer(targetPlayer,callback);
        } else {
            console.error(`Lecteur inconnu : ${targetPlayer}`);
            if (callback) callback(`Lecteur inconnu : ${targetPlayer}`);
        }
    }

    // Méthode pour définir le lecteur actuel
    async setPlayer(playerType,callback) {
        if (this.players[playerType]) {
            if (this.players[playerType].isAvailable === false) {
                
                console.warn(`Le lecteur ${playerType} est hors service.`);
                if (callback) callback(`Le lecteur ${playerType} est hors service`);
                this.currentPlayer = null;
                return;
            }
            this.playerType = playerType;
            this.currentPlayer = this.players[playerType];
            console.log(`Le lecteur actuel est : ${playerType}`);
            if (callback) callback(`Le lecteur actuel est : ${playerType}`);
        } else {
            console.error(`Lecteur inconnu : ${playerType}`);
            if (callback) callback(`Lecteur inconnu : ${playerType}`);
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
    async addMusics(track,callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('addMusics')) {
            try {
                await this.currentPlayer.addMusics(track,callback);
                console.log(`Musique ajoutée avec succès sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de l'ajout de la musique sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour jouer la musique
    async play(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('play')) {
            try {
                await this.currentPlayer.play(callback);
            } catch (error) {
                console.error(`Erreur lors de la lecture sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour jouer la musique suivante
    async next_track(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('next_track')) {
            try {
                await this.currentPlayer.next_track(callback);
                //console.log(`Lecture démarrée sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de la lecture sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour jouer la musique précédente
    async previous_track(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('previous_track')) {
            try {
                await this.currentPlayer.previous_track(callback);
                //console.log(`Lecture démarrée sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors de la lecture sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour mettre en pause la musique
    async pause(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('pause')) {
            try {
                await this.currentPlayer.pause(callback);
            } catch (error) {
                console.error(`Erreur lors de la pause sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour mettre en pause la musique
    async increase_volume(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('increase_volume')) {
            try {
                await this.currentPlayer.increase_volume(callback);
            } catch (error) {
                console.error(`Erreur lors de la gestion du son sur ${this.playerType}:`, error);
            }
        }
    }

    // Méthode pour mettre en pause la musique
    async decrease_volume(callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('decrease_volume')) {
            try {
                await this.currentPlayer.decrease_volume(callback);
            } catch (error) {
                console.error(`Erreur lors de la gestion du son sur ${this.playerType}:`, error);
            }
        }
    }
    
    // Méthode pour ajuster le volume
    async setVolume(volume,callback) {
        if (!this.currentPlayer) {
            console.error("Aucun lecteur sélectionné ou le lecteur est hors service");
            return;
        }
        if (this._checkMethod('setVolume')) {
            try {
                await this.currentPlayer.setVolume(volume, callback);
                //console.log(`Volume réglé à ${volume}% sur ${this.playerType}`);
            } catch (error) {
                console.error(`Erreur lors du réglage du volume sur ${this.playerType}:`, error);
            }
        }
    }
}

module.exports = MusicManager;

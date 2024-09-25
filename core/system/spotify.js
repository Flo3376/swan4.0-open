const SpotifyWebApi = require('spotify-web-api-node');

// Classe pour contrôler l'API Spotify
class SpotifyController {
  constructor(config) {
    // Vérification de la config Spotify
    if (!config.clientId || !config.clientSecret || !config.redirectUri || !config.client_acces_token || !config.client_refresh_token) {
        console.error("La configuration Spotify est incorrecte ou incomplète.");
        this.isAvailable = false;  // Marquer Spotify comme non disponible
    } else {
      console.log("La configuration Spotify est potentiellement correcte.");
        // Initialisation de l'API Spotify avec les paramètres de configuration valides
        //console.log(config.redirectUri)
        this.spotifyApi = new SpotifyWebApi({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectUri: config.redirectUri,
            accessToken: config.client_acces_token,
            refreshToken: config.client_refresh_token,
        });
        this.client_pref_device = config.client_pref_device;
        this.volume = config.defaultVolume;
        this.isAvailable = true;  // Marquer Spotify comme disponible
    }
}

  // Méthode pour vérifier la disponibilité
  _checkAvailability() {
      if (!this.isAvailable) {
          console.error("Spotify est hors service en raison d'une configuration incorrecte.");
          return false;
      }
      return true;
  }

  // Vérifie si le token est expiré
  isTokenExpired() {
    if (!this._checkAvailability()) return;
    return !this.tokenExpiryTime || this.tokenExpiryTime <= Date.now();
  }

  // Méthode pour rafraîchir le jeton d'accès
  async refreshAccessToken() {
    if (!this._checkAvailability()) return;
    if (this.isTokenExpired()) {
      try {
        const data = await this.spotifyApi.refreshAccessToken();
        this.spotifyApi.setAccessToken(data.body['access_token']);
        // Mise à jour de l'heure d'expiration du token
        this.tokenExpiryTime = Date.now() + data.body['expires_in'] * 1000;

        if (data.body['refresh_token']) {
          this.spotifyApi.setRefreshToken(data.body['refresh_token']);
        }
        console.log('Le token d\'accès a été rafraîchi et expire à', new Date(this.tokenExpiryTime));
      } catch (error) {
        console.error("Erreur lors du rafraîchissement du token d'accès:", error);
        throw new Error('Failed to refresh access token');
      }
    } else {
      console.log("Le token d'accès est toujours valide.");
    }
  }

  // Méthode privée pour effectuer les vérifications avant une action
  async _preActionChecks() {
    if (!this._checkAvailability()) return false; // Vérifier la disponibilité
    await this.refreshAccessToken(); // Rafraîchir le token

    const devices = await this.getDevices(); // Obtenir la liste des appareils
    let deviceActive = false;

    // Vérifier si l'appareil préféré est actif
    if (devices.length > 0) {
        devices.forEach(device => {
            if (device.id === this.client_pref_device && device.is_active) {
                deviceActive = true;
                console.log("Appareil préféré déjà actif:", device.name);
            }
        });

        // Si l'appareil préféré n'est pas actif, l'activer
        if (!deviceActive) {
            console.log("Activation de l'appareil préféré:", this.client_pref_device);
            await this.setActiveDevice(this.client_pref_device);
        }
    } else {
        console.log("Aucun appareil disponible.");
        return false;
    }

    return true;
  }
  // Méthode pour obtenir les appareils disponibles
  async getDevices() {
    if (!this._checkAvailability()) return;
    try {
      const data = await this.spotifyApi.getMyDevices();
      console.log('Appareils disponibles:', data.body.devices);
      return data.body.devices;
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      return false;
    }
  }

  // Méthode pour activer un appareil spécifique
  async setActiveDevice(deviceId) {
    if (!this._checkAvailability()) return;
    try {
      await this.spotifyApi.transferMyPlayback([deviceId]);
      return true;
    } catch (error) {
      console.error("Erreur lors du ciblage de l'appareil:", error);
      return false;
    }
  }
  // Méthode pour démarrer la lecture
  async play(callback) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.play();
      console.log('Lecture commencée');
      if (callback) callback( 'Lecture démarrée sur spotify');
      return true;
    } catch (error) {
      console.error('Erreur de lecture:', error);
      if (callback) callback("Je suis désolé mais je n'arrive pas à interragir avec spotify");
      return false;
    }
  }

  // Méthode pour mettre la lecture en pause
  async pause(callback) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.pause();
      console.log('Lecture mise en pause');
      if (callback) callback( 'Lecture mise en pause sur spotify');
      return true;
    } catch (error) {
      console.error('Erreur de pause:', error);
      if (callback) callback("Je suis désolé mais je n'arrive pas à interragir avec spotify");
      return false;
    }
  }

  // Méthode pour passer à la piste suivante
  async next_track(callback) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.skipToNext();
      console.log('Passé au morceau suivant');
      if (callback) callback( 'Musique suivante sur spotify');
      return true;
    } catch (error) {
      if (callback) callback("Je suis désolé mais je n'arrive pas à interragir avec spotify");
      console.error('Erreur lors du passage au suivant:', error);
      return false;
    }
  }

  // Méthode pour revenir à la piste précédente
  async previous_track(callback) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.skipToPrevious();
      console.log('Revenu au morceau précédent');
      if (callback) callback( 'Musique précédente sur spotify');
      return true;
    } catch (error) {
      if (callback) callback("Je suis désolé mais je n'arrive pas à interragir avec spotify");
      console.error('Erreur lors du retour au précédent:', error);
      return false;
    }
  }

  async addMusics(music,callback)
  {
    // Gestion des différentes pistes selon leur type (playlist, track, album)
      if (music.includes("playlist")) {
        console.log(music);
        let playlistId = music.split("/playlist/")[1].split("?")[0];
        //console.log("playlist id : " + playlistId);
        this.playPlaylist(playlistId);  // Lance une playlist sur Spotify
        if (callback) callback( 'Playlist lancé sur spotify');
    }
    if (music.includes("track")) {
        console.log(music);
        let trackId = music.split("/track/")[1].split("?")[0];
        //console.log("track id : " + trackId);
        this.playTrack (trackId);  // Lance une piste spécifique sur Spotify
        if (callback) callback( 'Morceau lancé sur spotify')
    }
    if (music.includes("album")) {
        console.log(music);
        let albumId = music.split("/album/")[1].split("?")[0];
        //console.log("album id : " + albumId);
        this.playAlbum (albumId);  // Lance un album sur Spotify
        if (callback) callback( 'Album lancé sur spotify')
    }
  }

  // Méthode pour rechercher des pistes
  async searchTracks(trackName) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      const data = await this.spotifyApi.searchTracks(trackName);
      //console.log(`Résultats de la recherche pour '${trackName}':`, data.body.tracks.items);
      return data.body.tracks.items;
    } catch (error) {
      console.error('Erreur lors de la recherche de morceaux:', error);
      return false;
    }
  }

  // Méthode pour jouer une piste spécifique
  async playTrack(trackId) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.play({
        uris: [`spotify:track:${trackId}`]
      });
      console.log(`Lecture du morceau avec ID: ${trackId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la lecture du morceau:', error);
      return false;
    }
  }

  // Méthode pour jouer un album spécifique
  async playAlbum(albumId) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.play({
        context_uri: `spotify:album:${albumId}`  // Utiliser context_uri pour un album
      });
      console.log(`Lecture de l'album avec ID: ${albumId}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la lecture de l'album:", error);
      return false;
    }
  }

   // Méthode pour jouer une playlist spécifique
   async playPlaylist(playlistId) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.play({
        context_uri: `spotify:playlist:${playlistId}`  // Utiliser context_uri pour un album
      });
      console.log(`Lecture de la playlist avec ID: ${playlistId}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la lecture de playlist:", error);
      return false;
    }
  }

  // Méthode pour obtenir le volume actuel du lecteur Spotify
  async getCurrentVolume() {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
        const playbackState = await this.spotifyApi.getMyCurrentPlaybackState();

        console.log(playbackState.body.device);


        if (playbackState && playbackState.body.device) {
            return playbackState.body.device.volume_percent;
        } else {
            console.warn('Aucun état de lecture ou appareil disponible.');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du volume:', error);
        return null;
    }
  }

  // Méthode pour définir le volume
  async setVolume(volume,callback) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    try {
      await this.spotifyApi.setVolume(volume); // Imaginons que `spotifyAPI` ait une méthode `setVolume`
      console.log(`Volume réglé à ${volume} sur Spotify`);
      if (callback) callback(`Volume réglé à ${volume} sur Spotify`);
    } catch (error) {
        console.error('Erreur lors du réglage du volume sur Spotify:', error);
        if (callback) callback('Erreur lors du réglage du volume sur Spotify');
    }
  }
  // Méthode pour augmenter le volume
  async increase_volume() {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    const currentVolume = await this.getCurrentVolume();
    if (currentVolume === null) {
        console.error('Impossible de récupérer le volume actuel.');
        return false;
    }

    const newVolume = Math.min(currentVolume + 5, 100); // Incrémente de 5
    return await this.setVolume(newVolume);
  }

  // Méthode pour diminuer le volume
  async decrease_volume() {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables

    const currentVolume = await this.getCurrentVolume();
    if (currentVolume === null) {
        console.error('Impossible de récupérer le volume actuel.');
        return false;
    }

    const newVolume = Math.max(currentVolume - 5, 0); // Décrémente de 5
    return await this.setVolume(newVolume);
  }

  async spotify_search(search_item) {
    if (!await this._preActionChecks()) return; // Effectuer les vérifications préalables


    try {
      const results = await this.searchTracks(search_item);
      if (results && results.length > 0) {
        const firstTrack = results[0]; // Prendre la première piste
        const albumId = firstTrack.album.id; // Obtenir l'ID de l'album de la première piste

        await this.playAlbum(albumId); // Jouer l'album
        console.log("Album joué :", albumId);
      } else {
        console.log("Aucun résultat trouvé pour la recherche.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche ou de la lecture de l'album :", error);
    }
  }

}

module.exports = SpotifyController;

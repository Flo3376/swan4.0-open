const SpotifyWebApi = require('spotify-web-api-node');

// Classe pour contrôler l'API Spotify
class SpotifyController {
  constructor(config) {
    // Initialisation de l'API Spotify avec les paramètres de configuration
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.clientId, // Identifiant du client
      clientSecret: config.clientSecret, // Secret du client (remplacer par votre propre secret)
      redirectUri: config.redirectUri, // URI de redirection (remplacer par votre propre URI)
      accessToken: config.client_acces_token, // Jeton d'accès
      refreshToken: config.client_refresh_token // Jeton de rafraîchissement
    });
    this.client_pref_device = config.client_pref_device; // Stockage de l'appareil préféré
    this.volume = config.defaultVolume; // Stockage du volume par défaut
  }

  // Méthode pour démarrer la lecture
  async play() {
    try {
      await this.spotifyApi.play();
      console.log('Lecture commencée');
      return true;
    } catch (error) {
      console.error('Erreur de lecture:', error);
      return false;
    }
  }

  // Méthode pour mettre la lecture en pause
  async pause() {
    try {
      await this.spotifyApi.pause();
      console.log('Lecture mise en pause');
      return true;
    } catch (error) {
      console.error('Erreur de pause:', error);
      return false;
    }
  }

  // Méthode pour passer à la piste suivante
  async nextTrack() {
    try {
      await this.spotifyApi.skipToNext();
      console.log('Passé au morceau suivant');
      return true;
    } catch (error) {
      console.error('Erreur lors du passage au suivant:', error);
      return false;
    }
  }

  // Méthode pour revenir à la piste précédente
  async previousTrack() {
    try {
      await this.spotifyApi.skipToPrevious();
      console.log('Revenu au morceau précédent');
      return true;
    } catch (error) {
      console.error('Erreur lors du retour au précédent:', error);
      return false;
    }
  }

  // Vérifie si le token est expiré
  isTokenExpired() {
    return !this.tokenExpiryTime || this.tokenExpiryTime <= Date.now();
  }

  // Méthode pour définir le volume
  async setVolume(volumePercent) {
    try {
      await this.spotifyApi.setVolume(volumePercent);
      console.log(`Volume fixé à ${volumePercent}%`);
      this.volume = volumePercent;
      return true;
    } catch (error) {
      console.error('Erreur de réglage du volume:', error);
      return false;
    }
  }

  // Méthode pour rechercher des pistes
  async searchTracks(trackName) {
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


  // Méthode pour obtenir les appareils disponibles
  async getDevices() {
    try {
      const data = await this.spotifyApi.getMyDevices();
      //console.log('Appareils disponibles:', data.body.devices);
      return data.body.devices;
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      return false;
    }
  }

  // Méthode pour activer un appareil spécifique
  async setActiveDevice(deviceId) {
    try {
      await this.spotifyApi.transferMyPlayback([deviceId]);
      return true;
    } catch (error) {
      console.error("Erreur lors du ciblage de l'appareil:", error);
      return false;
    }
  }

  // Méthode pour augmenter le volume
  async increaseVolume() {
    const newVolume = Math.min(this.volume + 10, 100);
    return await this.setVolume(newVolume);
  }

  // Méthode pour diminuer le volume
  async decreaseVolume() {
    const newVolume = Math.max(this.volume - 10, 0);
    return await this.setVolume(newVolume);
  }

  // Méthode pour rafraîchir le jeton d'accès
  async refreshAccessToken() {
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
  async spotify_search(search_item) {
    await this.refreshAccessToken(); // Rafraîchir le token

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

  // Méthode principale pour exécuter des actions
  async spotify_action(action,info) {

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

    switch (action) {
      case 'spotify_play':
        return await this.play();
      case 'spotify_pause':
        return await this.pause();
      case 'spotify_next_track':
        return await this.nextTrack();
      case 'spotify_previous_track':
        return await this.previousTrack();
      case 'spotify_increase_volume':
        return await this.increaseVolume();
      case 'spotify_decrease_volume':
        return await this.decreaseVolume();
      case 'spotify_lauch_playlist':
        return await this.playPlaylist(info);
      case 'spotify_lauch_album':
        return await this.playAlbum(info);
      case 'playTrack':
        return await this.playTrack(info);
      case 'volume50':
        return await this.setVolume(50);
      default:
        console.log("Action inconnue. Les actions valides incluent 'play', 'pause', 'next', 'previous', 'volume50'.");
        return false;
    }
  }
}

module.exports = SpotifyController;
//https://open.spotify.com/intl-fr/track/0C80GCp0mMuBzLf3EAXqxv?si=e7d23e2103f9488c
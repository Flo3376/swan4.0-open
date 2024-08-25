const express = require('express');
const axios = require('axios');
const app = express();
const colors = require('colors');



// -----------------------------
// Section de chargement de la configuration
// -----------------------------
const { load_config, display_config, update_config } = require("./../core/config/configurator")

//tentative de chargement du la configuration
const config = load_config('./../core/config/config.yaml');
if (config) {
    console.log(colors.green('Config chargée.'));
    console.log();
    if (config.debug_sw) display_config(config);
}
else {
    console.log(colors.red('Echec du chargement de la confiration, coupure du programme'));
    process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
}

const client_id = config.spotify.clientId;
const client_secret = config.spotify.clientSecret;
const redirect_uri = config.spotify.redirectUri;


app.get('/login', function (req, res) {
    var scopes = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state';
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + client_id +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get('/callback', function (req, res) {

    //console.log("Requête complète reçue:", req.query); // Log pour voir tous les paramètres reçus
    const code = req.query.code || null;
    if (!code) {
        return res.status(400).send('Code d’autorisation manquant dans la requête.');
    }

    //console.log("Code reçu:", code);  // Afficher le code reçu
    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        }),
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(response => {
        console.log("Réponse de l'API:", response.data);  // Afficher les données de réponse

        config.spotify.accessToken = response.data.access_token;
        config.spotify.refreshToken = response.data.refresh_token;

        const updates = {
            'client_acces_token': `"${response.data.access_token}"`,
            'client_refresh_token': `"${response.data.refresh_token}"`
        };
        // Appel de la fonction
        update_config('./core/config/config.yaml', updates);
        res.send('Tokens: ' + JSON.stringify(response.data));

        console.log(colors.green('Configuration mise à jours, vous avez terminé avec la configuration de Spotify'));
        process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
    }).catch(error => {
        console.error("Erreur lors de l'échange du code:", error.response.data);  // Afficher les détails de l'erreur
        res.send('Error: ' + error.message);
    });
});

app.listen(8888, () => console.log(`Allez sur ce lien http://localhost:8888/login`));
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar, Cookie } = require('tough-cookie');
const { promisify } = require('util');
const https = require('https');
const fs2 = require('fs');
const colors = require('colors');


const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// Configure axios with cookie support
wrapper(axios);
const cookieJar = new CookieJar();
const http = axios.create({
  jar: cookieJar,
  withCredentials: true,
  headers: {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': 'https://revoicer.app/user/login',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  }
});

function cleanAndExtractText(input) {
  let extractedText = input.trim();
  // Nettoyer le texte pour enlever les caractères spéciaux pouvant affecter les noms de fichiers
  const cleanText = extractedText.replace(/[\/\\?%*:|"<>.,;=+&^$#!'@()]/g, '').replace(/\s+/g, '_');
  // Limiter la longueur du texte nettoyé à 35 caractères
  const limitedText = cleanText.substring(0, 50);
  return limitedText;
}


// Ajouter une fonction d'aide pour sélectionner un élément aléatoire d'un tableau
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fonction principale pour la gestion de la vocalisation
async function vocalise(tts, config, openai, action = "other", effect) {

  let textToSpeak = Array.isArray(tts) ? getRandomItem(tts) : tts;
  console.log(textToSpeak)

  // Chemin du répertoire à vérifier
  let dirPath = path.join(`./${config[config.vocalisation.engine].path_output}/${action}/`);

  // Vérifie si le répertoire existe
  if (!fs2.existsSync(dirPath)) {
    fs2.mkdirSync(dirPath, { recursive: true }); // `recursive: true` permet de créer des sous-répertoires si nécessaire
    fs2.writeFileSync(path.join(dirPath, '.gitkeep'), ''); // Crée un fichier vide
    //console.log('Répertoire créé:', dirPath);
  }

  let speechFile = "";
  switch (config.vocalisation.engine) {
    case "openAI":

      speechFile = path.resolve(`./${config.openAI.path_output}/${action}/openAI_${config.openAI.assistant_voice}_${cleanAndExtractText(textToSpeak)}.mp3`);

      // Vérifier si le fichier existe
      if (fs2.existsSync(speechFile)) {
        //console.log('Le fichier existe déjà.');
        playAudio(config,speechFile, effect);
      } else {
        sendTextToOpenAI(textToSpeak, speechFile, openai, config, effect);
      }

      break;
    case "revoicer":
      speechFile = path.resolve(`./${config.revoicer.path_output}/${action}/revoicer_${config.revoicer.default_langage}_${config.revoicer.default_voice}_${config.revoicer.default_tone}_${cleanAndExtractText(textToSpeak)}.mp3`);
      if (fs2.existsSync(speechFile)) {
        //console.log('Le fichier existe déjà.');
        playAudio(config,speechFile, effect);
      }
      else {
        await mainRevoicer(textToSpeak, config, speechFile, effect);
      }
      break;
    case "google":
      // Implémentez la logique pour Google TTS ici
      break;
    case "sound_bank":
      await sound_bank_play(config,action);
      break;
  }
}
// -----------------------------
// Section Sound_bank
// -----------------------------
function sound_bank_play(config, action) {
  const speechFile = path.resolve(`./${config.sound_bank.path_output}/${action}/`);

  // Lire le contenu du dossier
  fs2.readdir(speechFile, (err, files) => {
    if (err) {
      console.error("Erreur lors de la lecture du dossier:", err);
      return;
    }

    // Filtrer pour garder uniquement les fichiers .mp3
    const mp3Files = files.filter(file => file.endsWith('.mp3'));

    if (mp3Files.length > 0) {
      // Choisir un fichier au hasard
      const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
      const fullPath = path.join(speechFile, randomFile);

      // Jouer le fichier audio sélectionné
      playAudio(config,fullPath, "none");
    } else {
      // Aucun fichier mp3 trouvé, jouer le son par défaut
      const defaultPath = path.resolve(`./${config.sound_bank.path_output}/default/bip.mp4`);
      playAudio(config,defaultPath, config.effect);
    }
  });
}




// -----------------------------
// Section openAI
// -----------------------------
async function sendTextToOpenAI(textToSpeak, speechFile, openai, config, effect) {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: config.openAI.assistant_voice,
      input: textToSpeak
    });
    const arrayBuffer = await mp3.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(speechFile, buffer);
    //console.log(`Fichier de discours enregistré à ${speechFile}`);
    playAudio(config,speechFile, effect);
  } catch (error) {
    console.error("Erreur lors de la génération ou de la lecture du fichier audio:", error);
  }
}





// -----------------------------
// Section revoicer
// -----------------------------


// Fonction pour vérifier la validité des cookies
function isCookieValid() {
  const cookies = cookieJar.getCookiesSync('https://revoicer.app');
  const sessionCookie = cookies.find(cookie => cookie.key === 'ci_session');
  if (!sessionCookie) {
    console.log('Aucun cookie de session trouvé.');
    return false;
  }

  /*console.log(`Cookie trouvé: ${sessionCookie.key}=${sessionCookie.value}`);
  console.log(`Date d'expiration du cookie: ${sessionCookie.expires}`);
  console.log(`Date actuelle: ${new Date().toISOString()}`);*/

  const isExpired = sessionCookie.expires <= new Date();

  if (isExpired) {
    //console.log('Le cookie est expiré.');
  } else {
    //console.log('Le cookie est toujours valide.');
  }

  return !isExpired;
}

// Fonction pour se connecter à Revoicer
async function login(email, password) {
  const url = 'https://revoicer.app/user/authenticate';
  const params = new URLSearchParams({ email, password });
  try {
    const response = await http.post(url, params.toString());
    //console.log(response.status === 200 ? 'Connexion réussie!' : 'Connexion échouée avec le statut:' + response.status);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error.response ? error.response.data : error.message);
  }
}

// Fonction pour charger les cookies depuis un fichier local
async function loadCookies() {
  try {
    // Assurez-vous que le chemin du fichier est correct et accessible
    const cookiesText = await fs.readFile('./core/data/cookies.json', 'utf8');
    try{
      const cookies = JSON.parse(cookiesText);
      cookies.forEach(cookieData => {
        const cookie = new Cookie({
          key: cookieData.key,
          value: cookieData.value,
          domain: cookieData.domain,
          path: cookieData.path,
          expires: new Date(cookieData.expires),
          secure: cookieData.secure,
          httpOnly: cookieData.httpOnly,
          sameSite: cookieData.sameSite
        });
        cookieJar.setCookieSync(cookie, 'https://revoicer.app/');
    });
    }
    catch{
      console.error('Cookies inexploitable');
    }
    
    //console.log("Cookies chargés avec succès");
  } catch (error) {
    console.error('Échec du chargement des cookies:', error);
    //throw error;  // Renvoyer l'erreur pour une meilleure visibilité de la chaîne d'appel
  }
}

// Fonction pour sauvegarder les cookies dans un fichier local
async function saveCookies() {
  const cookieArray = cookieJar.getCookiesSync('https://revoicer.app').map(cookie => cookie.toJSON());
  await writeFile('./core/data/cookies.json', JSON.stringify(cookieArray));
}

// Fonction pour envoyer du texte à Revoicer et recevoir un fichier audio
async function sendTextToRevoicer(text, languageSelected, voiceSelected, toneSelected, campaignId, player_path, fullFilename, effect,config) {
  const url = 'https://revoicer.app/speak/generate_voice';
  const data = JSON.stringify({ languageSelected, voiceSelected, toneSelected, text: `<p>${text}</p>**********${toneSelected}||||||||||`, simpletext: text, charCount: text.length, wordsCount: text.split(/\s+/).length, campaignId });
  const formData = new URLSearchParams({ data });
  //console.log(data)

  try {
    const response = await http.post(url, formData);
    if (response.status === 200) {
      console.log('Texte envoyé avec succès à Revoicer');
      //console.log(response.data);
      const downloadLink = response.data.data.voice.download_link;
      await handleVoiceDownloadAndPlay(downloadLink, player_path, fullFilename, effect,config);
    } else {
      console.log("Échec de l'envoi du texte avec le statut:", response.status);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du texte à Revoicer:", error);
  }
  //}
}

// Fonction pour télécharger le fichier audio généré.
function downloadVoiceFile(url, speechFile, effect) {
  return new Promise((resolve, reject) => {
    const file = fs2.createWriteStream(speechFile);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        //console.log('Téléchargement terminé :', speechFile);
        resolve(speechFile);
      });
    }).on('error', err => {
      fs2.unlink(speechFile, () => { });  // Supprime le fichier en cas d'erreur.
      console.error('Erreur lors du téléchargement du fichier:', err);
      reject(err);
    });
  });
}

// Fonction pour gérer le téléchargement et la lecture du fichier audio.
async function handleVoiceDownloadAndPlay(downloadLink, player_path, speechFile, effect,config) {
  try {
    const filePath = await downloadVoiceFile(downloadLink, speechFile);
    playAudio(config,filePath, effect);
  } catch (error) {
    console.error('Erreur lors de la gestion du fichier vocal:', error);
  }
}

async function mainRevoicer(text, config, path, effect) {
  try{
    await loadCookies();
  }
  catch{
    await login(config.revoicer.email, config.revoicer.password);
  }
  

  if (!isCookieValid()) {
    await login(config.revoicer.email, config.revoicer.password);
    console.log("Le cookies n'est plus valide")
  }
  await sendTextToRevoicer(text, config.revoicer.default_langage, config.revoicer.default_voice, config.revoicer.default_tone, config.revoicer.campaignId, config.player_path, path, effect);
  await saveCookies();
}

// -----------------------------
// Section commune, lecteur audio
// -----------------------------
// Fonction pour jouer un fichier audio localement
function playAudio(config,speechFile, effects = "none") {
  let command={
    class_action :"sound",
    action : "playoradd",
    volume : config.vocalisation.volume,
    effect : effects,
    path: speechFile,
    type : "infoprio",

  };

  
    const { class_action, type,path, action, volume,effect } = command;
    const params = new URLSearchParams({ class_action,path,action, type, volume, effect }).toString();
    const url = `http://127.0.0.1:2953?${params}`;
    
    axios.get(url)
        .then(response => {
            console.log(`Received response: ${response.data}`.green);
        })
        .catch(error => {
            console.error(`Error sending request: ${error.message}`.red);
        });
}

module.exports = {
  vocalise,
  playAudio
};

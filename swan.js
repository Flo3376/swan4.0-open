// Importation des modules nécessaires pour le fonctionnement du programme.
// Importe le module 'fs' pour la gestion des fichiers, permettant de lire et écrire des fichiers localement.
const fs2 = require('fs');
// Importe le module 'colors' pour permettre la coloration des textes dans la console, améliorant la lisibilité des logs.
const colors = require('colors');
// Importe des fonctions spécifiques depuis le module de configuration pour charger, afficher et mettre à jour la configuration du système.
const { load_config, display_config, update_config } = require("./core/config/configurator");
// Importe le module 'openai' pour interagir avec les APIs d'OpenAI, notamment GPT et autres modèles.
const { OpenAI, Configuration } = require('openai');
// Importe des fonctions du gestionnaire d'assistants AI pour créer ou mettre à jour des instances d'assistants virtuels.
const { createAssistantIfNotExist, updateAssistant } = require('./core/system/openaiAssistant');
// Importe des fonctions pour initialiser et récupérer l'état des boutons d'un joystick, utilisé pour interagir avec le système via un contrôleur physique.
const { initializeDevice: initializeJoystick, getButtonState: getJoystickButtonState } = require('./core/system/JoyTracker');
// Importe des fonctions pour écouter les entrées du clavier et récupérer l'état des touches pressées, utilisé pour des commandes via clavier.
const { initializeKeyboardListener, getButtonState: getKeyboardButtonState } = require('./core/system/keyboardListener');
// Importe des fonctions pour gérer l'enregistrement audio, incluant le démarrage, l'arrêt de l'enregistrement, et la vérification de l'état d'enregistrement.
const { startRecording, stopRecording, isRecording } = require('./core/system/audioRecorder');
// Importe des fonctions pour vocaliser du texte et jouer des fichiers audio, utilisé pour les réponses audibles du système.
const { vocalise, playAudio } = require('./core/system/vocalizor');
// Importe un module pour exécuter des commandes Python, utilisé pour des interactions système avancées.
const outputCommander = require('./core/system/outputCommander.js');
// Importe un module de reconnaissance vocale pour écouter et traiter des commandes vocales.
const voiceModule = require('./core/system/listen.js');
// Importe une fonction pour générer des commandes basées sur la configuration du système, utilisé pour paramétrer des commandes personnalisées.
const { generateCommands } = require('./core/system/command');
// Importe une fonction pour tokeniser des entrées textuelles, utile pour le traitement et l'analyse du langage naturel.
const { tokenize } = require('./core/system/tokenizer');
// Importe un module de chat pour gérer des dialogues interactifs avec un assistant virtuel.
const ChatModule = require('./core/system/chat');
// Importe un contrôleur pour interagir avec l'API de Spotify, permettant de contrôler la musique.
const SpotifyController = require('./core/system/spotify');
// Importe un module de pour gérer la musique en local
const localPlayer = require('./core/system/localPlayer.js');
;

const yaml = require('js-yaml');

var silent_mod=false;
var player_type="none";

const path = require('path');

const { exec } = require('child_process');

const { cleanDirectory } = require('./core/system/fileCleaner');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();


// Servir des fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'core', 'web')));


// -----------------------------
// Section de configuration par le web
// -----------------------------
app.set('view engine', 'ejs'); // Utiliser EJS comme moteur de template
app.set('views', path.join(__dirname, 'core', 'web'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Route pour afficher le formulaire
app.get('/lexique2', (req, res) => {
    try {
      const filePath = path.join(__dirname, 'core', 'config', 'lexique.yaml');
      const fileContents = fs2.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContents);
      //console.log(JSON.stringify(data, null, 2)); // Ajoutez cette ligne pour inspecter les données
      res.render('lexique', { data: data });
    } catch (e) {
      console.error(e);
      res.status(500).send('Erreur lors de la lecture du fichier');
    }
  });

// Route pour afficher le formulaire
app.get('/get_lexique', (req, res) => {
    try {
      const filePath = path.join(__dirname, 'core', 'config', 'lexique.yaml');
      const fileContents = fs2.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContents);
      const json=JSON.stringify(data, null, 2);
      res.json(data); // Renvoie le JSON comme réponse
    } catch (e) {
      console.error(e);
      res.status(500).send('Erreur lors de la lecture du fichier');
    }
  });

// Route pour afficher le formulaire
app.get('/lexique', (req, res) => {
    try {
      res.render('lexique2');
    } catch (e) {
      console.error(e);
      res.status(500).send('Erreur lors de la lecture du fichier');
    }
  });
  app.get('/config', (req, res) => {
    try {
      const filePath = path.join(__dirname, 'core', 'config', 'config.yaml');
      const fileContents = fs2.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContents);
      //console.log(JSON.stringify(data, null, 2)); // Ajoutez cette ligne pour inspecter les données
      res.render('index2', { data: data });
    } catch (e) {
      console.error(e);
      res.status(500).send('Erreur lors de la lecture du fichier');
    }
  });

  app.post('/update_lexique', (req, res) => {
    const nouvelleDonnee = req.body;
    // Convertir l'objet JSON en YAML
    const yamlStr = yaml.dump(nouvelleDonnee);
    console.log("YAML généré:", yamlStr); // Log pour voir le YAML généré

    // Chemin du fichier où sauvegarder le YAML
    const filePath = path.join(__dirname, 'core', 'config', 'lexique.yaml');

    // Écrire les données dans le fichier YAML
    fs2.writeFile(filePath, yamlStr, 'utf8', (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Erreur lors de la sauvegarde du fichier.');
        } else {
            res.json({ message: `Donnée mise à jour et sauvegardée dans ${filePath}` });
            restart();
        }
    });
});

const PORT = 2954;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



// -----------------------------
// Section de chargement des configurations et lexiques
// -----------------------------

let config = load_config('./core/config/config.yaml');
if (config) {
    console.log(colors.green('Config chargée.'));
    console.log();
    if (config.debug_sw) display_config(config);
}
else {
    console.log(colors.red('Echec du chargement de la confiration, coupure du programme'));
    process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
}

let lexique = load_config('./core/config/lexique.yaml');
if (lexique) {
    console.log(colors.green('Lexique chargée.'));
    console.log();
}
else {
    console.log(colors.red('Echec du chargement du lexique, coupure du programme'));
    process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
}


// -----------------------------
// Section Initialisation du système OpenAI
// -----------------------------
let assistant, thread, openai;

//vérification que revoicer peut être utiliser
const openAI_test = config.openAI;
const openAI_data = ['apiKey', 'model_assistant', 'assistant_voice', 'assistant_name'];

// Vérifiez si toutes les clés sont non nulles et non vides
const openAI_set = openAI_data.every(openAI_data => openAI_test[openAI_data] && openAI_test[openAI_data] !== '');

//création de l'objet multi-utilité openAI
if (openAI_set) {
    openai = new OpenAI({ apiKey: config.openAI.apiKey, });
}


// Fonction pour initialiser l'assistant
const { getOrCreateThreadId } = require('./core/system/threadManager');

async function initializeAssistant() {
    assistant = await createAssistantIfNotExist(config.openAI, openai);

    const updates = {
        'assistant_id': `"${assistant.id}"`
    };
    update_config('./core/config/config.yaml', updates);
    config.openAI.assistant_id = assistant.id
}

// Fonction pour initialiser le thread
async function initializeThread() {
    thread = await getOrCreateThreadId(config.openAI, openai);

    // Vérifier si le thread_id a été correctement récupéré ou créé
    if (!thread) {
        console.error('Erreur : Impossible de récupérer ou créer un thread_id');
        process.exit(1); // Arrêter le programme en cas d'erreur
    }
    //console.log(thread)
    const updates = {
        'thread_id': `"${thread}"`
    };
    update_config('./core/config/config.yaml', updates);
    config.openAI.thread_id = thread
}




// -----------------------------
// Section push to talk clavier et joystick/manette
// -----------------------------

//vérification qu'une touche clavier est informé (obligatoire)
if (config.push_to_talk.keyboard.keyboard_key && config.push_to_talk.keyboard.keyboard_key != '') {
    console.log(colors.green('Touche du clavier utilisée : ') + config.push_to_talk.keyboard.keyboard_key);
}
else {
    console.log(colors.red('Aucun touche clavier programmée, coupure du programme'));
    process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
}

//vérification qu'un bouton de manette ou de joystique est informé (optionnel)
const joystick_test = config.push_to_talk.joystick;
const joystick_data = ['vendorId', 'productId', 'tramId', 'bp_Id'];

// Vérifiez si toutes les clés sont non nulles et non vides
const joystick_set = joystick_data.every(joystick_data => joystick_test[joystick_data] && joystick_test[joystick_data] !== '');

//si un joystick / manette à été correctement informé
if (joystick_set) {
    const { vendorId, productId, tramId, bp_Id } = config.push_to_talk.joystick;
    const logMessage = colors.green("Un bouton sur une manette ou un joystick a été renseigné : ");
    const joystickInfo = `{${vendorId}/${productId}/${tramId}/${bp_Id}}`;

    console.log(logMessage + joystickInfo);
    console.log();
}
else {
    console.log(colors.yellow("Aucun bouton n'a été renseigner "));
    console.log();
}

/**
 * Fonction asynchrone pour initialiser les périphériques d'entrée : clavier et joystick/manette.
 * Cette fonction configure les périphériques pour qu'ils soient prêts à recevoir et traiter des entrées.
 */
async function initializeHardware() {
    // Initialisation du clavier :
    initializeKeyboardListener(config.push_to_talk.keyboard.keyboard_key);
    console.log(colors.green('Clavier initialisé et écoute des événements en cours...'));

    // La variable 'joystick_set' détermine si la configuration du joystick/manette a été définie correctement auparavant.
    if (joystick_set) {
        // Tente d'initialiser le joystick en passant la configuration à la fonction 'initializeJoystick'.
        const joystickDevice = initializeJoystick(config.push_to_talk.joystick);

        // Si l'initialisation du joystick réussit et retourne un dispositif valide,
        if (joystickDevice) {
            console.log(colors.green('Manette initialisée et écoute des événements en cours...'));
        }
    }
    console.log();
    // La fonction 'checkButtonStates' est responsable de vérifier l'état actuel des boutons sur les périphériques et d'agir en conséquence.
    setInterval(checkButtonStates, 250);
}


/**
 * Vérifie l'état des boutons du clavier et du joystick et gère l'enregistrement audio en conséquence.
 */
async function checkButtonStates() {
    const joystickState = getJoystickButtonState();
    const keyboardState = getKeyboardButtonState();

    //si le push to talk est solicité et que aucun enreogsitrment n'est déjà en cours
    if ((joystickState || keyboardState) && !isRecording()) {
        startRecording(config.mic.path_input);
        //si le push to talk n'est plus solicité et qu'un enreogsitrment est en cours
    } else if (!joystickState && !keyboardState && isRecording()) {
        //récupére l'adresse du fichier son aprés la fin de l'enristrement
        let sound_file = await stopRecording();
        //si openAI est bien initialisé
        if (openAI_set) {
            //si l'audiorecoder à retourner un nom de fichier
            if (sound_file !== null) {
                const transcription = await openai.audio.transcriptions.create({
                    file: fs2.createReadStream(sound_file),
                    model: "whisper-1",
                });
                console.log("        " + transcription.text);

                if (config.tokenizer == "openAI") {
                    chat.ask_question(transcription.text);
                }
                else {
                    let result = await tokenize(transcription.text)
                    if (result.isTokenized) {
                        console.log(lexique[result.response].rules[0].interact)
                        controller.handleCommand(lexique[result.response].rules[0].interact)
                        vocalise(lexique[result.response].rules[0].responses, config, openai, "", config.effect)
                    }

                }
            }
        }
        else {
            console.log(colors.red(`Impossible d'utiliser ce son car openAI n'est pas configué ou est mal configuré`));
        }
    }
}



// -----------------------------
// Section création de voix
// -----------------------------

//vérification que revoicer peut être utiliser
const revoicer_test = config.revoicer;
const revoicer_data = ['email', 'password', 'campaignId'];

// Vérifiez si toutes les clés sont non nulles et non vides
const revoicer_set = revoicer_data.every(revoicer_data => revoicer_test[revoicer_data] && revoicer_test[revoicer_data] !== '');

//vérification que goole peut être utiliser
const google_test = config.google;
const google_data = ['apiKey'];

// Vérifiez si toutes les clés sont non nulles et non vides
const google_set = google_data.every(google_data => google_test[google_data] && google_test[google_data] !== '');

//vérification qu'un vocaliser est utilisable
if ((config.vocalisation.engine == "revoicer" && revoicer_set) || (config.vocalisation.engine == "openAI" && openAI_set) || (config.vocalisation.engine == "google" && google_set)) {
    console.log(colors.green(`Moteur de vocalisation sélectionné : `) + config.vocalisation.engine);
} else {
    if(config.vocalisation!="sound_bank"){
        console.log(colors.red(`Le moteur de vocalisation "${config.vocalisation}" ne peut être utilisé, veuillez vérifier votre fichier de config, coupure du programme`));
    }
    
    console.log(colors.red(`Passage sur la banque de son interne ("sound_bank")`));
    config.vocalisation="sound_bank";
}




// -----------------------------
// Section interraction clavier souris
// -----------------------------

// Créer une instance du contrôleur d'entrée
const output_c = new outputCommander();
output_c.start('unique_process_id');

// -----------------------------
// Section décryptage vocal autonome (listen de sarah par JP Encausse)
// -----------------------------
const { make_grammar } = require('./core/system/grammar');

//si le module renvoie des logs
const logback_listen = (message) => {
    console.log(message);
};

function findResponsesByAction(lexique, action) {
    for (let key in lexique) {
        const tests = lexique[key];
        if (Array.isArray(tests['rules'])) {
            for (let rule of tests['rules']) {
                if (rule.action === action) {
                    console.log("détection de " + rule.action)
                    return rule.responses; // Retourner le tableau de réponses si l'action correspond
                }
            }
        }
    }
    return null; // Retourner null si aucune action correspondante n'est trouvée
}





// -----------------------------
// Section Musique
// -----------------------------
const MusicManager = require('./core/system/musicManager');
// Initialiser le gestionnaire de lecteurs
const musicManager = new MusicManager(config)


// Si le module reconnaît une commande
const callback_listen = (data) => {
    // Vérifie si 'options' et 'action' sont définis dans 'data'
    if (data && data.options && data.options.action) {

        if (data.options.action.startsWith("mm_")) {
            musicManager.handleCommand(data.options.action, data.options.info || null, ( message) => {
                console.log(`Callback reçu : ${message}`);
                vocalise(message, config, openai, data.options.action, "none");  // Vocalise la réponse liée à l'action
            });
            return;
        }

        // Si l'action contient "system_restart" et que le mode silencieux n'est pas activé
        if (data.options.action.includes("system_restart") && !silent_mod) {
            restart();  // Redémarre le système
        } 
        
        // Active le mode silencieux (silent_mod) si l'action contient "silent_mod" et que ce mode n'est pas déjà activé
        else if (data.options.action.includes("silent_mod") && !silent_mod) {
            silent_mod = true;  // Passe en mode silencieux
            console.log("silent_mod : " + silent_mod);
            const responses = findResponsesByAction(lexique, data.options.action);
            vocalise(responses, config, openai, data.options.action, config.effect);  // Vocalise la réponse liée à l'action
        } 
        
        // Désactive le mode silencieux si l'action contient "present_mod" et que le mode silencieux est activé
        else if (data.options.action.includes("present_mod") && silent_mod) {
            silent_mod = false;  // Désactive le mode silencieux
            console.log("silent_mod : " + silent_mod);
            const responses = findResponsesByAction(lexique, data.options.action);
            vocalise(responses, config, openai, data.options.action, config.effect);  // Vocalise la réponse
        } 
        
        // Réduit le volume si l'action contient "swan_minus" et que le mode silencieux n'est pas activé
        else if (data.options.action.includes("swan_minus") && !silent_mod) {
            if (config.vocalisation.volume >= 10) {  // Vérifie si le volume est supérieur ou égal à 10
                config.vocalisation.volume = config.vocalisation.volume - 10;  // Réduit le volume de 10
                const updates = {
                    'volume': config.vocalisation.volume  // Met à jour la configuration avec la nouvelle valeur de volume
                };
                update_config('./core/config/config.yaml', updates);  // Sauvegarde la nouvelle configuration
            }
            const responses = findResponsesByAction(lexique, data.options.action);
            vocalise(responses, config, openai, data.options.action, config.effect);  // Vocalise la réponse
        } 
        
        // Augmente le volume si l'action contient "swan_plus" et que le mode silencieux n'est pas activé
        else if (data.options.action.includes("swan_plus") && !silent_mod) {
            if (config.vocalisation.volume <= 90) {  // Vérifie si le volume est inférieur ou égal à 90
                config.vocalisation.volume = config.vocalisation.volume + 10;  // Augmente le volume de 10
                const updates = {
                    'volume': config.vocalisation.volume  // Met à jour la configuration avec la nouvelle valeur de volume
                };
                update_config('./core/config/config.yaml', updates);  // Sauvegarde la nouvelle configuration
            }
            const responses = findResponsesByAction(lexique, data.options.action);
            vocalise(responses, config, openai, data.options.action, config.effect);  // Vocalise la réponse
        } 
        
        // Si aucune des actions précédentes n'est correspondante, traite la commande via les règles du lexique
        else {
            if (!silent_mod) {  // Continue uniquement si le mode silencieux n'est pas activé
                const responses = findResponsesByAction(lexique, data.options.action);  // Trouve les réponses liées à l'action
                const ruleInteract = lexique[data.options.action]?.rules[0]?.interact;  // Récupère la règle 'interact' associée à l'action

                if (ruleInteract) {
                    if (ruleInteract.output !== "none") {
                        output_c.handleCommand(ruleInteract,data.options.action);  // Exécute la commande associée à l'interaction
                    }
                    
                    // Gère l'effet à appliquer lors de la vocalisation
                    let effect = config.effect;
                    console.log("effet définie : " + lexique[data.options.action].effect);
                    if (lexique[data.options.action].effect) {
                        console.log("effet répercuté : " + lexique[data.options.action].effect);
                        effect = lexique[data.options.action].effect;  // Met à jour l'effet si défini dans le lexique
                    }
                    vocalise(responses, config, openai, data.options.action, effect);  // Vocalise la réponse avec l'effet défini

                    // Gère l'ambiance musicale si elle est définie dans le lexique
                    if (lexique[data.options.action]?.ambiance?.track) {
                        if (lexique[data.options.action].ambiance.player == "Spotify") {
                            //player_type="spotify";
                            let music = lexique[data.options.action].ambiance.track;
                            musicManager.pause()
                                .then(() => musicManager.setPlayer("spotify"))
                                .then(() => musicManager.addMusics(music))
                                .then(() => {
                                    console.log('Musique ajoutée sur Spotify avec succès.');
                                })
                                .catch((error) => {
                                    console.error('Erreur lors de l\'exécution des commandes :', error);
                                });
                         }
                        if(lexique[data.options.action].ambiance.player == "Local")
                        {
                            let music = lexique[data.options.action].ambiance.track;

                            musicManager.pause()
                                .then(() => musicManager.setPlayer("local"))
                                .then(() => musicManager.addMusics(music))
                                .catch((error) => {
                                    console.error('Erreur lors de l\'exécution des commandes :', error);
                                });
                        }
                    }
                } else {
                    // Si la propriété 'rules' ou 'interact' n'est pas définie dans le lexique
                    vocalise("Alerte, corruption des lexiques détectée. Veuillez vider le répertoire grammar des fichiers auto.", config, openai, "", "none");
                    console.error(`La propriété 'rules' est manquante ou 'interact' n'est pas définie pour la commande ${data.options.action}`);
                    console.log(data.options.action);
                    console.log(lexique);
                }
            }
        }
    } else {
        // Message d'erreur si 'data.options' ou 'data.options.action' est indéfini
        console.error("Erreur: 'data.options' ou 'data.options.action' est undefined. Le programme a détecté un son mais ne l'a pas reconnu.");
        console.log("Veuillez consulter le fichier audio pour plus de détails:", data.filename);
    }
};




// -----------------------------
// Section chat / traitement des demandes envoyées via le clavier ou le Speech To Text (SST)
// -----------------------------

const chat = new ChatModule(openai, config);
chat.start();

chat.on('response', (response) => {
    /// console.log("Réponse de l'assistant:", response);
    vocalise(response, config, openai, "other", config.effect)
});

chat.on('error', (error) => {
    console.error("Erreur reçue:", error);
});





// -----------------------------
// Section initialisation et redémarrage
// -----------------------------
async function initializeSystem() {
    //playAudio("F:\\Documents\\GitHub\\swan4.0\\sound\\output_sound\\revoicer\\other\\voice_2_second_dem.mp3",config.player_path)
    await initializeHardware();
    await vocalise("Démarrage des systémes en cours.", config, openai, "error_generic", "none");
    
    await make_grammar();
    
    await generateCommands();
    

    if (openAI_set) {
        await initializeAssistant();
        await initializeThread();
        console.log(colors.cyan(`La retranscription de notre conversation est disponible a cette adresse : https://platform.openai.com/playground/assistants?assistant=${config.openAI.assistant_id}&thread=${config.openAI.thread_id}`))
        console.log()
    }
    await voiceModule.start('unique-id', config.listen, callback_listen, logback_listen);
    
    await tokenize("ai-tus en ligne"); //plein de faute, c'est volontaire
    await tokenize("Es-tu en ligne");
    //await spotify.playTrack("0C80GCp0mMuBzLf3EAXqxv");

}

async function restart() {
    config = load_config('./core/config/config.yaml');
    lexique = load_config('./core/config/lexique.yaml');
    
    initializeSystem()
}

// Initialisation du système
(async () => {
    try {
        await initializeSystem();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du système:', error);
        process.exit(1);
    }
})();


// -----------------------------
// Section module de nettoyage
// -----------------------------
cleanDirectory('sound/input_listen_sound');
cleanDirectory('core/exe/my_player/output');
cleanDirectory('core/exe/megatron/output');
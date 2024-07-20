const fs2 = require('fs');   // Importe le module fs pour la gestion des fichiers.
const colors = require('colors');





// -----------------------------
// Section de chargement de la configuration
// -----------------------------
const { load_config, display_config,update_config } = require("./core/config/configurator")

//tentative de chargement du la configuration
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
// Section openAI
// -----------------------------
let assistant;
let thread;
let openai

const { OpenAI, Configuration } = require('openai');

const { createAssistantIfNotExist, updateAssistant } = require('./core/system/openaiAssistant');
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
    config.openAI.assistant_id=assistant.id
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
    config.openAI.thread_id=thread
}




// -----------------------------
// Section push to talk clavier et joystick/manette
// -----------------------------
const { initializeDevice: initializeJoystick, getButtonState: getJoystickButtonState } = require('./core/system/JoyTracker');
const { initializeKeyboardListener, getButtonState: getKeyboardButtonState } = require('./core/system/keyboardListener');
const { startRecording, stopRecording, isRecording } = require('./core/system/audioRecorder');

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

                if(config.tokenizer=="openAI")
                {
                    chat.ask_question(transcription.text);
                }
                else{
                    let result =await tokenize(transcription.text)
                    if (result.isTokenized)
                    {
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
const { vocalise, playAudio } = require('./core/system/vocalizor');


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
if ((config.vocalisation == "revoicer" && revoicer_set) || (config.vocalisation == "openAI" && openAI_set) || (config.vocalisation == "google" && google_set)) {
    console.log(colors.green(`Moteur de vocalisation sélectionné : `) + config.vocalisation);
} else {
    console.log(colors.red(`Le moteur de vocalisation "${config.vocalisation}" ne peut être utilisé, veuillez vérifier votre fichier de config, coupure du programme`));
    process.exit(1); // Arrête l'exécution du programme avec un code d'erreur
}
//vocalisation d'une voix pour le démarrage du programme
///vocalise("Bonjour! je m'appelle swan, votre intelligence artificielle. Que puis je pour vous?", config, openai)
//playAudio("F:\\Documents\\GitHub\\swan4.0\\sound\\output_sound\\revoicer\\other\\voice_2_second_dem.mp3",config.player_path)





// -----------------------------
// Section interraction clavier souris
// -----------------------------
const KeyCommander = require('./core/system/KeyCommander .js');

// Créer une instance du contrôleur d'entrée
const controller = new KeyCommander();
/*
// Exemple de commande de souris pour déplacer la souris
const mouseCommand = {
    output: 'mouse',
    action: 'move',
    x: 500,
    y: 300
  };

setTimeout(() => controller.handleCommand(mouseCommand), 1000);
*/


// -----------------------------
// Section décryptage vocal autonome (listen de sarah par JP Encausse)
// -----------------------------
const voiceModule = require('./bin/listen.js');
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

//si le module reconnait une commande
const callback_listen = (data) => {
    console.log('Recognition result:', data);

    if (data.options.action.includes("spotify")) {
        spotify_go(data.options.action)
    }
    else if (data.options.action.includes("system_restart")) {
        restart();
    }
    else{
        const responses = findResponsesByAction(lexique, data.options.action);
        //console.log(responses);// Affiche le tableau de réponses ou null si aucune action ne correspond
        vocalise(responses, config, openai, data.options.action, config.effect)
    }
};





// -----------------------------
// Section tokenizer
// -----------------------------
const { generateCommands } = require('./core/system/command'); // Assurez-vous que le chemin d'accès est correct
const { tokenize} = require('./core/system/tokenizer'); // Assurez-vous que le chemin d'accès est correct





// -----------------------------
// Section chat / traitement des demandes envoyées via le clavier ou le Speech To Text (SST)
// -----------------------------
const ChatModule = require('./core/system/chat');

const chat = new ChatModule(openai,  config);
chat.start();

chat.on('response', (response) => {
   /// console.log("Réponse de l'assistant:", response);
    vocalise(response, config, openai, "other", config.effect)
});

chat.on('error', (error) => {
    console.error("Erreur reçue:", error);
});





// -----------------------------
// Section spotify
// -----------------------------
const SpotifyController = require('./core/system/spotify');
const spotifyController = new SpotifyController(config.spotify)

async function spotify_go(action) {
    const success = await spotifyController.spotify_action(action);
    if (!success) {
      vocalise("Désolé mais je n'y arrive pas.", config, openai, "error_generic", config.effect);
    }
    else{
        const responses = findResponsesByAction(lexique, action);
        vocalise(responses, config, openai, action, config.effect)
    }
  }
  async function spotify_search(search_item) {
    await spotifyController.refreshAccessToken(); // Rafraîchir le token
  
    try {
      const results = await spotifyController.searchTracks(search_item);
      if (results && results.length > 0) {
        const firstTrack = results[0]; // Prendre la première piste
        const albumId = firstTrack.album.id; // Obtenir l'ID de l'album de la première piste
  
        await spotifyController.playAlbum(albumId); // Jouer l'album
        console.log("Album joué :", albumId);
      } else {
        console.log("Aucun résultat trouvé pour la recherche.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche ou de la lecture de l'album :", error);
    }
  }
  
 // spotify_search("lofi médiavale");








///////////////////////////////////////////////

// Fonction pour initialiser le système
async function initializeSystem() {
    await initializeHardware();
    await make_grammar();
    await generateCommands();
    
    if (openAI_set) {
        await initializeAssistant();
        await initializeThread();
        console.log(colors.cyan(`La retranscription de notre conversation est disponible a cette adresse : https://platform.openai.com/playground/assistants?assistant=${config.openAI.assistant_id}&thread=${config.openAI.thread_id}`))
        console.log()
    }
    await voiceModule.start('unique-id', config.listen, callback_listen, logback_listen);
    await tokenize("ai-tus en line"); //plein de faute, c'est volontaire
    await tokenize("Es-tu en ligne"); 
    vocalise("Bonjour! je m'appelle swan, votre intelligence artificielle. Que puis je faire pour vous?", config, openai,"",config.effect)
    //await spotifyController.playTrack("0C80GCp0mMuBzLf3EAXqxv");
    
}

async function restart ()
{
    //setTimeout(() => voiceModule.cleanUp(), 10000);
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
/*
console.log(colors.red('Ce texte est en rouge'));
console.log(colors.green('Ce texte est en vert'));
console.log(colors.yellow('Ce texte est en jaune'));
console.log(colors.blue('Ce texte est en bleu'));
console.log(colors.magenta('Ce texte est en magenta'));
console.log(colors.cyan('Ce texte est en cyan'));
console.log(colors.white('Ce texte est en blanc'));
console.log(colors.gray('Ce texte est en gris'));*/

const fs = require('fs');
const path = require('path');


// Fonction pour obtenir ou créer un thread_id
async function getOrCreateThreadId(config,openai) {
    // Vérifiez si thread_id existe dans le fichier .env
    let threadId = config.thread_id;
    if (!threadId || threadId ==="") {
        // Créer un nouveau thread si thread_id n'existe pas
        const newThread = await openai.beta.threads.create();
        threadId = newThread.id;
        console.log(`Nouveau thread_id créé et ajouté au fichier de configuration: ${threadId}`);
    } else {
        //console.log(`thread_id existant trouvé dans le fichier  de configuration: ${threadId}`);
    }

    return threadId;
}

module.exports = {
    getOrCreateThreadId
};

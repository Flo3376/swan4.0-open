const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Fonction pour charger les commandes existantes
function loadExistingCommands(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).commands;
}

// Fonction pour sauvegarder les commandes mises à jour
function saveCommands(filePath, commands) {
    const formattedCommands = commands.map(command => ({
        ...command,
        phrases: Array.isArray(command.phrases) ? command.phrases : [command.phrases]
    }));

    const data = JSON.stringify({ commands: formattedCommands }, null, 2);
    const dataWithInlinePhrases = data.replace(/"phrases": \[\n\s*(.*?)\n\s*\]/g, '"phrases": [$1]');
    
    fs.writeFileSync(filePath, dataWithInlinePhrases, 'utf8');
}

// Fonction pour parser la réponse de l'assistant
function parseResponse(response, tokenised = false) {
    const commandsFilePath = path.join(__dirname, './../data/commands.json');
    const existingCommands = loadExistingCommands(commandsFilePath);

    if (tokenised == true) {
        console.log(colors.red("response : ") + response);
    } else {
        console.log(colors.magenta('6-Extraction du texte : ') + "responseParser.js");

        // Rechercher les blocs de code JSON
        const jsonCodePattern = /```json([\s\S]*?)```/g;
        let match;
        const jsonObjects = [];
        while ((match = jsonCodePattern.exec(response)) !== null) {
            const jsonString = match[1].trim();
            try {
                const jsonObject = JSON.parse(jsonString);
                console.log("codejson détecté");
                console.log(jsonObject);

                // Vérifier si une phrase de jsonObject existe déjà dans les commandes existantes
                const phraseExists = jsonObject.phrases.some(phrase => 
                    existingCommands.some(command => command.phrases.includes(phrase))
                );

                if (!phraseExists) {
                    jsonObject.action.tested = false; // Ajouter la variable tested après action
                    existingCommands.push(jsonObject); // Ajouter la nouvelle commande
                    saveCommands(commandsFilePath, existingCommands); // Sauvegarder les commandes mises à jour
                    console.log("Nouvelle commande ajoutée avec tested=false");
                }

                jsonObjects.push(jsonObject);
            } catch (error) {
                console.error("Erreur de parsing JSON:", error);
            }
        }

        const commandPattern = /\[(.*?)\]/g;
        const text = response.replace(commandPattern, '').trim();

        const commands = [];
        while ((match = commandPattern.exec(response)) !== null) {
            commands.push(match[1]);
        }

        return {
            text: text,
            commands: commands,
            jsonObjects: jsonObjects
        };
    }
}

module.exports = {
    parseResponse,
};

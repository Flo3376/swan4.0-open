const fs = require('fs').promises; // Importation de fs.promises pour les opérations de fichiers asynchrones
const yaml = require('js-yaml');
let json_command = [];

// Fonction asynchrone pour charger et traiter le fichier YAML
async function loadConfig() {
    const yamlText = await fs.readFile('./core/config/lexique.yaml', 'utf8');
    return yaml.load(yamlText);
}

// Fonction asynchrone pour générer les commandes à partir de chaque configuration
async function generateCommands() {
    const config = await loadConfig();
    Object.keys(config).forEach(key => {
        if (!key.startsWith('global')) {
            config[key].rules.forEach(rule => {
                const command = {
                    "phrases": rule.questions,
                    "code": rule.action,
                    "response": rule.responses,
                    "action": {
                        "output": rule.interact['output'],
                        "type": rule.interact['type'],
                        "action_input": rule.interact['action_input'],
                        "duration": rule.interact['duration']
                    },
                };
                json_command.push(command);
            });
        }
    });

    // Optionnellement, enregistrer les commandes dans un fichier JSON
    const jsonString = JSON.stringify(json_command, null, 2);
    await fs.writeFile('./core/data/commands.json', jsonString);
    return json_command;
}

module.exports = { generateCommands };

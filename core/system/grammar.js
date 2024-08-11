const fs = require('fs').promises; // Utiliser les promesses de fs pour la lecture de fichiers
const yaml = require('js-yaml');
const xmlbuilder = require('xmlbuilder');
const colors = require('colors');

// Fonction asynchrone pour charger le fichier YAML
async function load_lexique() {
    const yamlText = await fs.readFile('./core/config/lexique.yaml', 'utf8');
    return yaml.load(yamlText);
}

// Fonction asynchrone pour générer le XML pour chaque configuration
async function generateXML(testConfig, config) {
    const xml = xmlbuilder.create('grammar', {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: true
    })
    .att('version', config.global.version)
    .att('xml:lang', config.global.lang)
    .att('mode', config.global.mode)
    .att('root', testConfig.root)
    .att('xmlns', config.global.xmlns)
    .att('tag-format', config.global['tag-format']);

    testConfig.rules.forEach(rule => {
        const ruleElement = xml.ele('rule', {id: testConfig.root, scope: 'public'});
        ruleElement.ele('tag').text('out.action=new Object();');
        ruleElement.ele('item', config.global.name);
        const oneOfElement = ruleElement.ele('one-of');
        rule.questions.forEach(question => {
            oneOfElement.ele('item', {}, question);
        });
        ruleElement.ele('tag').text(`out.action.action="${rule.action}";`);
        rule.responses.forEach(response => {
            // Ajouter du contenu ici si nécessaire
        });
    });

    const xmlString = xml.end({ pretty: true });
    await fs.writeFile(`./core/grammar/auto_${testConfig.root}.xml`, xmlString);
}

// Exporter une fonction asynchrone principale pour être utilisée dans main.js
exports.make_grammar = async function() {
    console.log(colors.green(`Création des fichiers grammar lancée.`) );
    const config = await load_lexique();
    const keys = Object.keys(config);
    for (let key of keys) {
        if (!key.startsWith('global')) {
            await generateXML(config[key], config);
        }
    }
    console.log(colors.green(`Création des fichiers grammar terminée.`) );
    console.log();
};

const fs = require('fs').promises;
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const colors = require('colors');

// Charger le fichier JSON contenant des commandes
async function loadCommands(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

// Comparer la phrase avec les phrases du fichier JSON et noter la probabilité de correspondance
function findBestMatch(userPhrase, commands) {
    const tokenizedUserPhrase = tokenizer.tokenize(userPhrase.toLowerCase());
    let bestMatch = null;
    let highestScore = 0;

    for (const command of commands) {
        for (const phrase of command.phrases) {
            const tokenizedPhrase = tokenizer.tokenize(phrase.toLowerCase());
            const score = natural.JaroWinklerDistance(tokenizedUserPhrase.join(' '), tokenizedPhrase.join(' '));
            if (score > highestScore) {
                highestScore = score;
                bestMatch = { phrase, action: command.code, score };
            }
        }
    }
    return bestMatch;
}

// Fonction de tokenization qui renvoie true/false et une réponse
async function tokenize(input) {
    console.log(colors.magenta('4-Analyse de phrase (passe1) : ') + "tokenizer.js");
    const commands = await loadCommands('./core/data/commands.json');
    const bestMatch = findBestMatch(input, commands);

    if (bestMatch && bestMatch.score > 0.8) {
        console.log(`       Phrase: "${input}"`);
        console.log(`       Meilleure correspondance: "${bestMatch.phrase}"`);
        console.log(`       Action: "${bestMatch.action}"`);
        console.log(`       Probabilité de correspondance: ${bestMatch.score}`);
        console.log();
        return { isTokenized: true, response: bestMatch.action };
    } else {
        console.log(`       Aucune correspondance trouvée pour la phrase: "${input}"`);
        if(bestMatch.score!=null)
        {console.log(`       Probabilité de correspondance: ${bestMatch.score}`);}
        console.log();
        return { isTokenized: false, response: input, commands: commands };
    }
}

module.exports = {
    tokenize,
};

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
let openai;

async function createAssistantIfNotExist(config,openai) {
    const ASSISTANT_NAME = config.assistant_name;
    let assistant = null;

    let assistants = await openai.beta.assistants.list();
    assistant = assistants.data.find(assistant => assistant.name === ASSISTANT_NAME);

    if (assistant == null) {
        const directoryPath = path.join(__dirname, './../../core/prompt');
        let instructions = '';

        try {
            const files = await fs.readdir(directoryPath);
            const sortedFiles = files
                .filter(file => file.endsWith('.md') && /^\d{2}_/.test(file))
                .sort((a, b) => {
                    const numA = parseInt(a.split('_')[0]);
                    const numB = parseInt(b.split('_')[0]);
                    return numA - numB;
                });

            for (const file of sortedFiles) {
                const filePath = path.join(directoryPath, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                instructions += fileContent + '\n';
            }
        } catch (err) {
            console.error('Impossible de lire le répertoire:', err);
        }

        assistant = await openai.beta.assistants.create({
            name: ASSISTANT_NAME,
            instructions: instructions,
            //model: "gpt-4-turbo", // Modèle utilisé pour l'assistant,
            model: config.model_assistant,
            tools: [{ type: "code_interpreter" }],
        });

        //await updateEnvVariable('assistant_id', assistant.id, 'ID du nouvel assistant');
        console.log(`Nouvel assistant créé et ajouté au fichier .env: ${assistant.id}`);
    }
    return assistant;
}

async function updateAssistant(assistant) {
    const ASSISTANT_NAME = config.assistant_name;
    const directoryPath = path.join(__dirname, './../../core/prompt');
    let instructions = '';

    try {
        const files = await fs.readdir(directoryPath);
        const sortedFiles = files
            .filter(file => file.endsWith('.md') && /^\d{2}_/.test(file))
            .sort((a, b) => {
                const numA = parseInt(a.split('_')[0]);
                const numB = parseInt(b.split('_')[0]);
                return numA - numB;
            });

        for (const file of sortedFiles) {
            const filePath = path.join(directoryPath, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            instructions += fileContent + '\n';
        }
    } catch (err) {
        console.error('Impossible de lire le répertoire:', err);
    }

    await openai.beta.assistants.update(assistant.id, {
        instructions: instructions
    });

    console.log('Bot: Les instructions de l\'assistant ont été mises à jour.');
}

module.exports = {
    createAssistantIfNotExist,
    updateAssistant
};

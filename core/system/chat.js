// chatModule.js
const readline = require('readline');
//const { Configuration, OpenAIApi } = require("openai");
const colors = require('colors');
const EventEmitter = require('events');

let rl; // Instance de readline pour l'interface utilisateur

class ChatModule extends EventEmitter {
    constructor(openaiInstance, config) {
        super();  // Initialisation de l'émetteur d'événements
        this.openai = openaiInstance;
        this.assistant = config.openAI.assistant_id;
        this.threadId = config.openAI.thread_id;
        this.tokenizer = config.tokenizer;
    }

    start() {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "Vous: "
        });

        rl.prompt();

        rl.on('line', (line) => {
            if (this.tokenizer == "openAI") {
                this.ask_question(line.trim(), (response) => {
                    //console.log(`Réponse reçue: ${response}`);  // Traitement ou log de la réponse
                });
            }
            else {
                this.emit('response', `Tokenizer interne imposé: : ${line.trim()}`);  // Émet un événement avec la réponse
            }
        });
    }

    async ask_question(question) {
        try {
            const message = await this.openai.beta.threads.messages.create(this.threadId, {
                role: "user",
                content: question
            });

            let collectedText = '';

            // Démarre le streaming des réponses pour le thread en cours
            const run = this.openai.beta.threads.runs.stream(this.threadId, {
                assistant_id: this.assistant
            })
                // Quand un texte est créé, affiche "assistant :" en vert dans la console
                .on('textCreated', (text) => process.stdout.write(colors.green('\nassistant : ')))
                // Quand il y a un delta de texte (une nouvelle portion de texte), affiche cette portion en vert
                .on('textDelta', (textDelta, snapshot) => {
                    process.stdout.write(colors.green(textDelta.value));
                    collectedText += textDelta.value;
                })
                // Quand un appel d'outil est créé, affiche le type d'outil en vert
                .on('toolCallCreated', (toolCall) => process.stdout.write(colors.green(`\nassistant : ${toolCall.type}\n\n`)))
                // Quand il y a un delta dans l'appel d'outil, gère spécifiquement les types d'outil "code_interpreter"
                .on('toolCallDelta', (toolCallDelta, snapshot) => {
                    if (toolCallDelta.type === 'code_interpreter') {
                        if (toolCallDelta.code_interpreter.input) {
                            // Affiche l'entrée du code interpréteur en vert
                            process.stdout.write(colors.green(toolCallDelta.code_interpreter.input));
                        }
                        if (toolCallDelta.code_interpreter.outputs) {
                            // Si des sorties existent, affiche "output>" suivi des logs en vert
                            process.stdout.write(colors.green("\noutput>\n"));
                            toolCallDelta.code_interpreter.outputs.forEach(output => {
                                if (output.type === "logs") {
                                    //  process.stdout.write(colors.green(`\n${output.logs}\n`));
                                }
                            });
                        }
                    }
                })
                // Quand le stream se termine, générer et lire le fichier audio
                .on('end', async () => {
                    console.log(''); // Ajoute une nouvelle ligne pour éviter que le prompt écrase la dernière ligne
                    //console.log(`Assistant: ${collectedText}`);
                    //callback(collectedText);  // Appel du callback avec la réponse
                    this.emit('response', collectedText);  // Émet un événement avec la réponse
                })



            rl.prompt();
        } catch (error) {
            console.error(`Erreur lors de l'envoi de la question: ${error}`);
            //callback(null, error);  // Appel du callback avec erreur
            this.emit('error', error);  // Émet un événement en cas d'erreur

            rl.prompt();
        }
    }
}

module.exports = ChatModule;

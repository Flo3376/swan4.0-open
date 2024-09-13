using NAudio.Midi;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using WindowsInput;
using WindowsInput.Native;
using static System.Collections.Specialized.BitVector32;
using static System.Net.Mime.MediaTypeNames;
//using System.Windows.Forms;  // Nécessaire pour utiliser le presse-papier
using TextCopy;  // Utiliser la bibliothèque TextCopy

namespace megatron
{
    public class CycliqueCommand
    {
        public string ActionInput { get; set; }  // Commande à exécuter
        public int NumberNb { get; set; }  // Nombre de répétitions (-1 pour infini)
        public int Tempo { get; set; }  // Délai entre les répétitions (en millisecondes)

        public CycliqueCommand(string actionInput, int numberNb, int tempo)
        {
            ActionInput = actionInput;
            NumberNb = numberNb;
            Tempo = tempo;
        }
    }

    public class CommandKeyManager
    {
        private readonly InputSimulator simulator;

        // Dictionnaire pour stocker les commandes cycliques
        private Dictionary<string, CycliqueCommand> cycliqueCommands;

        // Initialisation du dictionnaire
        //cycliqueCommands = new Dictionary<string, CycliqueCommand>();

        [DllImport("user32.dll")]
        public static extern IntPtr GetKeyboardLayout(uint idThread);
        
        public static string GetCurrentKeyboardLayout()
        {
            IntPtr layout = GetKeyboardLayout(0); // On passe 0 pour obtenir le layout du thread courant
            int keyboardLayoutId = layout.ToInt32() & 0xFFFF; // On masque pour obtenir les 16 bits inférieurs (le layout ID)

            // Obtenir la culture correspondant à l'identifiant du layout
            var culture = new CultureInfo(keyboardLayoutId);
            return culture.Name; // Par exemple "fr-FR" ou "en-US"
        }

        public CommandKeyManager()
        {
            // Initialisation du dictionnaire
            cycliqueCommands = new Dictionary<string, CycliqueCommand>();

            simulator = new InputSimulator();  // Initialisation du simulateur dans le constructeur
            var layout = GetCurrentKeyboardLayout();
            Console.WriteLine($"Layout clavier actuel : {layout}");
        }



        public void key_command(string command)
        {
            Console.WriteLine("Keysender : received command: " + command);

            // Retirer le caractère '?' ou '/?' au début, si présent
            if (command.StartsWith("/?") || command.StartsWith("?"))
            {
                command = command.Substring(2);
            }

            // Découper la commande en segments de paramètres
            var parameters = command.Split('&');
            var commandDict = new Dictionary<string, string>();

            // Si la commande n'a pas assez d'éléments
            if (parameters.Length <= 1)
            {
                Console.WriteLine("Commande invalide, pas assez d'éléments fournis.");
                return;
            }

            // Remplir le dictionnaire avec les clés et valeurs des paramètres
            foreach (var param in parameters)
            {
                var keyValue = param.Split('=');
                if (keyValue.Length == 2)
                {
                    //Console.WriteLine($"Key : '{keyValue[0].ToLower()}'  Value: '{WebUtility.UrlDecode(keyValue[1])}'");
                    commandDict[keyValue[0].ToLower()] = WebUtility.UrlDecode(keyValue[1]);
                }
            }

            // Vérification des paramètres requis
            if (!commandDict.ContainsKey("class_action") || commandDict["class_action"] != "keysender")
            {
                Console.WriteLine($"Classe de commande invalide. Seule la classe 'keysender' est prise en charge. Classe reçue : '{commandDict["class_action"]}'");
                return;
            }

            if (!commandDict.ContainsKey("type"))
            {
                Console.WriteLine("Type d'action non spécifié.");
                return;
            }

            // Extraire les inputs de la commande
            var actionInput = commandDict.ContainsKey("action_input") ? commandDict["action_input"] : "";
            var matches = Regex.Matches(actionInput, @"\{([^}]+)\}");
            var inputs = matches.Cast<Match>().Select(m => m.Groups[1].Value).ToArray();

            Console.WriteLine(actionInput);
            if (inputs.Length == 0)
            {

                if (!commandDict.ContainsKey("action_code") || !commandDict["action_code"].EndsWith("_stop") || commandDict["type"] != "cyclique")
                {
                    Console.WriteLine("Aucun input valide trouvé dans la commande.");
                    return;
                }
            }

            // Par défaut, le délai est court
            int delayMs = (commandDict.ContainsKey("duration") && commandDict["duration"] == "long") ? 750 : 100;

            try
            {
                // Sélectionner le type d'action à exécuter
                switch (commandDict["type"].ToLower())
                {
                    case "combo":
                        SendCombo(actionInput, delayMs);
                        break;

                    case "phrase":
                        SendPhrase(actionInput);
                        break;
                    case "sequence":
                        SendSequence(actionInput);
                        break;
                    case "cyclique":
                        SendCyclique(command);
                        break;

                    default:
                        Console.WriteLine("Type d'action non supporté.");
                        break;
                }
                Console.WriteLine("Commande exécutée avec succès.");
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"Erreur de clé invalide : {ex.Message}. Touche non reconnue.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur inattendue lors de l'exécution de la commande : {ex.Message}");
            }
        }

        public void SendCyclique(string command)
        {
            //http://127.0.0.1:2953/&class_action=keysender&type=cyclique&action_input={short}{enter}{tempo 5000}{quantity 10}&action_code=scan_univers_actuel_start
            //http://127.0.0.1:2953/&class_action=keysender&type=cyclique&action_code=scan_univers_actuel_stop
            Console.WriteLine("la commande reçu : "+command);

            // Dictionnaire pour stocker les paramètres de la commande
            var dict = new Dictionary<string, string>();

            // La commande est du type "action_code=scan_stop&action_input={short}{Right_shift}{Asterisk}"
            var parameters = command.Split('&');

            // Parsing de la commande
            foreach (var param in parameters)
            {
                var keyValue = param.Split('=');
                if (keyValue.Length == 2)
                {
                    dict[keyValue[0]] = keyValue[1];  // Ajoute le paramètre au dictionnaire
                }
            }

            // Vérifier que la commande contient "action_code"
            if (!dict.ContainsKey("action_code"))
            {
                Console.WriteLine("Invalid command: missing action_code");
                return;
            }

            string actionCode = dict["action_code"].ToLower();

            Console.WriteLine("Start/Stop détecté : " + dict["action_code"].ToLower());

            // Step 1: Vérifier si le actionCode se termine par "_stop"
            if (actionCode.EndsWith("_stop"))
            {
                 // Extraire la partie avant "_stop"
                string trimmedActionCode = actionCode.Substring(0, actionCode.LastIndexOf("_"));

                Console.WriteLine("Start détecté pour : " + trimmedActionCode);

                // Appeler StopCyclique avec le action_code coupé
                StopCyclique(trimmedActionCode);
                return;
            }

            // Step 2: Si c'est un "_start", démarrer le cycle
            if (actionCode.EndsWith("_start"))
            {
                // Retirer le suffixe "_start" de l'actionCode
                string trimmedActionCode = actionCode.Substring(0, actionCode.LastIndexOf("_"));

                Console.WriteLine("Stop détecté pour : " + trimmedActionCode);
                
                // Vérifier si la commande contient "action_input"
                if (!dict.ContainsKey("action_input"))
                {
                    Console.WriteLine("Invalid command: missing action_input for cyclique start");
                    return;
                }
                string decodedActionInput = WebUtility.UrlDecode(dict["action_input"]);
                Console.WriteLine($"Decoded action_input: {decodedActionInput}");

                // Extraire tempo et quantity à partir de decodedActionInput
                int tempo = 1000;  // Par défaut
                int quantity = -1;  // Par défaut (infini)

                // Regex pour extraire {tempo XXX} et {quantity XXX}
                var tempoMatch = Regex.Match(decodedActionInput, @"\{tempo (\d+)\}");
                if (tempoMatch.Success)
                {
                    tempo = int.Parse(tempoMatch.Groups[1].Value);
                }

                var quantityMatch = Regex.Match(decodedActionInput, @"\{quantity (\d+)\}");
                if (quantityMatch.Success)
                {
                    quantity = int.Parse(quantityMatch.Groups[1].Value);
                }

                
                // Nettoyer les tags tempo et quantity de l'actionInput
                decodedActionInput = Regex.Replace(decodedActionInput, @"\{tempo \d+\}|\{quantity \d+\}", "");

                // Appeler StartCyclique avec les valeurs correctes
                StartCyclique(decodedActionInput, quantity, tempo, trimmedActionCode);

            }
        }

        /*public void StartCyclique(string actionInput, int numberNb, int tempo, string actionCode)
        {
            // Décodage de l'action input pour bien interpréter les commandes
            string decodedActionInput = WebUtility.UrlDecode(actionInput);

            Console.WriteLine($"Starting cyclique command {actionCode} with input: {actionInput}, repetitions: {numberNb}, tempo: {tempo}");

            // Si la commande cyclique est déjà en cours pour cet actionCode
            if (cycliqueCommands.ContainsKey(actionCode))
            {
                var existingCommand = cycliqueCommands[actionCode];

                // Ajouter la nouvelle quantité à la quantité restante si la commande est déjà en cours
                if (existingCommand.NumberNb != -1 && numberNb != -1)
                {
                    existingCommand.NumberNb += numberNb;
                    Console.WriteLine($"Updated cyclique command {actionCode} with new quantity: {existingCommand.NumberNb}");
                }
                else
                {
                    Console.WriteLine($"Cyclique command {actionCode} is already running with infinite quantity.");
                }
                return;
            }
            // Traitement des directives de durée {short} et {long}
            int delayMs = 100; // Par défaut 100ms pour {short}
            if (decodedActionInput.Contains("{long}"))
            {
                delayMs = 750;
                decodedActionInput = decodedActionInput.Replace("{long}", "");  // Supprimer {long} de la commande
            }
            else
            {
                decodedActionInput = decodedActionInput.Replace("{short}", "");  // Supprimer {short} de la commande
            }

            // Ajout de la commande cyclique au dictionnaire
            var cycliqueCommand = new CycliqueCommand(decodedActionInput, numberNb, tempo);
            cycliqueCommands.Add(actionCode, cycliqueCommand);

            // Exécution de la commande en boucle dans un Task pour ne pas bloquer le thread principal
            Task.Run(async () =>
            {
                int count = 0;
                while (numberNb == -1 || count < numberNb)  // Exécute à l'infini ou selon la quantité
                {
                    // Exécution de l'action réelle
                    Console.WriteLine($"Executing cyclique action: {decodedActionInput}");

                    SendCombo(decodedActionInput, delayMs);  // Exécute le combo avec la durée appropriée (100ms ou 750ms)

                    // Attente du tempo entre chaque exécution
                    await Task.Delay(tempo);

                    // Incrémente le compteur si le nombre de répétitions est limité
                    if (numberNb != -1)
                    {
                        count++;
                    }

                    // Si la commande est stoppée, sortir de la boucle
                    if (!cycliqueCommands.ContainsKey(actionCode))
                    {
                        Console.WriteLine($"Cyclique command {actionCode} was stopped.");
                        return;
                    }
                }

                // Si le cycle est fini (nombre de répétitions atteint), on retire la commande
                Console.WriteLine($"Cyclique command {actionCode} completed.");
                cycliqueCommands.Remove(actionCode);
            });
        }*/

        public void StartCyclique(string actionInput, int numberNb, int tempo, string actionCode)
        {
            // Décodage de l'action input pour bien interpréter les commandes
            string decodedActionInput = WebUtility.UrlDecode(actionInput);
            Console.WriteLine($"Starting cyclique command {actionCode} with input: {decodedActionInput}, repetitions: {numberNb}, tempo: {tempo}");

            // Si la commande cyclique est déjà en cours pour cet actionCode
            if (cycliqueCommands.ContainsKey(actionCode))
            {
                var existingCommand = cycliqueCommands[actionCode];

                // Ajouter la nouvelle quantité à la quantité restante si la commande est déjà en cours
                if (existingCommand.NumberNb != -1 && numberNb != -1)
                {
                    // Ajout correct de la nouvelle quantité à la quantité restante
                    existingCommand.NumberNb += numberNb;
                    Console.WriteLine($"Updated cyclique command {actionCode} with new quantity: {existingCommand.NumberNb}");
                }
                else if (existingCommand.NumberNb == -1)
                {
                    // Si la commande est infinie, pas besoin de changer la quantité
                    Console.WriteLine($"Cyclique command {actionCode} is already running with infinite quantity.");
                }
                return;
            }

            // Traitement des directives de durée {short} et {long}
            int delayMs = 100; // Par défaut 100ms pour {short}
            if (decodedActionInput.Contains("{long}"))
            {
                delayMs = 750;
                decodedActionInput = decodedActionInput.Replace("{long}", "");  // Supprimer {long} de la commande
            }
            else
            {
                decodedActionInput = decodedActionInput.Replace("{short}", "");  // Supprimer {short} de la commande
            }

            // Ajout de la commande cyclique au dictionnaire
            var cycliqueCommand = new CycliqueCommand(decodedActionInput, numberNb, tempo);
            cycliqueCommands.Add(actionCode, cycliqueCommand);

            // Exécution de la commande en boucle dans un Task pour ne pas bloquer le thread principal
            Task.Run(async () =>
            {
                int count = 0;
                while (cycliqueCommands.ContainsKey(actionCode) && (cycliqueCommands[actionCode].NumberNb == -1 || count < cycliqueCommands[actionCode].NumberNb))  // Exécute à l'infini ou selon la quantité dynamique
                {
                    // Exécution de l'action réelle
                    // Affichage du compteur et de la quantité totale
                    int totalQuantity = cycliqueCommands[actionCode].NumberNb == -1 ? int.MaxValue : cycliqueCommands[actionCode].NumberNb;
                    Console.WriteLine($"Executing cyclique action: {decodedActionInput} ({count + 1}/{totalQuantity})");

                    SendCombo(decodedActionInput, delayMs);  // Exécute le combo avec la durée appropriée (100ms ou 750ms)

                    // Attente du tempo entre chaque exécution
                    await Task.Delay(tempo);

                    // Incrémente le compteur si le nombre de répétitions est limité
                    if (cycliqueCommands[actionCode].NumberNb != -1)
                    {
                        count++;
                    }

                    // Si la commande est stoppée, sortir de la boucle
                    if (!cycliqueCommands.ContainsKey(actionCode))
                    {
                        Console.WriteLine($"Cyclique command {actionCode} was stopped.");
                        return;
                    }
                }

                // Si le cycle est fini (nombre de répétitions atteint), on retire la commande
                Console.WriteLine($"Cyclique command {actionCode} completed.");
                cycliqueCommands.Remove(actionCode);
            });
        }


        public void StopCyclique(string actionCode)
        {
            if (cycliqueCommands.ContainsKey(actionCode))
            {
                cycliqueCommands.Remove(actionCode);  // Supprime la commande du dictionnaire pour l'arrêter
                Console.WriteLine($"Cyclique command {actionCode} stopped.");
            }
            else
            {
                Console.WriteLine($"Cyclique command {actionCode} is not running.");
            }
        }

        
        // Méthode pour ajouter une commande cyclique au dictionnaire
        public void AddCycliqueCommand(string actionCode, string actionInput, int numberNb, int tempo)
        {
            if (!cycliqueCommands.ContainsKey(actionCode))
            {
                var cycliqueCommand = new CycliqueCommand(actionInput, numberNb, tempo);
                cycliqueCommands.Add(actionCode, cycliqueCommand);
                Console.WriteLine($"Added cyclique command with actionCode: {actionCode}");
            }
            else
            {
                Console.WriteLine($"Action code {actionCode} already exists.");
            }
        }

        // Méthode pour supprimer une commande cyclique
        public void RemoveCycliqueCommand(string actionCode)
        {
            if (cycliqueCommands.ContainsKey(actionCode))
            {
                cycliqueCommands.Remove(actionCode);
                Console.WriteLine($"Removed cyclique command with actionCode: {actionCode}");
            }
            else
            {
                Console.WriteLine($"Action code {actionCode} not found.");
            }
        }

        // Exemple de méthode pour afficher toutes les commandes cycliques
        public void DisplayCycliqueCommands()
        {
            foreach (var command in cycliqueCommands)
            {
                Console.WriteLine($"ActionCode: {command.Key}, ActionInput: {command.Value.ActionInput}, NumberNb: {command.Value.NumberNb}, Tempo: {command.Value.Tempo}");
            }
        }
        



        public void SendSequence(string actionInput)
        {
            Thread.Sleep(500);
            // Step 0: Vérifier si la séquence se termine par {tempo xxx}
            if (actionInput.EndsWith("}"))
            {
                var lastPart = actionInput.Substring(actionInput.LastIndexOf("{"));
                if (lastPart.StartsWith("{tempo"))
                {
                    Console.WriteLine("Invalid sequence: ends with {tempo}. Ignoring the sequence.");
                    return;
                }
            }

            // Step 1: Découper la séquence en blocs avec {tempo xxx} comme séparateur
            var parts = Regex.Split(actionInput, @"\{tempo \d+\}");  // Découpe sur {tempo xxx}

            // Step 1.1: Extraire les tempos
            var tempos = Regex.Matches(actionInput, @"\{tempo (\d+)\}")
                              .Cast<Match>()
                              .Select(m => int.Parse(m.Groups[1].Value))
                              .ToList();

            // Step 2: Pour chaque bloc, vérifier s'il contient {short} ou {long}, sinon ajouter {short}
            for (int i = 0; i < parts.Length; i++)
            {
                var part = parts[i].Trim();  // Enlever les espaces ou accolades inutiles
                if (string.IsNullOrEmpty(part)) continue;  // Ignorer les parties vides

                // Vérifier la durée du bloc, et enlever {short} ou {long} pour ne pas les envoyer à SendCombo
                int duration = 100;  // Par défaut {short}
                if (part.Contains("{short}"))
                {
                    duration = 100;  // Durée courte
                    part = part.Replace("{short}", "");  // Supprimer {short} avant d'envoyer à SendCombo
                }
                else if (part.Contains("{long}"))
                {
                    duration = 750;  // Durée longue
                    part = part.Replace("{long}", "");  // Supprimer {long} avant d'envoyer à SendCombo
                }

                // Step 3: Envoyer chaque bloc d'action sans {short} ou {long}
                Console.WriteLine($"Sending part: {part}");
                SendCombo(part, duration);  // Envoi de la commande avec la durée correspondante

                // Si un tempo existe, insérer une pause avant d'exécuter le prochain bloc
                if (i < tempos.Count)
                {
                    int delay = tempos[i];
                    Console.WriteLine($"Pause for {delay}ms");
                    Thread.Sleep(delay);  // Pause pour le tempo spécifié
                }
            }
        }

        public void SendCombo(string actionInput, int delayMs = 100)
        {
            // Extraire toutes les actions de la commande entre les accolades {}
            var matches = Regex.Matches(actionInput, @"\{([^}]+)\}");
            var inputs = matches.Cast<Match>().Select(m => m.Groups[1].Value).ToArray();

            if (inputs.Length == 0)
            {
                Console.WriteLine("Aucun input valide trouvé dans la commande.");
                return;
            }

            // Appuyer sur toutes les touches/actions en même temps
            foreach (var input in inputs)
            {
                SimulateActionDown(input);  // Simule appui sur la touche ou action souris
            }

            // Pause pour simuler la durée de la combinaison
            Thread.Sleep(delayMs); // ou tout autre délai adapté

            // Relâcher toutes les touches/actions
            foreach (var input in inputs.Reverse())
            {
                SimulateActionUp(input);  // Simule relâchement de la touche ou action souris
            }
        }

        private void SimulateActionDown(string action)
        {
            if (IsMouseAction(action))
            {
                // Si c'est une action souris
                switch (action.ToLower())
                {
                    case "left_click":
                        simulator.Mouse.LeftButtonDown();
                        break;
                    case "right_click":
                        simulator.Mouse.RightButtonDown();
                        break;
                    case "middle_click":
                        simulator.Mouse.MiddleButtonDown();
                        break;
                    default:
                        Console.WriteLine("Action souris non reconnue.");
                        break;
                }
            }
            else
            {
                // Si c'est une touche clavier
                simulator.Keyboard.KeyDown(ParseKeyCode(action));
            }
        }

        private void SimulateActionUp(string action)
        {
            if (IsMouseAction(action))
            {
                // Si c'est une action souris
                switch (action.ToLower())
                {
                    case "left_click":
                        simulator.Mouse.LeftButtonUp();
                        break;
                    case "right_click":
                        simulator.Mouse.RightButtonUp();
                        break;
                    case "middle_click":
                        simulator.Mouse.MiddleButtonUp();
                        break;
                    default:
                        Console.WriteLine("Action souris non reconnue.");
                        break;
                }
            }
            else
            {
                // Si c'est une touche clavier
                simulator.Keyboard.KeyUp(ParseKeyCode(action));
            }
        }

        private bool IsMouseAction(string action)
        {
            return action.ToLower().Contains("click");
        }



        public void SendPhrase(string actionInput)
        {
            // Pattern pour repérer les balises comme {Enter}, {²}, etc.
            var regex = new Regex(@"\{([^}]+)\}");
            var matches = regex.Matches(actionInput);
            int lastIndex = 0;

            foreach (Match match in matches)
            {
                // Récupérer le texte avant la balise
                if (match.Index > lastIndex)
                {
                    var textBeforeTag = actionInput.Substring(lastIndex, match.Index - lastIndex);
                    if (!string.IsNullOrEmpty(textBeforeTag))
                    {
                        // Envoyer ce texte via le presse-papier
                        PasteText(textBeforeTag);
                    }
                }

                // Récupérer et traiter la balise (comme {Enter}, {²}, etc.)
                string keyName = match.Groups[1].Value;
                SimulateKey(keyName);

                // Mettre à jour l'index
                lastIndex = match.Index + match.Length;
            }

            // Si du texte reste après la dernière balise
            if (lastIndex < actionInput.Length)
            {
                var remainingText = actionInput.Substring(lastIndex);
                PasteText(remainingText);  // Coller le texte restant via le presse-papier
            }
        }

        // Méthode pour copier du texte dans le presse-papier et le coller via Ctrl+V
        private void PasteText(string text)
        {
            ClipboardService.SetText(text);  // Met le texte dans le presse-papier avec TextCopy
            Thread.Sleep(100);  // Petit délai pour s'assurer que le presse-papier est prêt

            // Simuler Ctrl+V pour coller le texte
            simulator.Keyboard.ModifiedKeyStroke(VirtualKeyCode.CONTROL, VirtualKeyCode.VK_V);
            Thread.Sleep(100);  // Petit délai pour coller
        }

        /*private void HandleMouseClick(string button, int delayMs)
        {
            switch (button.ToLower())
            {
                case "left_click":
                    simulator.Mouse.LeftButtonDown();
                    Thread.Sleep(delayMs);
                    simulator.Mouse.LeftButtonUp();
                    break;
                case "right_click":
                    simulator.Mouse.RightButtonDown();
                    Thread.Sleep(delayMs);
                    simulator.Mouse.RightButtonUp();
                    break;
                case "center_click":
                    simulator.Mouse.MiddleButtonDown();
                    Thread.Sleep(delayMs);
                    simulator.Mouse.MiddleButtonUp();
                    break;
                default:
                    Console.WriteLine($"Invalid mouse button: {button}");
                    break;
            }
        }*/

        private void SimulateKey(string keyName, int delayMs = 100)
        {
            try
            {
                var keyCode = ParseKeyCode(keyName);

                // Appuyer sur la touche
                simulator.Keyboard.KeyDown(keyCode);
                Thread.Sleep(delayMs);  // Délai pour simuler la durée de l'appui
                simulator.Keyboard.KeyUp(keyCode);  // Relâcher la touche
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"Erreur lors de la simulation de la touche : {ex.Message}");
            }
        }

        private VirtualKeyCode ParseKeyCode(string input)
        {
            Console.WriteLine("Tentative : "+ input);
            var normalizedInput = input.ToLower();
            switch (normalizedInput)
            {
                case "escape":
                    return (VirtualKeyCode)27;
                case "f1":
                    return (VirtualKeyCode)112;
                case "f2":
                    return (VirtualKeyCode)113;
                case "f3":
                    return (VirtualKeyCode)114;
                case "f4":
                    return (VirtualKeyCode)115;
                case "f5":
                    return (VirtualKeyCode)116;
                case "f6":
                    return (VirtualKeyCode)117;
                case "f7":
                    return (VirtualKeyCode)118;
                case "f8":
                    return (VirtualKeyCode)119;
                case "f9":
                    return (VirtualKeyCode)120;
                case "f10":
                    return (VirtualKeyCode)121;
                case "f11":
                    return (VirtualKeyCode)122;
                case "f12":
                    return (VirtualKeyCode)123;
                case "print_screen":
                    return (VirtualKeyCode)44;
                case "scroll_lock ":
                    return (VirtualKeyCode)145;
                case "pause":
                    return (VirtualKeyCode)19;
                case "²":
                    return (VirtualKeyCode)222;
                case "1":
                    return (VirtualKeyCode)49;
                case "2":
                    return (VirtualKeyCode)50;
                case "3":
                    return (VirtualKeyCode)51;
                case "4":
                    return (VirtualKeyCode)52;
                case "5":
                    return (VirtualKeyCode)53;
                case "6":
                    return (VirtualKeyCode)54;
                case "7":
                    return (VirtualKeyCode)55;
                case "8":
                    return (VirtualKeyCode)56;
                case "9":
                    return (VirtualKeyCode)57;
                case "0":
                    return (VirtualKeyCode)48;
                case "degree":
                    return (VirtualKeyCode)219;
                case "plus":
                    return (VirtualKeyCode)187;
                case "backspace":
                    return (VirtualKeyCode)8;
                case "insert":
                    return (VirtualKeyCode)45;
                case "home":
                    return (VirtualKeyCode)36;
                case "page_up":
                    return (VirtualKeyCode)33;
                case "numpad_lock":
                    return (VirtualKeyCode)144;
                case "numpad_divide":
                    return (VirtualKeyCode)111;
                case "numpad_multiply":
                    return (VirtualKeyCode)106;
                case "numpad_subtract":
                    return (VirtualKeyCode)109;
                case "tab":
                    return (VirtualKeyCode)9;
                case "a":
                    return (VirtualKeyCode)65;
                case "z":
                    return (VirtualKeyCode)90;
                case "e":
                    return (VirtualKeyCode)69;
                case "r":
                    return (VirtualKeyCode)82;
                case "t":
                    return (VirtualKeyCode)84;
                case "y":
                    return (VirtualKeyCode)89;
                case "u":
                    return (VirtualKeyCode)85;
                case "i":
                    return (VirtualKeyCode)73;
                case "o":
                    return (VirtualKeyCode)79;
                case "p":
                    return (VirtualKeyCode)80;
                case "caret":
                    return (VirtualKeyCode)221;
                case "dollar":
                    return (VirtualKeyCode)186;
                case "enter":
                    return (VirtualKeyCode)13;
                case "delete":
                    return (VirtualKeyCode)46;
                case "end":
                    return (VirtualKeyCode)35;
                case "page_down":
                    return (VirtualKeyCode)34;
                case "numpad_7":
                    return (VirtualKeyCode)103;
                case "numpad_8":
                    return (VirtualKeyCode)104;
                case "numpad_9":
                    return (VirtualKeyCode)105;
                case "numpad_plus":
                    return (VirtualKeyCode)107;
                case "maj":
                    return (VirtualKeyCode)107;
                case "q":
                    return (VirtualKeyCode)81;
                case "s":
                    return (VirtualKeyCode)83;
                case "d":
                    return (VirtualKeyCode)68;
                case "f":
                    return (VirtualKeyCode)70;
                case "g":
                    return (VirtualKeyCode)71;
                case "h":
                    return (VirtualKeyCode)72;
                case "j":
                    return (VirtualKeyCode)74;
                case "k":
                    return (VirtualKeyCode)75;
                case "l":
                    return (VirtualKeyCode)76;
                case "m":
                    return (VirtualKeyCode)77;
                case "ù":
                    return (VirtualKeyCode)192;
                case "asterisk":
                    return (VirtualKeyCode)220;
                case "numpad_4":
                    return (VirtualKeyCode)100;
                case "numpad_5":
                    return (VirtualKeyCode)101;
                case "numpad_6":
                    return (VirtualKeyCode)102;
                case "left_shift":
                    return VirtualKeyCode.LSHIFT;
                case "greater_than":
                    return (VirtualKeyCode)226;
                case "w":
                    return (VirtualKeyCode)87;
                case "x":
                    return (VirtualKeyCode)88;
                case "c":
                    return (VirtualKeyCode)67;
                case "v":
                    return (VirtualKeyCode)86;
                case "b":
                    return (VirtualKeyCode)66;
                case "n":
                    return (VirtualKeyCode)78;
                case "comma":
                    return (VirtualKeyCode)188;
                case "period":
                    return (VirtualKeyCode)190;
                case "slash":
                    return (VirtualKeyCode)191;
                case "exclamation":
                    return (VirtualKeyCode)223;
                case "right_shift":
                    return VirtualKeyCode.RSHIFT;
                case "arrow_Up":
                    return (VirtualKeyCode)38;
                case "numpad_1":
                    return (VirtualKeyCode)97;
                case "numpad_2":
                    return (VirtualKeyCode)98;
                case "numpad_3":
                    return (VirtualKeyCode)99;
                case "left_control":
                    return VirtualKeyCode.LCONTROL;
                case "windows":
                    return VirtualKeyCode.LWIN;
                case "left_alt":
                    //return VirtualKeyCode.LMENU;
                    Console.WriteLine("test left_alt");
                    Console.WriteLine("envoie de :"+ VirtualKeyCode.LMENU);
                    return (VirtualKeyCode)164; // Virtual Key Code pour Alt gauche
                case "space":
                    return (VirtualKeyCode)32;
                case "right_alt":
                    return VirtualKeyCode.RMENU;
                case "menu":
                    return VirtualKeyCode.APPS;
                case "right_control":
                    return VirtualKeyCode.RCONTROL;
                case "arrow_left":
                    return (VirtualKeyCode)37;
                case "arrow_down":
                    return (VirtualKeyCode)40;
                case "arrow_right":
                    return (VirtualKeyCode)39;
                case "numpad_0":
                    return (VirtualKeyCode)96;
                case "numpad_period":
                    return (VirtualKeyCode)110;
                case "numpad_enter":
                    return (VirtualKeyCode)13;
                // Ajoutez d'autres cas au besoin
                default:
                    throw new ArgumentException($"Unknown key: '{normalizedInput}'");
            }
        }
    }


    
}

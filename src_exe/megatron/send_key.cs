using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using WindowsInput;
using WindowsInput.Native;
using static System.Collections.Specialized.BitVector32;
using static System.Net.Mime.MediaTypeNames;

namespace megatron
{
    public class CommandKeyManager
    {
        private readonly InputSimulator simulator;

        public CommandKeyManager()
        {
            simulator = new InputSimulator();  // Initialisation du simulateur dans le constructeur
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
                    Console.WriteLine($"Key : '{keyValue[0].ToLower()}'  Value: '{WebUtility.UrlDecode(keyValue[1])}'");
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

            if (inputs.Length == 0)
            {
                Console.WriteLine("Aucun input valide trouvé dans la commande.");
                return;
            }

            // Par défaut, le délai est court
            int delayMs = (commandDict.ContainsKey("duration") && commandDict["duration"] == "long") ? 750 : 100;

            try
            {
                // Sélectionner le type d'action à exécuter
                switch (commandDict["type"].ToLower())
                {
                    case "key":
                        Console.WriteLine("Tentative d'appuyer sur : " + inputs[0]);
                        simulator.Keyboard.KeyDown(ParseKeyCode(inputs[0]));
                        Thread.Sleep(delayMs);
                        simulator.Keyboard.KeyUp(ParseKeyCode(inputs[0]));
                        break;

                    case "combo":
                        foreach (var input in inputs)
                        {
                            ParseKeyCode(input); // Valide les touches
                        }

                        foreach (var input in inputs)
                        {
                            simulator.Keyboard.KeyDown(ParseKeyCode(input));
                        }

                        Thread.Sleep(delayMs);

                        foreach (var input in inputs.Reverse())
                        {
                            simulator.Keyboard.KeyUp(ParseKeyCode(input));
                        }
                        break;

                    case "phrase":
                        SendPhrase(actionInput);
                        break;

                    case "mouse_click":
                        HandleMouseClick(inputs[0], delayMs);
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


        private void SendPhrase(string actionInput)
        {
            var startPattern = @"\{([^}]+)\}";
            var endPattern = @"\{([^}]+)\}$";
            var startMatch = Regex.Match(actionInput, startPattern);
            var endMatch = Regex.Match(actionInput, endPattern);
            var text = Regex.Replace(actionInput, startPattern + "|" + endPattern, "");

            // Supposer que le premier et le dernier élément sont des touches spéciales
            if (startMatch.Success && endMatch.Success)
            {
                var startKey = ParseKeyCode(startMatch.Groups[1].Value);
                var endKey = ParseKeyCode(endMatch.Groups[1].Value);

                simulator.Keyboard.KeyPress(startKey); // Appuyer et relâcher la touche de début
                Thread.Sleep(500);

                // Simuler chaque touche du texte
                foreach (char c in text)
                {
                    var keyCode = (VirtualKeyCode)char.ToUpper(c);
                    simulator.Keyboard.KeyPress(keyCode);
                    Thread.Sleep(10); // Petit délai entre les touches pour simuler une frappe naturelle
                }

                Thread.Sleep(500);
                simulator.Keyboard.KeyPress(endKey); // Appuyer et relâcher la touche de fin
            }
            else
            {
                Console.WriteLine("Invalid format for phrase input.");
            }

        }

        private void HandleMouseClick(string button, int delayMs)
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
                    return VirtualKeyCode.LMENU;
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

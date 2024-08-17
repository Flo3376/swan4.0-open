using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Linq; // Assurez-vous d'avoir cet using pour accéder à LINQ

using System.Threading;
using System.Threading.Tasks;
using System.Web;
using WindowsInput;
using WindowsInput.Native;
using static System.Collections.Specialized.BitVector32;
using System.Text.RegularExpressions;

class Program
{
    public class CommandParameters
    {
        public string Output { get; set; }
        public string Type { get; set; }
        public string Duration { get; set; }
        public string ActionInput { get; set; }
    }

    static void Main(string[] args)
    {
        int port = 2953;
        var listener = new TcpListener(IPAddress.Loopback, port);
        listener.Start();
        Console.WriteLine($"Server is listening on {IPAddress.Loopback}:{port}");

        try
        {
            while (true)
            {
                TcpClient client = listener.AcceptTcpClient();
                HandleClientAsync(client);
            }
        }
        finally
        {
            listener.Stop();
        }
    }

    static async Task HandleClientAsync(TcpClient client)
    {
        using (client)
        using (var stream = client.GetStream())
        using (var reader = new StreamReader(stream))
        using (var writer = new StreamWriter(stream))
        {
            writer.AutoFlush = true;
            string line;
            string requestLine = await reader.ReadLineAsync();


            if (requestLine.StartsWith("GET") && requestLine.Contains("output="))
            {
                Console.WriteLine();
                Console.WriteLine($"Received command: {requestLine}");

                var url = requestLine.Split(' ')[1];
                var uri = new Uri("http://dummy" + url); // Utilisé pour parsing d'URI valide
                var query = HttpUtility.ParseQueryString(uri.Query);

                var parameters = new CommandParameters
                {
                    Output = query["output"],
                    Type = query["type"],
                    Duration = query["duration"],
                    ActionInput = query["action_input"]
                };

                await ProcessCommandAsync(writer, parameters);
            }

            while ((line = await reader.ReadLineAsync()) != null && line != string.Empty)

            {
                // Ignorer les en-têtes supplémentaires
            }
        }
    }

    static async Task ProcessCommandAsync(StreamWriter writer, CommandParameters parameters)
    {
        try
        {
            // Ici, vous pouvez ajouter la logique pour traiter différentes types de commandes
            Console.WriteLine($"Processing command with: Output={parameters.Output}, Type={parameters.Type}, Duration={parameters.Duration}, Input={parameters.ActionInput}");

            var Output = parameters.Output;
            var Type = parameters.Type;
            var Duration = parameters.Duration;
            var ActionInput = parameters.ActionInput;

            int delayMs = (Duration == "long") ? 750 : 100;  // Default to 100ms if not specified or if "short"

            var simulator = new InputSimulator();

            var matches = Regex.Matches(ActionInput, @"\{([^}]+)\}");
            var inputs = matches.Cast<Match>().Select(m => m.Groups[1].Value).ToArray();

            // Exemple pour illustrer l'usage des valeurs extraites
            foreach (var input in inputs)
            {
                if(Type != "mouse_click")
                {
                    Console.WriteLine($"Extracted input: {input}");
                }
                
            }

            switch (Type.ToLower())
            {
                case "key":
                    // Pression de la touche avec maintien selon le délai avant de relâcher
                    simulator.Keyboard.KeyDown(ParseKeyCode(inputs[0]));
                    Thread.Sleep(delayMs);  // Maintient la touche enfoncée pour la durée spécifiée
                    simulator.Keyboard.KeyUp(ParseKeyCode(inputs[0]));
                    break;
                case "combo":
                   // Valider toutes les touches avant de commencer
                    foreach (var input in inputs)
                    {
                        ParseKeyCode(input);
                    }

                    try
                    {
                        // Presser toutes les touches validées
                        foreach (var input in inputs)
                        {

                            simulator.Keyboard.KeyDown(ParseKeyCode(input));
                        }

                        Thread.Sleep(delayMs);  // Maintient la touche enfoncée pour la durée spécifiée

                        // Relâcher les touches dans l'ordre inverse
                        foreach (var input in inputs.Reverse())
                        {
                            simulator.Keyboard.KeyUp(ParseKeyCode(input));
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error during combo execution: {ex.Message}");
                    }
                    break;
                
                case "phrase":
                    // Exemple de pattern Regex pour extraire les touches spéciales
                    var pattern = @"\{([^}]+)\}";
                    var matches_toutch = Regex.Matches(ActionInput, pattern);

                    // Supposer que le premier et le dernier élément sont des touches spéciales
                    if (matches_toutch.Count >= 2)
                    {
                        Console.WriteLine("test1");
                        Console.WriteLine("test1 : " + matches_toutch[0].Groups[1].Value);
                        var startKey = ParseKeyCode(matches_toutch[0].Groups[1].Value);
                        

                        Console.WriteLine("test2");
                        var endKey = ParseKeyCode(matches_toutch[matches_toutch.Count - 1].Groups[1].Value);

                        Console.WriteLine("test3");
                        var text = Regex.Replace(ActionInput, pattern, "");  // Retirer les touches spéciales du texte

                        // Simuler la frappe
                        simulator.Keyboard.KeyPress(startKey);  // Touche de début
                        simulator.Keyboard.TextEntry(text);     // Entrée du texte
                        simulator.Keyboard.KeyPress(endKey);    // Touche de fin
                    }
                    else
                    {
                        Console.WriteLine("Invalid format for phrase input.");
                    }


                    //simulator.Keyboard.TextEntry(ActionInput);
                    break;

                /*case "sequence":
                    var sequenceParts = ActionInput.Split(',');
                    for (int i = 0; i < sequenceParts.Length; i += 2)
                    {
                        var seqAction = sequenceParts[i];
                        var seqDelay = int.Parse(sequenceParts[i + 1]);
                        Thread.Sleep(seqDelay); // Délai avant l'action

                        if (seqAction.Contains("+"))
                        {
                            keys = seqAction.Split('+').Select(k => k.Trim()).ToArray();
                            var modifierKey = ParseKeyCode(keys[0]);
                            mainKey = ParseKeyCode(keys[1]);
                            simulator.Keyboard.ModifiedKeyStroke(modifierKey, mainKey);
                        }
                        else if (Enum.TryParse<VirtualKeyCode>(seqAction, true, out var keyCode))
                        {
                            simulator.Keyboard.KeyPress(keyCode);
                        }
                        else
                        {
                            simulator.Keyboard.TextEntry(seqAction);
                        }
                    }
                    break;
                case "mouse_move":
                    var coords = ActionInput.Split(',');
                    var x = int.Parse(coords[0]);
                    var y = int.Parse(coords[1]);
                    simulator.Mouse.MoveMouseToPositionOnVirtualDesktop(x, y);
                    break;*/

                case "mouse_click":
                    switch (inputs[0].ToLower())
                    {

                        case "left_click":
                            Console.WriteLine($"demande: {inputs[0].ToLower()}");
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
                            Console.WriteLine($"Invalid mouse button: {inputs[0].ToLower()}");
                            break;
                    }
                    break;
                default:
                    break;
            }



            // Envoyer une réponse simple
            await writer.WriteLineAsync("HTTP/1.1 200 OK");
            await writer.WriteLineAsync("Content-Type: text/plain");
            await writer.WriteLineAsync("");
            await writer.WriteLineAsync($"Processed command with output: {parameters.Output}, type: {parameters.Type}, duration: {parameters.Duration}, input: {parameters.ActionInput}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing command: {ex.Message}");
            await writer.WriteLineAsync("HTTP/1.1 500 Internal Server Error");
            await writer.WriteLineAsync("");
            await writer.WriteLineAsync("Error processing command");
        }
    }


    static async Task SendJsonResponse(StreamWriter writer, object responseObject)
    {
        string jsonResponse = System.Text.Json.JsonSerializer.Serialize(responseObject);
        await writer.WriteLineAsync("HTTP/1.1 200 OK");
        await writer.WriteLineAsync("Content-Type: application/json");
        await writer.WriteLineAsync($"Content-Length: {Encoding.UTF8.GetByteCount(jsonResponse)}");
        await writer.WriteLineAsync("");
        await writer.WriteLineAsync(jsonResponse);
    }

    /*
    static void ExecuteCommandWithTimeout(InputSimulator simulator, string command, TimeSpan timeout)
    {
        using (var cts = new CancellationTokenSource())
        {
            cts.CancelAfter(timeout);
            try
            {
                var task = Task.Run(() => ProcessCommand(simulator, command), cts.Token);
                task.Wait(cts.Token);
                Console.WriteLine("Command completed successfully.");
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("Command timed out and was cancelled.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
            }
        }
    }

    
    static void ProcessCommand(InputSimulator simulator, string command)
    {
        var parts = command.Split(' ');
        var action = parts[0];
        var input = parts.Length > 1 ? parts[1] : string.Empty;
        var delay = parts.Length > 2 ? parts[2] : "short";
        int delayMs = (delay == "long") ? 750 : 100;

        // Add the logic to execute the action using InputSimulator
        Console.WriteLine($"Executing: {action} {input} {delay}");
        // Example: Assuming direct execution of key press
        if (action == "key")
        {
            var keyCode = ParseKeyCode(input);
            simulator.Keyboard.KeyPress(keyCode);
            Thread.Sleep(delayMs);
        }
        // Additional actions can be implemented similarly
    }
    */

    static VirtualKeyCode ParseKeyCode(string input)
    {
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

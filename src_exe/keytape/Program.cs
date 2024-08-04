using System;
using System.Diagnostics.Metrics;
using WindowsInput;
using WindowsInput.Native;

class Program
{
    static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            ShowHelp();
            return;
        }

        var action = ParseArgument(args, "action");
        var input = ParseArgument(args, "input");
        var delay = ParseArgument(args, "delay");

        int delayMs = (delay == "long") ? 750 : 100;  // Default to 100ms if not specified or if "short"

        var simulator = new InputSimulator();

        switch (action.ToLower())
        {
            case "key":
                // Pression de la touche avec maintien selon le délai avant de relâcher
                simulator.Keyboard.KeyDown(ParseKeyCode(input));
                Thread.Sleep(delayMs);  // Maintient la touche enfoncée pour la durée spécifiée
                simulator.Keyboard.KeyUp(ParseKeyCode(input));
                break;
            case "combo":
                // Pour une combinaison, appuyez et maintenez chaque touche
                var keys = input.Split('+');
                var keyCodes = keys.Select(k => ParseKeyCode(k.Trim())).ToArray();

                // Presse tous les modificateurs d'abord
                foreach (var keyCode in keyCodes.Take(keyCodes.Length - 1))
                {
                    simulator.Keyboard.KeyDown(keyCode);
                }

                // Presse et relâche la touche principale
                var mainKey = keyCodes.Last();
                simulator.Keyboard.KeyDown(mainKey);
                Thread.Sleep(delayMs);  // Maintient la touche enfoncée pour la durée spécifiée
                simulator.Keyboard.KeyUp(mainKey);

                // Relâche tous les modificateurs dans l'ordre inverse
                foreach (var keyCode in keyCodes.Take(keyCodes.Length - 1).Reverse())
                {
                    simulator.Keyboard.KeyUp(keyCode);
                }
                break;
            case "sequence":
                var sequenceParts = input.Split(',');
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
            case "text":
                simulator.Keyboard.TextEntry(input);
                break;
            case "mouse_move":
                var coords = input.Split(',');
                var x = int.Parse(coords[0]);
                var y = int.Parse(coords[1]);
                simulator.Mouse.MoveMouseToPositionOnVirtualDesktop(x, y);
                break;
            case "mouse_click":
                switch (input.ToLower())
                {
                    case "left":
                        simulator.Mouse.LeftButtonDown();
                        Thread.Sleep(delayMs);
                        simulator.Mouse.LeftButtonUp();
                        break;
                    case "right":
                        simulator.Mouse.RightButtonClick();
                        break;
                    case "middle":
                        simulator.Mouse.MiddleButtonClick();
                        break;
                    default:
                        Console.WriteLine($"Invalid mouse button: {input}");
                        break;
                }
                break;
            default:
                ShowHelp();
                break;
        }
    }

    static VirtualKeyCode ParseKeyCode(string input)
    {
        var normalizedInput = input.ToUpper();
        switch (normalizedInput)
        {
            case "ESPACE":
                return VirtualKeyCode.SPACE;
            case "F1":
                return VirtualKeyCode.F1;
            case "F2":
                return VirtualKeyCode.F2;
            case "F3":
                return VirtualKeyCode.F3;
            case "F4":
                return VirtualKeyCode.F4;
            case "F5":
                return VirtualKeyCode.F5;
            case "F6":
                return VirtualKeyCode.F6;
            case "F7":
                return VirtualKeyCode.F7;
            case "F8":
                return VirtualKeyCode.F8;
            case "F9":
                return VirtualKeyCode.F9;
            case "F10":
                return VirtualKeyCode.F10;
            case "F11":
                return VirtualKeyCode.F11;
            case "F12":
                return VirtualKeyCode.F12;
            case  "ENTER":
                return VirtualKeyCode.RETURN;
            case "TAB":
                return VirtualKeyCode.TAB;
            case "ECHAP":
                return VirtualKeyCode.ESCAPE;
            case "CTRLGAUCHE":
                return VirtualKeyCode.LCONTROL;
            case "CTRLDROITE":
                return VirtualKeyCode.RCONTROL;
            case "ALTGAUCHE":
                return VirtualKeyCode.LMENU;
            case "ALTDROITE":
                return VirtualKeyCode.RMENU;
            case "SHIFTGAUCHE":
                return VirtualKeyCode.LSHIFT;
            case "SHIFTDROITE":
                return VirtualKeyCode.RSHIFT;
            case "Ù":
                return (VirtualKeyCode)192;  
            case "\\":
                return (VirtualKeyCode)220;

            // Ajoutez d'autres cas au besoin
            default:
                // Ajoute une gestion pour les lettres et autres clés non spécifiées directement
                if (Enum.TryParse<VirtualKeyCode>("VK_" + normalizedInput, out var keyCode))
                {
                    return keyCode;
                }
                else if (Enum.TryParse<VirtualKeyCode>(normalizedInput, out keyCode))
                {
                    return keyCode;
                }
                else
                {
                    throw new ArgumentException($"Unknown key: {input}");
                }
        }
    }



    static string ParseArgument(string[] args, string key)
    {
        var prefix = key + "=";
        foreach (var arg in args)
        {
            if (arg.StartsWith(prefix))
            {
                return arg.Substring(prefix.Length);
            }
        }
        return null;
    }

    static void ShowHelp()
    {
        Console.WriteLine("Usage: keytape.exe action=<action> input=<input> delay=<delay>");
        Console.WriteLine();
        Console.WriteLine("Actions: key, combo, text, mouse_move, mouse_click");
        Console.WriteLine("Example: keytape.exe action=key input=F3 delay=short");
        Console.WriteLine("Example: keytape.exe action=combo input=[CTRL+A] delay=long");
        Console.WriteLine("Example: keytape.exe action=sequence input=\"F3,100,CTRL+A,200,TEXT,Hello,50\"");
        Console.WriteLine();
        Console.WriteLine("Example: keytape.exe action=text input=\"Hello, World!\" delay=short");
        Console.WriteLine();
        Console.WriteLine("Example: keytape.exe action=mouse_move input=200,300");
        Console.WriteLine("Example: keytape.exe action=mouse_click input=left delay=long");
    }
}

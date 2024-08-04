using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Appuyez sur les touches pour voir leurs informations. Appuyez sur ESC pour quitter.");

        do
        {
            ConsoleKeyInfo keyInfo = Console.ReadKey(true);
            int vkCode = (int)keyInfo.Key;

            Console.WriteLine();
            Console.WriteLine($"Vous avez appuyé sur: {keyInfo.KeyChar} (Char), {vkCode} (VK Code)");
            Console.WriteLine();
            Console.WriteLine($"code à rajouter dans keytape dans la méthode \"static VirtualKeyCode ParseKeyCode(string input)\"");
            Console.WriteLine();
            Console.WriteLine($"static VirtualKeyCode ParseKeyCode(string input)");
            Console.WriteLine("{");
            Console.WriteLine($"    var normalizedInput = input.ToUpper();");
            Console.WriteLine($"        switch (normalizedInput)");
            Console.BackgroundColor = ConsoleColor.Green;
            Console.ForegroundColor = ConsoleColor.Black;
            Console.WriteLine($"        case \"{keyInfo.KeyChar}\": ");
            Console.WriteLine($"            return (VirtualKeyCode){vkCode};");
            Console.ResetColor();
            Console.WriteLine("....");
            Console.WriteLine("le reste du code");
            Console.WriteLine();
            Console.WriteLine("====================================================================");
        }
        while (true);
    }
}

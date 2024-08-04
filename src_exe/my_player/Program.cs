using NAudio.Wave;
using System;
using System.IO;

namespace my_player
{
    class Program
    {
        static void Main(string[] args)
        {
            // Définition des chemins et effets par défaut
            string defaultFilePath = "test.mp3";  // Chemin par défaut du fichier
            string defaultEffect = "none";  // Effet par défaut est "none"

            string filePath;
            string effectName;

            // Gestion des arguments de ligne de commande
            if (args.Length == 0)
            {
                Console.WriteLine("Aucun argument fourni. Utilisation des paramètres par défaut.");
                filePath = defaultFilePath;
                effectName = defaultEffect;
            }
            else if (args.Length == 1)
            {
                filePath = args[0];
                effectName = defaultEffect;  // Utiliser l'effet par défaut si seul le fichier est spécifié
            }
            else
            {
                filePath = args[0];
                effectName = args[1];
            }

            // Vérification de l'existence du fichier spécifié
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"Erreur : Le fichier '{filePath}' est introuvable.");
                return;
            }

            AudioPlayer player = new AudioPlayer();
            try
            {
                player.PlayAudioWithEffect(filePath, effectName);
                Console.WriteLine($"Lecture de '{filePath}' avec l'effet '{effectName}'.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Une erreur est survenue : {ex.Message}");
            }
        }
    }
}

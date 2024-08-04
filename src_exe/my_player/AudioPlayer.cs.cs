using Newtonsoft.Json;
using NAudio.Wave;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;

public class AudioPlayer
{
    private Dictionary<string, string[]> effects;

    public AudioPlayer()
    {
        LoadEffects();  // Chargement des effets au démarrage
    }

    private void LoadEffects()
    {
        //string jsonPath = "effects.json";  // Chemin vers le fichier JSON
        string appDirectory = AppDomain.CurrentDomain.BaseDirectory; // Obtient le répertoire de l'exécutable

        string jsonPath = Path.Combine(appDirectory, "effects.json");
        if (File.Exists(jsonPath))
        {
            string jsonContent = File.ReadAllText(jsonPath);
            effects = JsonConvert.DeserializeObject<Dictionary<string, string[]>>(jsonContent);
        }
        else
        {
            Console.WriteLine("Erreur : Le fichier 'effects.json' est introuvable.");
        }
    }

    public void PlayAudioWithEffect(string filePath, string effectName)
    {
        if (effectName.ToLower() == "none")
        {
            Console.WriteLine("Aucun effet appliqué.");
            PlayAudio(filePath);
        }
        else
        {
            string outputFilePath = ApplyEffect(filePath, effectName);
            PlayAudio(outputFilePath);
        }
    }

    private string ApplyEffect(string inputFilePath, string effectName)
    {
        string timestamp = DateTime.Now.ToString("yyyyMMddHHmmssfff");
        string baseDirectory = AppDomain.CurrentDomain.BaseDirectory; // Chemin de base de l'application
        string outputDir = Path.Combine(baseDirectory, "output"); // Création du chemin vers le dossier 'output'

        // S'assurer que le dossier 'output' existe
        if (!Directory.Exists(outputDir))
        {
            Directory.CreateDirectory(outputDir);
        }

        string outputFileName = $"add_effect_{effectName}_to_{Path.GetFileNameWithoutExtension(inputFilePath)}_{timestamp}.mp3";
        string outputFilePath = Path.Combine(outputDir, outputFileName);

        string effectCommand = GetEffectCommand(effectName);

        Process ffmpeg = new Process();
        ffmpeg.StartInfo.FileName = "ffmpeg";
        ffmpeg.StartInfo.Arguments = $"-i \"{inputFilePath}\" {effectCommand} \"{outputFilePath}\"";
        ffmpeg.StartInfo.UseShellExecute = false;
        ffmpeg.StartInfo.RedirectStandardOutput = true;
        ffmpeg.StartInfo.RedirectStandardError = true;
        ffmpeg.Start();

        ffmpeg.WaitForExit();

        if (ffmpeg.ExitCode != 0)
        {
            string error = ffmpeg.StandardError.ReadToEnd();
            Console.WriteLine($"Erreur FFmpeg : {error}");
            throw new InvalidOperationException($"Erreur FFmpeg : {error}");
        }

        return outputFilePath;
    }

    private string GetEffectCommand(string effectName)
    {
        if (effectName.ToLower() == "none")
        {
            return "";  // Aucun effet n'est appliqué
        }

        if (effects.TryGetValue(effectName.ToLower(), out string[] commands))
        {
            return "-af \"" + string.Join(",", commands) + "\"";
        }
        else
        {
            return "";
        }
    }

    private void PlayAudio(string filePath)
    {
        using (var audioFile = new AudioFileReader(filePath))
        using (var outputDevice = new WaveOutEvent())
        {
            outputDevice.Init(audioFile);
            outputDevice.Play();
            while (outputDevice.PlaybackState == PlaybackState.Playing)
            {
                Thread.Sleep(1000);
            }
        }
    }
}

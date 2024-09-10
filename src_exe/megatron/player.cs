using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using NAudio.Wave;
using System.Diagnostics;
using System.IO;
using System.Net; // Nécessaire pour WebUtility.UrlDecode
using Newtonsoft.Json;


namespace megatron
{
    public class SoundFile
    {
        public string FilePath { get; set; } //adresse du fichier (local ou réseau interne)
        public string Role { get; set; } // "music", "journal", "infoprio"
        public string Effect { get; set; } // Effect à lui donner
        public int Volume { get; set; } // Son volume de 0 à 100%
        public int VolumeConsigne { get; set; } //En cas de variation, le volume cible à atteindre progressivement
        public int LastConsigne { get; set; } //En cas de surcouchage par un autre son
        public string Priority { get; set; } // Option pour couper / reduire tous les autres sons

        public SoundFile(string filePath, string role, string effect = "none", int volume = 50, string priority = "none")
        {
            FilePath = filePath;
            Role = role;
            Effect = effect;
            Volume = volume;
            VolumeConsigne = volume; // Par défaut, la consigne est égale au volume initial
            LastConsigne = volume; // Par défaut, l'ancienne consigne est égale au volume initial
            Priority = priority; // Par défaut, cut_all est false
        }
    }

    public class VolumeManager
    {
        private int _volume;
        private int _volumeConsigne;
        private AudioFileReader _audioFileReader;
        private bool _isAdjusting;

        public VolumeManager(AudioFileReader audioFileReader, int initialVolume)
        {
            _audioFileReader = audioFileReader;
            _volume = initialVolume;
            _volumeConsigne = initialVolume;
            _isAdjusting = false;
        }

        public void SetVolumeConsigne(int newConsigne, Action onFadeOutComplete = null)
        {
            _volumeConsigne = newConsigne;
            if (!_isAdjusting)
            {
                _isAdjusting = true;
                // Passer l'action à effectuer après le fade out
                Task.Run(() => AdjustVolumeCycle(onFadeOutComplete));
            }
        }

        /*private void AdjustVolumeCycle()
        {
            while (_isAdjusting)
            {
                if (_volume < _volumeConsigne)
                {
                    _volume++;
                }
                else if (_volume > _volumeConsigne)
                {
                    _volume--;
                }

                _audioFileReader.Volume = _volume / 100.0f;

                Thread.Sleep(10);

                if (_volume == _volumeConsigne)
                {
                    _isAdjusting = false;
                }
            }
        }*/

        public void AdjustVolumeCycle(Action onFadeOutComplete = null)
        {
            while (_isAdjusting)
            {
                if (_volume < _volumeConsigne)
                {
                    _volume++;
                }
                else if (_volume > _volumeConsigne)
                {
                    _volume--;
                }

                _audioFileReader.Volume = _volume / 100.0f;

                // Délai entre chaque ajustement
                Thread.Sleep(10);

                // Si le volume atteint la consigne
                if (_volume == _volumeConsigne)
                {
                    _isAdjusting = false;

                    // Si c'est un fade out complet, exécuter une action une fois terminé
                    if (_volumeConsigne == 0 && onFadeOutComplete != null)
                    {
                        onFadeOutComplete.Invoke(); // Exécuter l'action après le fade out
                    }
                }
            }
        }

        // Nouvelle méthode pour obtenir la consigne de volume actuelle
        public int GetCurrentVolumeConsigne()
        {
            return _volumeConsigne;
        }
    }

    public class CommandPlayerManager
    {
        // Une référence à SoundManager pour exécuter les commandes
        private SoundManager soundManager = new SoundManager();

        public void player_command(string command)
        {
            Console.WriteLine("Sound : received command: " + command);

            // Retirer le caractère '?' au début, si présent
            if (command.StartsWith("/?")) command = command.Substring(2);

            //Console.WriteLine("cmd : " + command);
            // Découper la commande en segments de paramètres
            var parameters = command.Split('&');
            var commandDict = new Dictionary<string, string>();

            //Console.WriteLine("Nb : " + parameters.Length);
            if (parameters.Length <= 1)
            {
                Console.WriteLine("Commande invalide, pas assez d'élement fournis");
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
            if (!commandDict.ContainsKey("class_action") || commandDict["class_action"] != "sound")
            {
                Console.WriteLine($"class_action de commande invalide. Seule la class_action 'sound' est prise en charge. Class reçu : '{commandDict["class"]}'");
                return;
            }

            if (!commandDict.ContainsKey("class_action"))
            {
                Console.WriteLine("No action specified.");
                return;
            }
            else
            {
                switch (commandDict["action"].ToLower())
                {
                    case "playoradd":
                        if (commandDict.ContainsKey("path") && commandDict.ContainsKey("type") && commandDict.ContainsKey("volume"))
                        {
                            // Avant de créer un SoundFile, on vérifie que le fichier existe
                            string filePath = commandDict["path"];
                            if (!File.Exists(filePath))
                            {
                                Console.WriteLine($"Erreur : Le fichier spécifié est introuvable : '{filePath}'");
                                return; // Annule toute action si le fichier n'existe pas
                            }
                            else
                            {
                                // Conversion de la valeur du volume de string à int
                                if (!int.TryParse(commandDict["volume"], out int volume))
                                {
                                    Console.WriteLine($"Erreur : Le volume spécifié '{commandDict["volume"]}' n'est pas valide.");
                                    return; // Annule l'action si le volume n'est pas un entier valide
                                }

                                // Obtenir le paramètre "priority" si présent, sinon utiliser la valeur par défaut "none"
                                string priority = commandDict.ContainsKey("priority") ? commandDict["priority"].ToLower() : "none";
                                // Obtenir le paramètre "priority" si présent, sinon utiliser la valeur par défaut "none"
                                string effect = commandDict.ContainsKey("effect") ? commandDict["effect"].ToLower() : "none";

                                // Créer un SoundFile et l'envoyer au SoundManager
                                SoundFile soundFile = new SoundFile(filePath, commandDict["type"].ToLower(), effect, volume, priority);
                                soundManager.PlayOrAdd(soundFile);
                            }
                        }
                        else
                        {
                            Console.WriteLine("Paramètres manquants pour la commande playoradd.");
                        }

                        break;

                    case "setvolume":
                        //"?class=sound&action=setvolume&type=music&volume=50"
                        // Vérifier que le type et le volume sont présents dans la commande
                        if (commandDict.ContainsKey("type") && commandDict.ContainsKey("volume"))
                        {
                            string type = commandDict["type"].ToLower();
                            string volumeStr = commandDict["volume"];

                            // Tenter de convertir la chaîne de volume en entier
                            if (int.TryParse(volumeStr, out int volume))
                            {
                                // Assurer que le volume est dans la plage 0-100
                                volume = Math.Clamp(volume, 0, 100);

                                // Appeler la méthode SetVolume avec les valeurs validées
                                soundManager.SetVolume(type, volume);
                                Console.WriteLine($"Volume pour {type} réglé à {volume}%.");
                            }
                            else
                            {
                                Console.WriteLine("Le volume spécifié n'est pas un nombre valide.");
                            }
                        }
                        else
                        {
                            Console.WriteLine("Paramètres manquants pour la commande setvolume.");
                        }
                        break;

                    case "pausemusic":
                        soundManager.PauseMusic();
                        break;
                    case "playnext":
                        soundManager.ManualNext();
                        break;

                    case "resumemusic":
                        soundManager.ResumeMusic();
                        break;
                    case "stopmusic":
                        soundManager.StopMusic();
                        break;
                    case "clearmusic":
                        soundManager.ClearMusicQueue();
                        break;

                    default:
                        Console.WriteLine("Commande inconnue: '" + commandDict["action"] + "'");
                        break;
                }
            }
            Console.WriteLine();
        }
    }

    public class SoundManager
    {
        //variable lecteur music1
        private IWavePlayer waveOutDeviceMusic;
        private AudioFileReader audioFileReaderMusic;
        private VolumeManager volumeManagerMusic;
        private int musicVolume = 0;
        //private Thread musicThread1;
        //private CancellationTokenSource music1CancellationTokenSource;

        //variable communes lecteur music
        private ConcurrentQueue<SoundFile> musicQueue = new ConcurrentQueue<SoundFile>();
        private bool isPaused = false; // Indique si la musique est en pause

        //variable lecteur journal
        private IWavePlayer waveOutDeviceJournal;
        private AudioFileReader audioFileReaderJournal;
        private VolumeManager volumeManagerJournal;
        //private Thread journalThread;
        private int journalVolume = 100;
        //private CancellationTokenSource journalCancellationTokenSource;

        //variable lecteur info prioritaire
        private IWavePlayer waveOutDevicePriority;
        private AudioFileReader audioFileReaderPriority;
        private VolumeManager volumeManagerPriority;
        //private Thread priorityInfoThread;
        private int priorityVolume = 100;
        private bool isPlayingPriority = false;
        private ConcurrentQueue<SoundFile> priorityQueue = new ConcurrentQueue<SoundFile>();
        //private CancellationTokenSource priorityCancellationTokenSource;

        private bool adjustVolume; // Flag to control volume adjustment

        /* Sélecteur du type de lecteur */
        public void PlayOrAdd(SoundFile soundFile)
        {
            switch (soundFile.Role.ToLower())
            {
                case "music":
                    PlayMusic(soundFile);
                    break;
                case "journal":
                    PlayJournal(soundFile);
                    break;
                case "infoprio":
                    PlayPriorityInfo(soundFile);
                    break;
                default:
                    Console.WriteLine("Unknown role specified.");
                    break;
            }
        }

        // Méthode pour mettre en pause la musique en cours
        public void PauseMusic()
        {
            if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Playing)
            {
                // Après le fade out complet, mettre en pause
                volumeManagerMusic.SetVolumeConsigne(0, () =>
                {
                    waveOutDeviceMusic.Pause();
                    Console.WriteLine("Musique mise en pause après fade out.");
                    Console.WriteLine();
                });
                isPaused = true;
            }
        }

        // Méthode pour reprendre la musique mise en pause ou relancer la playlist
        public void ResumeMusic()
        {
            if (isPaused)
            {
                if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Paused)
                {
                    waveOutDeviceMusic.Play();

                    // Déclenche un fade in progressif vers le volume actuel
                    volumeManagerMusic.SetVolumeConsigne(musicVolume); // Retour au volume global
                    Console.WriteLine("Musique relancée avec fade in.");
                }

                isPaused = false;
                //Console.WriteLine("Musique relancée.");
            }
            else
            {
                PlayNextMusicInQueue();
                Console.WriteLine("Aucun morceau en cours, lancement du suivant si existant");
            }
            Console.WriteLine();
        }

        // Méthode pour arrêter la musique et vider la queue
        public void ClearMusicQueue()
        {
            // Vider la file d'attente sans arrêter la musique en cours
            while (musicQueue.TryDequeue(out _)) { }

            // Laisser le volume et la musique actuelle en place
            Console.WriteLine("File d'attente vidée, la musique en cours continue.");
            Console.WriteLine();
        }

        public void StopMusic()
        {
            if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Playing)
            {
                ClearMusicQueue();
                // Déclenche un fade out avec une consigne de volume à 0
                volumeManagerMusic.SetVolumeConsigne(0);

                // Après le fade out, arrêter complètement le lecteur
                volumeManagerMusic.AdjustVolumeCycle(() =>
                {
                    waveOutDeviceMusic.Stop();
                    waveOutDeviceMusic.Dispose();
                    waveOutDeviceMusic = null;
                    Console.WriteLine("Musique arrêtée après fade out.");
                    Console.WriteLine("Musique arrêtée, file d'attente vidée, et volume réinitialisé à 0.");
                    Console.WriteLine();
                });
            }
        }
        // Méthode pour jouer une musique avec un seul lecteur
        private void PlayMusic(SoundFile soundFile, bool standby = false)
        {
            Console.WriteLine("Ajout à la file d'attente : " + soundFile.FilePath);
            musicQueue.Enqueue(soundFile);

            // Si c'est la première musique ou après un reset, on initialise musicVolume
            if (musicVolume == 0)
            {
                musicVolume = soundFile.Volume; // Utiliser le volume du SoundFile de la première musique
                Console.WriteLine($"Première musique, volume initialisé à : {musicVolume}%");
            }


            if (!standby && waveOutDeviceMusic == null)
            {
                PlayNextMusicInQueue(); // Jouer immédiatement s'il n'y a rien en cours
            }
            else
            {
                Console.WriteLine("Mise en standby. La lecture commencera plus tard.");
            }
        }


        // Méthode pour passer au morceau suivant
        public void PlayNextMusicInQueue()
        {
            Console.WriteLine("PlayNextMusicInQueue");

            if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Playing)
            {
                Console.WriteLine("Arrêt du lecteur avant de passer au suivant.");
                StopPlayer(waveOutDeviceMusic);  // Stopper le lecteur si quelque chose joue déjà
            }

            if (musicQueue.TryDequeue(out SoundFile soundFile))
            {
                Console.WriteLine("Lecture du prochain morceau.");
                //PlayMusic1(soundFile);  // Lecture immédiate sur le lecteur unique
                if (waveOutDeviceMusic != null)
                {
                    waveOutDeviceMusic.Dispose();
                }

                audioFileReaderMusic = new AudioFileReader(soundFile.FilePath)
                {
                    Volume = musicVolume / 100.0f
                };
                waveOutDeviceMusic = new WaveOutEvent();
                waveOutDeviceMusic.Init(audioFileReaderMusic);

                // S'abonner à l'événement PlaybackStopped pour détecter la fin du morceau
                waveOutDeviceMusic.PlaybackStopped += OnPlaybackStopped;

                waveOutDeviceMusic.Play();
                Console.WriteLine($"La musique joue avec un volume de : {musicVolume}%");

                // On met à jour le volume manager pour ce morceau avec musicVolume
                volumeManagerMusic = new VolumeManager(audioFileReaderMusic, musicVolume);
            }
            else
            {
                Console.WriteLine("La file d'attente est vide.");
            }
        }

        private void OnPlaybackStopped(object sender, StoppedEventArgs e)
        {
            try
            {
                // Nettoyage des ressources audio pour tous les lecteurs
                if (sender is IWavePlayer waveOutDevice)
                {
                    try
                    {
                        if (waveOutDevice != null && waveOutDevice.PlaybackState != PlaybackState.Stopped)
                        {
                            waveOutDevice.Dispose();
                            //Console.WriteLine("Ressource libérée pour le lecteur général.");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur lors de la libération des ressources générales : {ex.Message}");
                    }
                }

                // Vérification si c'est le lecteur music1 qui a arrêté la lecture
                if (sender == waveOutDeviceMusic)
                {
                    try
                    {
                        waveOutDeviceMusic = null;
                        //Console.WriteLine("Lecture terminée sur le lecteur 1, ressource libérée.");
                        PlayNextMusicInQueue(); // Jouez le prochain morceau si c'était music1
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur lors du traitement de libération lecteur 1 : {ex.Message}");
                        Console.WriteLine($"Détails : {ex.StackTrace}");
                    }
                }
                // Cas où un autre lecteur a terminé (journal, priorité)
                else
                {
                   // Console.WriteLine("Un autre lecteur a terminé sa lecture, mais ce n'est ni music1 ni music2.");
                }

                // Libération des autres lecteurs
                try
                {
                    waveOutDevicePriority = sender == waveOutDevicePriority ? null : waveOutDevicePriority;
                    //Console.WriteLine("Vérification et libération du lecteur priorité si applicable.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erreur lors de la libération du lecteur priorité : {ex.Message}");
                }

                try
                {
                    waveOutDeviceJournal = sender == waveOutDeviceJournal ? null : waveOutDeviceJournal;
                    //Console.WriteLine("Vérification et libération du lecteur journal si applicable.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erreur lors de la libération du lecteur journal : {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur inattendue dans OnPlaybackStopped : {ex.Message}");
            }
        }


        

        // Méthode pour arrêter un lecteur proprement
        private void StopPlayer(IWavePlayer player)
        {
            if (player != null && player.PlaybackState != PlaybackState.Stopped)
            {
                player.Stop();
                player.Dispose();
                player = null;
            }
        }


        

        public void ManualNext()
        {
            Console.WriteLine("Manuel : Passage au morceau suivant avec crossfade.");

            if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Playing)
            {
                int volumeActuel = volumeManagerMusic.GetCurrentVolumeConsigne();
                int tempsPourCrossfade = volumeActuel * 50; // Calcul du délai dynamique

                Thread.Sleep(tempsPourCrossfade);
                OnPlaybackStopped(waveOutDeviceMusic, null);  // Simuler la fin de lecture pour le lecteur
            }
            else
            {
                Console.WriteLine("Aucune musique en cours de lecture.");
            }
        }


        private void PlayJournal(SoundFile soundFile)
        {
            if (waveOutDeviceJournal != null)
            {
                waveOutDeviceJournal.Dispose();
            }

            audioFileReaderJournal = new AudioFileReader(soundFile.FilePath)
            {
                Volume = soundFile.Volume / 100.0f
            };
            //Console.WriteLine(soundFile.Volume);
            waveOutDeviceJournal = new WaveOutEvent();
            waveOutDeviceJournal.Init(audioFileReaderJournal);

            // S'abonner à l'événement PlaybackStopped pour détecter la fin du morceau
            waveOutDeviceJournal.PlaybackStopped += OnPlaybackStopped;

            waveOutDeviceJournal.Play();

            volumeManagerJournal = new VolumeManager(audioFileReaderJournal, soundFile.Volume);
        }

        /* lecteurs dédiés au journal */
        private void PlayPriorityInfo(SoundFile soundFile)
        {
            if (soundFile.Priority == "absolute")
            {
                StopMusic(); // Arrêter la musique en cours
                waveOutDeviceJournal?.Stop(); // Arrêter le journal si en cours
            }

            priorityQueue.Enqueue(soundFile);

            // Si aucun son prioritaire n'est en cours, commencer à jouer le premier dans la queue
            if (!isPlayingPriority)
            {
                PlayNextPriorityInfo();
            }
        }

        private void ProcessPriorityQueue()
        {
            while (priorityQueue.TryDequeue(out SoundFile soundFile))
            {
                if (waveOutDevicePriority != null)
                {
                    waveOutDevicePriority.Dispose();
                }

                audioFileReaderPriority = new AudioFileReader(soundFile.FilePath)
                {
                    Volume = soundFile.Volume / 100.0f
                };
                waveOutDevicePriority = new WaveOutEvent();
                waveOutDevicePriority.Init(audioFileReaderPriority);
                waveOutDevicePriority.Play();

                waveOutDevicePriority.PlaybackStopped += (sender, args) =>
                {
                    if (!priorityQueue.IsEmpty)
                    {
                        ProcessPriorityQueue();
                    }
                    else
                    {
                        waveOutDevicePriority?.Dispose();
                        waveOutDevicePriority = null;
                        audioFileReaderPriority = null;
                        //priorityInfoThread = null;
                    }
                };

                volumeManagerPriority = new VolumeManager(audioFileReaderPriority, soundFile.Volume);
            }
        }

        private void PlayNextPriorityInfo()
        {
            if (priorityQueue.TryDequeue(out SoundFile soundFile))
            {
                // Initialiser l'objet AudioPlayer
                AudioPlayer audioPlayer = new AudioPlayer();
                // Vérifier si un effet est à appliquer sur le fichier sonore
                string effect = soundFile.Effect; // Utilise la propriété 'Effect' de SoundFile
                int volume = soundFile.Volume;

                try
                {
                    // Jouer le fichier sonore avec ou sans effet en utilisant l'objet AudioPlayer
                    audioPlayer.PlayAudioWithEffect(soundFile.FilePath, effect, volume);

                    // Après lecture du fichier, on peut effectuer d'autres actions ici si nécessaire
                }
                catch (Exception ex)
                {
                    // Gérer toute erreur survenue lors de l'application de l'effet ou de la lecture audio
                    Console.WriteLine($"Erreur lors de la lecture du fichier {soundFile.FilePath} avec l'effet '{effect}' : {ex.Message}");
                }


            }
        }

        private void Crossfade(VolumeManager from, VolumeManager to)
        {
            if (from != null)
            {
                from.SetVolumeConsigne(0);  // Diminuer progressivement le volume du lecteur en cours
            }

            if (to != null)
            {
                to.SetVolumeConsigne(to.GetCurrentVolumeConsigne());  // Augmenter progressivement le volume du nouveau lecteur
            }
        }

        /* Gestionnaire de volume par type de lecteur */
        // Méthode pour ajuster progressivement le volume
        public void SetVolume(string role, int volume)
        {
            switch (role.ToLower())
            {
                case "music":
                    musicVolume = volume; // On met à jour la consigne globale de volume
                    Console.WriteLine($"Le volume global de la musique est maintenant réglé à {musicVolume}%");

                    // Si une musique est en cours de lecture, on applique immédiatement ce nouveau volume
                    if (waveOutDeviceMusic != null && waveOutDeviceMusic.PlaybackState == PlaybackState.Playing)
                    {
                        volumeManagerMusic?.SetVolumeConsigne(musicVolume); // Ajuste progressivement le volume en cours
                        Console.WriteLine($"Volume de la musique en cours ajusté à {musicVolume}%");
                    }
                    break;
                case "journal":
                    volumeManagerJournal?.SetVolumeConsigne(volume);
                    Console.WriteLine($"Journal volume set to {volume}%");
                    break;
                case "infoprio":
                    volumeManagerPriority?.SetVolumeConsigne(volume);
                    Console.WriteLine($"Priority info volume set to {volume}%");
                    break;
            }
            Console.WriteLine();
        }

    }
    public class AudioPlayer
    {
        private Dictionary<string, string[]> effects;

        public AudioPlayer()
        {
            LoadEffects();
        }

        private void LoadEffects()
        {
            string appDirectory = AppDomain.CurrentDomain.BaseDirectory; // Répertoire de l'exécutable
            string jsonPath = Path.Combine(appDirectory, "effects.json");

            try
            {
                if (File.Exists(jsonPath))
                {
                    string jsonContent = File.ReadAllText(jsonPath);
                    effects = JsonConvert.DeserializeObject<Dictionary<string, string[]>>(jsonContent);
                    Console.WriteLine("Fichier 'effects.json' chargé avec succès.");
                }
                else
                {
                    Console.WriteLine("Erreur : Le fichier 'effects.json' est introuvable.");
                    effects = new Dictionary<string, string[]>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du chargement du fichier 'effects.json' : {ex.Message}");
                effects = new Dictionary<string, string[]>(); // Charger un dictionnaire vide en cas d'échec
            }
        }

        public void PlayAudioWithEffect(string filePath, string effectName, int volume)
        {
            // Teste si FFmpeg est disponible
            if (IsFFmpegAvailable())
            {
                // Recharger les effets à chaque demande
                LoadEffects();

                // Si l'effet est "none", jouer sans effet
                if (effectName.ToLower() == "none")
                {
                    Console.WriteLine("Aucun effet appliqué.");
                    PlayAudio(filePath, volume);
                }
                else if (!effects.ContainsKey(effectName.ToLower()))
                {
                    // Si l'effet demandé n'existe pas dans le fichier JSON, le signaler et jouer sans effet
                    Console.WriteLine($"Effet '{effectName}' non défini dans 'effects.json'. Le fichier sera joué sans effet.");
                    PlayAudio(filePath, volume);
                }
                else
                {
                    try
                    {
                        string outputFilePath = ApplyEffect(filePath, effectName);
                        PlayAudio(outputFilePath, volume);
                    }
                    catch (InvalidOperationException ex)
                    {
                        // Si FFmpeg retourne une erreur, on joue le fichier sans effet
                        Console.WriteLine($"Erreur lors de l'application de l'effet '{effectName}' : {ex.Message}. Lecture sans effet.");
                        PlayAudio(filePath, volume);
                    }
                }
            }
            else
            {
                // Si FFmpeg n'est pas disponible, lecture directe sans appliquer d'effet
                Console.WriteLine("FFmpeg non disponible, lecture sans effet.");
                PlayAudio(filePath, volume);
            }
        }

        private string ApplyEffect(string inputFilePath, string effectName)
        {
            string timestamp = DateTime.Now.ToString("yyyyMMddHHmmssfff");
            string baseDirectory = AppDomain.CurrentDomain.BaseDirectory; // Chemin de base de l'application
            string outputDir = Path.Combine(baseDirectory, "output"); // Chemin vers le dossier 'output'

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
            if (effects.TryGetValue(effectName.ToLower(), out string[] commands))
            {
                return "-af \"" + string.Join(",", commands) + "\"";
            }
            else
            {
                return "";  // Aucun effet n'est appliqué
            }
        }

        private void PlayAudio(string filePath, int volume)
        {
            using (var audioFile = new AudioFileReader(filePath))
            using (var outputDevice = new WaveOutEvent())
            {
                // Assurez-vous que le volume est dans une plage acceptable (0 à 1 pour NAudio)
                audioFile.Volume = Math.Clamp(volume / 100.0f, 0.0f, 1.0f);

                outputDevice.Init(audioFile);
                outputDevice.Play();

                // Attendre que la lecture se termine
                while (outputDevice.PlaybackState == PlaybackState.Playing)
                {
                    Thread.Sleep(1000);  // Vérifie toutes les secondes
                }
            }
        }
        public bool IsFFmpegAvailable()
        {
            try
            {
                Process ffmpeg = new Process();
                ffmpeg.StartInfo.FileName = "ffmpeg";
                ffmpeg.StartInfo.Arguments = "-version"; // Simple commande pour vérifier si ffmpeg répond
                ffmpeg.StartInfo.UseShellExecute = false;
                ffmpeg.StartInfo.RedirectStandardOutput = true;
                ffmpeg.StartInfo.RedirectStandardError = true;
                ffmpeg.StartInfo.CreateNoWindow = true;

                ffmpeg.Start();
                ffmpeg.WaitForExit();

                if (ffmpeg.ExitCode == 0)
                {
                    Console.WriteLine("FFmpeg est disponible.");
                    return true;
                }
                else
                {
                    string error = ffmpeg.StandardError.ReadToEnd();
                    Console.WriteLine($"Erreur lors de l'exécution de FFmpeg : {error}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FFmpeg n'est pas disponible : {ex.Message}");
                return false;
            }
        }
    }

}
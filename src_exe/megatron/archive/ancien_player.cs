using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using NAudio.Wave;

namespace anc_megatron
{
    public class SoundFile
    {
        /* le moule de l'objet SoundFile / mp3 */
        public string FilePath { get; set; }
        public string Role { get; set; } // "music", "journal", "infoprio"
        public string Effect { get; set; } // Placeholder for future effects
        public int Volume { get; set; } // Volume as a percentage (0-100)
        public int VolumeConsigne { get; set; } // Volume cible à atteindre progressivement
        public bool CutAll { get; set; } // Option pour couper tous les autres sons

        /**
        * définition du mp3 qui va êter utilisé
        *
        * @param string FilePath ,l'adresse ou se trouve le fichier à lire
        * @param string Role , si c'est de la music/journal/infoprio
        * @param string effect , casque/vaisseaux/mobyglass
        * @param int volume , si c'est de la music/journal/infoprio
        * 
        * @example
        * Sounfile('\chemin\fichier.mp3', 'music', 'vaisseaux',50')
        * 
        */

        public SoundFile(string filePath, string role, string effect = null, int volume = 50, bool cutAll = false)
        {
            FilePath = filePath;
            Role = role;
            Effect = effect;
            Volume = volume;
            VolumeConsigne = volume; // Par défaut, la consigne est égale au volume initial
            CutAll = cutAll; // Par défaut, cut_all est false
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

        public void SetVolumeConsigne(int newConsigne)
        {
            _volumeConsigne = newConsigne;
            if (!_isAdjusting)
            {
                _isAdjusting = true;
                Task.Run(AdjustVolumeCycle);
            }
        }

        private void AdjustVolumeCycle()
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

                Thread.Sleep(100);

                if (_volume == _volumeConsigne)
                {
                    _isAdjusting = false;
                }
            }
        }

        // Nouvelle méthode pour obtenir la consigne de volume actuelle
        public int GetCurrentVolumeConsigne()
        {
            return _volumeConsigne;
        }
    }

    public class SoundManager
    {
        private IWavePlayer waveOutDeviceMusic1;
        private AudioFileReader audioFileReaderMusic1;
        private VolumeManager volumeManagerMusic1;

        private IWavePlayer waveOutDeviceMusic2;
        private AudioFileReader audioFileReaderMusic2;
        private VolumeManager volumeManagerMusic2;

        private IWavePlayer waveOutDeviceJournal;
        private AudioFileReader audioFileReaderJournal;
        private VolumeManager volumeManagerJournal;

        private IWavePlayer waveOutDevicePriority;
        private AudioFileReader audioFileReaderPriority;
        private VolumeManager volumeManagerPriority;

        /* le moule de l'objet SoundManager */
        private Thread musicThread1;                                             /* lecteur audio music1 */
        private Thread musicThread2;                                             /* lecteur audio music2 */
        private Thread journalThread;                                            /* lecteur audio journal */
        private Thread priorityInfoThread;                                       /* lecteur audio info importante */

        private CancellationTokenSource journalCancellationTokenSource;          /* gestionnaire d'annulation du thread pour le journal */
        private CancellationTokenSource priorityCancellationTokenSource;         /* gestionnaire d'annulation du thread pour les info prioritaire */
        private bool isPlayingPriority = false; // Indicateur si un son prioritaire est en cours de lecture

        private ConcurrentQueue<SoundFile> priorityQueue = new ConcurrentQueue<SoundFile>();

        private ConcurrentQueue<SoundFile> musicQueue = new ConcurrentQueue<SoundFile>();

        private bool playerOneInUse = true; // Indique si le premier lecteur est utilisé
        private bool isPaused = false; // Indique si la musique est en pause

        private int music1Volume = 100;
        private int music2Volume = 100;
        private int journalVolume = 100;
        private int priorityVolume = 100;

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
            if (playerOneInUse)
            {
                waveOutDeviceMusic1?.Pause();
            }
            else
            {
                waveOutDeviceMusic2?.Pause();
            }
            isPaused = true;
            Console.WriteLine("Musique mise en pause.");
        }

        // Méthode pour reprendre la musique mise en pause ou relancer la playlist
        public void ResumeMusic()
        {
            if (isPaused)
            {
                if (playerOneInUse)
                {
                    waveOutDeviceMusic1?.Play();
                }
                else
                {
                    waveOutDeviceMusic2?.Play();
                }
                isPaused = false;
                Console.WriteLine("Musique relancée.");
            }
            else
            {
                PlayNextMusicInQueue();
            }
        }

        // Méthode pour arrêter la musique et vider la queue
        public void Clear()
        {
            StopMusic();
            while (musicQueue.TryDequeue(out _)) { } // Vider la queue
            Console.WriteLine("liste d'attente vidée.");
        }

        // Méthode pour arrêter la musique en cours sans vider la queue
        public void StopMusic()
        {
            waveOutDeviceMusic1?.Stop();
            waveOutDeviceMusic2?.Stop();
            waveOutDeviceMusic1?.Dispose();
            waveOutDeviceMusic2?.Dispose();
            Console.WriteLine("Musique arrêtée.");
        }

        private void PlayMusic1(SoundFile soundFile)
        {
            if (waveOutDeviceMusic1 != null)
            {
                waveOutDeviceMusic1.Dispose();
            }

            audioFileReaderMusic1 = new AudioFileReader(soundFile.FilePath)
            {
                Volume = soundFile.Volume / 100.0f
            };
            waveOutDeviceMusic1 = new WaveOutEvent();
            waveOutDeviceMusic1.Init(audioFileReaderMusic1);

            // S'abonner à l'événement PlaybackStopped pour détecter la fin du morceau
            waveOutDeviceMusic1.PlaybackStopped += OnPlaybackStopped;

            waveOutDeviceMusic1.Play();

            volumeManagerMusic1 = new VolumeManager(audioFileReaderMusic1, soundFile.Volume);
        }

        private void PlayMusic2(SoundFile soundFile)
        {
            if (waveOutDeviceMusic2 != null)
            {
                waveOutDeviceMusic2.Dispose();
            }

            audioFileReaderMusic2 = new AudioFileReader(soundFile.FilePath)
            {
                Volume = soundFile.Volume / 100.0f
            };
            waveOutDeviceMusic2 = new WaveOutEvent();
            waveOutDeviceMusic2.Init(audioFileReaderMusic2);

            // S'abonner à l'événement PlaybackStopped pour détecter la fin du morceau
            waveOutDeviceMusic2.PlaybackStopped += OnPlaybackStopped;

            waveOutDeviceMusic2.Play();

            volumeManagerMusic2 = new VolumeManager(audioFileReaderMusic2, soundFile.Volume);
        }

        private void PlayMusic(SoundFile soundFile)
        {
            Console.WriteLine("Ajout à la file d'attente : " + soundFile.FilePath);
            musicQueue.Enqueue(soundFile);

            if ((musicThread1 == null) && (musicThread2 == null))
            {
                Console.WriteLine("Tous les lecteurs de musique sont disponible");
                //Console.WriteLine("soundFile : "+ soundFile.FilePath);
                //Console.WriteLine("musicThread1 : " + musicThread1);
                //Console.WriteLine("musicThread2 : " + musicThread2);

                PlayNextMusicInQueue();
            }
        }

        public void PlayNextMusicInQueue()
        {
            if (musicQueue.TryDequeue(out SoundFile soundFile))
            {
                if (playerOneInUse)
                {
                    if (musicThread2 == null || !musicThread2.IsAlive)
                    {
                        musicThread2 = new Thread(() =>
                        {
                            PlayMusic2(soundFile);
                            Crossfade(volumeManagerMusic1, volumeManagerMusic2);
                            playerOneInUse = false;
                        });
                        Console.WriteLine("Activation du lecteur 2");
                        musicThread2.Start();
                    }
                }
                else
                {
                    if (musicThread1 == null || !musicThread1.IsAlive)
                    {
                        musicThread1 = new Thread(() =>
                        {
                            PlayMusic1(soundFile);
                            Crossfade(volumeManagerMusic2, volumeManagerMusic1);
                            playerOneInUse = true;
                        });
                        Console.WriteLine("Activation du lecteur 1");
                        musicThread1.Start();
                    }
                }
            }
        }

        // Méthode appelée lorsque la lecture est terminée
        private void OnPlaybackStopped(object sender, StoppedEventArgs e)
        {
            Console.WriteLine("Le morceau est terminé.");

            // Optionnel: Déclencher la lecture du morceau suivant, gérer la file d'attente, etc.
            PlayNextMusicInQueue();
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
            waveOutDeviceJournal = new WaveOutEvent();
            waveOutDeviceJournal.Init(audioFileReaderJournal);
            waveOutDeviceJournal.Play();

            volumeManagerJournal = new VolumeManager(audioFileReaderJournal, soundFile.Volume);
        }

        /* lecteurs dédiés au journal */
        private void PlayPriorityInfo(SoundFile soundFile)
        {
            if (soundFile.CutAll)
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
                        priorityInfoThread = null;
                    }
                };

                volumeManagerPriority = new VolumeManager(audioFileReaderPriority, soundFile.Volume);
            }
        }

        private void PlayNextPriorityInfo()
        {
            if (priorityQueue.TryDequeue(out SoundFile soundFile))
            {
                isPlayingPriority = true;

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
                    isPlayingPriority = false;
                    PlayNextPriorityInfo(); // Passer au suivant dans la file d'attente
                };

                volumeManagerPriority = new VolumeManager(audioFileReaderPriority, soundFile.Volume);
            }
        }





        /* Gestionnaire de volume par type de lecteur */
        // Méthode pour ajuster progressivement le volume
        public void SetVolume(string role, int volume)
        {
            switch (role.ToLower())
            {
                case "music":
                    if (playerOneInUse)
                    {
                        volumeManagerMusic1?.SetVolumeConsigne(volume);
                    }
                    else
                    {
                        volumeManagerMusic2?.SetVolumeConsigne(volume);
                    }

                    Console.WriteLine($"Music volume set to {volume}%");
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
        }
    }
}
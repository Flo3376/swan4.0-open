using System;
using System.Collections.Generic;

namespace megatron
{
    public class Dispatcher
    {
        private SoundManager _soundManager; // Exemples d'autres classes peuvent être ajoutés ici

        public Dispatcher()
        {
            _soundManager = new SoundManager();
        }

        public void Dispatch(Command command)
        {
            try
            {
                switch (command.Target.ToLower())
                {
                    case "soundmanager":
                        _soundManager.HandleCommand(command);
                        break;
                    // Ajouter d'autres cas pour d'autres classes comme JournalManager, etc.
                    default:
                        Console.WriteLine("Cible non reconnue : " + command.Target);
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erreur lors de l'exécution de la commande : " + ex.Message);
            }
        }
    }
}

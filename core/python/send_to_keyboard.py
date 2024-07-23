import sys
from pynput.keyboard import Key, Controller
import time
import re

keyboard = Controller()

# Mise à jour du dictionnaire pour la conversion des noms de touches
key_map = {
    'ctrl_l': (Key.ctrl_l, 1),
    'ctrl_r': (Key.ctrl_r, 1),
    'alt_l': (Key.alt_l, 2),
    'alt_r': (Key.alt_r, 2),
    'shift_l': (Key.shift_l, 3),
    'shift_r': (Key.shift_r, 3),
    'space': (Key.space, 100),
    'f1': (Key.f1, 100),
    'f2': (Key.f2, 100),
    'f3': (Key.f3, 100),
    'f4': (Key.f4, 100),
    'f5': (Key.f5, 100),
    'f6': (Key.f6, 100),
    'f7': (Key.f7, 100),
    'f8': (Key.f8, 100),
    'f9': (Key.f9, 100),
    'f10': (Key.f10, 100),
    'f11': (Key.f11, 100),
    'f12': (Key.f12, 100),
}

# Cette fonction envoie un micro pulse uniquement aux touches modificateurs dont la priorité est < 100
def micro_pulse(processed_keys):
    print(f"pulse: {processed_keys}")
    for key, priority in processed_keys:
        if priority < 100:
            print(f"try_pulse: {key}")
            keyboard.press(key)
            time.sleep(0.1)  # Délai entre press et release
            keyboard.release(key)
            time.sleep(0.05)  # Délai après release avant de passer à la prochaine touche

# Trie les touches selon leur priorité en supposant une valeur par défaut de 100 pour les touches non listées
def sort_keys(keys):
    return sorted(keys, key=lambda k: key_map.get(k, (None, 100))[1])

# Fonction pour appuyer sur une touche unique
def press_key(key_name, duration):
    key = key_map.get(key_name, key_name)
    if isinstance(key, tuple):
        key = key[0]  # Utilisation de l'élément Key si la clé est trouvée dans key_map
    print(f"Pressing single key: {key}")
    keyboard.press(key)
    time.sleep(duration)
    keyboard.release(key)

# Fonction pour gérer une combinaison de touches
def press_combination(keys, duration):
    processed_keys = []
    for k in keys:
        key_entry = key_map.get(k, (k, 100))  # Assigne une priorité de 100 si la touche est inconnue
        processed_keys.append(key_entry)

    sorted_keys = sort_keys([k for k, _ in processed_keys])
    print(f"Pressing combination: {sorted_keys}")

    try:
        for key, _ in processed_keys:
            keyboard.press(key)
        time.sleep(duration)
    finally:
        for key, _ in processed_keys:
            keyboard.release(key)
        micro_pulse(processed_keys)  # Envoie un micro pulse aux touches modificateurs

# Fonction principale pour exécuter le script
def main():
    args = sys.argv[1:]  
    keys_string = args[0]
    duration_arg = args[1]

    duration = 0.2 if duration_arg == "short" else 1 if duration_arg == "long" else float(duration_arg)
    keys = re.findall(r'\{([^}]*)\}', keys_string)

    if len(keys) == 1:
        press_key(keys[0], duration)
    elif len(keys) > 1:
        press_combination(keys, duration)

if __name__ == "__main__":
    main()

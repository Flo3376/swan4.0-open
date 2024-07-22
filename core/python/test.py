import sys
from pynput.keyboard import Key, Controller
import time
import re

keyboard = Controller()

# Mise à jour du dictionnaire pour la conversion des noms de touches
key_map = {
    'ctrl_l': Key.ctrl_l,
    'ctrl_r': Key.ctrl_r,
    'alt_l': Key.alt_l,
    'alt_r': Key.alt_r,
    'shift_l': Key.shift_l,
    'shift_r': Key.shift_r,
    'space': Key.space,
    'f1': Key.f1,
    'f2': Key.f2,
    'f3': Key.f3,
    'f4': Key.f4,
    'f5': Key.f5,
    'f6': Key.f6,
    'f7': Key.f7,
    'f8': Key.f8,
    'f9': Key.f9,
    'f10': Key.f10,
    'f11': Key.f11,
    'f12': Key.f12,
}

def micro_pulse(keys):
    for key in keys:
        if key in [Key.ctrl_l, Key.ctrl_r, Key.alt_l, Key.alt_r, Key.shift_l, Key.shift_r]:
            keyboard.press(key)
            keyboard.release(key)
            time.sleep(0.05)  # Un bref délai pour le micro pulse

def press_key(key_name, duration):
    key = key_map.get(key_name, key_name)
    print(f"Pressing single key: {key}")
    keyboard.press(key)
    time.sleep(duration)
    keyboard.release(key)

def press_combination(keys, duration):
    keys = [key_map.get(k, k) for k in keys]
    print(f"Pressing combination: {keys}")
    try:
        with keyboard.pressed(keys[0]):
            for key in keys[1:]:
                keyboard.press(key)
            time.sleep(duration)
    finally:
        for key in keys:
            keyboard.release(key)
        micro_pulse([keys[0]] + keys[1:])  # Envoyer un micro pulse aux touches utilisées

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

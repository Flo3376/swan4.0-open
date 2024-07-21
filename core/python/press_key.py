from pynput.keyboard import Controller, Key
import sys

def press_key(key):
    keyboard = Controller()
    # Convertit la touche reçue en un attribut de l'objet Key si possible
    if hasattr(Key, key):
        key_to_press = getattr(Key, key)
    else:
        key_to_press = key

    # Appuie et relâche la touche
    keyboard.press(key_to_press)
    keyboard.release(key_to_press)

if __name__ == '__main__':
    key_to_press = sys.argv[1]  # Prend la touche à appuyer depuis la ligne de commande
    press_key(key_to_press)
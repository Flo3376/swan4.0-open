from pynput.keyboard import Controller, Key
import sys
import time

def hold_key(key, duration):
    keyboard = Controller()
    
    # Convertit la touche reçue en un attribut de l'objet Key si possible
    try:
        key_to_hold = getattr(Key, key)  # Pour les touches spéciales comme 'enter', 'space'
    except AttributeError:
        key_to_hold = key  # Pour les touches alphanumériques
    
    # Maintenir la touche
    keyboard.press(key_to_hold)
    time.sleep(duration)
    keyboard.release(key_to_hold)

if __name__ == '__main__':
    key_to_hold = sys.argv[1]  # Prend la touche à maintenir depuis la ligne de commande
    duration = float(sys.argv[2])  # Prend la durée en secondes depuis la ligne de commande
    hold_key(key_to_hold, duration)

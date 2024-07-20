import pyautogui
import sys
import time

def hold_key(key, duration):
    pyautogui.keyDown(key)
    time.sleep(duration)
    pyautogui.keyUp(key)

if __name__ == '__main__':
    key_to_hold = sys.argv[1]  # Prend la touche à maintenir depuis la ligne de commande
    duration = float(sys.argv[2])  # Prend la durée en secondes depuis la ligne de commande
    hold_key(key_to_hold, duration)

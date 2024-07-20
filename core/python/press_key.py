import pyautogui
import sys

def press_key(key):
    pyautogui.press(key)

if __name__ == '__main__':
    key_to_press = sys.argv[1]  # Prend la touche à appuyer depuis la ligne de commande
    press_key(key_to_press)

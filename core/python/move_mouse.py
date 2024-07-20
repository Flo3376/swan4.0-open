import pyautogui
import sys

def move_mouse(x, y):
    pyautogui.moveTo(x, y)

if __name__ == '__main__':
    x_position = int(sys.argv[1])  # Prend la position X depuis la ligne de commande
    y_position = int(sys.argv[2])  # Prend la position Y depuis la ligne de commande
    move_mouse(x_position, y_position)

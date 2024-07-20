import pyautogui
import sys

def click_mouse(button):
    pyautogui.click(button=button)

if __name__ == '__main__':
    button_to_click = sys.argv[1]  # Prend 'left' ou 'right' depuis la ligne de commande
    click_mouse(button_to_click)

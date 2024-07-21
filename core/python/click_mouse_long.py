from pynput.mouse import Button, Controller
import sys
import time  # Importer le module time pour utiliser sleep

def click_mouse(button):
    mouse = Controller()
    # Vérifier quel bouton doit être cliqué
    if button == 'left':
        button_to_click = Button.left
    elif button == 'right':
        button_to_click = Button.right
    else:
        raise ValueError("Unsupported button type. Use 'left' or 'right'.")
    
    # Appuyer sur le bouton
    mouse.press(button_to_click)
    time.sleep(1)  # Maintenir le bouton pressé pendant 1 seconde
    # Relâcher le bouton
    mouse.release(button_to_click)

if __name__ == '__main__':
    button_to_click = sys.argv[1]  # Prend 'left' ou 'right' depuis la ligne de commande
    click_mouse(button_to_click)

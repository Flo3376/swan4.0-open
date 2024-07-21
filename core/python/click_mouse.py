from pynput.mouse import Button, Controller
import sys

def click_mouse(button):
    mouse = Controller()
    # Vérifier quel bouton doit être cliqué
    if button == 'left':
        button_to_click = Button.left
    elif button == 'right':
        button_to_click = Button.right
    else:
        raise ValueError("Unsupported button type. Use 'left' or 'right'.")
    
    # Effectuer le clic
    mouse.click(button_to_click)

if __name__ == '__main__':
    button_to_click = sys.argv[1]  # Prend 'left' ou 'right' depuis la ligne de commande
    click_mouse(button_to_click)

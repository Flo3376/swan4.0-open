from pynput.keyboard import Controller, Key
import time

def press_space_with_delay(delay, repetitions):
    keyboard = Controller()
    for _ in range(repetitions):
        time.sleep(delay)  # Attendre avant de presser la touche espace
        keyboard.press(Key.space)  # Appuyer sur la touche espace
        keyboard.release(Key.space)  # Relâcher la touche espace

# Appeler la fonction avec un délai de 5 secondes et 3 répétitions
press_space_with_delay(5, 3)

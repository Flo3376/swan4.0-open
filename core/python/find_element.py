import pyautogui
import time

try:
    # Prendre une capture d'écran
    pyautogui.screenshot('screenshot.png')

    # Trouver l'emplacement d'une image particulière dans la capture d'écran
    location = pyautogui.locateOnScreen('tofind.png')
    # Ajouter un délai pour s'assurer que la capture d'écran est complète
    #time.sleep(1)  # Délai d'une seconde

    if location:
        print("Image trouvée à :", location)
        # Vous pouvez aussi cliquer au milieu de l'image trouvée
        center = pyautogui.center(location)
        pyautogui.click(center)
    else:
        print("Image non trouvée")
except pyautogui.ImageNotFoundException:
    print("Image non trouvée - Exception gérée")

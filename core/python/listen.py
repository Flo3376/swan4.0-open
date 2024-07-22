from pynput.keyboard import Key, Listener

def on_press(key):
    try:
        print('Key {} pressed.'.format(key.char))
    except AttributeError:
        print('Special key {} pressed.'.format(key))

def on_release(key):
    print('Key {} released.'.format(key))
    if key == Key.esc:
        # Stop listener
        return False

# Collect events until released
with Listener(on_press=on_press, on_release=on_release) as listener:
    listener.join()

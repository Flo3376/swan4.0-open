# swan4.0

Swan 4.0 est un chatbot pour Star Citizen.


# Setup

Pour installer les dépendances, exécutez la commande suivante dans votre terminal, à la racine du projet :
```bash
$ npm install
```

## Programmes à installer
Pour pouvoir capture le son il faut installer SoX - Sound eXchange dispo a cette adresse: https://sourceforge.net/projects/sox/

# Capture de la touche - push to talk

### 2 étapes : 
- Trouver la touche clavier sur lequel vous voulez le mettre OU la touche joystick
- Renseigner cela dans le fichier .env


## Pour utiliser le clavier
Pour connaitre le code d'une touche clavier
1. Executer `node S5_find_keys.js`
2. Appuyer sur __la touche__ que vous souhaiter utiliser
3. Dans le fichier.env remplir le champ `key_keyboard_Id`

Exemple :
```javascript
key_keyboard_Id= LEFT SHIFT
```
   
   


## Pour utiliser une manette de jeux ou joystick
### Trouver le joystick

Pour trouver votre joystick, suivez ces étapes :

1. Exécutez le programme `node S1_find_joy.js`.

2. La première fois, il affichera tous les périphériques connectés.

3. Repérez dans la liste le constructeur du joystick qui vous intéresse.

4. Modifiez la ligne 12 du fichier `S1_find_joy.js` en remplaçant `'la marque que vous voulez'` par le nom de la marque de votre joystick.
   ```javascript
   var filterString = 'Logitech';
   ```

5. Relancez le programme.

6. Identifiez le bon joystick et notez les vendorid et productid pour votre configuration.


## Trouver la trame où se cache votre bouton

Pour dans la trame de donnés où se trouve votre bouton, suivez ces étapes :

1. Modifier la ligne 7 et 8 du fichier `node S2_find_trame.js` en remplaçant vendorId et productId pour ce qui vous avez noté pendant l'étape précédente.
    ```javascript
        // Remplacez par le vendorId et le productId de votre manette
        const vendorId = 13124; // Par exemple, pour une manette Virpil
        const productId = 32971; // Par exemple, pour une manette Virpil
        ```

2. Exécutez le programme `S2_find_trame.js`.

3. appuyer sur le bouton de votre joystique ou manette pour avoir le numéro de l'octet qui bouge
    `Changement détecté à l'octet 21: 0 -> 32`
    l'octet qui nous interresse est le 21

## Trouver votre bouton dans la trame

Pour le dernier élément qui définis votre bouton, suivez ces étapes :

1. Modifier les lignes 7 et 8 du fichier `S3_find_button.js` en remplaçant vendorId et productId pour ce que vous avez noté pendant l'étape précédente.
    ```javascript
        // Remplacez par le vendorId et le productId de votre manette
        const vendorId = 13124; // Par exemple, pour une manette Virpil
        const productId = 32971; // Par exemple, pour une manette Virpil
    ```

2. Modifier la ligne 11 du fichier `S3_find_button.js` renseignant l'octet que vous avez noté pendant l'étape précédente.
    ```javascript
    // Spécifiez l'octet à surveiller (index de la trame)
    const sur_tram = 21; // Par exemple, surveiller le 21e octet
    ```

2. Exécutez le programme `node S3_find_button.js`.

3. appuyer sur le bouton de votre joystique ou manette pour avoir le numéro de le bit qui bouge
    `Bouton 6: Appuyé (vendorId: 13124, productId: 32971, octet: 21, bit: 0x20)`
    le bit est `0x20`

4. un résumé complet du bouton est affiché
    `(vendorId: 13124, productId: 32971, octet: 21, bit: 0x20)`
5. compléter le fichier .env
   ```javascript
   vendorId = 13124
   productId = 32971
   tramId = 21
   bp_Id=0x40
   ```

**Tout ces éléments permetront de définir le bouton de push to talk pour Swan. Il faudra renseigner ces informations dans le fichier.env**

# Lancement de swan #
```javascript
   node swan.js
   ```

# Bonus

## Dépendances installées

Voici la liste des dépendances installées :

- **colors** (^1.4.0) : Permet d'ajouter des couleurs au texte affiché dans le terminal.
- **dotenv** (^16.4.5) : Charge les variables d'environnement à partir d'un fichier `.env`.
- **mic** (^2.1.2) : Permet d'accéder au microphone de l'ordinateur.
- **node-hid** (^3.1.0) : Donne accès aux périphériques HID (Human Interface Device) via Node.js.
- **openai** (^4.52.0) : SDK pour interagir avec l'API OpenAI.
- **"node-global-key-listener** (^0.3.0) : Permet de surveiller les évents claviers.


# Principe de fonctionnement
![Logo](/principe%20swan%204.0.png)
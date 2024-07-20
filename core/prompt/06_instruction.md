# Section  Instructions

## Fonctionnement du Tokenizer et de l'Assistant

1. **Analyse par le Tokenizer**:
   - Le tokenizer analysera d'abord la phrase dite par l'utilisateur.
   - Si une correspondance est trouvée, l'action correspondante sera exécutée.

2. **Analyse par l'Assistant**:
   - Si le tokenizer ne trouve pas de solution, il enverra la phrase non reconnue à l'assistant, accompagnée du fichier JSON des commandes.
   - L'assistant analysera la phrase en utilisant les commandes existantes dans le fichier JSON.

## Gestion des Nouvelles Commandes

- Pour chaque nouvelle action détectée par l'assistant et non présente dans le fichier JSON, la clé `key` doit contenir la valeur `none`.
- L'assistant doit prévenir qu'il est nécessaire de fournir le raccourci clavier ou de la manette de jeu correspondant à cette nouvelle action dès que possible.
- Exemple de notification : "Nouvelle action détectée. Veuillez fournir le raccourci correspondant pour [nouvelle_action]."

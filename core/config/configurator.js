// configManager.js
const colors = require('colors');

const fs = require('fs');
const yaml = require('js-yaml');

// Fonction pour charger la configuration YAML
function load_config(filePath) {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(fileContents);
        return data;
    } catch (e) {
        console.log(colors.red(`Failed to load file ${filePath}: ${e}`));
        return null;
    }
}

// Fonction pour afficher la configuration de manière structurée
function display_config(config, indent = '') {
    if (config !== null && typeof config === 'object') {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                console.log(colors.cyan(`${indent}${key}:`));
                display_config(config[key], indent + '  ');
            }
        }
    } else {
        console.log(`${indent}${config}`);
    }
}
function truncateString(str, maxLength) {
    if (str.length > maxLength) {
      return str.substring(0, maxLength - 3) + '...';  // Soustraire 3 pour les points de suspension
    }
    return str;
  }
// Fonction pour mettre à jour le fichier de configuration
function update_config(filePath, updates) {
    const fileLines = fs.readFileSync(filePath, 'utf8').split('\n');
    const newLines = fileLines.map(line => {
      const trimmedLine = line.trim();
            
      // Ignorer les lignes commentées ou vides
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        return line;
      }
  
      // Vérifier si la ligne contient une clé à mettre à jour
      const keyMatch = Object.keys(updates).find(key => trimmedLine.startsWith(key));
      if (keyMatch) {
        // Construire la nouvelle ligne avec la clé et la nouvelle valeur
        const indentation = line.indexOf(keyMatch);
        
        // Log de la modification avec troncature à 30 caractères
        const newLine = line.substring(0, indentation) + keyMatch + ': ' + updates[keyMatch];

    
        console.log(colors.yellow("        Modification de la ligne :" + truncateString(newLine, 100)));

        return line.substring(0, indentation) + keyMatch + ' : ' + updates[keyMatch];
      }
  
      // Retourner la ligne originale si aucune clé à mettre à jour n'est trouvée
      return line;
    });
  
    // Écrire les nouvelles lignes dans le fichier
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  }



module.exports = { load_config, display_config,update_config  };
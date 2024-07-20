const fs = require('fs');
const yaml = require('js-yaml');

function loadYAMLConfig(filePath) {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(fileContents);
        return data;
    } catch (e) {
        console.error(`Failed to load file ${filePath}: ${e}`);
        return null;
    }
}

function displayObject(obj, indent = '') {
    if (obj !== null && typeof obj === 'object') {
        // Si l'objet est un objet ou un tableau, itérer sur ses propriétés
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                console.log(`${indent}${key}:`);
                displayObject(obj[key], indent + '  ');
            }
        }
    } else {
        // Si c'est une valeur primitive, l'afficher directement
        console.log(`${indent}${obj}`);
    }
}

const config = loadYAMLConfig('./config.yaml');
if (config) {
    console.log("Configuration Tree:");
    displayObject(config);
}

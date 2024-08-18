const fs = require('fs');
const path = require('path');

// Exclure certains répertoires
const excludeDirs = ['node_modules', '.git', 'dist','src_exe']; // Ajoutez d'autres répertoires à exclure si nécessaire

// Fonction pour lister tous les répertoires de manière récursive avec indentation
function listDirectories(currentPath, indent = '') {
    const contents = fs.readdirSync(currentPath, { withFileTypes: true });

    contents.forEach(entry => {
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
            // Si c'est un répertoire et qu'il n'est pas dans la liste d'exclusion
            console.log(indent + entry.name);  // Afficher le nom du répertoire avec indentation

            const nextPath = path.join(currentPath, entry.name);
            listDirectories(nextPath, indent + '   ');  // Ajouter une indentation pour les sous-répertoires
        }
    });
}

// Point de départ : remplacer './' par le chemin du répertoire de départ souhaité
listDirectories('./');

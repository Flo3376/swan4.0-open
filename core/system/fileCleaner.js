const fs = require('fs');
const path = require('path');

function cleanDirectory(directory, interval = 60000, ageLimit = 5) {
    const cleanFiles = () => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(`Erreur lors de la lecture du répertoire ${directory}:`, err);
                return;
            }

            files.forEach(file => {
                if (file !== '.gitkeep') {
                    const filePath = path.join(directory, file);
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            console.error(`Erreur lors de la récupération des informations du fichier ${filePath}:`, err);
                            return;
                        }

                        const now = new Date().getTime();
                        const endTime = new Date(stats.mtime).getTime() + ageLimit * 60000;

                        if (now > endTime) {
                            fs.unlink(filePath, err => {
                                if (err) {
                                    console.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
                                } else {
                                    //console.log(`Fichier supprimé: ${filePath}`);
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    setInterval(cleanFiles, interval);
}

module.exports = { cleanDirectory };

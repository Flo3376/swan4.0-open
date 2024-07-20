const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Ou 'pug' si vous préférez
app.use(express.static('public'));

app.get('/', (req, res) => {
  try {
    const doc = yaml.load(fs.readFileSync('./core/config/config.yaml', 'utf8'));
    res.render('index', { config: doc });
  } catch (e) {
    console.log(e);
    res.status(500).send("Erreur lors du chargement du fichier YAML.");
  }
});

app.post('/', (req, res) => {
  try {
    const newYaml = req.body; // Assurez-vous que la structure de `req.body` correspond à celle attendue par `js-yaml`.
    fs.writeFileSync('./core/config/config.yaml', yaml.dump(newYaml));
    res.redirect('/');
  } catch (e) {
    console.log(e);
    res.status(500).send("Erreur lors de l'enregistrement du fichier YAML.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

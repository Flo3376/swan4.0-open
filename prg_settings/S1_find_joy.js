// Importation du module 'node-hid' pour accéder aux périphériques HID
var HID = require('node-hid');

// Définir le type de pilote. Remplacez par le type de pilote que vous souhaitez utiliser
var type = 'hidraw';  
console.log("driverType:", type);

// Définir le type de pilote dans le module 'node-hid'
HID.setDriverType(type);

// Chaîne de filtre définie en dur dans le programme. Modifiez cette valeur pour changer le filtre
var filterString = 'Razer'; 

// Récupération de la liste des périphériques HID disponibles
var devices = HID.devices();

// Parcourir chaque périphérique dans la liste des périphériques
devices.forEach(device => {
    // Créer un nouvel objet contenant uniquement les propriétés souhaitées
    var filteredDevice = {
        vendorId: device.vendorId,
        productId: device.productId,
        path: device.path,
        manufacturer: device.manufacturer,
        product: device.product
    };

    // Appliquer le filtre insensible à la casse si filterString est défini
    if (filterString.length>0) {
        // Convertir les chaînes en minuscules pour une comparaison insensible à la casse
        if (
            (filteredDevice.manufacturer && filteredDevice.manufacturer.toLowerCase().includes(filterString.toLowerCase())) ||
            (filteredDevice.product && filteredDevice.product.toLowerCase().includes(filterString.toLowerCase()))
        ) {
            // Afficher les informations filtrées du périphérique si le filtre correspond
            console.log(filteredDevice);
        }
    } else {
        // Afficher les informations du périphérique si aucun filtre n'est défini
        console.log(filteredDevice);
    }
});

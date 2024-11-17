// Configuración de la base de datos IndexedDB
let db;
const request = indexedDB.open('AsistenciasDB', 1);

request.onerror = function (event) {
    console.log('Error al abrir la base de datos', event);
};

request.onsuccess = function (event) {
    db = event.target.result;
    console.log('Base de datos abierta con éxito:', db);
};

request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('asistencias', { keyPath: 'id', autoIncrement: true });
};

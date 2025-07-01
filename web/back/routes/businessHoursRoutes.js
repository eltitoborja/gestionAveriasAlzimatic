// Ruta del archivo: routes/businessHoursRoutes.js

// --- 1. IMPORTACIONES ---
// Se importa la librería Express para utilizar su sistema de enrutamiento.
const express = require('express');
// Se crea una nueva instancia del enrutador de Express para definir las rutas de este módulo.
const router = express.Router();
// Se importa el controlador que contiene la lógica para obtener y guardar el horario de negocio.
const businessHoursController = require('../controllers/businessHoursController');
// Se importa el middleware 'verifyToken' para proteger las rutas.
const { verifyToken } = require('../middleware/authMiddleware');

// Log de depuración que se muestra en la consola cuando el servidor se inicia.
console.log("businessHoursRoutes.js: Configurando rutas para / (GET y POST - protegidas)");

// --- 2. DEFINICIÓN DE RUTAS PROTEGIDAS ---
// Todas las rutas en este archivo requieren que el usuario esté autenticado.
// Por eso, todas utilizan el middleware 'verifyToken' antes de llegar al controlador.

// Ruta para OBTENER el horario de negocio del usuario autenticado.
// Cuando llega una petición GET a '/api/business-hours/':
// 1. Se ejecuta 'verifyToken' para asegurar que el usuario ha iniciado sesión.
// 2. Si el token es válido, se pasa el control a 'businessHoursController.getBusinessHours'.
router.get('/', verifyToken, businessHoursController.getBusinessHours);

// Ruta para ESTABLECER o ACTUALIZAR el horario de negocio del usuario autenticado.
// Cuando llega una petición POST a '/api/business-hours/':
// 1. Se ejecuta 'verifyToken'.
// 2. Si el token es válido, se pasa el control a 'businessHoursController.setBusinessHours'.
router.post('/', verifyToken, businessHoursController.setBusinessHours);

// --- 3. EXPORTACIÓN ---
// Se exporta el enrutador con las rutas ya configuradas para que el archivo principal de la
// aplicación (app.js o server.js) pueda utilizarlas.
module.exports = router;
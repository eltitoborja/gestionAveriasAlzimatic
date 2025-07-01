// Ruta del archivo: routes/incidentRoutes.js

// --- 1. IMPORTACIONES ---
const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { verifyToken } = require('../middleware/authMiddleware');

// --- 2. DEFINICIÓN DE RUTAS ---

// Ruta para CREAR una nueva incidencia (protegida).
router.post('/', verifyToken, incidentController.createIncident);

// Ruta para OBTENER TODAS las incidencias (protegida).
// Necesaria para el panel de administrador.
router.get('/', verifyToken, incidentController.getIncidents);

// Ruta para OBTENER UNA incidencia específica por su ID (protegida).
router.get('/:id', verifyToken, incidentController.getIncidentById);

// Ruta para ACTUALIZAR una incidencia por su ID (protegida).
// Útil para que un admin cambie el estado de "abierta" a "resuelta".
router.put('/:id', verifyToken, incidentController.updateIncident);

// Ruta para ELIMINAR una incidencia por su ID (protegida).
// El controlador ya valida que solo un admin pueda hacer esto.
router.delete('/:id', verifyToken, incidentController.deleteIncident);


// --- 3. EXPORTACIÓN ---
module.exports = router;
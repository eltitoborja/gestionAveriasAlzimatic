// Ruta del archivo: routes/authRoutes.js

// --- 1. IMPORTACIONES ---
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// --- CAMBIO: Se importa verifyToken e isAdmin ---
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// --- 2. DEFINICIÓN DE RUTAS ---

// Ruta para registrar un nuevo usuario
router.post('/register', authController.register);

// Ruta para iniciar sesión
router.post('/login', authController.login);

// Ruta para obtener los datos del usuario actualmente autenticado (Ruta Protegida)
router.get('/me', verifyToken, authController.getMe);

// Ruta para el inicio de sesión mediante QR
router.post('/qr-login', authController.qrLogin);

// Ruta para cerrar sesión (Ruta Protegida)
router.post('/logout', verifyToken, authController.logout);


// --- NUEVA RUTA AÑADIDA ---
// Esta ruta devuelve todos los usuarios y está protegida para que solo los admins puedan usarla.
// Se ejecutan los middlewares en orden: primero 'verifyToken', y si es exitoso, luego 'isAdmin'.
router.get('/users', [verifyToken, isAdmin], authController.getAllUsers);


// --- 3. EXPORTACIÓN ---
module.exports = router;
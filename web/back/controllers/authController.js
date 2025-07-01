// Ruta del archivo: controllers/authController.js

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const JWT_SECRET = process.env.JWT_SECRET; 

// --- FUNCIÓN DE REGISTRO DE USUARIOS ---
exports.register = async (req, res) => {
    // ... (Tu código de registro existente, sin cambios)
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ message: 'Email y contraseña (mínimo 6 caracteres) son obligatorios.' });
    }
    try {
        const [existingUsers] = await pool.query('SELECT id FROM usuario WHERE correo = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO usuario (correo, contraseña) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: 'Usuario registrado con éxito.', userId: result.insertId });
    } catch (error) {
        console.error('Error en el controlador de registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al intentar registrar.' });
    }
};

// --- FUNCIÓN DE INICIO DE SESIÓN (LOGIN) - CORREGIDA ---
exports.login = async (req, res) => {
    console.log("CONTROLADOR: Petición a /api/login recibida.");
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'El email y la contraseña son obligatorios.' });
    }
    
    try {
        const [users] = await pool.query('SELECT id, correo, contraseña, tipo_usuario FROM usuario WHERE correo = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        
        const user = users[0];
        
        const isMatch = await bcrypt.compare(password, user.contraseña); 
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        
        // --- CAMBIO IMPORTANTE ---
        // El payload ahora incluye el 'tipo_usuario' para que el rol del usuario viaje en el token.
        const payload = { 
            userId: user.id, 
            email: user.correo,
            tipo_usuario: user.tipo_usuario // <-- ¡Esta línea es crucial!
        };
        
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: { id: user.id, email: user.correo, tipo_usuario: user.tipo_usuario }
        });
        
    } catch (error) {
        console.error('Error en el controlador de login:', error);
        res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' });
    }
};

// --- FUNCIÓN PARA OBTENER DATOS DEL USUARIO AUTENTICADO ---
exports.getMe = async (req, res) => {
    // ... (Tu código de getMe existente, sin cambios)
};

// --- FUNCIÓN DE LOGIN ESPECIAL MEDIANTE QR ---
exports.qrLogin = async (req, res) => {
    // ... (Tu código de qrLogin existente, sin cambios)
};

// --- FUNCIÓN DE CIERRE DE SESIÓN (LOGOUT) ---
exports.logout = async (req, res) => {
    // ... (Tu código de logout existente, sin cambios)
};

// --- NUEVA FUNCIÓN AÑADIDA ---
// Devuelve una lista de todos los usuarios registrados (solo su id y email).
exports.getAllUsers = async (req, res) => {
    try {
        // Seleccionamos solo los campos necesarios para poblar el desplegable del frontend.
        const [users] = await pool.query('SELECT id, email FROM usuarios ORDER BY email ASC');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error al obtener la lista de usuarios:", error);
        res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
    }
};
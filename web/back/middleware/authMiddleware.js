// Ruta del archivo: middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Middleware para verificar el token en cada petición protegida
exports.verifyToken = (req, res, next) => {
    // Busca el token en el encabezado 'Authorization', que debe tener el formato "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No se proveyó un token. Acceso denegado.' });
    }

    // Verifica el token usando la clave secreta
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Si el token es inválido o ha expirado, devuelve un error
            return res.status(403).json({ message: 'Token inválido o expirado.' });
        }
        // Si el token es válido, guarda los datos del usuario en el objeto de la petición (req)
        // para que las siguientes funciones puedan acceder a ellos.
        req.user = user;
        // Pasa el control a la siguiente función de middleware o al controlador final.
        next();
    });
};

// --- NUEVA FUNCIÓN AÑADIDA ---
// Middleware para verificar si el usuario tiene rol de administrador.
// Este middleware debe usarse siempre DESPUÉS de verifyToken.
exports.isAdmin = (req, res, next) => {
    // Comprueba si req.user existe y si el tipo de usuario es 2 (admin)
    if (req.user && req.user.tipo_usuario === 2) {
        next(); // Es admin, puede continuar.
    } else {
        // Si no es admin, deniega el acceso con un error 403 (Prohibido).
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};
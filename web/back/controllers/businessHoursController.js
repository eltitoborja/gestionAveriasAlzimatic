// Ruta del archivo: controllers/businessHoursController.js

// --- 1. IMPORTACIONES ---
// Se importa el pool de conexiones a la base de datos para poder realizar consultas.
const pool = require('../config/db');

// --- 2. FUNCIÓN PARA OBTENER EL HORARIO DE NEGOCIO ---
// Exporta la función para que pueda ser utilizada por el enrutador de Express.
// Esta función gestiona las peticiones GET para obtener el horario de un usuario.
exports.getBusinessHours = async (req, res) => {
    // Se asume que un middleware (ej. 'verifyToken') ya ha verificado el token del usuario
    // y ha añadido la información del usuario (incluido su ID) al objeto 'req'.
    const userId = req.user.userId;
    console.log(`CONTROLADOR: Petición GET /api/business-hours recibida del usuario ID: ${userId}`);

    // Se utiliza un bloque try...catch para manejar posibles errores durante la consulta a la base de datos.
    try {
        // Ejecuta una consulta para seleccionar las horas de apertura y cierre para el ID de usuario específico.
        const [rows] = await pool.query(
            'SELECT apertura, cierre FROM business_hours WHERE user_id = ?',
            [userId]
        );

        // Comprueba si la consulta devolvió alguna fila.
        if (rows.length > 0) {
            // Si se encontró un horario, se devuelve la primera (y única) fila con un estado 200 (OK).
            // La respuesta será un objeto como: { apertura: '09:00:00', cierre: '18:00:00' }
            res.status(200).json(rows[0]);
        } else {
            // Si no se encontraron filas, significa que el usuario no tiene un horario configurado.
            // Se devuelve un estado 200 (OK) con un objeto que indica que no hay horario.
            // Esto permite al frontend manejarlo de forma controlada sin que sea un error.
            res.status(200).json({ apertura: null, cierre: null, message: 'Horario no configurado.' });
            
            // Alternativamente, se podría devolver un error 404 (Not Found) si se considera más apropiado semánticamente.
            // res.status(404).json({ message: 'Horario no configurado para este usuario.' });
        }
    } catch (error) {
        // Si ocurre cualquier error en el bloque 'try', se captura aquí.
        console.error('Error en el controlador getBusinessHours:', error);
        // Se devuelve un error 500 (Internal Server Error) para notificar al cliente que algo salió mal en el servidor.
        res.status(500).json({ message: 'Error interno del servidor al obtener el horario de negocio.' });
    }
};

// --- 3. FUNCIÓN PARA ESTABLECER O ACTUALIZAR EL HORARIO DE NEGOCIO ---
// Gestiona las peticiones POST (o PUT) para guardar el horario de un usuario.
exports.setBusinessHours = async (req, res) => {
    // Obtiene el ID del usuario del objeto 'req' (añadido por el middleware).
    const userId = req.user.userId;
    // Extrae los valores de 'apertura' y 'cierre' del cuerpo de la petición.
    const { apertura, cierre } = req.body; // Se esperan valores como 'HH:MM' o 'HH:MM:SS'.

    console.log(`CONTROLADOR: Petición POST /api/business-hours recibida del usuario ID: ${userId}`);
    console.log("Datos de horario recibidos:", { apertura, cierre });

    // --- Validaciones de los datos de entrada ---
    // Se asegura de que las propiedades 'apertura' y 'cierre' existan en el body. Pueden ser 'null' para borrar el horario.
    if (apertura === undefined || cierre === undefined) {
        return res.status(400).json({ message: 'Los campos apertura y cierre son requeridos (pueden ser null para "no definido").' });
    }
    
    // Valida que el formato de la hora sea correcto usando una expresión regular.
    // Solo se valida si los valores no son nulos.
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
    if ((apertura !== null && !timeRegex.test(apertura)) || (cierre !== null && !timeRegex.test(cierre))) {
        return res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM o HH:MM:SS.' });
    }

    try {
        // Se utiliza una consulta "INSERT ... ON DUPLICATE KEY UPDATE".
        // Esta es una forma eficiente de realizar un "upsert":
        // - Si no existe una fila para 'user_id', la INSERTA.
        // - Si ya existe una fila para 'user_id', la ACTUALIZA (UPDATE).
        // Esto requiere que la columna 'user_id' tenga un índice UNIQUE en la tabla.
        const query = `
            INSERT INTO business_hours (user_id, apertura, cierre)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE apertura = VALUES(apertura), cierre = VALUES(cierre);
        `;
        // Los valores a insertar o actualizar en la consulta.
        const values = [userId, apertura, cierre];

        // Ejecuta la consulta en la base de datos.
        const [result] = await pool.query(query, values);

        // --- Verificación del resultado de la consulta ---
        if (result.affectedRows > 0) {
            // En MySQL, 'affectedRows' es 1 para una inserción nueva y 2 para una actualización exitosa.
            res.status(200).json({ 
                message: 'Horario de negocio guardado con éxito.',
                data: { apertura, cierre }
            });
        } else if (result.affectedRows === 0 && result.warningStatus === 0) {
            // Este caso ocurre si se envían los mismos valores que ya estaban en la base de datos.
            // MySQL no realiza la actualización y devuelve affectedRows = 0. Se considera una operación exitosa.
            res.status(200).json({
                message: 'El horario de negocio es el mismo, no se realizaron cambios.',
                data: { apertura, cierre }
            });
        } else {
            // Si 'affectedRows' es 0 pero por otra razón, se registra como un comportamiento inesperado.
            console.error('Error al guardar horario: La operación en la BD no afectó filas de la forma esperada.', result);
            res.status(500).json({ message: 'Error interno del servidor al guardar el horario.' });
        }
    } catch (error) {
        // Manejo de cualquier error durante la ejecución de la consulta.
        console.error('Error en el controlador setBusinessHours:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el horario de negocio.' });
    }
};
// Ruta del archivo: controllers/incidentController.js

const pool = require('../config/db');

// --- FUNCIÓN createIncident MODIFICADA ---
exports.createIncident = async (req, res) => {
    // Obtenemos los datos del usuario que hace la petición (el que está logueado)
    const { tipo_usuario, userId: requesterId } = req.user;
    const incidentDataFromFrontend = req.body;

    // LÓGICA DE ASIGNACIÓN:
    // Si el que está logueado es un admin Y en el formulario se ha enviado un 'userId',
    // entonces se usará el userId del formulario.
    // En cualquier otro caso (si es un usuario normal o el admin no especifica un usuario),
    // se usará el ID del propio usuario que está logueado.
    const userIdForIncident = (tipo_usuario === 2 && incidentDataFromFrontend.userId)
        ? incidentDataFromFrontend.userId
        : requesterId;

    console.log(`CONTROLADOR: Incidencia será asignada al usuario ID: ${userIdForIncident}`);

    if (!incidentDataFromFrontend.stepSeleccionaMaquina || !incidentDataFromFrontend.tipoDeIncidenciaSeleccionada || !userIdForIncident) {
        return res.status(400).json({ message: 'Máquina, tipo de incidencia y usuario asignado son obligatorios.' });
    }

    try {
        const {
            stepSeleccionaMaquina, tipoDeIncidenciaSeleccionada,
            step_pantalla_superior_inferior, step_sale_mensaje,
            step_apagar_encender, step_acepta_billetes,
            step_quitar_con_llave, cantidad_faltante,
            step_comprobar_funciona, sin_llave, status
        } = incidentDataFromFrontend;

        const query = `
            INSERT INTO incidents (
                user_id, status, step_selecciona_maquina, tipo_de_incidencia_seleccionada, 
                step_pantalla_superior_inferior, step_sale_mensaje, step_apagar_encender, 
                step_acepta_billetes, step_quitar_con_llave, cantidad_faltante, 
                step_comprobar_funciona, sin_llave
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            userIdForIncident,
            status || 'abierta',
            stepSeleccionaMaquina,
            tipoDeIncidenciaSeleccionada,
            step_pantalla_superior_inferior || null,
            step_sale_mensaje || null,
            step_apagar_encender || null,
            step_acepta_billetes || null,
            step_quitar_con_llave || null,
            cantidad_faltante ? parseFloat(cantidad_faltante) : null,
            step_comprobar_funciona || null,
            sin_llave || false
        ];

        const [result] = await pool.query(query, values);

        res.status(201).json({ message: 'Incidencia creada y asignada con éxito.', incidentId: result.insertId });

    } catch (error) {
        console.error('Error en el controlador createIncident:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la incidencia.' });
    }
};


// --- El resto de funciones se mantienen como las teníamos ---

exports.getIncidents = async (req, res) => {
    const { userId, tipo_usuario } = req.user;
    console.log(`CONTROLADOR: Petición a GET /api/incidents recibida del usuario ID: ${userId} (Tipo: ${tipo_usuario})`);

    try {
        let query = 'SELECT * FROM incidents ORDER BY id DESC';
        let queryParams = [];

        if (tipo_usuario !== 2) {
            query = 'SELECT * FROM incidents WHERE user_id = ? ORDER BY id DESC';
            queryParams.push(userId);
        }

        const [incidentsFromDB] = await pool.query(query, queryParams);

        const formattedIncidents = incidentsFromDB.map(dbRow => ({
            id: dbRow.id,
            estado: dbRow.status,
            // Si tuvieras una columna 'createdAt', iría aquí. De momento la omitimos.
            // createdAt: dbRow.createdAt, 
            detalles: {
                stepSeleccionaMaquina: dbRow.step_selecciona_maquina,
                tipoDeIncidenciaSeleccionada: dbRow.tipo_de_incidencia_seleccionada,
                stepPantallaSuperiorInferior: dbRow.step_pantalla_superior_inferior,
                stepSaleMensaje: dbRow.step_sale_mensaje,
                stepApagarEncender: dbRow.step_apagar_encender,
                stepAceptaBilletes: dbRow.step_acepta_billetes,
                stepQuitarConLlave: dbRow.step_quitar_con_llave,
                cantidad_faltante: dbRow.cantidad_faltante,
                stepComprobarFunciona: dbRow.step_comprobar_funciona,
                sin_llave: dbRow.sin_llave
            }
        }));

        res.status(200).json(formattedIncidents);
    } catch (error) {
        console.error('Error en el controlador getIncidents:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las incidencias.' });
    }
};

exports.getIncidentById = async (req, res) => {
    const { id } = req.params;
    try {
        const [incidents] = await pool.query('SELECT * FROM incidents WHERE id = ?', [id]);
        if (incidents.length === 0) {
            return res.status(404).json({ message: 'Incidencia no encontrada.' });
        }
        res.status(200).json(incidents[0]);
    } catch (error) {
        console.error(`Error en getIncidentById para id ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.updateIncident = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: 'El campo "status" es obligatorio.' });
    }
    try {
        const [result] = await pool.query('UPDATE incidents SET status = ? WHERE id = ?', [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Incidencia no encontrada.' });
        }
        res.status(200).json({ message: 'Incidencia actualizada con éxito.' });
    } catch (error) {
        console.error(`Error en updateIncident para id ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.deleteIncident = async (req, res) => {
    const { id } = req.params;
    const { tipo_usuario } = req.user;
    if (tipo_usuario !== 2) {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    try {
        const [result] = await pool.query('DELETE FROM incidents WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Incidencia no encontrada.' });
        }
        res.status(200).json({ message: 'Incidencia eliminada con éxito.' });
    } catch (error) {
        console.error(`Error en deleteIncident para id ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
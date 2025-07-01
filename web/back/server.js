// server.js

require('dotenv').config();



const express = require('express');

const cors = require('cors');

const pool = require('./config/db');



const authRoutes = require('./routes/authRoutes');

const incidentRoutes = require('./routes/incidentRoutes');

// --- NUEVA LÍNEA: Importar las rutas de horarios ---

const businessHoursRoutes = require('./routes/businessHoursRoutes');

// --- FIN NUEVA LÍNEA ---



const app = express();

const PORT = process.env.PORT || 3001;



app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => {

    res.send('¡API de Incidencias Alzimatic está funcionando!');

});



console.log("server.js: Montando authRoutes bajo el prefijo /api");

app.use('/api', authRoutes);



console.log("server.js: Montando incidentRoutes bajo el prefijo /api/incidents");

app.use('/api/incidents', incidentRoutes);



// --- NUEVA LÍNEA: Usar las rutas de horarios con el prefijo /api/business-hours ---

console.log("server.js: Montando businessHoursRoutes bajo el prefijo /api/business-hours");

app.use('/api/business-hours', businessHoursRoutes);

// --- FIN NUEVA LÍNEA ---



app.listen(PORT, () => {

    console.log(`Servidor API escuchando en http://localhost:${PORT}`);

});
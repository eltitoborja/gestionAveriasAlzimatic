// Ruta del archivo: config/db.js

// --- 1. IMPORTACIÓN DE DEPENDENCIAS ---
// Se importa la librería 'mysql2'. La extensión '/promise' nos permite usar 
// características modernas de JavaScript como async/await para manejar las operaciones con la base de datos.
const mysql = require('mysql2/promise');

// --- 2. CREACIÓN DEL POOL DE CONEXIONES ---
// Se crea un "pool" de conexiones en lugar de una única conexión.
// Un pool gestiona múltiples conexiones, reutilizándolas y mejorando el rendimiento y la escalabilidad de la aplicación.
const pool = mysql.createPool({
  // --- Configuración de la conexión ---
  // Host de la base de datos (ej. 'localhost' o una IP). Se carga desde una variable de entorno por seguridad.
  host: process.env.DB_HOST,
  // Usuario para conectarse a la base de datos. También se carga desde una variable de entorno.
  user: process.env.DB_USER,
  // Contraseña del usuario. Es fundamental que esté en una variable de entorno y no directamente en el código.
  password: process.env.DB_PASSWORD,
  // Nombre de la base de datos a la que nos queremos conectar.
  database: process.env.DB_NAME,
  
  // --- Configuración del Pool ---
  // Si es 'true', las nuevas solicitudes esperarán a que una conexión esté disponible si todas están en uso.
  // Si es 'false', fallarían inmediatamente.
  waitForConnections: true,
  // Número máximo de conexiones que puede haber en el pool al mismo tiempo.
  connectionLimit: 10,
  // Límite de solicitudes que pueden estar en la cola de espera. 0 significa que no hay límite.
  queueLimit: 0
});

// --- 3. FUNCIÓN PARA PROBAR LA CONEXIÓN ---
// Esta función asíncrona intenta obtener una conexión del pool para verificar que la configuración es correcta.
// Es opcional, pero muy útil para detectar problemas de conexión al iniciar la aplicación.
async function testDbConnection() {
  try {
    // Intenta obtener una conexión del pool. 'await' pausa la función hasta que se consiga.
    const connection = await pool.getConnection();
    // Si la conexión es exitosa, muestra un mensaje en la consola.
    console.log('Conectado a la base de datos MySQL con éxito (ID de conexión: ' + connection.threadId + ')');
    // ¡MUY IMPORTANTE! Libera la conexión para devolverla al pool y que pueda ser reutilizada.
    connection.release();
  } catch (error) {
    // Si ocurre un error durante la conexión, se captura aquí.
    console.error('Error al conectar con la base de datos MySQL:', error.message);
    
    // Comprobación específica para un error común: la base de datos no existe.
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`La base de datos '${process.env.DB_NAME}' no existe. Por favor, créala.`);
    }
    
    // Opcional: Si la conexión a la base de datos es crítica para el arranque,
    // se podría descomentar la siguiente línea para detener la aplicación.
    // process.exit(1); 
  }
}

// --- 4. EJECUCIÓN Y EXPORTACIÓN ---
// Se llama a la función de prueba inmediatamente para verificar la conexión al iniciar el servidor.
testDbConnection();

// Se exporta el 'pool' para que otros archivos (controladores, modelos, etc.)
// puedan importarlo y utilizarlo para hacer consultas a la base de datos.
module.exports = pool;
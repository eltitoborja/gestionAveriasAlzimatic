# Proyecto: Gestión de Averías Alzimatic

Aplicación web full-stack diseñada para que los empleados de establecimientos (por ejemplo, bares) puedan registrar y gestionar averías o averías en máquinas de juegos. El sistema facilita la comunicación de estas averías a los técnicos correspondientes para su pronta resolución.

## Descripción del Proyecto

El objetivo principal es crear una plataforma intuitiva y fácil de usar que permita a los usuarios no técnicos reportar problemas de manera eficiente. La aplicación guiará al usuario a través de una serie de preguntas para recopilar toda la información necesaria sobre la incidencia, y luego la registrará para que los técnicos puedan acceder a ella y gestionarla.

## Funcionalidades Implementadas (Frontend)

* **Autenticación de Usuarios:**
    * Inicio de sesión para usuarios registrados (empleados).
* **Asistente para Reportar Averías:**
    * Flujo guiado paso a paso para registrar una nueva avería.
    * Selección del horario del negocio (confirmación o definición).
    * Selección de la máquina afectada.
    * Descripción del tipo de problema con opciones predefinidas y preguntas de seguimiento específicas según el tipo de incidencia (ej: máquina enganchada, pantalla no funciona, billete enganchado, falta de pago, etc.).
    * Sugerencias de resolución básicas (ej: apagar y encender).
    * Confirmación de si el problema se ha solucionado o persiste.
* **Navegación:**
    * Botón "Atrás" para corregir selecciones en pasos anteriores del asistente.
* **Notificación:**
    * Mensajes de confirmación al usuario indicando si la avería se ha reportado al técnico o si se ha solucionado.

## Funcionalidades Planificadas (Full-Stack)

Las funcionalidades completas incluirán:

* **Backend y Base de Datos:**
    * API para gestionar averías, usuarios y máquinas.
    * Almacenamiento persistente de datos de usuarios, averías y máquinas.
* **Gestión Avanzada de Averías:**
    * Listado de averías abiertas y cerradas para usuarios y técnicos.
    * Vista detallada de cada avería.
    * Posibilidad de que los técnicos cambien el estado de una avería (abierta, en proceso, cerrada).
* **Notificaciones Reales:**
    * Sistema para hacer llegar las averías a los técnicos.

## Tecnologías Utilizadas (Versión Actual del Prototipo Frontend)

* **Frontend:**
    * HTML5
    * CSS3 (con Tailwind CSS para el diseño y la interfaz de usuario)
    * JavaScript (ES6+) para la lógica de la interfaz, el flujo del asistente y la interacción con Firebase/simulación local.
* **Autenticación y Base de Datos (Prototipo):**
    * Firebase Authentication (para inicio de sesión y registro de usuarios).
    * Firestore (para el almacenamiento de datos de averías y configuración de horarios del negocio).
    * Opción de "Acceso Local de Prueba" que simula la funcionalidad sin conexión a Firebase.

## Tecnologías Recomendadas para la Versión Full-Stack (Según Documento del Proyecto)

* **Frontend:** HTML, CSS, JavaScript (o un framework como React o Vue).
* **Backend:** Node.js con Express, o Python con Flask/Django.
* **Base de Datos:** MySQL, PostgreSQL o SQLite.
* **Control de Versiones:** Git y GitHub (Repositorio: `git@github.com:florida-uni-lab/gestionIncidenciasAlzimatic.git`)

## Estructura del Frontend

El prototipo actual consta de tres archivos principales:

* `index.html`: Contiene la estructura principal de la aplicación.
* `style.css`: Contiene los estilos CSS personalizados y las definiciones de Tailwind CSS.
* `script.js`: Contiene toda la lógica de JavaScript para la funcionalidad de la aplicación, incluyendo:
    * Gestión de la interfaz de usuario y navegación entre pasos.
    * Manejo de la autenticación.
    * Recopilación de datos de averías.
    * Interacción con la base de datos.

## Configuración y Puesta en Marcha (Prototipo Frontend)

1.  **Clonar el Repositorio (si aplica):**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd [NOMBRE_DEL_DIRECTORIO]
    ```
2.  **Configurar Firebase (Opcional, para funcionalidad completa):**
    * Crea un proyecto en [Firebase](https://console.firebase.google.com/).
    * Registra una nueva aplicación web.
    * Obtén el objeto de configuración `firebaseConfig` (incluye `apiKey`, `authDomain`, etc.).
    * Reemplaza los valores de marcador de posición para `firebaseConfig` en el archivo `script.js` con tus propias claves.
    * En la consola de Firebase, habilita "Authentication" con el proveedor "Email/Password".
    * Configura "Firestore Database". Asegúrate de que las reglas de seguridad permitan la lectura/escritura para los usuarios autenticados en las rutas correspondientes (ej: `/artifacts/[appId]/users/[userId]/...`).

3.  **Abrir la Aplicación:**
    * Abre el archivo `index.html` en tu navegador web.

## Uso

1.  **Inicio de Sesión / Registro:**
    * Si tienes Firebase configurado, puedes registrarte con un correo y contraseña, y luego iniciar sesión.
    * Alternativamente, puedes usar el botón "ACCESO LOCAL DE PRUEBA" para saltar la autenticación de Firebase y probar el flujo del asistente (los datos no se guardarán permanentemente).
        * Usuario de prueba local sugerido: `test@local.com`
        * Contraseña de prueba local sugerida: `password` (o cualquier valor)
2.  **Reportar Incidencia:**
    * Sigue los pasos del asistente:
        * Confirma o define el horario de tu negocio.
        * Selecciona la máquina afectada.
        * Describe el tipo de problema y responde a las preguntas de seguimiento.
    * Utiliza el botón "Atrás" si necesitas corregir una selección anterior.
3.  **Finalización:**
    * Al final del flujo, verás un mensaje de confirmación indicando si la incidencia se ha "enviado" al técnico o si el problema se considera resuelto.

## Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1.  Haz un Fork del proyecto.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y haz commit (`git commit -am 'Añadir nueva funcionalidad'`).
4.  Haz Push a la rama (`git push origin feature/nueva-funcionalidad`).
5.  Abre un Pull Request.

## Autores

* Ali Zega / Borja Pardo Juanes - Backend (API, base de datos, autenticación), Documentación técnica.
* Ali Zega / Borja Pardo Juanes - Frontend (formularios, listados, diseño), Pruebas y documentación de usuario.


## Licencia

Este proyecto se distribuye bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---


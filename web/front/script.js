// --- Configuración de la Aplicación ---

// Define la URL base del servidor API. Todas las peticiones al backend usarán esta URL como prefijo.
const API_BASE_URL = "http://localhost:3001/api";

// Un identificador único para la aplicación cliente. Puede ser útil para logging o seguimiento.
const APP_ID = 'alzimatic-incidencias-api-client-v2';


// Variable booleana para activar un modo de prueba local que no requiere conexión con el backend.
let isLocalTestMode = false;


// --- Selectores de Elementos del DOM ---
// Se obtienen y guardan en constantes las referencias a los elementos HTML que se manipularán.
// Esto se hace una sola vez al cargar el script para mejorar el rendimiento.

// Secciones principales que funcionan como "pantallas" de la aplicación.
const loginScreen = document.getElementById('loginSection');
const registerScreen = document.getElementById('registerSection');
const incidentFormContainer = document.getElementById('incidentFormContainer');
const finalSuccessScreen = document.getElementById('stepFinalizarFunciona');
const finalTechScreen = document.getElementById('stepFinalizarAvisoTecnico');
const finalTecnicoVerificaScreen = document.getElementById('stepFinalizarTecnicoVerifica');


// Elementos específicos de la pantalla de login.
const emailPasswordLoginContainer = document.getElementById('emailPasswordLoginContainer');
const qrLoginContainer = document.getElementById('qrLoginContainer');
const qrReaderElement = document.getElementById('qrReader');
const qrReaderStatus = document.getElementById('qrReaderStatus');
const qrLoader = document.getElementById('qrLoader');


// Elementos generales de la interfaz de la aplicación.
const appHeader = document.getElementById('appHeader');
const logoutButton = document.getElementById('logoutButton');
const localModeBanner = document.getElementById('localModeBanner');
const appContainer = document.getElementById('appContainer');


// Formularios de autenticación.
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');


// Párrafos para mostrar mensajes de error en los formularios.
const loginErrorP = document.getElementById('loginError');
const registerErrorP = document.getElementById('registerError');
// Indicador de carga (spinner) principal.
const loader = document.getElementById('loader');


// Botones de navegación entre las pantallas de login y registro.
const showRegisterScreenButton = document.getElementById('showRegisterScreenButton');
const showLoginScreenButton = document.getElementById('showLoginScreenButton');
const localLoginButton = document.getElementById('localLoginButton');
const showQrLoginButton = document.getElementById('showQrLoginButton');
const cancelQrLoginButton = document.getElementById('cancelQrLoginButton');


// Elementos del formulario de incidencias.
const cantidadErrorP = document.getElementById('cantidadError');
const selectedMachineNameSpan = document.getElementById('selectedMachineName');


// Elementos de la barra de progreso.
const progressBarContainerEl = document.getElementById('progressBarContainer');
const progressBarEl = document.getElementById('progressBar');


// --- SELECTORES PARA EL PANEL DE ADMIN ---
const adminDashboardSection = document.getElementById('adminDashboardSection');
const incidentsTableBody = document.getElementById('incidentsTableBody');
const refreshIncidentsButton = document.getElementById('refreshIncidentsButton');
const adminLogoutButton = document.getElementById('adminLogoutButton');



// --- Variables de Estado de la Aplicación ---
// Almacenan la información que cambia durante el uso de la aplicación.

// Guarda los datos de la sesión del usuario actual (token, id, email, etc.) tras el login.
let currentUserSession = null; // { token: "...", userId: "...", email: "...", tipo_usuario: "..." }
// Objeto que acumula las respuestas del usuario a medida que avanza en el asistente de incidencias.
let incidentData = {};
// Array que funciona como historial de navegación dentro del asistente para permitir la función "Atrás".
let navigationHistory = [];
// Almacena el ID del paso actual en el que se encuentra el usuario dentro del asistente.
let currentStepId = '';
// Un array con todos los elementos HTML que son pasos del asistente, para un acceso rápido.
const allWizardSteps = Array.from(incidentFormContainer ? incidentFormContainer.querySelectorAll('.wizard-step') : []);
// Variable para guardar la instancia de la librería de escaneo de QR.
let html5QrCodeScanner = null;
// Objeto que define los posibles estados del escáner QR.
const Html5QrcodeScannerState = { NOT_STARTED: 0, SCANNING: 1, PAUSED: 2, STOPPED: 3 };



// --- Lógica de la Barra de Progreso ---
const conceptualStepMap = {
    'stepSeleccionaMaquina': 1, 'stepTipoIncidencia': 2, 'stepPantallaSuperiorInferior': 3,
    'stepSaleMensaje': 3, 'stepAceptaBilletes': 3, 'stepCuantoFalta': 3,
    'stepApagarEncender': 4, 'stepQuitarConLlave': 4, 'stepComprobarFunciona': 4,
    'stepHorarioNegocio': 5, 'stepHorarioApertura': 5, 'stepHorarioCierre': 5
};
const totalConceptualSteps = 5;

function updateProgressBar(stepId) {
    if (!progressBarEl || !progressBarContainerEl) return;
    const finalScreenIds = ['stepFinalizarFunciona', 'stepFinalizarAvisoTecnico', 'stepFinalizarTecnicoVerifica'];
    if (finalScreenIds.includes(stepId)) {
        progressBarEl.style.width = '100%';
        progressBarEl.textContent = '100%';
        return;
    }
    if (!conceptualStepMap.hasOwnProperty(stepId)) return;
    const currentConceptualStepNumber = conceptualStepMap[stepId];
    let progressPercentage = (currentConceptualStepNumber / totalConceptualSteps) * 100;
    progressBarEl.style.width = `${Math.min(progressPercentage, 100)}%`;
    progressBarEl.textContent = (progressPercentage > 0 && progressPercentage <= 100) ? `${Math.round(progressPercentage)}%` : '';
}


// --- Gestión de Pantallas ---
function displayScreen(screenElement) {
    [loginScreen, registerScreen, incidentFormContainer, adminDashboardSection, finalSuccessScreen, finalTechScreen, finalTecnicoVerificaScreen].forEach(s => {
        if (s) s.classList.remove('active-screen');
    });
    if (screenElement) screenElement.classList.add('active-screen');
    if (localModeBanner) localModeBanner.style.display = 'none';
    if (progressBarContainerEl) {
        progressBarContainerEl.classList.toggle('hidden',
            screenElement !== incidentFormContainer && screenElement !== adminDashboardSection &&
            !finalSuccessScreen.classList.contains('active-screen') &&
            !finalTechScreen.classList.contains('active-screen') &&
            !finalTecnicoVerificaScreen.classList.contains('active-screen')
        );
    }
}


function setQrReaderStatus(message, isError = false) {
    if (qrReaderStatus) {
        qrReaderStatus.textContent = message;
        qrReaderStatus.className = isError ? 'text-sm text-red-600 font-semibold mt-2' : 'text-sm text-gray-700 mt-2';
    }
}


function stopQrScanner() {
    if (html5QrCodeScanner && typeof Html5QrcodeScanner !== "undefined" && html5QrCodeScanner.getState && html5QrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCodeScanner.clear().then(() => console.log("Escáner QR detenido.")).catch(err => console.error("Error al detener escáner:", err));
    }
    html5QrCodeScanner = null;
}


function resetAndShowLogin(clearSession = true) {
    document.body.classList.remove('admin-mode');
    isLocalTestMode = false;
    incidentData = { pendingFinalizationDetails: null };
    navigationHistory = [];
    currentStepId = '';
    stopQrScanner();
    setQrReaderStatus('');
    if(qrLoader) qrLoader.style.display = 'none';
    if (appHeader) appHeader.classList.add('hidden');
    if (localModeBanner) localModeBanner.style.display = 'none';
    if (progressBarEl) { progressBarEl.style.width = '0%'; progressBarEl.textContent = '';}
    if(emailPasswordLoginContainer) emailPasswordLoginContainer.classList.remove('hidden');
    if(qrLoginContainer) qrLoginContainer.classList.add('hidden');
    if (clearSession) {
        localStorage.removeItem('userSessionToken');
        currentUserSession = null;
    }
    displayScreen(loginScreen);
}


// --- Funciones de Interacción con la API ---
async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (requiresAuth && currentUserSession && currentUserSession.token) {
        headers.append('Authorization', `Bearer ${currentUserSession.token}`);
    } else if (requiresAuth && (!currentUserSession || !currentUserSession.token)) {
        console.warn(`apiRequest: La petición a ${endpoint} requiere autenticación pero no hay token.`);
        resetAndShowLogin(true);
        return { success: false, error: "Sesión no válida. Por favor, inicie sesión.", status: 401, data: null };
    }

    const config = { method: method, headers: headers };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
    }
    
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request: ${method} ${fullUrl}`, body ? {body} : '');

    try {
        const response = await fetch(fullUrl, config);
        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.log("Respuesta no JSON recibida (o vacía):", textResponse);
            responseData = { message: `Respuesta del servidor (status ${response.status}): ${textResponse || '(vacía)'}` };
        }
        
        console.log(`API Response: ${response.status} ${fullUrl}`, responseData);

        if (!response.ok) {
            if ((response.status === 401 || response.status === 403) && requiresAuth) {
                console.warn("Token inválido, expirado o permisos insuficientes. Cerrando sesión.");
                resetAndShowLogin(true);
            }
            const errorMessage = responseData?.message || responseData?.error || `Error ${response.status} al llamar a la API.`;
            return { success: false, error: errorMessage, status: response.status, data: responseData };
        }
        return { success: true, data: responseData, status: response.status };
    } catch (error) {
        console.error(`Error de red o conexión en apiRequest (${fullUrl}):`, error);
        return { success: false, error: error.message || "Error de red o conexión con la API." };
    }
}


function handleSuccessfulLogin(apiResponseData) {
    console.log('LOGIN: Respuesta completa de la API recibida:', JSON.stringify(apiResponseData, null, 2));

    if (!apiResponseData || !apiResponseData.token || !apiResponseData.user || !apiResponseData.user.id) {
        const errorMsg = "Respuesta de inicio de sesión inválida desde el servidor.";
        if(loginErrorP) loginErrorP.textContent = errorMsg;
        setQrReaderStatus(errorMsg, true);
        if(loader) loader.style.display = 'none';
        console.error("LOGIN: Datos de respuesta de API incompletos o inválidos.");
        return;
    }
    
    currentUserSession = {
        token: apiResponseData.token,
        userId: apiResponseData.user.id,
        email: apiResponseData.user.email || 'N/A',
        tipo_usuario: apiResponseData.user.tipo_usuario
    };
    localStorage.setItem('userSessionToken', currentUserSession.token);
    
    if(loader) loader.style.display = 'none';

    console.log('LOGIN: currentUserSession ANTES del if:', JSON.stringify(currentUserSession, null, 2));
    console.log('LOGIN: Verificando tipo_usuario:', currentUserSession.tipo_usuario, "| Tipo de dato:", typeof currentUserSession.tipo_usuario);

    if (currentUserSession.tipo_usuario === 2) {
        console.log("LOGIN: Usuario es ADMIN (tipo_usuario === 2). Mostrando panel de admin.");
        showAdminDashboard();
    } else {
        console.log("LOGIN: Usuario NO es ADMIN (tipo_usuario !== 2). Mostrando formulario de incidencia.");
        if (appHeader) appHeader.classList.remove('hidden');
        initializeIncidentForm();
    }
}


async function checkUserSession() {
    const storedToken = localStorage.getItem('userSessionToken');
    if (storedToken) {
        currentUserSession = { token: storedToken };
        if (loader) loader.style.display = 'block';
        const response = await apiRequest('/me', 'GET', null, true);
        if (loader) loader.style.display = 'none';
        
        console.log('CHECK SESSION: Respuesta completa de /me recibida:', JSON.stringify(response, null, 2));

        if (response.success && response.data && response.data.user) {
            currentUserSession = {
                token: storedToken,
                userId: response.data.user.id,
                email: response.data.user.email,
                tipo_usuario: response.data.user.tipo_usuario
            };
            
            console.log('CHECK SESSION: currentUserSession ANTES del if:', JSON.stringify(currentUserSession, null, 2));
            console.log('CHECK SESSION: Verificando tipo_usuario:', currentUserSession.tipo_usuario, "| Tipo de dato:", typeof currentUserSession.tipo_usuario);
            
            if (currentUserSession.tipo_usuario === 2) {
                console.log("CHECK SESSION: Usuario es ADMIN (tipo_usuario === 2). Mostrando panel de admin.");
                showAdminDashboard();
            } else {
                console.log("CHECK SESSION: Usuario NO es ADMIN (tipo_usuario !== 2). Mostrando formulario de incidencia.");
                if (appHeader) appHeader.classList.remove('hidden');
                initializeIncidentForm();
            }
        } else {
            console.warn("CHECK SESSION: Falló la obtención de datos del usuario o la respuesta no fue exitosa.");
            resetAndShowLogin(true);
        }
    } else {
        console.log("CHECK SESSION: No hay token almacenado.");
        resetAndShowLogin(false);
        if (loader) loader.style.display = 'none';
    }
}


// --- Navegación y Autenticación ---
if (showRegisterScreenButton) {
    showRegisterScreenButton.addEventListener('click', () => {
        if (loginErrorP) loginErrorP.textContent = '';
        if (registerErrorP) registerErrorP.textContent = '';
        stopQrScanner();
        displayScreen(registerScreen);
    });
}
if (showLoginScreenButton) {
    showLoginScreenButton.addEventListener('click', () => {
        if (loginErrorP) loginErrorP.textContent = '';
        if (registerErrorP) registerErrorP.textContent = '';
        resetAndShowLogin(false);
    });
}
if (showQrLoginButton) {
    showQrLoginButton.addEventListener('click', () => {
        if (typeof Html5QrcodeScanner === "undefined") {
            setQrReaderStatus("Error: Librería de escaneo QR no encontrada.", true); return;
        }
        if(emailPasswordLoginContainer) emailPasswordLoginContainer.classList.add('hidden');
        if(qrLoginContainer) qrLoginContainer.classList.remove('hidden');
        if(loginErrorP) loginErrorP.textContent = '';
        startQrScanningFlow();
    });
}
if (cancelQrLoginButton) {
    cancelQrLoginButton.addEventListener('click', () => {
        stopQrScanner();
        if(emailPasswordLoginContainer) emailPasswordLoginContainer.classList.remove('hidden');
        if(qrLoginContainer) qrLoginContainer.classList.add('hidden');
        setQrReaderStatus('Escaneo de QR cancelado.', false);
        if(qrLoader) qrLoader.style.display = 'none';
    });
}
if (localLoginButton) {
    localLoginButton.addEventListener('click', () => {
        isLocalTestMode = true;
        currentUserSession = {
            token: "local-test-token",
            userId: `local-test-user-${crypto.randomUUID().substring(0,8)}`,
            email: "test@local.com",
            tipo_usuario: 1
        };
        if (appHeader) appHeader.classList.remove('hidden');
        if (localModeBanner) {
            localModeBanner.textContent = `MODO LOCAL (${currentUserSession.userId})`;
            localModeBanner.style.display = 'block';
        }
        initializeIncidentForm();
    });
}
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(loginErrorP) loginErrorP.textContent = '';
        if(loader) loader.style.display = 'block';
        isLocalTestMode = false;
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const response = await apiRequest('/login', 'POST', { email, password }, false);
        if (response.success && response.data) {
            handleSuccessfulLogin(response.data);
        } else {
            if(loader) loader.style.display = 'none';
            if(loginErrorP) loginErrorP.textContent = response.error || "Error al iniciar sesión.";
        }
    });
}
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(registerErrorP) registerErrorP.textContent = '';
        if(loader) loader.style.display = 'block';
        isLocalTestMode = false;
        const email = registerForm.registerEmail.value;
        const password = registerForm.registerPassword.value;
        const response = await apiRequest('/register', 'POST', { email, password }, false);
        if(loader) loader.style.display = 'none';
        if (response.success && response.data) {
            if(loginErrorP) loginErrorP.textContent = response.data.message || 'Registro exitoso. Por favor, inicie sesión.';
            displayScreen(loginScreen);
        } else {
            if(registerErrorP) registerErrorP.textContent = response.error || "Error en el registro.";
        }
    });
}
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        if (isLocalTestMode) {
            resetAndShowLogin(true);
            return;
        }
        if (currentUserSession && currentUserSession.token) {
            if(loader) loader.style.display = 'block';
            await apiRequest('/logout', 'POST', null, true);
            if(loader) loader.style.display = 'none';
        }
        resetAndShowLogin(true);
    });
}
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async () => {
        if (currentUserSession && currentUserSession.token) {
            if (loader) loader.style.display = 'block';
            await apiRequest('/logout', 'POST', null, true);
            if (loader) loader.style.display = 'none';
        }
        resetAndShowLogin(true);
    });
}



// --- Lógica de Escaneo de QR (CORREGIDA)---
async function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR escaneado, contenido: ${decodedText}`);
    stopQrScanner();
    setQrReaderStatus(`QR detectado. Redirigiendo para autenticar...`, false);
    if(qrLoader) qrLoader.style.display = 'block';

    try {
        new URL(decodedText);
        window.location.href = decodedText;
    } catch (error) {
        console.error("El contenido del QR no es una URL válida:", error);
        setQrReaderStatus("El código QR no contiene una URL válida.", true);
        if(loader) loader.style.display = 'none';
    }
}
function onScanFailure(error) { /* Sin cambios */ }
async function startQrScanningFlow() {
    setQrReaderStatus("Iniciando cámara...", false);
    if(qrLoader) qrLoader.style.display = 'block';
    if (!qrReaderElement) {
        setQrReaderStatus("Error: Visor de cámara no encontrado.", true); if(qrLoader) qrLoader.style.display = 'none'; return;
    }
    qrReaderElement.innerHTML = '';
    if (typeof Html5QrcodeScanner === "undefined" || typeof Html5QrcodeScanType === "undefined") {
           setQrReaderStatus("Error: Librería de escaneo QR no cargada.", true);
           if(qrLoader) qrLoader.style.display = 'none'; return;
    }
    try {
        html5QrCodeScanner = new Html5QrcodeScanner("qrReader", { fps: 10, qrbox: (w,h) => {const m=Math.min(w,h); return {width:Math.floor(m*0.7),height:Math.floor(m*0.7)}} , rememberLastUsedCamera: true, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]}, false);
        setQrReaderStatus("Apunte la cámara al código QR...", false);
        if(loader) qrLoader.style.display = 'none';
        await html5QrCodeScanner.render(onScanSuccess, onScanFailure);
    } catch (renderError) {
        setQrReaderStatus("Error al iniciar cámara. Verifique permisos.", true);
        if(loader) qrLoader.style.display = 'none';
    }
}


// --- Lógica del Formulario de Incidencias ---
function initializeIncidentForm() {
    incidentData = { pendingFinalizationDetails: null };
    navigationHistory = [];
    if(selectedMachineNameSpan) selectedMachineNameSpan.textContent = "(ninguna)";
    displayScreen(incidentFormContainer);
    if (allWizardSteps.length > 0) showStep('stepSeleccionaMaquina');
    const cantidadFaltanteInput = document.getElementById('cantidadFaltante');
    if(cantidadFaltanteInput) cantidadFaltanteInput.value = '';
    if(cantidadErrorP) cantidadErrorP.classList.add('hidden');
}


function showStep(stepId, isGoingBack = false, contextMessage = "") {
    if (!isGoingBack && currentStepId && currentStepId !== stepId) {
        navigationHistory.push(currentStepId);
    }
    allWizardSteps.forEach(s => s.classList.remove('active-wizard-step'));
    const sectionElement = document.getElementById(stepId);
    if (sectionElement) {
        sectionElement.classList.add('active-wizard-step');
        currentStepId = stepId;
        if (incidentFormContainer && incidentFormContainer.classList.contains('active-screen')) {
             sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        updateProgressBar(stepId);
        const comprobarContextoEl = document.getElementById('comprobarContexto');
        if (comprobarContextoEl) {
            comprobarContextoEl.textContent = (stepId === 'stepComprobarFunciona' && contextMessage) ? contextMessage : "";
        }
    } else {
        console.error("Error en showStep: Elemento del paso no encontrado - ID:", stepId);
        updateProgressBar('');
    }
}


function proceedToFinalization() {
    if (incidentData.pendingFinalizationDetails && incidentData.pendingFinalizationDetails.screenId) {
        finalizeIncidentApi(incidentData.pendingFinalizationDetails.screenId, incidentData.pendingFinalizationDetails.isSuccess);
    } else {
        console.warn("proceedToFinalization: No se encontraron detalles de finalización pendientes. Usando fallback.");
        finalizeIncidentApi('stepFinalizarAvisoTecnico', false);
    }
}


if (appContainer) {
    appContainer.addEventListener('click', function(event) {
        let target = event.target.closest('button');
        if (!target) return;

        const excludedButtonIds = ['showRegisterScreenButton', 'showLoginScreenButton', 'logoutButton', 'adminLogoutButton', 'localLoginButton', 'showQrLoginButton', 'cancelQrLoginButton', 'refreshIncidentsButton'];
        if (excludedButtonIds.includes(target.id) || (target.type === 'submit' && (target.closest('form')?.id === 'loginForm' || target.closest('form')?.id === 'registerForm'))) {
            return;
        }
        
        let nextStep = target.dataset.nextStep;
        let finalizeAction = target.dataset.finalize;
        const value = target.dataset.value;
        const action = target.dataset.action;
        const parentStep = target.closest('.wizard-step');

        if (parentStep && value) {
            incidentData[parentStep.id] = value;
            if (parentStep.id === 'stepTipoIncidencia') {
                incidentData.tipoDeIncidenciaSeleccionada = value;
            }
        }

        if (action) {
            handleAction(action, target, value);
            if (action === 'resetWizard') return;
            if (action === 'saveHoraCierre' && nextStep) {
            }
        }
        
        const currentSelectedIncidentType = incidentData.tipoDeIncidenciaSeleccionada;

        if (currentStepId === 'stepSaleMensaje' && currentSelectedIncidentType === 'MÁQUINA ENGANCHADA') {
            if (value === 'SI') nextStep = 'stepQuitarConLlave';
            else if (value === 'NO') nextStep = 'stepApagarEncender';
            finalizeAction = null;
        } else if (currentStepId === 'stepQuitarConLlave' && currentSelectedIncidentType === 'MÁQUINA ENGANCHADA') {
            if (value === 'SI, Y NO SE QUITA') {
                incidentData.pendingFinalizationDetails = { screenId: 'stepFinalizarAvisoTecnico', isSuccess: false };
                nextStep = 'stepHorarioNegocio';
                finalizeAction = null;
            }
        } else if (currentStepId === 'stepApagarEncender' && currentSelectedIncidentType === 'PANTALLA NO FUNCIONA') {
            if (value === 'SI, PERO SIGUE IGUAL') {
                incidentData.pendingFinalizationDetails = { screenId: 'stepFinalizarAvisoTecnico', isSuccess: false };
                nextStep = 'stepHorarioNegocio';
                finalizeAction = null;
            }
        }

        if (finalizeAction) {
            incidentData.pendingFinalizationDetails = {
                screenId: finalizeAction,
                isSuccess: (finalizeAction === 'stepFinalizarFunciona' || finalizeAction === 'stepFinalizarTecnicoVerifica')
            };
            if (finalizeAction.includes("_sin_llave")) {
                 incidentData['sin_llave'] = true;
                 incidentData.pendingFinalizationDetails.screenId = finalizeAction.replace("_sin_llave", "");
            }
            nextStep = 'stepHorarioNegocio';
            loadBusinessHoursApi();
        }

        if (nextStep) {
            let actualTarget = nextStep;
            let msg = "";
            if (nextStep.includes("_despues_de_probar")) {
                msg = "Por favor, realice la prueba y luego indique el resultado.";
                actualTarget = nextStep.replace("_despues_de_probar", "");
            }
            showStep(actualTarget, false, msg);
        }
    });
}


function handleAction(actionName, buttonElement, buttonValue) {
    const cantidadFaltanteInput = document.getElementById('cantidadFaltante');
    if(cantidadErrorP) cantidadErrorP.classList.add('hidden');
    if(cantidadFaltanteInput) cantidadFaltanteInput.classList.remove('border-red-500');

    switch(actionName) {
        case 'goBack':
            if (navigationHistory.length > 0) {
                const previousSectionId = navigationHistory.pop();
                if(currentStepId && incidentData[currentStepId]){ delete incidentData[currentStepId]; }
                if (currentStepId === 'stepTipoIncidencia') {
                      delete incidentData.stepSeleccionaMaquina;
                      if(selectedMachineNameSpan) selectedMachineNameSpan.textContent = "(ninguna)";
                } else if (currentStepId === 'stepHorarioNegocio') {
                      incidentData.pendingFinalizationDetails = null;
                }
                showStep(previousSectionId, true);
            }
            break;
        case 'hideHorarioInputs':
            incidentData['horario_apertura'] = null;
            incidentData['hora_cierre'] = null;
            proceedToFinalization();
            break;
        case 'saveHoraApertura':
            const horaAperturaEl = document.getElementById('horaApertura');
            if(horaAperturaEl) incidentData['hora_apertura'] = horaAperturaEl.value;
            break;
        case 'saveHoraCierre':
            const horaCierreEl = document.getElementById('horaCierre');
            if(horaCierreEl) incidentData['hora_cierre'] = horaCierreEl.value;
            saveBusinessHoursApi(incidentData['hora_apertura'], incidentData['hora_cierre'])
                .finally(() => {
                    proceedToFinalization();
                });
            break;
        case 'selectMachine': incidentData['stepSeleccionaMaquina'] = buttonValue; if(selectedMachineNameSpan) selectedMachineNameSpan.textContent = `(${buttonValue})`; break;
        case 'saveCantidadFaltante':
            if (cantidadFaltanteInput) {
                const cantidad = cantidadFaltanteInput.value;
                if(cantidad && parseFloat(cantidad) > 0) {
                    incidentData['cantidad_faltante'] = parseFloat(cantidad);
                } else {
                    if(cantidadErrorP) cantidadErrorP.classList.remove('hidden');
                    cantidadFaltanteInput.classList.add('border-red-500');
                    incidentData['cantidad_faltante'] = null;
                    return;
                }
            }
            break;
        case 'resetWizard': initializeIncidentForm(); break;
        default: console.warn("handleAction: Acción desconocida -", actionName);
    }
}


async function finalizeIncidentApi(targetScreenId, isSuccessOperation = false) {
    if (!currentUserSession || !currentUserSession.userId) {
        alert("Su sesión ha expirado o no es válida. Por favor, inicie sesión de nuevo.");
        resetAndShowLogin(true); return;
    }
    if (progressBarEl) { progressBarEl.style.width = '100%'; progressBarEl.textContent = `100%`; }
    if(loader) loader.style.display = 'block';

    const incidentPayload = { ...incidentData };
    delete incidentPayload.pendingFinalizationDetails;

    let tituloFinal = "AVISO ENVIADO";
    let mensajeFinal = "Incidencia reportada con éxito.";
    let actualFinalScreenElement = finalTechScreen;
    
    if (targetScreenId === 'stepFinalizarFunciona' || (targetScreenId === 'stepComprobarFunciona' && isSuccessOperation)) {
        tituloFinal = "¡PERFECTO!";
        mensajeFinal = "Nos alegra que ya funcione. Si vuelve a fallar, no dude en reportarlo de nuevo.";
        actualFinalScreenElement = finalSuccessScreen;
    } else if (targetScreenId === 'stepFinalizarTecnicoVerifica' || (targetScreenId === 'stepAceptaBilletes' && isSuccessOperation) ) {
        tituloFinal = "¡MUY BIEN!";
        mensajeFinal = "La puede dejar en marcha y el técnico pasará a verificarlo. Gracias.";
        actualFinalScreenElement = finalTecnicoVerificaScreen;
    } else if (incidentData.tipoDeIncidenciaSeleccionada === "PASAR A RECAUDAR" && targetScreenId === 'stepFinalizarAvisoTecnico') {
        tituloFinal = "SOLICITUD DE RECAUDACIÓN REGISTRADA";
        mensajeFinal = "Se ha registrado la solicitud para pasar a recaudar. Gracias.";
    } else if (incidentData.sin_llave && targetScreenId === 'stepFinalizarAvisoTecnico') {
        tituloFinal = "AVISO ESPECIAL ENVIADO";
        mensajeFinal = "Hemos informado al técnico sobre el problema y que no dispone de llave. Gracias.";
    } else if (incidentData.cantidad_faltante && incidentData.tipoDeIncidenciaSeleccionada === "SE HA QUEDADO VACIA PAGANDO UN PREMIO" && targetScreenId === 'stepFinalizarAvisoTecnico') {
         tituloFinal = "AVISO POR FALTA DE PAGO";
         mensajeFinal = `Se ha registrado una incidencia por ${incidentData.cantidad_faltante}€ que faltan por pagar.`;
    } else if (targetScreenId === 'stepFinalizarAvisoTecnico') {
        tituloFinal = "AVISO AL TÉCNICO";
        mensajeFinal = "Hemos pasado el aviso al técnico. Gracias por realizar la incidencia.";
    }

    if (isLocalTestMode) {
        setTimeout(() => {
            if(loader) loader.style.display = 'none';
            if (actualFinalScreenElement) {
                const h2 = actualFinalScreenElement.querySelector('h2');
                const p = actualFinalScreenElement.querySelector('p');
                if (actualFinalScreenElement.id === 'stepFinalizarAvisoTecnico') {
                    if(actualFinalScreenElement.querySelector('#avisoTecnicoTitulo')) actualFinalScreenElement.querySelector('#avisoTecnicoTitulo').textContent = tituloFinal + " (LOCAL)";
                    if(actualFinalScreenElement.querySelector('#avisoTecnicoMensaje')) actualFinalScreenElement.querySelector('#avisoTecnicoMensaje').textContent = mensajeFinal;
                } else { if(h2) h2.textContent = tituloFinal + " (LOCAL)"; if(p) p.textContent = mensajeFinal; }
            }
            displayScreen(actualFinalScreenElement);
        }, 500);
        return;
    }

    const response = await apiRequest('/incidents', 'POST', incidentPayload, true);
    if (!response.success) {
        tituloFinal = "ERROR AL ENVIAR";
        mensajeFinal = response.error || "No se pudo guardar la incidencia.";
    }
    
    if(loader) loader.style.display = 'none';
    if (actualFinalScreenElement) {
        const h2 = actualFinalScreenElement.querySelector('h2');
        const p = actualFinalScreenElement.querySelector('p');
        if (actualFinalScreenElement.id === 'stepFinalizarAvisoTecnico') {
            if(actualFinalScreenElement.querySelector('#avisoTecnicoTitulo')) actualFinalScreenElement.querySelector('#avisoTecnicoTitulo').textContent = tituloFinal;
            if(actualFinalScreenElement.querySelector('#avisoTecnicoMensaje')) actualFinalScreenElement.querySelector('#avisoTecnicoMensaje').textContent = mensajeFinal;
        } else { if(h2) h2.textContent = tituloFinal; if(p) p.textContent = mensajeFinal; }
    }
    displayScreen(actualFinalScreenElement);
}


async function loadBusinessHoursApi() {
    const displayHorario = document.getElementById('displayHorarioNegocio');
    if (!currentUserSession && !isLocalTestMode) {
        if(displayHorario) displayHorario.textContent = "Inicie sesión para ver el horario."; return;
    }
    if (isLocalTestMode) {
        const mockApertura = "08:00"; const mockCierre = "22:00";
        if(displayHorario) displayHorario.textContent = `MODO LOCAL: Abre: ${mockApertura} - Cierra: ${mockCierre}`;
        incidentData.horarioVerificado = { apertura: mockApertura, cierre: mockCierre }; return;
    }
    if(displayHorario) displayHorario.textContent = "Cargando horario...";
    const response = await apiRequest('/business-hours', 'GET', null, true);
    if (response.success && response.data) {
        const { apertura, cierre } = response.data;
        if(displayHorario) displayHorario.textContent = `Abre: ${apertura || 'N/A'} - Cierra: ${cierre || 'N/A'}`;
        incidentData.horarioVerificado = { apertura, cierre };
    } else {
        if(displayHorario) displayHorario.textContent = response.error || "Error al cargar horario.";
        incidentData.horarioVerificado = { apertura: null, cierre: null };
    }
}


async function saveBusinessHoursApi(apertura, cierre) {
    if ((!currentUserSession || !currentUserSession.userId) && !isLocalTestMode) {
        alert("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
        resetAndShowLogin(true); return Promise.reject("Sesión expirada");
    }
    if ((apertura !== null && typeof apertura !== 'string') || (cierre !== null && typeof cierre !== 'string')) {
        return Promise.reject("Datos de horario inválidos");
    }
    const displayHorario = document.getElementById('displayHorarioNegocio');
    if (isLocalTestMode) {
        incidentData.horarioVerificado = { apertura, cierre };
        if(displayHorario) displayHorario.textContent = `MODO LOCAL: Abre: ${apertura} - Cierra: ${cierre}`;
        return Promise.resolve();
    }
    if(displayHorario) displayHorario.textContent = "Guardando horario...";
    const response = await apiRequest('/business-hours', 'POST', { apertura, cierre }, true);
    if (response.success && response.data) {
        const savedApertura = response.data.apertura || apertura;
        const savedCierre = response.data.cierre || cierre;
        if(displayHorario) displayHorario.textContent = `Abre: ${savedApertura || 'N/A'} - Cierra: ${savedCierre || 'N/A'} (Guardado)`;
        incidentData.horarioVerificado = { apertura: savedApertura, cierre: savedCierre };
        return Promise.resolve();
    } else {
        if(displayHorario) displayHorario.textContent = `Abre: ${apertura||'N/A'} - Cierra: ${cierre||'N/A'} (Error al guardar)`;
        incidentData.horarioVerificado = { apertura, cierre };
        return Promise.reject(response.error || "Error guardando horario");
    }
}



// --- Lógica del Panel de Administrador ---

// Muestra el panel de administración y carga las incidencias.
function showAdminDashboard() {
    document.body.classList.add('admin-mode');
    displayScreen(adminDashboardSection);
    // **CORRECCIÓN**: La llamada a la inicialización de los listeners va aquí.
    initializeAdminDashboardListeners(); 
    fetchAndDisplayIncidents();
}

// Variable para asegurar que los listeners se añadan solo una vez.
let isAdminDashboardInitialized = false;

function initializeAdminDashboardListeners() {
    // Si ya se inicializó, no hacemos nada más.
    if (isAdminDashboardInitialized) {
        return;
    }

    const adminShowIncidentsBtn = document.getElementById('adminShowIncidentsBtn');
    const adminNewIncidentBtn = document.getElementById('adminNewIncidentBtn');
    const adminCancelNewIncidentBtn = document.getElementById('adminCancelNewIncidentBtn');
    const adminNewIncidentForm = document.getElementById('adminNewIncidentForm');

    if (adminShowIncidentsBtn) {
        adminShowIncidentsBtn.addEventListener('click', () => {
            showAdminView('adminViewIncidents');
        });
    }

    if (adminNewIncidentBtn) {
        adminNewIncidentBtn.addEventListener('click', () => {
            if (adminNewIncidentForm) adminNewIncidentForm.reset();
            showAdminView('adminViewNewIncident');
        });
    }

    if (adminCancelNewIncidentBtn) {
        adminCancelNewIncidentBtn.addEventListener('click', () => {
            showAdminView('adminViewIncidents');
        });
    }

    if (adminNewIncidentForm) {
        adminNewIncidentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(adminNewIncidentForm);
            const payload = {
                stepSeleccionaMaquina: formData.get('stepSeleccionaMaquina'),
                tipoDeIncidenciaSeleccionada: formData.get('tipoDeIncidenciaSeleccionada'),
                stepApagarEncender: formData.get('detallesAdicionales') || null,
                status: formData.get('status')
            };

            if (loader) loader.style.display = 'block';
            const response = await apiRequest('/incidents', 'POST', payload, true);
            if (loader) loader.style.display = 'none';

            if (response.success) {
                alert('¡Incidencia creada con éxito!');
                adminNewIncidentForm.reset();
                showAdminView('adminViewIncidents');
                fetchAndDisplayIncidents();
            } else {
                alert(`Error al crear la incidencia: ${response.error || 'Error desconocido'}`);
            }
        });
    }

    // Marcamos como inicializado para no volver a añadir los listeners.
    isAdminDashboardInitialized = true;
    console.log("Listeners del panel de administrador inicializados.");
}


// --- FUNCIÓN PARA GESTIONAR VISTAS DEL PANEL DE ADMIN ---
function showAdminView(viewIdToShow) {
    // Oculta todas las vistas del admin
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active-admin-view');
    });
    // Muestra solo la vista deseada
    const viewToShow = document.getElementById(viewIdToShow);
    if (viewToShow) {
        viewToShow.classList.add('active-admin-view');
    }
}

// Obtiene las incidencias de la API y las muestra en la tabla.
async function fetchAndDisplayIncidents() {
    if (!incidentsTableBody) {
        console.error("Elemento incidentsTableBody no encontrado.");
        return;
    }

    incidentsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Cargando incidencias...</td></tr>`;

    const response = await apiRequest('/incidents', 'GET', null, true);

    if (response.success && Array.isArray(response.data)) {
        incidentsTableBody.innerHTML = '';

        if (response.data.length === 0) {
            incidentsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">No hay incidencias reportadas.</td></tr>`;
            return;
        }

        response.data.forEach(incidencia => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';

            const fecha = new Date(incidencia.createdAt).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const maquinaTd = document.createElement('td');
            maquinaTd.className = 'py-3 px-4';
            maquinaTd.textContent = (incidencia.detalles && incidencia.detalles.stepSeleccionaMaquina) || '-';
            tr.appendChild(maquinaTd);

            const tipoTd = document.createElement('td');
            tipoTd.className = 'py-3 px-4';
            tipoTd.textContent = (incidencia.detalles && incidencia.detalles.tipoDeIncidenciaSeleccionada) || '-';
            tr.appendChild(tipoTd);

            const fechaTd = document.createElement('td');
            fechaTd.className = 'py-3 px-4';
            // Corrección: Usar la columna 'createdAt' si existe, si no, 'N/A'
            fechaTd.textContent = incidencia.createdAt ? new Date(incidencia.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A';
            tr.appendChild(fechaTd);
            
            const estadoTd = document.createElement('td');
            estadoTd.className = 'py-3 px-4';
            let estadoHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>';
            if (incidencia.estado === 'resuelta') {
                 estadoHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Resuelta</span>';
            } else if (incidencia.estado === 'en_proceso') {
                 estadoHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">En Proceso</span>';
            }
            estadoTd.innerHTML = estadoHTML;
            tr.appendChild(estadoTd);

            const accionesTd = document.createElement('td');
            accionesTd.className = 'py-3 px-4';
            const verButton = document.createElement('button');
            verButton.className = 'text-indigo-600 hover:text-indigo-900 text-sm';
            verButton.textContent = 'Ver';
            accionesTd.appendChild(verButton);
            tr.appendChild(accionesTd);
            
            incidentsTableBody.appendChild(tr);
        });

    } else {
        incidentsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Error al cargar las incidencias: ${response.error || 'Error desconocido'}</td></tr>`;
    }
}

// Asigna la función de recarga al botón de refrescar del panel de admin.
if (refreshIncidentsButton) {
    refreshIncidentsButton.addEventListener('click', fetchAndDisplayIncidents);
}


// --- Inicialización al Cargar la Página ---
document.addEventListener('DOMContentLoaded', () => {
    if(loader) loader.style.display = 'block';
    checkUserSession(); 
});


console.log("Fin del script principal. Esperando eventos...");
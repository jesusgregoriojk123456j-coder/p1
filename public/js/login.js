// js/login.js - Manejo de la autenticación

// Credenciales de demostración
const USUARIO_DEMO = {
    usuario: 'admin',
    password: 'password',
    nombre: 'Administrador',
    rol: 'admin'
};

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'error') {
    const notificacion = document.createElement('div');
    notificacion.className = `mensaje-flotante mensaje-${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Verificar si ya hay sesión activa
function verificarSesionActiva() {
    const sesion = localStorage.getItem('sesion_sigelab');
    if (sesion) {
        window.location.href = 'index.html';
    }
}

// Guardar sesión
function guardarSesion(usuarioData) {
    const sesionData = {
        usuario: usuarioData.usuario,
        nombre: usuarioData.nombre,
        rol: usuarioData.rol,
        fechaInicio: new Date().toISOString(),
        id: Date.now()
    };
    localStorage.setItem('sesion_sigelab', JSON.stringify(sesionData));
}

// Manejar el envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    verificarSesionActiva();

    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const usuario = document.getElementById('usuario').value.trim();
            const password = document.getElementById('password').value;
            const recordar = document.querySelector('input[name="recordar"]')?.checked || false;

            if (!usuario || !password) {
                mostrarNotificacion('❌ Por favor completa todos los campos', 'error');
                return;
            }

            // Simular verificación (en producción esto sería una petición AJAX)
            if (usuario === USUARIO_DEMO.usuario && password === USUARIO_DEMO.password) {
                mostrarNotificacion('✅ ¡Bienvenido a SIGELAB!', 'exito');
                
                guardarSesion(USUARIO_DEMO);

                if (recordar) {
                    localStorage.setItem('recordar_sesion', 'true');
                }

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                mostrarNotificacion('❌ Usuario o contraseña incorrectos', 'error');
                
                loginForm.classList.add('shake');
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500);
            }
        });
    }
});
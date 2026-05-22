// js/bitacora.js - Manejo de la bitácora digital

let tipoUsuarioSeleccionado = '';

// Actualizar fecha y hora en tiempo real
function actualizarFechaHora() {
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const campoFecha = document.getElementById('fecha_hora');
    if (campoFecha) {
        campoFecha.value = fechaHora;
    }
}

// Actualizar cada segundo
setInterval(actualizarFechaHora, 1000);

// Seleccionar tipo de usuario
function seleccionarTipo(tipo) {
    tipoUsuarioSeleccionado = tipo;
    
    // Actualizar UI
    const tipoEstudiante = document.getElementById('tipo-estudiante');
    const tipoExterno = document.getElementById('tipo-externo');
    if (tipoEstudiante) tipoEstudiante.classList.remove('seleccionado');
    if (tipoExterno) tipoExterno.classList.remove('seleccionado');
    
    if (tipo === 'estudiante') {
        if (tipoEstudiante) tipoEstudiante.classList.add('seleccionado');
        const campoClase = document.getElementById('campo-clase');
        if (campoClase) campoClase.style.display = 'block';
        const claseInput = document.getElementById('clase');
        if (claseInput) claseInput.required = true;
        cargarClases();
    } else {
        if (tipoExterno) tipoExterno.classList.add('seleccionado');
        const campoClase = document.getElementById('campo-clase');
        if (campoClase) campoClase.style.display = 'none';
        const claseInput = document.getElementById('clase');
        if (claseInput) {
            claseInput.required = false;
            claseInput.value = '';
        }
    }
    
    const tipoUsuarioInput = document.getElementById('tipo_usuario');
    if (tipoUsuarioInput) tipoUsuarioInput.value = tipo;
}

// Cargar registros recientes desde el backend
async function cargarRegistrosRecientes() {
    try {
        const response = await fetch(`${API_URL}/bitacora/recientes`);
        const registros = await response.json();
        
        const tbody = document.getElementById('registros-recientes');
        if (tbody) {
            tbody.innerHTML = registros.map(registro => `
                <tr>
                    <td>${registro.hora || '-'}</td>
                    <td>${registro.equipo_numero || '-'}</td>
                    <td>${registro.usuario_nombre || '-'}</td>
                    <td>${registro.tipo_usuario === 'estudiante' ? '👨‍🎓 Estudiante' : '👤 Externo'}</td>
                    <td>${registro.clase_nombre || '-'}</td>
                    <td>${registro.proposito || '-'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando registros recientes:', error);
    }
}

// Cargar lista de equipos desde el backend
async function cargarEquipos() {
    try {
        const response = await fetch(`${API_URL}/equipos`);
        const equipos = await response.json();
        
        const selectComputadora = document.getElementById('computadora');
        if (selectComputadora) {
            // Filtrar solo equipos disponibles
            const equiposDisponibles = equipos.filter(e => e.estado === 'disponible');
            
            selectComputadora.innerHTML = '<option value="">Selecciona una computadora</option>';
            equiposDisponibles.forEach(equipo => {
                const option = document.createElement('option');
                option.value = equipo.numero;
                option.textContent = `${equipo.numero} - ${equipo.marca || 'Sin marca'} (${equipo.estado})`;
                selectComputadora.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando equipos:', error);
    }
}

// Cargar clases desde el backend
async function cargarClases() {
    try {
        const response = await fetch(`${API_URL}/clases`);
        const clases = await response.json();
        
        const selectClase = document.getElementById('clase');
        if (selectClase) {
            selectClase.innerHTML = '<option value="">Selecciona tu clase</option>';
            clases.forEach(clase => {
                const option = document.createElement('option');
                option.value = clase.id;
                option.textContent = `${clase.nombre} (${clase.codigo}) - ${clase.grado}°${clase.grupo}`;
                selectClase.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando clases:', error);
    }
}

// Manejar envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    actualizarFechaHora();
    cargarEquipos();
    cargarRegistrosRecientes();
    cargarClases();
    
    const form = document.getElementById('form-bitacora');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!tipoUsuarioSeleccionado) {
                mostrarMensaje('⚠️ Por favor selecciona el tipo de usuario', 'error');
                return;
            }
            
            const computadora = document.getElementById('computadora').value;
            if (!computadora) {
                mostrarMensaje('⚠️ Por favor selecciona una computadora', 'error');
                return;
            }
            
            const nombre = document.getElementById('nombre').value;
            if (!nombre) {
                mostrarMensaje('⚠️ Por favor ingresa tu nombre completo', 'error');
                return;
            }
            
            const proposito = document.getElementById('proposito').value;
            if (!proposito) {
                mostrarMensaje('⚠️ Por favor selecciona el propósito', 'error');
                return;
            }
            
            const datos = {
                equipo_numero: computadora,
                usuario_nombre: nombre,
                tipo_usuario: tipoUsuarioSeleccionado,
                clase_id: document.getElementById('clase').value || null,
                tipo_registro: 'entrada',
                proposito: proposito,
                observaciones: document.getElementById('observaciones').value || ''
            };
            
            try {
                const response = await fetch(`${API_URL}/bitacora`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datos)
                });
                
                if (response.ok) {
                    mostrarMensaje('✅ Acceso registrado correctamente', 'exito');
                    
                    // Limpiar formulario
                    form.reset();
                    tipoUsuarioSeleccionado = '';
                    const tipoEstudiante = document.getElementById('tipo-estudiante');
                    const tipoExterno = document.getElementById('tipo-externo');
                    if (tipoEstudiante) tipoEstudiante.classList.remove('seleccionado');
                    if (tipoExterno) tipoExterno.classList.remove('seleccionado');
                    const campoClase = document.getElementById('campo-clase');
                    if (campoClase) campoClase.style.display = 'none';
                    
                    // Recargar datos
                    cargarEquipos();
                    cargarRegistrosRecientes();
                } else {
                    const error = await response.json();
                    mostrarMensaje(`❌ Error: ${error.error}`, 'error');
                }
            } catch (error) {
                console.error('Error al registrar acceso:', error);
                mostrarMensaje('❌ Error de conexión con el servidor', 'error');
            }
        });
    }
});

// Función para mostrar mensajes flotantes
function mostrarMensaje(texto, tipo) {
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.textContent = texto;
    mensaje.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        z-index: 9999;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (tipo === 'exito') {
        mensaje.style.backgroundColor = '#28a745';
    } else if (tipo === 'error') {
        mensaje.style.backgroundColor = '#dc3545';
    } else {
        mensaje.style.backgroundColor = '#ffc107';
        mensaje.style.color = '#333';
    }
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, 3000);
}

// Agregar estilos para la animación si no existen
if (!document.querySelector('#mensaje-estilos')) {
    const style = document.createElement('style');
    style.id = 'mensaje-estilos';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}
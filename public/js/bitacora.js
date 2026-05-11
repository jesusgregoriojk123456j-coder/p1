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
    document.getElementById('tipo-estudiante').classList.remove('seleccionado');
    document.getElementById('tipo-externo').classList.remove('seleccionado');
    
    if (tipo === 'estudiante') {
        document.getElementById('tipo-estudiante').classList.add('seleccionado');
        document.getElementById('campo-clase').style.display = 'block';
        document.getElementById('clase').required = true;
        cargarClases();
    } else {
        document.getElementById('tipo-externo').classList.add('seleccionado');
        document.getElementById('campo-clase').style.display = 'none';
        document.getElementById('clase').required = false;
        document.getElementById('clase').value = '';
    }
    
    document.getElementById('tipo_usuario').value = tipo;
}

// Cargar registros recientes
function cargarRegistrosRecientes() {
    const registros = JSON.parse(localStorage.getItem('bitacora_registros')) || [];
    const tbody = document.getElementById('registros-recientes');
    
    if (tbody) {
        const ultimosRegistros = registros.slice(-5).reverse();
        tbody.innerHTML = ultimosRegistros.map(registro => `
            <tr>
                <td>${registro.hora}</td>
                <td>${registro.computadora}</td>
                <td>${registro.nombre}</td>
                <td>${registro.tipo_usuario === 'estudiante' ? '👨‍🎓 Estudiante' : '👤 Externo'}</td>
                <td>${obtenerNombreClase(registro.clase)}</td>
                <td>${registro.proposito}</td>
            </tr>
        `).join('');
    }
}

// Manejar envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    actualizarFechaHora();
    cargarRegistrosRecientes();
    
    const form = document.getElementById('form-bitacora');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!tipoUsuarioSeleccionado) {
                alert('Por favor selecciona el tipo de usuario');
                return;
            }
            
            const registro = {
                id: Date.now(),
                fecha: new Date().toLocaleDateString('es-MX'),
                hora: new Date().toLocaleTimeString('es-MX'),
                computadora: document.getElementById('computadora').value,
                nombre: document.getElementById('nombre').value,
                tipo_usuario: tipoUsuarioSeleccionado,
                clase: document.getElementById('clase').value || '',
                tipo_registro: document.getElementById('tipo_registro').value,
                proposito: document.getElementById('proposito').value,
                observaciones: document.getElementById('observaciones').value,
                timestamp: new Date().toISOString()
            };
            
            // Guardar en localStorage
            const registros = JSON.parse(localStorage.getItem('bitacora_registros')) || [];
            registros.push(registro);
            localStorage.setItem('bitacora_registros', JSON.stringify(registros));
            
            // Actualizar estado de la computadora
            actualizarEstadoComputadora(registro.computadora, registro.tipo_registro);
            
            // Mostrar mensaje de éxito
            mostrarMensaje('✅ Acceso registrado correctamente', 'exito');
            
            // Limpiar formulario
            form.reset();
            tipoUsuarioSeleccionado = '';
            document.getElementById('tipo-estudiante').classList.remove('seleccionado');
            document.getElementById('tipo-externo').classList.remove('seleccionado');
            document.getElementById('campo-matricula').style.display = 'none';
            
            // Recargar registros recientes
            cargarRegistrosRecientes();
        });
    }
});

// Actualizar estado de computadora
function actualizarEstadoComputadora(computadora, tipoRegistro) {
    const equipos = JSON.parse(localStorage.getItem('equipos')) || [
        { id: 'PC-01', numero: 'PC-01', estado: 'disponible' },
        { id: 'PC-02', numero: 'PC-02', estado: 'disponible' },
        { id: 'PC-03', numero: 'PC-03', estado: 'disponible' },
        { id: 'PC-04', numero: 'PC-04', estado: 'disponible' },
        { id: 'PC-05', numero: 'PC-05', estado: 'disponible' },
        { id: 'PC-06', numero: 'PC-06', estado: 'disponible' }
    ];
    
    const equipoIndex = equipos.findIndex(e => e.numero === computadora);
    if (equipoIndex !== -1) {
        if (tipoRegistro === 'entrada') {
            equipos[equipoIndex].estado = 'uso';
        } else {
            equipos[equipoIndex].estado = 'disponible';
        }
        localStorage.setItem('equipos', JSON.stringify(equipos));
    }
}

function cargarClases() {
    const clases = JSON.parse(localStorage.getItem('clases')) || [];
    const selectClase = document.getElementById('clase');
    
    if (selectClase) {
        // Mantener la opción por defecto
        selectClase.innerHTML = '<option value="">Selecciona tu clase</option>';
        
        clases.forEach(clase => {
            const option = document.createElement('option');
            option.value = clase.codigo; // Guardar el código
            option.textContent = `${clase.nombre} (${clase.codigo})`; // Mostrar nombre y código
            selectClase.appendChild(option);
        });
    }
}

// Función para obtener el nombre de la clase por código
function obtenerNombreClase(codigo) {
    const clases = JSON.parse(localStorage.getItem('clases')) || [];
    const clase = clases.find(c => c.codigo === codigo);
    return clase ? `${clase.nombre} (${clase.codigo})` : codigo || '-';
}

function mostrarMensaje(texto, tipo) {
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, 3000);
}
// js/app.js - Funcionalidades generales

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Marcar enlace activo
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('nav a').forEach(enlace => {
        if (enlace.getAttribute('href') === currentPage) {
            enlace.classList.add('activo');
        }
    });
    
    // Cargar inventario si estamos en esa página
    if (currentPage === 'inventario.html') {
        cargarInventario();
        verificarAccesoAdmin();
    }
});

// Verificar si es admin para mostrar acciones
function verificarAccesoAdmin() {
    const esAdmin = localStorage.getItem('admin_sesion') === 'true';
    const adminActions = document.getElementById('admin-actions');
    if (adminActions) {
        adminActions.style.display = esAdmin ? 'block' : 'none';
    }
}

// Cargar inventario
function cargarInventario() {
    // Datos de ejemplo
    const equiposPredeterminados = [
        { id: 'PC-01', numero: 'PC-01', marca: 'HP EliteDesk', estado: 'disponible', ubicacion: 'Laboratorio 101', especificaciones: 'i5, 16GB RAM, 256GB SSD' },
        { id: 'PC-02', numero: 'PC-02', marca: 'Dell Optiplex', estado: 'disponible', ubicacion: 'Laboratorio 101', especificaciones: 'i7, 16GB RAM, 512GB SSD' },
        { id: 'PC-03', numero: 'PC-03', marca: 'Lenovo ThinkCentre', estado: 'uso', ubicacion: 'Laboratorio 102', especificaciones: 'i5, 8GB RAM, 256GB SSD' },
        { id: 'PC-04', numero: 'PC-04', marca: 'HP ProDesk', estado: 'disponible', ubicacion: 'Laboratorio 102', especificaciones: 'i5, 16GB RAM, 256GB SSD' },
        { id: 'PC-05', numero: 'PC-05', marca: 'Apple iMac', estado: 'mantenimiento', ubicacion: 'Laboratorio 103', especificaciones: 'M1, 8GB RAM, 256GB SSD' },
        { id: 'PC-06', numero: 'PC-06', marca: 'Microsoft Surface', estado: 'disponible', ubicacion: 'Laboratorio 103', especificaciones: 'i7, 16GB RAM, 512GB SSD' }
    ];
    
    let equipos = JSON.parse(localStorage.getItem('equipos'));
    if (!equipos) {
        localStorage.setItem('equipos', JSON.stringify(equiposPredeterminados));
        equipos = equiposPredeterminados;
    }
    
    actualizarGridEquipos(equipos);
    actualizarContadores(equipos);
}

// Actualizar grid de equipos
function actualizarGridEquipos(equipos) {
    const grid = document.getElementById('equipos-grid');
    if (!grid) return;
    
    grid.innerHTML = equipos.map(equipo => {
        let estadoClass = '';
        let estadoTexto = '';
        
        switch(equipo.estado) {
            case 'disponible':
                estadoClass = 'estado-disponible';
                estadoTexto = '✅ Disponible';
                break;
            case 'uso':
                estadoClass = 'estado-uso';
                estadoTexto = '🔄 En Uso';
                break;
            case 'mantenimiento':
                estadoClass = 'estado-mantenimiento';
                estadoTexto = '🔧 Mantenimiento';
                break;
        }
        
        return `
            <div class="equipo-card ${equipo.estado}">
                <div class="equipo-header">
                    <span class="equipo-numero">${equipo.numero}</span>
                    <span class="equipo-estado ${estadoClass}">${estadoTexto}</span>
                </div>
                <div class="equipo-info">
                    <p><strong>Marca:</strong> ${equipo.marca}</p>
                    <p><strong>Ubicación:</strong> ${equipo.ubicacion}</p>
                    <p><strong>Especificaciones:</strong> ${equipo.especificaciones}</p>
                </div>
                ${localStorage.getItem('admin_sesion') === 'true' ? `
                    <div style="margin-top: 1rem; text-align: center;">
                        <button onclick="editarEquipo('${equipo.id}')" class="btn-secundario btn-pequeno">✏️ Editar</button>
                        <button onclick="eliminarEquipo('${equipo.id}')" class="btn-eliminar btn-pequeno">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Actualizar contadores
function actualizarContadores(equipos) {
    const disponibles = equipos.filter(e => e.estado === 'disponible').length;
    const uso = equipos.filter(e => e.estado === 'uso').length;
    const mantenimiento = equipos.filter(e => e.estado === 'mantenimiento').length;
    
    document.getElementById('total-disponibles').textContent = disponibles;
    document.getElementById('total-uso').textContent = uso;
    document.getElementById('total-mantenimiento').textContent = mantenimiento;
}

// Funciones para administrar equipos
function mostrarFormularioEquipo() {
    document.getElementById('form-equipo-container').style.display = 'block';
    document.getElementById('form-equipo-titulo').textContent = '➕ Agregar Nuevo Equipo';
    document.getElementById('form-equipo').reset();
    document.getElementById('equipo-id').value = '';
}

function cancelarFormularioEquipo() {
    document.getElementById('form-equipo-container').style.display = 'none';
}

// Guardar equipo
document.addEventListener('submit', function(e) {
    if (e.target.id === 'form-equipo') {
        e.preventDefault();
        
        const equipos = JSON.parse(localStorage.getItem('equipos')) || [];
        const equipoId = document.getElementById('equipo-id').value;
        
        const equipoData = {
            id: equipoId || 'PC-' + (equipos.length + 1).toString().padStart(2, '0'),
            numero: document.getElementById('equipo-numero').value,
            marca: document.getElementById('equipo-marca').value,
            estado: document.getElementById('equipo-estado').value,
            ubicacion: document.getElementById('equipo-ubicacion').value,
            especificaciones: document.getElementById('equipo-especificaciones').value
        };
        
        if (equipoId) {
            // Editar existente
            const index = equipos.findIndex(e => e.id === equipoId);
            if (index !== -1) {
                equipos[index] = equipoData;
            }
        } else {
            // Agregar nuevo
            equipos.push(equipoData);
        }
        
        localStorage.setItem('equipos', JSON.stringify(equipos));
        cargarInventario();
        cancelarFormularioEquipo();
        mostrarMensaje('✅ Equipo guardado', 'exito');
    }
});

// Funciones globales
window.seleccionarTipo = seleccionarTipo;
window.mostrarFormularioEquipo = mostrarFormularioEquipo;
window.cancelarFormularioEquipo = cancelarFormularioEquipo;
window.aplicarFiltros = aplicarFiltros;
window.generarReporte = generarReporte;
window.exportarExcel = exportarExcel;
window.logout = logout;
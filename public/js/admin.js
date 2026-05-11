// js/admin.js - Funcionalidades del panel administrativo con backend

// Login de administrador
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-admin-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const usuario = document.getElementById('usuario').value;
            const password = document.getElementById('password').value;

            try {
                const data = await fetchAPI('/login', {
                    method: 'POST',
                    body: JSON.stringify({ username: usuario, password: password })
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                mostrarMensaje('✅ Acceso concedido', 'exito');
                setTimeout(() => {
                    window.location.href = 'admin-panel.html';
                }, 1500);
            } catch (error) {
                mostrarMensaje('❌ Credenciales incorrectas', 'error');
            }
        });
    }

    if (window.location.pathname.includes('admin-panel.html')) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login-admin.html';
        } else {
            cargarDatosPanel();
        }
    }
});

async function cargarDatosPanel() {
    try {
        const stats = await fetchAPI('/stats/dashboard');
        document.getElementById('stats-hoy').textContent = stats.accesos_hoy || 0;
        document.getElementById('stats-uso').textContent = stats.equipos_uso || 0;
        document.getElementById('stats-total').textContent = stats.total_registros || 0;

        await cargarTablaBitacora();
        await cargarTablaClases();
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarMensaje('Error al cargar datos', 'error');
    }
}

async function cargarTablaBitacora(filtros = {}) {
    try {
        let url = '/bitacora?limite=100';
        if (filtros.fecha) url += `&fecha=${filtros.fecha}`;
        if (filtros.tipo) url += `&tipo_usuario=${filtros.tipo}`;
        if (filtros.busqueda) url += `&busqueda=${filtros.busqueda}`;

        const registros = await fetchAPI(url);
        const tbody = document.getElementById('tabla-bitacora');

        if (tbody) {
            tbody.innerHTML = registros.map(registro => `
                <tr>
                    <td>${registro.fecha} ${registro.hora}</td>
                    <td>${registro.equipo_numero}</td>
                    <td>${registro.usuario_nombre}</td>
                    <td>${registro.tipo_usuario === 'estudiante' ? '👨‍🎓 Estudiante' : '👤 Externo'}</td>
                    <td>${registro.clase_nombre || '-'}</td>
                    <td>${registro.proposito}</td>
                    <td>
                        <button onclick="eliminarRegistro(${registro.id})" class="btn-eliminar btn-pequeno">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando bitácora:', error);
        mostrarMensaje('Error al cargar bitácora', 'error');
    }
}

async function aplicarFiltros() {
    const filtros = {
        fecha: document.getElementById('filtro-fecha')?.value,
        tipo: document.getElementById('filtro-tipo')?.value,
        busqueda: document.getElementById('filtro-busqueda')?.value
    };
    await cargarTablaBitacora(filtros);
}

async function eliminarRegistro(id) {
    if (!confirm('¿Eliminar este registro?')) {
        return;
    }

    try {
        await fetchAPI(`/bitacora/${id}`, { method: 'DELETE' });
        mostrarMensaje('✅ Registro eliminado', 'exito');
        await cargarTablaBitacora();
    } catch (error) {
        console.error('Error eliminando registro:', error);
        mostrarMensaje('Error al eliminar registro', 'error');
    }
}

async function cargarTablaClases() {
    try {
        const clases = await fetchAPI('/clases');
        const tbody = document.getElementById('tabla-clases');

        if (tbody) {
            tbody.innerHTML = clases.map(clase => `
                <tr>
                    <td>${clase.nombre}</td>
                    <td>${clase.grado}° Grado</td>
                    <td>${clase.grupo}</td>
                    <td>${clase.maestro}</td>
                    <td>
                        <button onclick="eliminarClase(${clase.id})" class="btn-eliminar btn-pequeno">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando clases:', error);
        mostrarMensaje('Error al cargar clases', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const formClase = document.getElementById('form-clase');
    if (formClase) {
        formClase.addEventListener('submit', async function(e) {
            e.preventDefault();

            const grado = document.getElementById('grado').value;
            const grupo = document.getElementById('grupo').value;
            const nombre = document.getElementById('nombre_clase').value;
            const maestro = document.getElementById('maestro').value;
            const codigo = grado + grupo;

            try {
                await fetchAPI('/clases', {
                    method: 'POST',
                    body: JSON.stringify({ codigo, nombre, grado, grupo, maestro })
                });

                mostrarMensaje('✅ Clase creada', 'exito');
                formClase.reset();
                await cargarTablaClases();
            } catch (error) {
                console.error('Error creando clase:', error);
                mostrarMensaje('Error al crear clase', 'error');
            }
        });
    }
});

async function eliminarClase(id) {
    if (!confirm('¿Eliminar esta clase?')) {
        return;
    }

    try {
        await fetchAPI(`/clases/${id}`, { method: 'DELETE' });
        mostrarMensaje('🗑️ Clase eliminada', 'exito');
        await cargarTablaClases();
    } catch (error) {
        console.error('Error eliminando clase:', error);
        mostrarMensaje('Error al eliminar clase', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    mostrarMensaje('👋 Sesión cerrada', 'exito');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function mostrarMensaje(texto, tipo) {
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);

    setTimeout(() => mensaje.remove(), 3000);
}
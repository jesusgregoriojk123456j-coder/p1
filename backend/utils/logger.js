// backend/utils/logger.js

// ✅ Usar la misma conexión que server.js
const pool = require('../config/db');

/**
 * Obtiene la IP real del cliente, incluso detrás de proxies
 */
const getClientIp = (req) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 
           req.connection?.remoteAddress || 
           req.ip || 
           '0.0.0.0';
};

/**
 * Clase Logger para registrar actividades en SIGELAB
 */
class Logger {
    
    static async log(req, accion, detalles = {}, resultado = 'exito', mensaje_error = null, duracion_ms = null) {
        try {
            console.log('📝 Logger.log() - Acción:', accion, 'Resultado:', resultado);
            
            // Obtener información del usuario
            let usuario_id = null;
            let usuario_nombre = null;
            let rol_usuario = null;
            
            // Intentar obtener usuario desde el token (si está disponible)
            if (req.usuarioId) {
                try {
                    const result = await pool.query(
                        'SELECT username, nombre_completo FROM usuarios WHERE id = $1',
                        [req.usuarioId]
                    );
                    if (result.rows.length > 0) {
                        usuario_id = req.usuarioId;
                        usuario_nombre = result.rows[0].username;
                    }
                } catch (err) {
                    console.error('Error obteniendo usuario:', err);
                }
            }
            
            // Si no hay usuario autenticado, usar datos del body (registro público)
            if (!usuario_nombre && detalles.datos?.usuario_nombre) {
                usuario_nombre = detalles.datos.usuario_nombre;
                rol_usuario = 'publico';
                console.log('👤 Usuario público (desde body):', usuario_nombre);
            }
            
            // Si sigue sin nombre, usar anonimo
            if (!usuario_nombre) {
                usuario_nombre = 'anonimo';
                rol_usuario = 'publico';
            }
            
            const ip_address = getClientIp(req);
            
            // Limpiar parámetros sensibles
            const parametros = { ...req.query, ...req.body, ...req.params };
            delete parametros.password;
            delete parametros.password_hash;
            
            // Guardar log en la base de datos
            const query = `
                INSERT INTO logs (usuario_id, usuario_nombre, rol_usuario, accion, modulo, 
                                 metodo, ip_address, user_agent, detalles, parametros, 
                                 resultado, mensaje_error, duracion_ms, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            
            const values = [
                usuario_id,
                usuario_nombre,
                rol_usuario,
                accion,
                req.baseUrl || req.route?.path || null,
                req.method,
                ip_address,
                req.headers['user-agent'] || null,
                JSON.stringify(detalles),
                JSON.stringify(parametros),
                resultado,
                mensaje_error,
                duracion_ms
            ];
            
            console.log('📊 Insertando log:', { accion, usuario_nombre, resultado });
            
            const result = await pool.query(query, values);
            console.log('✅ Log insertado con ID:', result.rows[0].id);
            return result.rows[0].id;
            
        } catch (error) {
            console.error('❌ Error al guardar log:', error.message);
            return null;
        }
    }
    
    static async logInicio(req, accion, detalles = {}) {
        const inicio = Date.now();
        await this.log(req, accion, { ...detalles, estado: 'iniciado' }, 'inicio');
        return inicio;
    }
    
    static async logExito(req, accion, detalles = {}, inicio = null) {
        const duracion = inicio !== null ? Date.now() - inicio : null;
        await this.log(req, accion, { ...detalles, estado: 'completado' }, 'exito', null, duracion);
    }
    
    static async logError(req, accion, error, detalles = {}, inicio = null) {
        const duracion = inicio !== null ? Date.now() - inicio : null;
        await this.log(req, accion, { ...detalles, estado: 'error' }, 'error', error, duracion);
    }
    
    static async logDenegado(req, accion, detalles = {}) {
        await this.log(req, accion, { ...detalles, estado: 'denegado' }, 'denegado', 'Permiso insuficiente');
    }
}

module.exports = Logger;
// backend/utils/logger.js

//
const pool = require('../config/db');

/**
 *  IP 
 */
const getClientIp = (req) => {
    // Prioridad: x-forwarded-for (cuando hay proxy/balanceador)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        // La primera IP es la del cliente original
        return xForwardedFor.split(',')[0].trim();
    }
    
    // Si no hay proxy, usar la IP de conexión directa
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
            // Obtener información del usuario desde la sesión
            let usuario_id = null;
            let usuario_nombre = null;
            let rol_usuario = null;
            
            if (req.session && req.session.usuario) {
                usuario_id = req.session.usuario.id;
                usuario_nombre = req.session.usuario.username || req.session.usuario.nombre_completo;
                rol_usuario = req.session.usuario.rol_nombre;
            }
            
            //IP 
            const ip_address = getClientIp(req);
            
            // Limpiar parámetros sensibles
            const parametros = { ...req.query, ...req.body, ...req.params };
            delete parametros.password;
            delete parametros.password_hash;
            delete parametros.token;
            
            // Guardar log en la base de datos
            const query = `
                INSERT INTO logs (usuario_id, usuario_nombre, rol_usuario, accion, modulo, controlador, 
                                 metodo, ip_address, user_agent, detalles, parametros, 
                                 resultado, mensaje_error, duracion_ms, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            
            const values = [
                usuario_id,
                usuario_nombre,
                rol_usuario,
                accion,
                req.baseUrl || req.route?.path || null,
                req.route?.path ? 'controller' : null,
                req.method,
                ip_address,
                req.headers['user-agent'] || null,
                JSON.stringify(detalles),
                JSON.stringify(parametros),
                resultado,
                mensaje_error,
                duracion_ms
            ];
            
            const result = await pool.query(query, values);
            return result.rows[0].id;
            
        } catch (error) {
            console.error('Error al guardar log:', error);
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
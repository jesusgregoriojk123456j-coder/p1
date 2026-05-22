// backend/utils/logger.js
const pool = require('../config/db');

/**
 * Obtiene la IP real del cliente, incluso detrás de proxies
 */
const getClientIp = (req) => {
    // 1. Prioridad: x-forwarded-for (cuando hay proxy como Render)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        // La primera IP es la del cliente real
        const ips = xForwardedFor.split(',');
        const clientIp = ips[0].trim();
        console.log('📡 IP desde x-forwarded-for:', clientIp);
        return clientIp;
    }
    
    // 2. Si no hay proxy, usar la IP de conexión directa
    if (req.ip) {
        console.log('📡 IP desde req.ip:', req.ip);
        return req.ip;
    }
    
    // 3. Fallback: socket remote address
    if (req.socket?.remoteAddress) {
        console.log('📡 IP desde socket:', req.socket.remoteAddress);
        // Limpiar IPv6 localhost
        const cleanIp = req.socket.remoteAddress.replace('::ffff:', '');
        return cleanIp;
    }
    
    // 4. Último recurso
    console.log('📡 IP no detectada, usando 0.0.0.0');
    return '0.0.0.0';
};

class Logger {
    static async log(req, accion, detalles = {}, resultado = 'exito', mensaje_error = null, duracion_ms = null) {
        try {
            // Obtener nombre del usuario desde el body o query
            let usuario_nombre = req.body?.usuario_nombre || req.query?.usuario_nombre || 'anonimo';
            
            // Obtener IP real del cliente
            const ip_address = getClientIp(req);
            
            // Obtener User-Agent
            const user_agent = req.headers['user-agent'] || null;
            
            // Insertar en la base de datos (incluyendo IP)
            const query = `
                INSERT INTO logs (usuario_nombre, accion, detalles, resultado, ip_address, user_agent, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id
            `;
            
            const values = [
                usuario_nombre,
                accion,
                JSON.stringify(detalles),
                resultado,
                ip_address,
                user_agent
            ];
            
            console.log('📝 Intentando insertar log:', { 
                accion, 
                usuario_nombre, 
                resultado,
                ip_address 
            });
            
            const result = await pool.query(query, values);
            console.log('✅ Log insertado ID:', result.rows[0].id);
            return result.rows[0].id;
        } catch (error) {
            console.error('❌ Error en logger:', error.message);
            return null;
        }
    }
    
    static async logInicio(req, accion, detalles = {}) {
        const inicio = Date.now();
        await this.log(req, accion, { ...detalles, estado: 'iniciado' }, 'inicio');
        return inicio;
    }
    
    static async logExito(req, accion, detalles = {}, inicio = null) {
        await this.log(req, accion, { ...detalles, estado: 'completado' }, 'exito');
    }
    
    static async logError(req, accion, error, detalles = {}, inicio = null) {
        await this.log(req, accion, { ...detalles, estado: 'error', error_msg: error }, 'error', error);
    }
    
    static async logDenegado(req, accion, detalles = {}) {
        await this.log(req, accion, { ...detalles, estado: 'denegado' }, 'denegado', 'Permiso insuficiente');
    }
}

module.exports = Logger;
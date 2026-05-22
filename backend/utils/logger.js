/// backend/utils/logger.js
const pool = require('../config/db');

class Logger {
    static async log(req, accion, detalles = {}, resultado = 'exito', mensaje_error = null, duracion_ms = null) {
        try {
            // Obtener nombre del usuario desde el body o query
            let usuario_nombre = req.body?.usuario_nombre || req.query?.usuario_nombre || 'anonimo';
            
            // Insertar directamente
            const query = `
                INSERT INTO logs (usuario_nombre, accion, detalles, resultado, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING id
            `;
            
            const values = [
                usuario_nombre,
                accion,
                JSON.stringify(detalles),
                resultado
            ];
            
            console.log('📝 Intentando insertar log:', { accion, usuario_nombre, resultado });
            
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
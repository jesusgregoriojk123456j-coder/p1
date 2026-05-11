const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sigelab_secret_key_2024';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const REPORTS_FOLDER = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_FOLDER)) {
    fs.mkdirSync(REPORTS_FOLDER, { recursive: true });
}

app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/reports', express.static(REPORTS_FOLDER));

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.usuarioId = decoded.id;
        req.rol = decoded.rol;
        next();
    });
};

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign({ id: 1, rol: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                success: true,
                token,
                usuario: { id: 1, username: 'admin', rol: 'admin' }
            });
        }

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = result.rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nombre_completo: usuario.nombre_completo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/equipos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipos ORDER BY numero');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/equipos/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
                COUNT(CASE WHEN estado = 'uso' THEN 1 END) as en_uso,
                COUNT(CASE WHEN estado = 'mantenimiento' THEN 1 END) as mantenimiento,
                COUNT(*) as total
            FROM equipos
        `);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/equipos', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { numero, marca, modelo, estado, ubicacion, especificaciones } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO equipos (numero, marca, modelo, estado, ubicacion, especificaciones) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [numero, marca, modelo, estado, ubicacion, especificaciones]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/equipos/:id', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { numero, marca, modelo, estado, ubicacion, especificaciones } = req.body;

    try {
        const result = await pool.query(
            `UPDATE equipos SET 
                numero = $1, marca = $2, modelo = $3, estado = $4, 
                ubicacion = $5, especificaciones = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 RETURNING *`,
            [numero, marca, modelo, estado, ubicacion, especificaciones, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/equipos/:id', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM equipos WHERE id = $1', [id]);
        res.json({ mensaje: 'Equipo eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bitacora', async (req, res) => {
    const { equipo_numero, usuario_nombre, tipo_usuario, clase_id, tipo_registro, proposito, observaciones } = req.body;

    try {
        const equipo = await pool.query('SELECT id FROM equipos WHERE numero = $1', [equipo_numero]);

        if (equipo.rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];
        const hora = ahora.toTimeString().split(' ')[0];

        const result = await pool.query(
            `INSERT INTO bitacora (equipo_id, usuario_nombre, tipo_usuario, clase_id, tipo_registro, proposito, observaciones, fecha, hora)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [equipo.rows[0].id, usuario_nombre, tipo_usuario, clase_id, tipo_registro, proposito, observaciones, fecha, hora]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bitacora', async (req, res) => {
    const { fecha, tipo_usuario, busqueda, limite = 50 } = req.query;

    let query = `
        SELECT b.*, e.numero as equipo_numero, c.nombre as clase_nombre
        FROM bitacora b
        LEFT JOIN equipos e ON b.equipo_id = e.id
        LEFT JOIN clases c ON b.clase_id = c.id
        WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (fecha) {
        query += ` AND b.fecha = $${paramIndex}`;
        params.push(fecha);
        paramIndex++;
    }

    if (tipo_usuario) {
        query += ` AND b.tipo_usuario = $${paramIndex}`;
        params.push(tipo_usuario);
        paramIndex++;
    }

    if (busqueda) {
        query += ` AND (b.usuario_nombre ILIKE $${paramIndex} OR c.nombre ILIKE $${paramIndex})`;
        params.push(`%${busqueda}%`);
        paramIndex++;
    }

    query += ` ORDER BY b.fecha DESC, b.hora DESC LIMIT $${paramIndex}`;
    params.push(limite);

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bitacora/recientes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, e.numero as equipo_numero, c.nombre as clase_nombre
            FROM bitacora b
            LEFT JOIN equipos e ON b.equipo_id = e.id
            LEFT JOIN clases c ON b.clase_id = c.id
            ORDER BY b.fecha DESC, b.hora DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reportes/generar', async (req, res) => {
    const { tipo, periodo, equipo, clase } = req.body;

    let query = '';
    const params = [];

    if (tipo === 'accesos') {
        query = `
            SELECT b.fecha, b.hora, e.numero as equipo_numero, b.usuario_nombre,
                   b.tipo_usuario, c.nombre as clase_nombre, b.proposito, b.observaciones
            FROM bitacora b
            LEFT JOIN equipos e ON b.equipo_id = e.id
            LEFT JOIN clases c ON b.clase_id = c.id
            WHERE 1=1`;

        if (periodo === 'Hoy') {
            query += ` AND b.fecha = CURRENT_DATE`;
        } else if (periodo === 'Esta semana') {
            query += ` AND b.fecha >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (periodo === 'Este mes') {
            query += ` AND b.fecha >= date_trunc('month', CURRENT_DATE)`;
        }

        query += ` ORDER BY b.fecha DESC, b.hora DESC`;
    } else if (tipo === 'equipos') {
        query = `SELECT numero, marca, modelo, estado, ubicacion, especificaciones FROM equipos`;

        if (equipo && equipo !== 'Todos los equipos') {
            query += ` WHERE numero = $1`;
            params.push(equipo);
        }

        query += ` ORDER BY numero`;
    } else if (tipo === 'estudiante') {
        query = `
            SELECT b.fecha, b.hora, e.numero as equipo_numero, b.usuario_nombre,
                   b.tipo_usuario, c.nombre as clase_nombre, b.proposito, b.observaciones
            FROM bitacora b
            LEFT JOIN equipos e ON b.equipo_id = e.id
            LEFT JOIN clases c ON b.clase_id = c.id
            WHERE 1=1`;

        if (clase) {
            params.push(`%${clase}%`);
            query += ` AND (c.nombre ILIKE $${params.length} OR c.codigo ILIKE $${params.length})`;
        }

        query += ` ORDER BY b.fecha DESC, b.hora DESC`;
    } else {
        return res.status(400).json({ error: 'Tipo de reporte no soportado' });
    }

    try {
        const result = await pool.query(query, params);
        const registros = result.rows;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `reporte_${tipo}_${timestamp}.pdf`;
        const filepath = path.join(REPORTS_FOLDER, filename);

        const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        doc.fontSize(18).text(`Reporte de ${tipo.toUpperCase()}`, { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleString('es-MX')}`);
        if (periodo) doc.text(`Período: ${periodo}`);
        if (equipo) doc.text(`Equipo: ${equipo}`);
        if (clase) doc.text(`Clase: ${clase}`);
        doc.moveDown();

        if (registros.length === 0) {
            doc.text('No hay registros para el filtro seleccionado.');
        } else {
            registros.forEach((reg, index) => {
                doc.font('Helvetica-Bold').fontSize(10).text(`Registro ${index + 1}`);
                doc.font('Helvetica').text(`Fecha: ${reg.fecha || '-'}  Hora: ${reg.hora || '-'}`);
                doc.text(`Equipo: ${reg.equipo_numero || '-'}`);
                doc.text(`Nombre: ${reg.usuario_nombre || '-'}`);
                if (reg.clase_nombre !== undefined) {
                    doc.text(`Clase: ${reg.clase_nombre || '-'}`);
                }
                if (reg.marca !== undefined) {
                    doc.text(`Marca: ${reg.marca || '-'}  Modelo: ${reg.modelo || '-'}`);
                    doc.text(`Ubicación: ${reg.ubicacion || '-'}  Estado: ${reg.estado || '-'}`);
                }
                if (reg.tipo_usuario !== undefined) {
                    doc.text(`Tipo: ${reg.tipo_usuario === 'estudiante' ? 'Estudiante' : 'Externo'}`);
                }
                if (reg.proposito !== undefined) {
                    doc.text(`Propósito: ${reg.proposito}`);
                }
                if (reg.observaciones !== undefined) {
                    doc.text(`Observaciones: ${reg.observaciones || '-'}`);
                }
                doc.moveDown();
                if (doc.y > 720) {
                    doc.addPage();
                }
            });
        }

        doc.end();

        stream.on('finish', () => {
            res.json({ url: `/reports/${filename}`, filename });
        });

        stream.on('error', (error) => {
            console.error('Error escribiendo PDF:', error);
            res.status(500).json({ error: error.message });
        });
    } catch (error) {
        console.error('Error generando reporte PDF:', error);
        res.status(500).json({ error: 'Error generando el reporte PDF' });
    }
});

app.delete('/api/bitacora/:id', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM bitacora WHERE id = $1', [id]);
        res.json({ mensaje: 'Registro eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/clases', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clases ORDER BY grado, grupo');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clases', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { codigo, nombre, grado, grupo, maestro } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO clases (codigo, nombre, grado, grupo, maestro) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [codigo, nombre, grado, grupo, maestro]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/clases/:id', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM clases WHERE id = $1', [id]);
        res.json({ mensaje: 'Clase eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const accesosHoy = await pool.query(`SELECT COUNT(*) as total FROM bitacora WHERE fecha = CURRENT_DATE`);
        const equiposUso = await pool.query(`SELECT COUNT(*) as total FROM equipos WHERE estado = 'uso'`);
        const totalRegistros = await pool.query(`SELECT COUNT(*) as total FROM bitacora`);
        const clasesActivas = await pool.query(`SELECT COUNT(*) as total FROM clases`);

        res.json({
            accesos_hoy: parseInt(accesosHoy.rows[0].total, 10),
            equipos_uso: parseInt(equiposUso.rows[0].total, 10),
            total_registros: parseInt(totalRegistros.rows[0].total, 10),
            total_clases: parseInt(clasesActivas.rows[0].total, 10)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mantenimientos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, e.numero as equipo_numero
            FROM mantenimientos m
            JOIN equipos e ON m.equipo_id = e.id
            ORDER BY m.fecha DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.post('/api/mantenimientos', verificarToken, async (req, res) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { equipo_numero, tipo, fecha, tecnico, descripcion, observaciones, estado } = req.body;

    try {
        const equipo = await pool.query('SELECT id FROM equipos WHERE numero = $1', [equipo_numero]);

        if (equipo.rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        const result = await pool.query(
            `INSERT INTO mantenimientos (equipo_id, tipo, fecha, tecnico, descripcion, observaciones, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [equipo.rows[0].id, tipo, fecha, tecnico, descripcion, observaciones, estado]
        );

        if (estado === 'completado') {
            await pool.query('UPDATE equipos SET estado = $1 WHERE id = $2', ['disponible', equipo.rows[0].id]);
        } else if (estado === 'en_proceso') {
            await pool.query('UPDATE equipos SET estado = $1 WHERE id = $2', ['mantenimiento', equipo.rows[0].id]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Frontend esperado en: ${FRONTEND_URL}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'desarrollo'}`);
});
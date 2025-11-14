const express = require('express');
const router = express.Router();
const Mantenimiento = require('../models/Mantenimiento');
const ModeloComputadora = require('../models/ModeloComputadora');
const { ensureAuthenticated, ensureAdmin, ensureModeratorOrAdmin } = require('../middleware/auth');

// Listar mantenimientos con filtros y control por rol
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const query = {};

    // Moderadores solo ven los mantenimientos que ellos crearon
    if (req.user.rol === 'moderador') {
      query.creadoPor = req.user._id;
    }

    // filtro por rango de fechas (fechaInicio)
    if (startDate || endDate) {
      query.fechaInicio = {};
      if (startDate) query.fechaInicio.$gte = new Date(startDate);
      if (endDate) query.fechaInicio.$lte = new Date(endDate);
    }

    // filtro por tipo de equipo y tipo de mantenimiento
    if (req.query.tipo) {
      query.tipo = req.query.tipo;
    }
    if (req.query.tipoMantenimiento) {
      query.tipoMantenimiento = req.query.tipoMantenimiento;
    }

    // búsqueda por texto simple (modelo, técnico)
    if (search) {
      query.$or = [{ modelo: new RegExp(search, 'i') }, { tecnico: new RegExp(search, 'i') }];
    }

  const mantenimientos = await Mantenimiento.find(query).populate('creadoPor', 'nombre').sort({ fechaInicio: -1 });
  res.render('mantenimientos/index', { mantenimientos, query: req.query });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al cargar mantenimientos' });
  }
});

// Estadísticas mensuales por tipo de equipo
router.get('/estadisticas/mensuales', ensureAdmin, async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    // Rango de fechas para el año seleccionado
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    // Agregación: contar mantenimientos por mes y tipo
    const agg = await Mantenimiento.aggregate([
      { $match: { fechaInicio: { $gte: start, $lt: end } } },
      { $group: { _id: { month: { $month: '$fechaInicio' }, tipo: '$tipo' }, count: { $sum: 1 } } }
    ]);

    // Tipos conocidos — mantener orden estable
    const tipos = ['Desktop', 'Laptop', 'Servidor', 'All-in-One'];
    const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    // Inicializar conteos
    const dataByTipo = {};
    tipos.forEach(t => dataByTipo[t] = new Array(12).fill(0));

    // Rellenar con resultados de agregación
    agg.forEach(item => {
      const monthIndex = item._id.month - 1; // Mongo month: 1-12
      const tipo = item._id.tipo || 'Otros';
      if (!dataByTipo[tipo]) dataByTipo[tipo] = new Array(12).fill(0);
      dataByTipo[tipo][monthIndex] = item.count;
    });

    // Preparar datasets para Chart.js
    const colors = {
      'Desktop': 'rgba(54,162,235,0.7)',
      'Laptop': 'rgba(255,206,86,0.7)',
      'Servidor': 'rgba(255,99,132,0.7)',
      'All-in-One': 'rgba(75,192,192,0.7)',
      'Otros': 'rgba(153,102,255,0.7)'
    };

    const datasets = Object.keys(dataByTipo).map(tipo => ({
      label: tipo,
      data: dataByTipo[tipo],
      backgroundColor: colors[tipo] || colors['Otros']
    }));

    res.render('estadisticas/mensuales', {
      year,
      labels: JSON.stringify(labels),
      datasets: JSON.stringify(datasets)
    });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al generar estadísticas' });
  }
});

// Formulario nuevo mantenimiento
router.get('/nuevo', ensureModeratorOrAdmin, async (req, res) => {
  try {
    const modelos = await ModeloComputadora.find().sort({ nombre: 1 });
    res.render('mantenimientos/nuevo', { modelos, query: req.query });
  } catch (err) {
    console.error(err);
    res.render('mantenimientos/nuevo', { modelos: [], query: req.query });
  }
});

// Crear mantenimiento
router.post('/', ensureModeratorOrAdmin, async (req, res) => {
  try {
    // Preparar payload y asegurar que guardamos modeloCodigo
    const payload = {
      ...req.body,
      creadoPor: req.user._id
    };

    // Si el formulario incluye 'codigo' (hidden input), usarlo como modeloCodigo
    if (req.body.codigo) {
      payload.modeloCodigo = req.body.codigo;
    } else if (!payload.modeloCodigo && req.body.modelo) {
      // intentar extraer código desde el campo modelo si tiene formato "Nombre (COD)"
      const m = String(req.body.modelo).match(/\(([^)]+)\)\s*$/);
      if (m && m[1]) payload.modeloCodigo = m[1];
    }

  // Crear mantenimiento directamente en la base primaria
  await Mantenimiento.create(payload);
    
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    // Al renderizar de nuevo, devolver los modelos para no romper la plantilla
    try {
      const modelos = await ModeloComputadora.find().sort({ nombre: 1 });
      res.render('mantenimientos/nuevo', { error: 'Error al crear mantenimiento', modelos, query: req.body });
    } catch (e) {
      console.error(e);
      res.render('mantenimientos/nuevo', { error: 'Error al crear mantenimiento', modelos: [], query: req.body });
    }
  }
});

// Ver detalle
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id).populate('creadoPor', 'nombre');
    if (!mantenimiento) return res.render('error', { message: 'Mantenimiento no encontrado' });

    // Si es moderador, sólo puede ver si él lo creó
    if (req.user.rol === 'moderador' && mantenimiento.creadoPor && mantenimiento.creadoPor._id.toString() !== req.user._id.toString()) {
      return res.status(403).render('error', { message: 'Acceso denegado - No puedes ver este mantenimiento' });
    }

    res.render('mantenimientos/detalle', { mantenimiento });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al cargar mantenimiento' });
  }
});

// Formulario editar
router.get('/:id/editar', ensureModeratorOrAdmin, async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id);
    if (!mantenimiento) {
      return res.render('error', { message: 'Mantenimiento no encontrado' });
    }
    
    // Si es moderador, solo puede editar si él lo creó
    if (req.user.rol === 'moderador' && mantenimiento.creadoPor.toString() !== req.user._id.toString()) {
      return res.status(403).render('error', { message: 'Solo puedes editar tus propios mantenimientos' });
    }
    
    res.render('mantenimientos/editar', { mantenimiento });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al cargar mantenimiento' });
  }
});

// Actualizar mantenimiento
router.put('/:id', ensureModeratorOrAdmin, async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id);
    if (!mantenimiento) {
      return res.render('error', { message: 'Mantenimiento no encontrado' });
    }
    
    // Si es moderador, solo puede actualizar si él lo creó
    if (req.user.rol === 'moderador' && mantenimiento.creadoPor.toString() !== req.user._id.toString()) {
      return res.status(403).render('error', { message: 'Solo puedes editar tus propios mantenimientos' });
    }
    
    // Actualizar en la base primaria
    await Mantenimiento.updateOne({ _id: req.params.id }, req.body);
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al actualizar mantenimiento' });
  }
});

// Eliminar mantenimiento
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    await Mantenimiento.deleteOne({ _id: req.params.id });
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al eliminar mantenimiento' });
  }
});

module.exports = router;
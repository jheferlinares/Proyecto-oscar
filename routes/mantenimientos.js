const express = require('express');
const router = express.Router();
const Mantenimiento = require('../models/Mantenimiento');
const SyncModel = require('../models/SyncModel');
const ModeloComputadora = require('../models/ModeloComputadora');
const { ensureAuthenticated, ensureAdmin, ensureModeratorOrAdmin } = require('../middleware/auth');

// Listar mantenimientos
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

    // Crear mantenimiento (SyncModel ahora escribe en la DB primaria)
    await SyncModel.create(Mantenimiento, payload);
    
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
router.get('/:id/editar', ensureAdmin, async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id);
    if (!mantenimiento) {
      return res.render('error', { message: 'Mantenimiento no encontrado' });
    }
    res.render('mantenimientos/editar', { mantenimiento });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al cargar mantenimiento' });
  }
});

// Actualizar mantenimiento
router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    // Actualizar sincronizado en ambas bases
    await SyncModel.updateOne(Mantenimiento, { _id: req.params.id }, req.body);
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al actualizar mantenimiento' });
  }
});

module.exports = router;
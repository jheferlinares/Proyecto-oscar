const express = require('express');
const router = express.Router();
const Mantenimiento = require('../models/Mantenimiento');
const { ensureAuthenticated, ensureAdmin, ensureModeratorOrAdmin } = require('../middleware/auth');

// Listar mantenimientos
router.get('/', ensureModeratorOrAdmin, async (req, res) => {
  try {
    const mantenimientos = await Mantenimiento.find().populate('creadoPor', 'nombre').sort({ fecha: -1 });
    res.render('mantenimientos/index', { mantenimientos });
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al cargar mantenimientos' });
  }
});

// Formulario nuevo mantenimiento
router.get('/nuevo', ensureAdmin, (req, res) => {
  res.render('mantenimientos/nuevo');
});

// Crear mantenimiento
router.post('/', ensureAdmin, async (req, res) => {
  try {
    const nuevoMantenimiento = new Mantenimiento({
      ...req.body,
      creadoPor: req.user._id
    });
    
    await nuevoMantenimiento.save();
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    res.render('mantenimientos/nuevo', { error: 'Error al crear mantenimiento', ...req.body });
  }
});

// Ver detalle
router.get('/:id', ensureModeratorOrAdmin, async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id).populate('creadoPor', 'nombre');
    if (!mantenimiento) {
      return res.render('error', { message: 'Mantenimiento no encontrado' });
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
    await Mantenimiento.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/mantenimientos');
  } catch (error) {
    console.error(error);
    res.render('error', { message: 'Error al actualizar mantenimiento' });
  }
});

module.exports = router;
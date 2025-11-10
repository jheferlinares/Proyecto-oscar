const express = require('express');
const ModeloComputadora = require('../models/ModeloComputadora');
const Mantenimiento = require('../models/Mantenimiento');
const { ensureAuthenticated, ensureAdmin, ensureModeratorOrAdmin } = require('../middleware/auth');

module.exports = function(upload) {
  const router = express.Router();

  // Listado de modelos
  router.get('/', ensureAuthenticated, async (req, res) => {
    try {
      const modelos = await ModeloComputadora.find().sort({ fechaCreacion: -1 });
      res.render('modelos/index', { modelos });
    } catch (err) {
      console.error(err);
      res.render('error', { message: 'Error cargando modelos' });
    }
  });

  // Formulario nuevo modelo
  router.get('/nuevo', ensureModeratorOrAdmin, (req, res) => {
    // pasar 'data' vacío para evitar errores en la plantilla cuando no hay valores previos
    res.render('modelos/nuevo', { data: {} });
  });

  // Crear modelo (con subida de imagen)
  router.post('/', ensureModeratorOrAdmin, upload.single('imagen'), async (req, res) => {
    try {
      const payload = {
        nombre: req.body.nombre,
        codigo: req.body.codigo,
        creadoPor: req.user._id
      };
      if (req.file) payload.imagen = '/uploads/' + req.file.filename;

      const modelo = new ModeloComputadora(payload);
      await modelo.save();
      res.redirect('/modelos');
    } catch (err) {
      console.error(err);
      res.render('modelos/nuevo', { error: 'Error creando modelo', data: req.body });
    }
  });

  // Ver detalle de modelo y su historial de mantenimientos
  router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
      const modelo = await ModeloComputadora.findById(req.params.id);
      if (!modelo) return res.render('error', { message: 'Modelo no encontrado' });

      // Buscar mantenimientos relacionados por nombre o código (compatibilidad con datos previos)
      const mantenimientos = await Mantenimiento.find({ $or: [{ modelo: modelo.nombre }, { modelo: modelo.codigo }] }).sort({ fechaInicio: -1 }).populate('creadoPor', 'nombre');

      res.render('modelos/detalle', { modelo, mantenimientos });
    } catch (err) {
      console.error(err);
      res.render('error', { message: 'Error cargando detalle de modelo' });
    }
  });

  return router;
};

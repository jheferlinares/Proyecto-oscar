const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/mantenimientos');
  }
  // Mostrar landing page si no está autenticado
  res.render('index');
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

router.get('/ayuda', (req, res) => {
  res.render('ayuda');
});

router.get('/acerca', (req, res) => {
  res.render('acerca');
});

module.exports = router;
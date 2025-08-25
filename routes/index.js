const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/mantenimientos');
  } else {
    res.redirect('/auth/login');
  }
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

module.exports = router;
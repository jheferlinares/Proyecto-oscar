const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Página de login
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Procesar login
router.post('/login', passport.authenticate('local', {
  successRedirect: '/mantenimientos',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

// Página de registro
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Procesar registro
router.post('/register', async (req, res) => {
  const { nombre, email, password, password2 } = req.body;
  let errors = [];

  if (!nombre || !email || !password || !password2) {
    errors.push({ msg: 'Todos los campos son obligatorios' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    res.render('auth/register', { errors, nombre, email });
  } else {
    try {
      const existingUser = await User.findOne({ email: email });
      
      if (existingUser) {
        errors.push({ msg: 'El email ya está registrado' });
        res.render('auth/register', { errors, nombre, email });
      } else {
        const newUser = new User({
          nombre,
          email,
          password
        });

        await newUser.save();
        res.render('auth/pending', { nombre });
      }
    } catch (error) {
      console.error(error);
      res.render('auth/register', { errors: [{ msg: 'Error del servidor' }], nombre, email });
    }
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
});

module.exports = router;
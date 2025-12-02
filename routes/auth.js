const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

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
  const { nombre, email, posicion, password, password2 } = req.body;
  let errors = [];

  if (!nombre || !email || !posicion || !password || !password2) {
    errors.push({ msg: 'Todos los campos son obligatorios' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  if (password.length < 8) {
    errors.push({ msg: 'La contraseña debe tener al menos 8 caracteres' });
  }

  // Validar caracteres especiales
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharRegex.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)' });
  }

  // Validar mayúscula y minúscula
  if (!/[A-Z]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos una letra mayúscula' });
  }

  if (!/[a-z]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos una letra minúscula' });
  }

  // Validar número
  if (!/[0-9]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos un número' });
  }

  if (errors.length > 0) {
    res.render('auth/register', { errors, nombre, email, posicion });
  } else {
    try {
      const existingUser = await User.findOne({ email: email });
      
      if (existingUser) {
        errors.push({ msg: 'El email ya está registrado' });
        res.render('auth/register', { errors, nombre, email, posicion });
      } else {
        // Crear usuario en la base de datos primaria
        await User.create({
          nombre,
          email,
          posicion,
          password
        });
        res.render('auth/pending', { nombre });
      }
    } catch (error) {
      console.error(error);
      res.render('auth/register', { errors: [{ msg: 'Error del servidor' }], nombre, email, posicion });
    }
  }
});

// Página de recuperación de contraseña
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password');
});

// Procesar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.render('auth/forgot-password', { 
        error: 'No existe una cuenta con ese email' 
      });
    }
    
    // Generar token temporal (en producción usar crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    
    // Enviar email de recuperación
    try {
      await sendPasswordResetEmail(email, resetToken);
      res.render('auth/forgot-password', { 
        success: 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.' 
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // Fallback: mostrar token en consola si falla el email
      console.log(`Token de recuperación para ${email}: ${resetToken}`);
      res.render('auth/forgot-password', { 
        success: 'Se ha generado un enlace de recuperación (revisa la consola del servidor)' 
      });
    }
  } catch (error) {
    console.error(error);
    res.render('auth/forgot-password', { 
      error: 'Error del servidor' 
    });
  }
});

// Página de reseteo de contraseña
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.render('auth/login', { 
        messages: { error: 'Token inválido o expirado' } 
      });
    }
    
    res.render('auth/reset-password', { token: req.params.token });
  } catch (error) {
    console.error(error);
    res.render('auth/login', { 
      messages: { error: 'Error del servidor' } 
    });
  }
});

// Procesar nuevo password
router.post('/reset-password/:token', async (req, res) => {
  const { password, password2 } = req.body;
  const token = req.params.token;
  let errors = [];
  
  if (!password || !password2) {
    errors.push({ msg: 'Todos los campos son obligatorios' });
  }
  
  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }
  
  if (password.length < 8) {
    errors.push({ msg: 'La contraseña debe tener al menos 8 caracteres' });
  }
  
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharRegex.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos un carácter especial' });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos una letra mayúscula' });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos una letra minúscula' });
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push({ msg: 'La contraseña debe contener al menos un número' });
  }
  
  if (errors.length > 0) {
    return res.render('auth/reset-password', { errors, token });
  }
  
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.render('auth/login', { 
        messages: { error: 'Token inválido o expirado' } 
      });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.render('auth/login', { 
      messages: { success: 'Contraseña actualizada correctamente' } 
    });
  } catch (error) {
    console.error(error);
    res.render('auth/reset-password', { 
      errors: [{ msg: 'Error del servidor' }], 
      token 
    });
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
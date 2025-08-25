module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/auth/login');
  },

  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.rol === 'administrador') {
      return next();
    }
    res.status(403).render('error', { message: 'Acceso denegado - Se requiere rol de administrador' });
  },

  ensureModeratorOrAdmin: (req, res, next) => {
    if (req.isAuthenticated() && (req.user.rol === 'moderador' || req.user.rol === 'administrador')) {
      return next();
    }
    res.status(403).render('error', { message: 'Acceso denegado - Se requiere rol de moderador o administrador' });
  }
};
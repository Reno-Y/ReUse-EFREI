function requireLogin(req, res, next) {
  if (!req.session.user) {
    res.flash('error', 'Connectez-vous pour accéder à cette page.');
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Cette page est réservée aux administrateurs.' });
  }
  next();
}

function requireOwnerOrAdmin(resourceUserId) {
  return (req, res, next) => {
    if (!req.session.user) {
      res.flash('error', 'Connectez-vous pour accéder à cette page.');
      return res.redirect('/login');
    }
    const user = req.session.user;
    if (user.role === 'admin' || user.id === resourceUserId) {
      return next();
    }
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous n\'êtes pas autorisé à effectuer cette action.' });
  };
}

module.exports = { requireLogin, requireAdmin, requireOwnerOrAdmin };

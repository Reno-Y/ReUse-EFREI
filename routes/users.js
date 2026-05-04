const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const PER_PAGE = 20;
const SALT_ROUNDS = 12;

router.get('/', requireAdmin, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PER_PAGE;

  const total = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  const users = db.prepare('SELECT id, first_name, last_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(PER_PAGE, offset);
  const totalPages = Math.ceil(total / PER_PAGE);

  res.render('users/list', { title: 'Gestion des utilisateurs', users, currentPage: page, totalPages });
});

router.get('/:id/edit', requireLogin, (req, res) => {
  const target = db.prepare('SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier ce profil.' });
  }

  res.render('users/edit', { title: 'Modifier le profil', target, old: target });
});

router.post('/:id/edit', requireLogin, async (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier ce profil.' });
  }

  const { first_name, last_name, email, password, role, is_active } = req.body;
  const errors = [];

  if (!first_name || first_name.trim().length < 2) errors.push('Le prénom est requis (min. 2 caractères).');
  if (!last_name || last_name.trim().length < 2) errors.push('Le nom est requis (min. 2 caractères).');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide.');
  if (password && password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères.');

  const duplicate = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), target.id);
  if (duplicate) errors.push('Cet email est déjà utilisé.');

  if (errors.length) {
    const editTarget = { ...target, first_name, last_name, email };
    return res.render('users/edit', { title: 'Modifier le profil', target: editTarget, errors, old: req.body });
  }

  let password_hash = target.password_hash;
  if (password) password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const newRole = user.role === 'admin' ? (role || target.role) : target.role;
  const newActive = user.role === 'admin' ? (is_active === '1' ? 1 : 0) : target.is_active;

  db.prepare(`
    UPDATE users SET first_name=?, last_name=?, email=?, password_hash=?, role=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(first_name.trim(), last_name.trim(), email.toLowerCase(), password_hash, newRole, newActive, target.id);

  if (user.id === target.id) {
    req.session.user = { ...req.session.user, first_name: first_name.trim(), last_name: last_name.trim(), email: email.toLowerCase() };
  }

  res.flash('success', 'Profil mis à jour.');
  res.redirect(user.role === 'admin' ? '/users' : '/dashboard');
});

router.get('/:id/delete', requireLogin, (req, res) => {
  const target = db.prepare('SELECT id, first_name, last_name, email FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer ce compte.' });
  }

  res.render('users/delete', { title: 'Supprimer le compte', target });
});

router.post('/:id/delete', requireLogin, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer ce compte.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);

  if (user.id === target.id) {
    return req.session.destroy(() => res.redirect('/'));
  }

  res.flash('success', 'Compte supprimé.');
  res.redirect('/users');
});

module.exports = router;

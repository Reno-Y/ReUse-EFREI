const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const PER_PAGE = 20;
const SALT_ROUNDS = 12;

router.get('/', requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PER_PAGE;

  const countRow = await db.get('SELECT COUNT(*) as n FROM users');
  const total = parseInt(countRow.n);
  const users = await db.all(
    'SELECT id, first_name, last_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [PER_PAGE, offset]
  );
  const totalPages = Math.ceil(total / PER_PAGE);

  res.render('users/list', { title: 'Gestion des utilisateurs', users, currentPage: page, totalPages });
});

router.get('/:id/edit', requireLogin, async (req, res) => {
  const target = await db.get('SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1', [req.params.id]);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier ce profil.' });
  }

  res.render('users/edit', { title: 'Modifier le profil', target, old: target });
});

router.post('/:id/edit', requireLogin, async (req, res) => {
  const target = await db.get('SELECT * FROM users WHERE id = $1', [req.params.id]);
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

  const duplicate = await db.get('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), target.id]);
  if (duplicate) errors.push('Cet email est déjà utilisé.');

  if (errors.length) {
    const editTarget = { ...target, first_name, last_name, email };
    return res.render('users/edit', { title: 'Modifier le profil', target: editTarget, errors, old: req.body });
  }

  let password_hash = target.password_hash;
  if (password) password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const newRole = user.role === 'admin' ? (role || target.role) : target.role;
  const newActive = user.role === 'admin' ? (is_active === '1' ? 1 : 0) : target.is_active;

  await db.run(
    `UPDATE users SET first_name=$1, last_name=$2, email=$3, password_hash=$4, role=$5, is_active=$6,
     updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
    [first_name.trim(), last_name.trim(), email.toLowerCase(), password_hash, newRole, newActive, target.id]
  );

  if (user.id === target.id) {
    req.session.user = { ...req.session.user, first_name: first_name.trim(), last_name: last_name.trim(), email: email.toLowerCase() };
  }

  res.flash('success', 'Profil mis à jour.');
  res.redirect(user.role === 'admin' ? '/users' : '/dashboard');
});

router.get('/:id/delete', requireLogin, async (req, res) => {
  const target = await db.get('SELECT id, first_name, last_name, email FROM users WHERE id = $1', [req.params.id]);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer ce compte.' });
  }

  res.render('users/delete', { title: 'Supprimer le compte', target });
});

router.post('/:id/delete', requireLogin, async (req, res) => {
  const target = await db.get('SELECT id FROM users WHERE id = $1', [req.params.id]);
  if (!target) return res.status(404).render('error', { title: 'Introuvable', message: 'Utilisateur introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && user.id !== target.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer ce compte.' });
  }

  await db.run('DELETE FROM users WHERE id = $1', [target.id]);

  if (user.id === target.id) {
    return req.session.destroy(() => res.redirect('/'));
  }

  res.flash('success', 'Compte supprimé.');
  res.redirect('/users');
});

module.exports = router;

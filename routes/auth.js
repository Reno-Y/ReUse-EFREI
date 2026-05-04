const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');

const SALT_ROUNDS = 12;

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Inscription' });
});

router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, password_confirm } = req.body;
  const errors = [];

  if (!first_name || first_name.trim().length < 2) errors.push('Le prénom est requis (min. 2 caractères).');
  if (!last_name || last_name.trim().length < 2) errors.push('Le nom est requis (min. 2 caractères).');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide.');
  if (!password || password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères.');
  if (password !== password_confirm) errors.push('Les mots de passe ne correspondent pas.');

  if (errors.length) {
    return res.render('register', { title: 'Inscription', errors, old: { first_name, last_name, email } });
  }

  const existing = await db.get('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing) {
    return res.render('register', { title: 'Inscription', errors: ['Cet email est déjà utilisé.'], old: { first_name, last_name, email } });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db.run(
    'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
    [first_name.trim(), last_name.trim(), email.toLowerCase(), password_hash]
  );

  const user = await db.get('SELECT id, first_name, last_name, email, role FROM users WHERE id = $1', [result.id]);
  req.session.user = user;
  res.flash('success', `Bienvenue ${user.first_name} ! Votre compte a été créé.`);
  res.redirect('/dashboard');
});

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Connexion' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { title: 'Connexion', errors: ['Email et mot de passe requis.'], old: { email } });
  }

  const user = await db.get('SELECT * FROM users WHERE email = $1 AND is_active = 1', [email.toLowerCase()]);
  if (!user) {
    return res.render('login', { title: 'Connexion', errors: ['Identifiants incorrects.'], old: { email } });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.render('login', { title: 'Connexion', errors: ['Identifiants incorrects.'], old: { email } });
  }

  req.session.user = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role };
  res.flash('success', `Bon retour, ${user.first_name} !`);
  res.redirect('/dashboard');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

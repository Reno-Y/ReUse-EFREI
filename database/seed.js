require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

const SALT_ROUNDS = 12;

async function seed() {
  const existing = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (existing > 0) {
    console.log('Base déjà peuplée — seed ignoré.');
    return;
  }

  const adminHash = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const userHash = await bcrypt.hash('User1234!', SALT_ROUNDS);

  const insertUser = db.prepare(
    'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  );

  const admin = insertUser.run('Admin', 'EFREI', 'admin@efrei.net', adminHash, 'admin');
  const u1 = insertUser.run('Renaud', 'Dupont', 'renaud@efrei.net', userHash, 'user');
  const u2 = insertUser.run('Camille', 'Martin', 'camille@efrei.net', userHash, 'user');

  const insertListing = db.prepare(`
    INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertListing.run('Câble HDMI 2m', 'Câble HDMI en bon état, plus besoin après avoir changé de setup.', 'Électronique', 'don', null, 'Campus EFREI', u1.lastInsertRowid, 'active');
  insertListing.run('Manuel Java 2e édition', 'Livre de cours Java, légèrement annoté mais complet.', 'Livres', 'vente', 5, 'Campus EFREI', u1.lastInsertRowid, 'active');
  insertListing.run('Lampe de bureau', 'Lampe LED orientable, fonctionne parfaitement.', 'Mobilier', 'don', null, 'Résidence étudiante', u2.lastInsertRowid, 'active');
  insertListing.run('Calculatrice Casio fx-92+', 'Calculatrice lycée, j\'en ai une autre.', 'Informatique', 'pret', null, 'Campus EFREI', u2.lastInsertRowid, 'active');
  insertListing.run('Cherche clavier mécanique', 'Je cherche un clavier mécanique AZERTY pas trop cher.', 'Informatique', 'recherche', null, 'Campus EFREI', u1.lastInsertRowid, 'active');
  insertListing.run('Chaise de bureau', 'Chaise réglable, retapissée. À récupérer sur place.', 'Mobilier', 'vente', 20, 'Paris 15e', u2.lastInsertRowid, 'active');

  console.log('Seed OK !');
  console.log('  Admin : admin@efrei.net / Admin1234!');
  console.log('  User  : renaud@efrei.net / User1234!');
}

seed().catch(console.error);

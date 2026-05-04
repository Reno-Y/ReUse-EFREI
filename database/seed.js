require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

const SALT_ROUNDS = 12;

async function seed() {
  await db.init();

  const existing = await db.get('SELECT COUNT(*) as n FROM users');
  if (parseInt(existing.n) > 0) {
    console.log('Base déjà peuplée — seed ignoré.');
    return;
  }

  const adminHash = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const userHash = await bcrypt.hash('User1234!', SALT_ROUNDS);

  const admin = await db.run(
    'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['Admin', 'EFREI', 'admin@efrei.net', adminHash, 'admin']
  );
  const u1 = await db.run(
    'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['Renaud', 'Dupont', 'renaud@efrei.net', userHash, 'user']
  );
  const u2 = await db.run(
    'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['Camille', 'Martin', 'camille@efrei.net', userHash, 'user']
  );

  const insertListing = (title, description, category, listing_type, price, location, owner_id) =>
    db.run(
      `INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active')`,
      [title, description, category, listing_type, price, location, owner_id]
    );

  await insertListing('Câble HDMI 2m', "Câble HDMI en bon état, plus besoin après avoir changé de setup.", 'Électronique', 'don', null, 'Campus EFREI', u1.id);
  await insertListing('Manuel Java 2e édition', "Livre de cours Java, légèrement annoté mais complet.", 'Livres', 'vente', 5, 'Campus EFREI', u1.id);
  await insertListing('Lampe de bureau', "Lampe LED orientable, fonctionne parfaitement.", 'Mobilier', 'don', null, 'Résidence étudiante', u2.id);
  await insertListing('Calculatrice Casio fx-92+', "Calculatrice lycée, j'en ai une autre.", 'Informatique', 'pret', null, 'Campus EFREI', u2.id);
  await insertListing('Cherche clavier mécanique', "Je cherche un clavier mécanique AZERTY pas trop cher.", 'Informatique', 'recherche', null, 'Campus EFREI', u1.id);
  await insertListing('Chaise de bureau', "Chaise réglable, retapissée. À récupérer sur place.", 'Mobilier', 'vente', 20, 'Paris 15e', u2.id);

  console.log('Seed OK !');
  console.log('  Admin : admin@efrei.net / Admin1234!');
  console.log('  User  : renaud@efrei.net / User1234!');
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

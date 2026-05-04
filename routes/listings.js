const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const CATEGORIES = ['Informatique', 'Livres', 'Mobilier', 'Électronique', 'Vêtements', 'Sport', 'Cuisine', 'Autre'];
const TYPES = ['don', 'pret', 'vente', 'recherche'];
const STATUSES = ['active', 'reservee', 'terminee'];
const PER_PAGE = 20;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées.'));
  },
});

async function saveImage(buffer) {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const dest = path.join(__dirname, '..', 'public', 'uploads', filename);
  await sharp(buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 75 }).toFile(dest);
  return '/uploads/' + filename;
}

router.get('/', (req, res) => {
  const { category, listing_type, status, page } = req.query;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const conditions = ['l.status != ?'];
  const params = ['terminee'];

  if (category) { conditions.push('l.category = ?'); params.push(category); }
  if (listing_type && TYPES.includes(listing_type)) { conditions.push('l.listing_type = ?'); params.push(listing_type); }
  if (status && STATUSES.includes(status)) { conditions.splice(0, 1); conditions.unshift('l.status = ?'); params.splice(0, 1, status); }

  const where = 'WHERE ' + conditions.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) as n FROM listings l ${where}`).get(...params).n;
  const listings = db.prepare(`
    SELECT l.id, l.title, l.category, l.listing_type, l.location, l.status, l.image_path, l.price,
           u.first_name, u.last_name
    FROM listings l JOIN users u ON l.owner_id = u.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, PER_PAGE, offset);

  const totalPages = Math.ceil(total / PER_PAGE);
  const filters = { category, listing_type, status };

  res.render('listings/list', { title: 'Annonces', listings, categories: CATEGORIES, types: TYPES, statuses: STATUSES, filters, currentPage, totalPages });
});

router.get('/create', requireLogin, (req, res) => {
  res.render('listings/create', { title: 'Nouvelle annonce', categories: CATEGORIES, types: TYPES, old: {} });
});

router.post('/create', requireLogin, upload.single('image'), async (req, res) => {
  const { title, description, category, listing_type, price, location } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Le titre est requis (min. 3 caractères).');
  if (!description || description.trim().length < 10) errors.push('La description est requise (min. 10 caractères).');
  if (!category || !CATEGORIES.includes(category)) errors.push('Catégorie invalide.');
  if (!listing_type || !TYPES.includes(listing_type)) errors.push('Type invalide.');
  if (!location || location.trim().length < 2) errors.push('Le lieu est requis.');
  if (listing_type === 'vente' && (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
    errors.push('Un prix valide est requis pour une vente.');
  }

  if (errors.length) {
    return res.render('listings/create', { title: 'Nouvelle annonce', errors, categories: CATEGORIES, types: TYPES, old: req.body });
  }

  let image_path = null;
  if (req.file) {
    try { image_path = await saveImage(req.file.buffer); }
    catch { errors.push('Erreur lors du traitement de l\'image.'); }
  }

  const result = db.prepare(`
    INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), description.trim(), category, listing_type, listing_type === 'vente' ? parseFloat(price) : null, location.trim(), req.session.user.id, image_path);

  res.flash('success', 'Annonce publiée avec succès !');
  res.redirect('/dashboard');
});

router.get('/:id', (req, res) => {
  const listing = db.prepare(`
    SELECT l.*, u.first_name, u.last_name, u.email
    FROM listings l JOIN users u ON l.owner_id = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Cette annonce n\'existe pas.' });
  res.render('listings/detail', { title: listing.title, listing });
});

router.get('/:id/edit', requireLogin, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier cette annonce.' });
  }

  res.render('listings/edit', { title: 'Modifier l\'annonce', listing, categories: CATEGORIES, types: TYPES, statuses: STATUSES, old: listing });
});

router.post('/:id/edit', requireLogin, upload.single('image'), async (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier cette annonce.' });
  }

  const { title, description, category, listing_type, price, location, status } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Le titre est requis (min. 3 caractères).');
  if (!description || description.trim().length < 10) errors.push('La description est requise (min. 10 caractères).');
  if (!category || !CATEGORIES.includes(category)) errors.push('Catégorie invalide.');
  if (!listing_type || !TYPES.includes(listing_type)) errors.push('Type invalide.');
  if (!location || location.trim().length < 2) errors.push('Le lieu est requis.');
  if (!status || !STATUSES.includes(status)) errors.push('Statut invalide.');

  if (errors.length) {
    return res.render('listings/edit', { title: 'Modifier l\'annonce', errors, listing, categories: CATEGORIES, types: TYPES, statuses: STATUSES, old: req.body });
  }

  let image_path = listing.image_path;
  if (req.file) {
    try {
      image_path = await saveImage(req.file.buffer);
      if (listing.image_path) {
        const old = path.join(__dirname, '..', 'public', listing.image_path);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    } catch { errors.push('Erreur lors du traitement de l\'image.'); }
  }

  db.prepare(`
    UPDATE listings SET title=?, description=?, category=?, listing_type=?, price=?, location=?, status=?, image_path=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(title.trim(), description.trim(), category, listing_type, listing_type === 'vente' ? parseFloat(price) : null, location.trim(), status, image_path, listing.id);

  res.flash('success', 'Annonce mise à jour.');
  res.redirect('/dashboard');
});

router.get('/:id/delete', requireLogin, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer cette annonce.' });
  }

  res.render('listings/delete', { title: 'Supprimer l\'annonce', listing });
});

router.post('/:id/delete', requireLogin, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer cette annonce.' });
  }

  if (listing.image_path) {
    const imgPath = path.join(__dirname, '..', 'public', listing.image_path);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.prepare('DELETE FROM listings WHERE id = ?').run(listing.id);
  res.flash('success', 'Annonce supprimée.');
  const back = user.role === 'admin' ? '/users/listings' : '/dashboard';
  res.redirect(back);
});

module.exports = router;

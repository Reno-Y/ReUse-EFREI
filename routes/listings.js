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

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

async function saveImage(buffer) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const dest = path.join(UPLOADS_DIR, filename);
  await sharp(buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 75 }).toFile(dest);
  return '/uploads/' + filename;
}

router.get('/', async (req, res) => {
  const { category, listing_type, status, page } = req.query;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (status && STATUSES.includes(status)) {
    conditions.push(`l.status = $${idx++}`);
    params.push(status);
  } else {
    conditions.push(`l.status != $${idx++}`);
    params.push('terminee');
  }

  if (category) { conditions.push(`l.category = $${idx++}`); params.push(category); }
  if (listing_type && TYPES.includes(listing_type)) { conditions.push(`l.listing_type = $${idx++}`); params.push(listing_type); }

  const where = 'WHERE ' + conditions.join(' AND ');

  const countRow = await db.get(`SELECT COUNT(*) as n FROM listings l ${where}`, params);
  const total = parseInt(countRow.n);

  const listings = await db.all(
      `SELECT l.id, l.title, l.category, l.listing_type, l.location, l.status, l.image_path, l.price,
              u.first_name, u.last_name
       FROM listings l JOIN users u ON l.owner_id = u.id
         ${where} ORDER BY l.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, PER_PAGE, offset]
  );

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
    try {
      image_path = await saveImage(req.file.buffer);
    } catch (e) {
      console.error('saveImage error:', e);
      return res.render('listings/create', {
        title: 'Nouvelle annonce',
        errors: ["Erreur lors du traitement de l'image. Vérifiez le format du fichier."],
        categories: CATEGORIES, types: TYPES, old: req.body,
      });
    }
  }

  await db.run(
      `INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, image_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [title.trim(), description.trim(), category, listing_type,
        listing_type === 'vente' ? parseFloat(price) : null,
        location.trim(), req.session.user.id, image_path]
  );

  res.flash('success', 'Annonce publiée avec succès !');
  res.redirect('/dashboard');
});

router.get('/:id', async (req, res) => {
  const listing = await db.get(
      `SELECT l.*, u.first_name, u.last_name, u.email
       FROM listings l JOIN users u ON l.owner_id = u.id
       WHERE l.id = $1`,
      [req.params.id]
  );
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: "Cette annonce n'existe pas." });
  res.render('listings/detail', { title: listing.title, listing });
});

router.get('/:id/edit', requireLogin, async (req, res) => {
  const listing = await db.get('SELECT * FROM listings WHERE id = $1', [req.params.id]);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas modifier cette annonce.' });
  }

  res.render('listings/edit', { title: "Modifier l'annonce", listing, categories: CATEGORIES, types: TYPES, statuses: STATUSES, old: listing });
});

router.post('/:id/edit', requireLogin, upload.single('image'), async (req, res) => {
  const listing = await db.get('SELECT * FROM listings WHERE id = $1', [req.params.id]);
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
    return res.render('listings/edit', { title: "Modifier l'annonce", errors, listing, categories: CATEGORIES, types: TYPES, statuses: STATUSES, old: req.body });
  }

  let image_path = listing.image_path;
  if (req.file) {
    try {
      image_path = await saveImage(req.file.buffer);
      if (listing.image_path) {
        const old = path.join(__dirname, '..', 'public', listing.image_path);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    } catch { errors.push("Erreur lors du traitement de l'image."); }
  }

  await db.run(
      `UPDATE listings SET title=$1, description=$2, category=$3, listing_type=$4, price=$5,
                           location=$6, status=$7, image_path=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9`,
      [title.trim(), description.trim(), category, listing_type,
        listing_type === 'vente' ? parseFloat(price) : null,
        location.trim(), status, image_path, listing.id]
  );

  res.flash('success', 'Annonce mise à jour.');
  res.redirect('/dashboard');
});

router.get('/:id/delete', requireLogin, async (req, res) => {
  const listing = await db.get('SELECT * FROM listings WHERE id = $1', [req.params.id]);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer cette annonce.' });
  }

  res.render('listings/delete', { title: "Supprimer l'annonce", listing });
});

router.post('/:id/delete', requireLogin, async (req, res) => {
  const listing = await db.get('SELECT * FROM listings WHERE id = $1', [req.params.id]);
  if (!listing) return res.status(404).render('error', { title: 'Introuvable', message: 'Annonce introuvable.' });

  const user = req.session.user;
  if (user.role !== 'admin' && listing.owner_id !== user.id) {
    return res.status(403).render('error', { title: 'Accès refusé', message: 'Vous ne pouvez pas supprimer cette annonce.' });
  }

  if (listing.image_path) {
    const imgPath = path.join(__dirname, '..', 'public', listing.image_path);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await db.run('DELETE FROM listings WHERE id = $1', [listing.id]);
  res.flash('success', 'Annonce supprimée.');
  res.redirect(user.role === 'admin' ? '/users' : '/dashboard');
});

module.exports = router;
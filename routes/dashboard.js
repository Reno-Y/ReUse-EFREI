const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, (req, res) => {
  const userId = req.session.user.id;

  const listings = db.prepare(`
    SELECT id, title, listing_type, status, created_at
    FROM listings
    WHERE owner_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  const counts = {
    active: listings.filter(l => l.status === 'active').length,
    reservee: listings.filter(l => l.status === 'reservee').length,
    terminee: listings.filter(l => l.status === 'terminee').length,
  };

  res.render('dashboard', { title: 'Mon tableau de bord', listings, counts });
});

module.exports = router;

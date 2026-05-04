const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  const listings = await db.all(
    `SELECT id, title, listing_type, status, created_at
     FROM listings WHERE owner_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const counts = {
    active: listings.filter(l => l.status === 'active').length,
    reservee: listings.filter(l => l.status === 'reservee').length,
    terminee: listings.filter(l => l.status === 'terminee').length,
  };

  res.render('dashboard', { title: 'Mon tableau de bord', listings, counts });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', async (req, res) => {
  const listings = await db.all(`
    SELECT l.id, l.title, l.category, l.listing_type, l.location, l.status, l.image_path,
           u.first_name, u.last_name
    FROM listings l
    JOIN users u ON l.owner_id = u.id
    WHERE l.status = 'active'
    ORDER BY l.created_at DESC
    LIMIT 6
  `);

  res.render('home', { title: 'Accueil', listings });
});

module.exports = router;

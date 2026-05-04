require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const flashMiddleware = require('./middleware/flash');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'),
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(flashMiddleware);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/listings', require('./routes/listings'));
app.use('/users', require('./routes/users'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page introuvable', message: 'La page demandée n\'existe pas.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Erreur serveur', message: 'Une erreur interne est survenue.' });
});

const db = require('./database/db');
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ReUse EFREI — http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erreur connexion base de données :', err.message);
    process.exit(1);
  });

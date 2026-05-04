-- Seed ReUse EFREI — PostgreSQL
-- À exécuter après schema.sql
-- Mots de passe : utiliser seed.js pour des hashs bcrypt corrects

INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
  ('Admin',   'EFREI',   'admin@efrei.net',   '$2b$12$placeholder_remplacez_par_vrai_hash', 'admin'),
  ('Renaud',  'Dupont',  'renaud@efrei.net',  '$2b$12$placeholder_remplacez_par_vrai_hash', 'user'),
  ('Camille', 'Martin',  'camille@efrei.net', '$2b$12$placeholder_remplacez_par_vrai_hash', 'user');

INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, status) VALUES
  ('Câble HDMI 2m',            'Câble HDMI en bon état.',                         'Électronique', 'don',       NULL, 'Campus EFREI',        2, 'active'),
  ('Manuel Java 2e édition',   'Livre de cours Java, légèrement annoté.',          'Livres',       'vente',     5,    'Campus EFREI',        2, 'active'),
  ('Lampe de bureau',          'Lampe LED orientable, fonctionne parfaitement.',   'Mobilier',     'don',       NULL, 'Résidence étudiante', 3, 'active'),
  ('Calculatrice Casio fx-92+','Calculatrice lycée, j''en ai une autre.',          'Informatique', 'pret',      NULL, 'Campus EFREI',        3, 'active'),
  ('Cherche clavier mécanique','Clavier mécanique AZERTY, pas trop cher.',         'Informatique', 'recherche', NULL, 'Campus EFREI',        2, 'active'),
  ('Chaise de bureau',         'Chaise réglable, retapissée.',                     'Mobilier',     'vente',     20,   'Paris 15e',           3, 'active');

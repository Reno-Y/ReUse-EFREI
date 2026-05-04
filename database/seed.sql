-- Seed ReUse EFREI — données de démo
-- Mots de passe : Admin1234! et User1234! (hashés bcrypt)

INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
  ('Admin',   'EFREI',   'admin@efrei.net',   '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Renaud',  'Dupont',  'renaud@efrei.net',  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
  ('Camille', 'Martin',  'camille@efrei.net', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

INSERT INTO listings (title, description, category, listing_type, price, location, owner_id, status) VALUES
  ('Câble HDMI 2m',           'Câble HDMI en bon état, plus besoin après avoir changé de setup.',   'Électronique', 'don',       NULL, 'Campus EFREI',       2, 'active'),
  ('Manuel Java 2e édition',  'Livre de cours Java, légèrement annoté mais complet.',                'Livres',       'vente',     5,    'Campus EFREI',       2, 'active'),
  ('Lampe de bureau',         'Lampe LED orientable, fonctionne parfaitement.',                      'Mobilier',     'don',       NULL, 'Résidence étudiante',3, 'active'),
  ('Calculatrice Casio fx-92+','Calculatrice lycée, j''en ai une autre.',                            'Informatique', 'pret',      NULL, 'Campus EFREI',       3, 'active'),
  ('Cherche clavier mécanique','Je cherche un clavier mécanique AZERTY pas trop cher.',             'Informatique', 'recherche', NULL, 'Campus EFREI',       2, 'active'),
  ('Chaise de bureau',        'Chaise réglable, retapissée. À récupérer sur place.',                 'Mobilier',     'vente',     20,   'Paris 15e',          3, 'active');

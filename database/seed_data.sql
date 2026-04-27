-- Soul Surf Mobile - Seed Data SQL
-- Populando o banco de dados com dados iniciais para desenvolvimento

-- 1. Usuários
INSERT INTO users (username, email, password, created_at) VALUES
('gabriel_surf', 'gabriel@soulsurf.com', '$2a$10$x.F7eZ8fJ7vB1g5eF7vB1u', CURRENT_TIMESTAMP),
('marina_waves', 'marina@soulsurf.com', '$2a$10$x.F7eZ8fJ7vB1g5eF7vB1u', CURRENT_TIMESTAMP),
('soul_admin', 'admin@soulsurf.com', '$2a$10$x.F7eZ8fJ7vB1g5eF7vB1u', CURRENT_TIMESTAMP);

-- 2. Praias (Beaches)
INSERT INTO beaches (nome, latitude, longitude, localizacao, descricao, caminho_foto) VALUES
('Praia do Futuro', -3.7345, -38.4712, 'Fortaleza, CE', 'Principal pico de surf em Fortaleza, com várias barracas e boas ondas o ano todo.', 'beaches/pfuturo.jpg'),
('Icaraí', -3.6821, -38.6534, 'Caucaia, CE', 'Ondas consistentes e vento forte, excelente para surf e kitesurf.', 'beaches/icarai.jpg'),
('Jericoacoara', -2.7954, -40.5132, 'Jijoca de Jericoacoara, CE', 'Paraíso mundialmente conhecido, ótimas ondas para iniciantes e longboard.', 'beaches/jeri.jpg'),
('Taíba', -3.5087, -38.8892, 'São Gonçalo do Amarante, CE', 'Famosa pelas ondas perfeitas e o canal que proporciona surf de alta qualidade.', 'beaches/taiba.jpg');

-- 3. Pontos de Interesse (POIs)
INSERT INTO pois (nome, categoria, latitude, longitude, descricao, beach_id, telefone) VALUES
('Escola de Surf do Titanzinho', 'SURF_SCHOOL', -3.7156, -38.4754, 'Aulas para todas as idades com instrutores certificados.', 1, '85999999999'),
('Surf Shop Ceará', 'SURF_SHOP', -3.7350, -38.4720, 'Venda de pranchas, roupas e acessórios de surf.', 1, '8533333333'),
('Oficina da Prancha', 'BOARD_REPAIR', -3.6830, -38.6540, 'Consertos rápidos e profissionais em fibra e epóxi.', 2, '85888888888'),
('Pousada do Surfista', 'TOURIST_SPOT', -2.7960, -40.5140, 'Hospedagem temática com vista para o mar.', 3, NULL);

-- 4. Posts (Feed)
INSERT INTO posts (descricao, publico, beach_id, user_id, foto, created_at) VALUES
('Altas ondas hoje na Praia do Futuro! O vento parou e o mar abriu.', true, 1, 1, 'posts/post1.jpg', CURRENT_TIMESTAMP),
('Treino de hoje rendeu muito na Taíba.', true, 4, 2, 'posts/post2.jpg', CURRENT_TIMESTAMP),
('Alguém sabe como está o mar no Icaraí?', true, 2, 1, NULL, CURRENT_TIMESTAMP);

-- 5. Comentários
INSERT INTO comments (post_id, user_id, texto, created_at) VALUES
(1, 2, 'Estou chegando aí em 20 minutos!', CURRENT_TIMESTAMP),
(1, 3, 'Show! Aproveita o drop.', CURRENT_TIMESTAMP),
(3, 1, 'Fui lá cedo e estava mexido, mas agora deve ter melhorado.', CURRENT_TIMESTAMP);

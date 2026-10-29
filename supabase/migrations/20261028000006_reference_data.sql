-- =============================================================================
-- Reference data shipped to every environment: built-in exercise library and
-- program catalog. Generated from the app mocks (apps/mobile/src/features/workouts/model).
-- =============================================================================

-- Built-in exercise library (owner_id is null).
insert into public.exercises (slug, name, muscle_group, secondary_groups, equipment, kind, default_kg, default_reps, default_rest_seconds, instructions) values
  ('supino-reto-com-barra', 'Supino reto com barra', 'Peito', '{}', 'Barra', 'load_reps', 60, 8, 120, 'Escápulas retraídas e pés firmes no chão. Desça de forma controlada e suba sem travar os cotovelos.'),
  ('supino-inclinado', 'Supino inclinado', 'Peito', '{}', 'Halteres', 'load_reps', 22, 10, 90, 'Escápulas retraídas e pés firmes no chão. Desça de forma controlada e suba sem travar os cotovelos.'),
  ('crucifixo-na-maquina', 'Crucifixo na máquina', 'Peito', '{}', 'Máquina', 'load_reps', 35, 12, 60, 'Escápulas retraídas e pés firmes no chão. Desça de forma controlada e suba sem travar os cotovelos.'),
  ('flexao-de-braco', 'Flexão de braço', 'Peito', '{}', 'Peso corporal', 'reps', null, 12, 60, 'Escápulas retraídas e pés firmes no chão. Desça de forma controlada e suba sem travar os cotovelos.'),
  ('puxada-frontal', 'Puxada frontal', 'Costas', '{}', 'Polia', 'load_reps', 55, 10, 90, 'Inicie o movimento pelas escápulas e mantenha o tronco estável, sem embalo.'),
  ('remada-curvada', 'Remada curvada', 'Costas', '{}', 'Barra', 'load_reps', 50, 8, 120, 'Inicie o movimento pelas escápulas e mantenha o tronco estável, sem embalo.'),
  ('remada-baixa', 'Remada baixa', 'Costas', '{}', 'Polia', 'load_reps', 45, 12, 60, 'Inicie o movimento pelas escápulas e mantenha o tronco estável, sem embalo.'),
  ('barra-fixa', 'Barra fixa', 'Costas', '{}', 'Peso corporal', 'reps', null, 8, 90, 'Inicie o movimento pelas escápulas e mantenha o tronco estável, sem embalo.'),
  ('desenvolvimento', 'Desenvolvimento', 'Ombros', '{}', 'Halteres', 'load_reps', 18, 10, 90, 'Evite elevar os ombros em direção às orelhas. Movimento controlado na subida e na descida.'),
  ('elevacao-lateral', 'Elevação lateral', 'Ombros', '{}', 'Halteres', 'load_reps', 8, 12, 60, 'Evite elevar os ombros em direção às orelhas. Movimento controlado na subida e na descida.'),
  ('face-pull', 'Face pull', 'Ombros', '{}', 'Polia', 'load_reps', 20, 15, 60, 'Evite elevar os ombros em direção às orelhas. Movimento controlado na subida e na descida.'),
  ('rosca-direta', 'Rosca direta', 'Bíceps', '{}', 'Halteres', 'load_reps', 14, 10, 60, 'Cotovelos junto ao corpo; evite balançar o tronco.'),
  ('rosca-martelo', 'Rosca martelo', 'Bíceps', '{}', 'Halteres', 'load_reps', 12, 12, 60, 'Cotovelos junto ao corpo; evite balançar o tronco.'),
  ('triceps-na-corda', 'Tríceps na corda', 'Tríceps', '{}', 'Polia', 'load_reps', 25, 12, 60, 'Cotovelos fixos; estenda por completo sem travar a articulação.'),
  ('triceps-frances', 'Tríceps francês', 'Tríceps', '{}', 'Halteres', 'load_reps', 14, 10, 60, 'Cotovelos fixos; estenda por completo sem travar a articulação.'),
  ('mergulho-nas-paralelas', 'Mergulho nas paralelas', 'Tríceps', '{}', 'Peso corporal', 'reps', null, 10, 90, 'Cotovelos fixos; estenda por completo sem travar a articulação.'),
  ('agachamento-livre', 'Agachamento livre', 'Pernas', '{}', 'Barra', 'load_reps', 80, 6, 150, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('leg-press-45', 'Leg press 45°', 'Pernas', '{}', 'Máquina', 'load_reps', 160, 10, 120, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('cadeira-extensora', 'Cadeira extensora', 'Pernas', '{}', 'Máquina', 'load_reps', 45, 12, 60, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('stiff', 'Stiff', 'Pernas', '{}', 'Barra', 'load_reps', 50, 10, 90, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('afundo', 'Afundo', 'Pernas', '{}', 'Halteres', 'load_reps', 14, 10, 60, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('panturrilha-em-pe', 'Panturrilha em pé', 'Pernas', '{}', 'Máquina', 'load_reps', 60, 15, 45, 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.'),
  ('elevacao-pelvica', 'Elevação pélvica', 'Glúteos', '{}', 'Barra', 'load_reps', 70, 10, 90, 'Contraia no topo e controle a descida.'),
  ('abducao-na-maquina', 'Abdução na máquina', 'Glúteos', '{}', 'Máquina', 'load_reps', 40, 15, 45, 'Contraia no topo e controle a descida.'),
  ('abdominal-infra', 'Abdominal infra', 'Abdômen', '{}', 'Peso corporal', 'reps', null, 15, 45, 'Expire na contração e evite puxar o pescoço.'),
  ('abdominal-na-polia', 'Abdominal na polia', 'Abdômen', '{}', 'Polia', 'load_reps', 30, 12, 45, 'Expire na contração e evite puxar o pescoço.'),
  ('esteira', 'Esteira', 'Cardio', '{}', 'Esteira', 'time', null, 20, 0, 'Mantenha um ritmo em que consiga falar frases curtas, exceto em intervalos.'),
  ('bicicleta-ergometrica', 'Bicicleta ergométrica', 'Cardio', '{}', 'Bicicleta', 'time', null, 15, 0, 'Mantenha um ritmo em que consiga falar frases curtas, exceto em intervalos.'),
  ('remo-ergometro', 'Remo ergômetro', 'Cardio', '{}', 'Remo', 'time', null, 10, 0, 'Mantenha um ritmo em que consiga falar frases curtas, exceto em intervalos.'),
  ('mobilidade-de-quadril', 'Mobilidade de quadril', 'Mobilidade', '{}', 'Livre', 'time', null, 8, 0, 'Movimentos lentos e sem dor, com respiração contínua.'),
  ('mobilidade-toracica', 'Mobilidade torácica', 'Mobilidade', '{}', 'Livre', 'time', null, 5, 0, 'Movimentos lentos e sem dor, com respiração contínua.');

-- Program catalog (PRO).
insert into public.programs (id, name, weeks, tag, frequency, description, pattern, legend, week_titles, light_weeks, position) values
  ('forca', 'Força em 8 semanas', 8, 'Musculação · intermediário', '3 treinos/semana', 'Treinos A, B e C com progressão de carga e uma semana leve a cada quatro.', array['A', '—', 'B', '—', 'C', '—', '—']::text[], 'A, B e C são suas rotinas atuais.', array['Adaptação', 'Volume', 'Volume', 'Leve', 'Força', 'Força', 'Pico', 'Leve e teste']::text[], '{3,7}', 0),
  ('5k', '5 km em 6 semanas', 6, 'Corrida · iniciante', '3 corridas/semana', 'Do trote contínuo aos 5 km, com intervalos e uma corrida mais longa por semana.', array['—', '⟶', '—', '⟶', '—', '⟶', '—']::text[], '⟶ corrida · os outros dias são livres.', array['Base · 3 × 20 min', 'Intervalos curtos', 'Ritmo contínuo', 'Longo de 4 km', 'Intervalos longos', 'Prova de 5 km']::text[], '{}', 1),
  ('volta', 'Volta aos treinos', 4, 'Corpo inteiro · retomada', '2 treinos/semana', 'Corpo inteiro com cargas leves para retomar a rotina sem excesso.', array['F', '—', '—', 'F', '—', '—', '—']::text[], 'F é um treino de corpo inteiro.', array['Técnica', 'Técnica e volume', 'Volume', 'Avaliação']::text[], '{}', 2);

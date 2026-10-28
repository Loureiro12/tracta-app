import type {
  ExerciseType,
  LibraryExercise,
  Modality,
  PrevSet,
  Program,
  Routine,
  RoutineExercise,
} from './workouts.types';

/** Stable, URL-safe id from an exercise name ("Leg press 45°" → "leg-press-45"). */
export function exerciseIdFromName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type SeedExercise = {
  n: string;
  g: string;
  eq: string;
  reps: number;
  rest: number;
  prev: PrevSet[];
  grp?: string;
};

function seed(list: SeedExercise[]): RoutineExercise[] {
  return list.map(seedExercise);
}

function seedExercise(e: SeedExercise): RoutineExercise {
  return {
    exerciseId: exerciseIdFromName(e.n),
    name: e.n,
    group: e.g,
    equipment: e.eq,
    sets: e.prev.length,
    reps: e.reps,
    kg: e.prev[0]?.[0] ?? null,
    rest: e.rest,
    superset: e.grp ?? null,
    cardio: false,
    prev: e.prev,
  };
}

/** Seeded routines A/B/C from the prototype (`const W`). */
export const routines: Routine[] = [
  {
    id: 'A',
    name: 'Treino A',
    focus: 'Peito & Tríceps',
    day: 0,
    estMinutes: 55,
    lastDoneAt: '2026-10-19',
    exercises: seed([
      {
        n: 'Supino reto com barra',
        g: 'Peito',
        eq: 'Barra',
        reps: 8,
        rest: 120,
        prev: [
          [60, 8],
          [60, 8],
          [60, 7],
          [57.5, 8],
        ],
      },
      {
        n: 'Supino inclinado',
        g: 'Peito superior',
        eq: 'Halteres',
        reps: 10,
        rest: 90,
        prev: [
          [22, 10],
          [22, 10],
          [22, 10],
        ],
      },
      {
        n: 'Crucifixo na máquina',
        g: 'Peito',
        eq: 'Máquina',
        reps: 12,
        rest: 60,
        prev: [
          [35, 12],
          [35, 12],
          [35, 11],
        ],
      },
      {
        n: 'Tríceps na corda',
        g: 'Tríceps',
        eq: 'Polia',
        reps: 12,
        rest: 0,
        grp: 'S1',
        prev: [
          [25, 12],
          [25, 12],
          [25, 10],
        ],
      },
      {
        n: 'Mergulho nas paralelas',
        g: 'Tríceps',
        eq: 'Peso corporal',
        reps: 10,
        rest: 90,
        grp: 'S1',
        prev: [
          [null, 10],
          [null, 9],
          [null, 8],
        ],
      },
    ]),
  },
  {
    id: 'B',
    name: 'Treino B',
    focus: 'Costas & Bíceps',
    day: 2,
    estMinutes: 50,
    lastDoneAt: '2026-10-21',
    exercises: seed([
      {
        n: 'Puxada frontal',
        g: 'Costas',
        eq: 'Polia',
        reps: 10,
        rest: 90,
        prev: [
          [55, 10],
          [55, 10],
          [55, 9],
          [50, 10],
        ],
      },
      {
        n: 'Remada curvada',
        g: 'Costas',
        eq: 'Barra',
        reps: 8,
        rest: 120,
        prev: [
          [50, 8],
          [50, 8],
          [50, 7],
          [50, 7],
        ],
      },
      {
        n: 'Remada baixa',
        g: 'Costas',
        eq: 'Polia',
        reps: 12,
        rest: 60,
        prev: [
          [45, 12],
          [45, 12],
          [45, 11],
        ],
      },
      {
        n: 'Rosca direta',
        g: 'Bíceps',
        eq: 'Halteres',
        reps: 10,
        rest: 60,
        prev: [
          [14, 10],
          [14, 10],
          [14, 8],
        ],
      },
    ]),
  },
  {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas',
    day: 4,
    estMinutes: 60,
    lastDoneAt: '2026-10-23',
    exercises: seed([
      {
        n: 'Agachamento livre',
        g: 'Pernas',
        eq: 'Barra',
        reps: 6,
        rest: 150,
        prev: [
          [80, 6],
          [80, 6],
          [80, 6],
          [75, 6],
        ],
      },
      {
        n: 'Leg press 45°',
        g: 'Pernas',
        eq: 'Máquina',
        reps: 10,
        rest: 120,
        prev: [
          [160, 10],
          [160, 10],
          [160, 9],
          [150, 10],
        ],
      },
      {
        n: 'Cadeira extensora',
        g: 'Quadríceps',
        eq: 'Máquina',
        reps: 12,
        rest: 60,
        prev: [
          [45, 12],
          [45, 12],
          [45, 10],
        ],
      },
      {
        n: 'Stiff',
        g: 'Posterior',
        eq: 'Barra',
        reps: 10,
        rest: 90,
        prev: [
          [50, 10],
          [50, 10],
          [50, 9],
        ],
      },
      {
        n: 'Panturrilha em pé',
        g: 'Panturrilha',
        eq: 'Máquina',
        reps: 15,
        rest: 45,
        prev: [
          [60, 15],
          [60, 15],
          [60, 14],
          [60, 12],
        ],
      },
    ]),
  },
];

/** Muscle-group filters of the picker (`CATS`), without the "all" entry which is UI copy. */
export const exerciseCategories = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Cardio',
  'Mobilidade',
  'Funcional',
] as const;

export type ExerciseCategory = (typeof exerciseCategories)[number];

/** Equipment options of the exercise form (`EQS`). */
export const equipment = [
  'Barra',
  'Halteres',
  'Máquina',
  'Polia',
  'Peso corporal',
  'Kettlebell',
  'Elástico',
  'Outro',
] as const;

type SeedLib = [string, string, string, ExerciseType, number | null, number, number];

const LIB_SEED: SeedLib[] = [
  ['Supino reto com barra', 'Peito', 'Barra', 's', 60, 8, 120],
  ['Supino inclinado', 'Peito', 'Halteres', 's', 22, 10, 90],
  ['Crucifixo na máquina', 'Peito', 'Máquina', 's', 35, 12, 60],
  ['Flexão de braço', 'Peito', 'Peso corporal', 'b', null, 12, 60],
  ['Puxada frontal', 'Costas', 'Polia', 's', 55, 10, 90],
  ['Remada curvada', 'Costas', 'Barra', 's', 50, 8, 120],
  ['Remada baixa', 'Costas', 'Polia', 's', 45, 12, 60],
  ['Barra fixa', 'Costas', 'Peso corporal', 'b', null, 8, 90],
  ['Desenvolvimento', 'Ombros', 'Halteres', 's', 18, 10, 90],
  ['Elevação lateral', 'Ombros', 'Halteres', 's', 8, 12, 60],
  ['Face pull', 'Ombros', 'Polia', 's', 20, 15, 60],
  ['Rosca direta', 'Bíceps', 'Halteres', 's', 14, 10, 60],
  ['Rosca martelo', 'Bíceps', 'Halteres', 's', 12, 12, 60],
  ['Tríceps na corda', 'Tríceps', 'Polia', 's', 25, 12, 60],
  ['Tríceps francês', 'Tríceps', 'Halteres', 's', 14, 10, 60],
  ['Mergulho nas paralelas', 'Tríceps', 'Peso corporal', 'b', null, 10, 90],
  ['Agachamento livre', 'Pernas', 'Barra', 's', 80, 6, 150],
  ['Leg press 45°', 'Pernas', 'Máquina', 's', 160, 10, 120],
  ['Cadeira extensora', 'Pernas', 'Máquina', 's', 45, 12, 60],
  ['Stiff', 'Pernas', 'Barra', 's', 50, 10, 90],
  ['Afundo', 'Pernas', 'Halteres', 's', 14, 10, 60],
  ['Panturrilha em pé', 'Pernas', 'Máquina', 's', 60, 15, 45],
  ['Elevação pélvica', 'Glúteos', 'Barra', 's', 70, 10, 90],
  ['Abdução na máquina', 'Glúteos', 'Máquina', 's', 40, 15, 45],
  ['Abdominal infra', 'Abdômen', 'Peso corporal', 'b', null, 15, 45],
  ['Abdominal na polia', 'Abdômen', 'Polia', 's', 30, 12, 45],
  ['Esteira', 'Cardio', 'Esteira', 'c', null, 20, 0],
  ['Bicicleta ergométrica', 'Cardio', 'Bicicleta', 'c', null, 15, 0],
  ['Remo ergômetro', 'Cardio', 'Remo', 'c', null, 10, 0],
  ['Mobilidade de quadril', 'Mobilidade', 'Livre', 'c', null, 8, 0],
  ['Mobilidade torácica', 'Mobilidade', 'Livre', 'c', null, 5, 0],
];

/** Default exercise library (`LIB`). User-created exercises live in the store. */
export const exerciseLibrary: LibraryExercise[] = LIB_SEED.map(
  ([name, group, eq, type, kg, reps, rest]) => ({
    id: exerciseIdFromName(name),
    name,
    group,
    secondary: [],
    equipment: eq,
    type,
    kg,
    reps,
    rest,
    notes: '',
    favorite: false,
    custom: false,
  }),
);

/** Generic execution cues by muscle group (`INSTR`). */
export const groupInstructions: Record<string, string> = {
  Peito:
    'Escápulas retraídas e pés firmes no chão. Desça de forma controlada e suba sem travar os cotovelos.',
  Costas: 'Inicie o movimento pelas escápulas e mantenha o tronco estável, sem embalo.',
  Ombros:
    'Evite elevar os ombros em direção às orelhas. Movimento controlado na subida e na descida.',
  Bíceps: 'Cotovelos junto ao corpo; evite balançar o tronco.',
  Tríceps: 'Cotovelos fixos; estenda por completo sem travar a articulação.',
  Pernas: 'Joelhos alinhados com a ponta dos pés e coluna neutra durante todo o movimento.',
  Glúteos: 'Contraia no topo e controle a descida.',
  Abdômen: 'Expire na contração e evite puxar o pescoço.',
  Cardio: 'Mantenha um ritmo em que consiga falar frases curtas, exceto em intervalos.',
  Mobilidade: 'Movimentos lentos e sem dor, com respiração contínua.',
  Funcional: 'Priorize a técnica antes da velocidade.',
};

/** Week programs (`PROGS`). */
export const programs: Program[] = [
  {
    id: 'forca',
    name: 'Força em 8 semanas',
    weeks: 8,
    tag: 'Musculação · intermediário',
    frequency: '3 treinos/semana',
    description: 'Treinos A, B e C com progressão de carga e uma semana leve a cada quatro.',
    pattern: ['A', '—', 'B', '—', 'C', '—', '—'],
    legend: 'A, B e C são suas rotinas atuais.',
    weekTitles: ['Adaptação', 'Volume', 'Volume', 'Leve', 'Força', 'Força', 'Pico', 'Leve e teste'],
    lightWeeks: [3, 7],
    today: { 0: 'Treino A · Peito & Tríceps' },
  },
  {
    id: '5k',
    name: '5 km em 6 semanas',
    weeks: 6,
    tag: 'Corrida · iniciante',
    frequency: '3 corridas/semana',
    description: 'Do trote contínuo aos 5 km, com intervalos e uma corrida mais longa por semana.',
    pattern: ['—', '⟶', '—', '⟶', '—', '⟶', '—'],
    legend: '⟶ corrida · os outros dias são livres.',
    weekTitles: [
      'Base · 3 × 20 min',
      'Intervalos curtos',
      'Ritmo contínuo',
      'Longo de 4 km',
      'Intervalos longos',
      'Prova de 5 km',
    ],
    lightWeeks: [],
    today: {},
  },
  {
    id: 'volta',
    name: 'Volta aos treinos',
    weeks: 4,
    tag: 'Corpo inteiro · retomada',
    frequency: '2 treinos/semana',
    description: 'Corpo inteiro com cargas leves para retomar a rotina sem excesso.',
    pattern: ['F', '—', '—', 'F', '—', '—', '—'],
    legend: 'F é um treino de corpo inteiro.',
    weekTitles: ['Técnica', 'Técnica e volume', 'Volume', 'Avaliação'],
    lightWeeks: [],
    today: { 0: 'Corpo inteiro · 40 min' },
  },
];

/** Activity modalities (`MOD`). `run` and `walk` have their own tiles; the rest live in the sheet. */
export const modalities: Modality[] = [
  {
    id: 'run',
    label: 'Corrida',
    description: 'GPS · ritmo · parciais',
    gps: true,
    pace: 335,
    speed: false,
    swim: false,
  },
  {
    id: 'walk',
    label: 'Caminhada',
    description: 'GPS · distância · tempo',
    gps: true,
    pace: 630,
    speed: false,
    swim: false,
  },
  {
    id: 'bike',
    label: 'Ciclismo',
    description: 'duração, distância, velocidade e percurso',
    gps: true,
    pace: 150,
    speed: true,
    swim: false,
  },
  {
    id: 'swim',
    label: 'Natação',
    description: 'duração, distância e voltas',
    gps: false,
    pace: null,
    speed: false,
    swim: true,
  },
  {
    id: 'soccer',
    label: 'Futebol',
    description: 'duração e observações',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
  {
    id: 'basket',
    label: 'Basquete',
    description: 'duração e observações',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
  {
    id: 'tennis',
    label: 'Tênis',
    description: 'duração e observações',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
  {
    id: 'functional',
    label: 'Treino funcional',
    description: 'duração e observações',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
  {
    id: 'stretch',
    label: 'Alongamento',
    description: 'duração',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
  {
    id: 'yoga',
    label: 'Yoga',
    description: 'duração',
    gps: false,
    pace: null,
    speed: false,
    swim: false,
  },
];

/** Average pace (s/km) of the last runs in the prototype, used by the race estimate. */
export const recentPaceSeconds = 336;

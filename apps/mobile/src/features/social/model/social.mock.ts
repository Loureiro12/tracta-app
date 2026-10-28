import type { Challenge, Friend, Participant } from './social.types';

/** Friends from the prototype (`FR`). Names, colors and activity are data, not UI copy. */
export const friends: readonly Friend[] = [
  {
    id: 'ana',
    name: 'Ana Souza',
    color: '#B2482D',
    handle: '@anasouza',
    done: true,
    what: 'concluiu Treino de pernas',
    min: 52,
    at: '14:20',
    steps: 11200,
    streak: 4,
  },
  {
    id: 'bruno',
    name: 'Bruno Lima',
    color: '#1F6FA8',
    handle: '@brunolima',
    done: false,
    min: 0,
    steps: 5400,
    streak: 0,
  },
  {
    id: 'carla',
    name: 'Carla Mendes',
    color: '#4B4FC4',
    handle: '@carlam',
    done: true,
    what: 'correu 6,1 km',
    min: 34,
    at: '07:05',
    steps: 9800,
    streak: 9,
  },
  {
    id: 'diego',
    name: 'Diego Rocha',
    color: '#7A5600',
    handle: '@diegor',
    done: false,
    min: 0,
    steps: 7300,
    streak: 2,
  },
  {
    id: 'elisa',
    name: 'Elisa Prado',
    color: '#B4482A',
    handle: '@elisaprado',
    done: true,
    what: 'fez Yoga',
    min: 18,
    at: '12:40',
    steps: 8100,
    streak: 1,
  },
];

export const friendById = (id: string): Friend | undefined => friends.find((f) => f.id === id);

/** Friends the user already has (the rest show up as invitable contacts). */
export const initialFriendIds: readonly string[] = ['ana', 'bruno', 'carla'];

/** The user's activity today (prototype `myToday()` with no session logged). */
export const meToday: Omit<Participant, 'id' | 'name' | 'color'> = {
  done: false,
  min: 0,
  steps: 6842,
};

/** Reference "today" of the prototype (26 Oct 2026). */
export const today = new Date(2026, 9, 26);

export const initialChallenges: readonly Challenge[] = [
  {
    id: 'c1',
    name: 'Semana em movimento',
    type: 'day',
    min: 20,
    days: 7,
    start: 'today',
    members: ['ana', 'bruno', 'carla'],
  },
];

/** Avatar placeholders for the empty state. */
export const emptyStateAvatars: readonly { name: string; color: string }[] = [
  { name: 'Ana', color: '#B2482D' },
  { name: 'Carla', color: '#4B4FC4' },
  { name: 'Diego', color: '#7A5600' },
];

export const inviteLink = 'tracta.app/convite/voce-7f2k';

export const shareTargets = ['messages', 'whatsapp', 'email'] as const;
export type ShareTarget = (typeof shareTargets)[number];

export const challengeLengths = [7, 14, 30] as const;
export const MIN_DURATION = { min: 10, max: 90, step: 5 } as const;
export const STEP_GOAL = 10000;

import en from './en.json';
import ptBR from './pt-BR.json';

/** Namespace "home". Keys are typed from en.json; pt-BR must mirror them (check-structure enforces parity). */
export const homeTranslations = { en, 'pt-BR': ptBR } as const;

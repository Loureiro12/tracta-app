import { create } from 'zustand';

import { shareTemplates } from './share.mock';

import type { ShareFormat, ShareOption, ShareStyle, ShareTemplate } from './share.mock';

type ShareState = {
  template: ShareTemplate;
  style: ShareStyle;
  format: ShareFormat;
  options: Record<ShareOption, boolean>;
  setTemplate: (template: ShareTemplate) => void;
  /** Moves to the previous (-1) or next (+1) template, wrapping around. */
  stepTemplate: (delta: 1 | -1) => void;
  setStyle: (style: ShareStyle) => void;
  setFormat: (format: ShareFormat) => void;
  toggleOption: (option: ShareOption) => void;
};

/** In-memory editor state of the share screen (template, style, format, options). */
export const useShareStore = create<ShareState>((set) => ({
  template: 'evo',
  style: 'ink',
  format: 'story',
  options: { loads: true, times: true, name: false },
  setTemplate: (template) => set({ template }),
  stepTemplate: (delta) =>
    set((s) => {
      const index = shareTemplates.indexOf(s.template);
      const next = (index + delta + shareTemplates.length) % shareTemplates.length;
      return { template: shareTemplates[next] ?? s.template };
    }),
  setStyle: (style) => set({ style }),
  setFormat: (format) => set({ format }),
  toggleOption: (option) =>
    set((s) => ({ options: { ...s.options, [option]: !s.options[option] } })),
}));

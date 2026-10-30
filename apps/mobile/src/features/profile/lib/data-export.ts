import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { env } from '@/shared/config/env';

import type { DataExport } from '@tracta/api';

/** Saves the export as a JSON file and hands it to the system share sheet. */
export type ExportSink = { deliver: (data: DataExport, fileName: string) => Promise<void> };

const nativeSink: ExportSink = {
  async deliver(data, fileName) {
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    await file.write(JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync())
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: fileName,
      });
  },
};

/** E2E builds: the share sheet is native UI Maestro cannot dismiss, so only the data is fetched. */
const fakeSink: ExportSink = { deliver: () => Promise.resolve() };

export const exportSink: ExportSink = env.isE2E ? fakeSink : nativeSink;

/** `tracta-export-2026-10-26.json` */
export function exportFileName(day: string): string {
  return `tracta-export-${day}.json`;
}

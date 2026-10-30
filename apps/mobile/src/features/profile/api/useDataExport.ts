import { account, supabase, useMutation } from '@/shared/api';
import { today } from '@/shared/clock';

import { exportFileName, exportSink } from '../lib/data-export';

/** "Export my data": everything the account owns as a JSON file, opened in the share sheet. */
export function useDataExport() {
  return useMutation({
    mutationFn: async () => {
      const data = await account.exportData(supabase);
      await exportSink.deliver(data, exportFileName(today()));
      return data;
    },
  });
}

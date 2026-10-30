import { photos, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { today } from '@/shared/clock';
import { useSession } from '@/shared/session';

import { photoSource } from '../lib/photo-source';

import type { PhotoOrigin } from '../lib/photo-source';
import type { photos as photosApi } from '@tracta/api';

export type ProgressPhoto = photosApi.ProgressPhoto;

const photosKey = (userId: string | undefined) => ['photos', userId] as const;

/** Progress photos, newest first, with signed URLs (refreshed well before they expire). */
export function useProgressPhotos() {
  const { user } = useSession();
  return useQuery({
    queryKey: photosKey(user?.id),
    queryFn: () => photos.listPhotos(supabase),
    enabled: !!user,
    staleTime: (photos.SIGNED_URL_TTL / 2) * 1000,
  });
}

/**
 * Picks (camera or library), resizes and uploads today's photo; the weight is the latest
 * weigh-in. Resolves to null when the user cancels.
 */
export function useAddPhoto() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (origin: PhotoOrigin) => {
      const picked = await photoSource.pick(origin);
      if (!picked) return null;
      return photos.uploadPhoto(supabase, {
        takenOn: today(),
        contentType: picked.contentType,
        data: picked.data,
      });
    },
    onSuccess: (photo) => {
      if (photo) void queryClient.invalidateQueries({ queryKey: photosKey(user?.id) });
    },
  });
}

/** Deletes a photo (file and row). */
export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (id: string) => photos.deletePhoto(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosKey(user?.id) }),
  });
}

/**
 * Progress photos: bytes in the private Storage bucket `progress-photos` under `<user_id>/`,
 * metadata (day, weight) in `progress_photos`. Pictures are read through short-lived signed URLs.
 */
import { z } from 'zod';

import { ApiError, toApiError, unwrap, unwrapOne } from '../errors';
import { listOf, parse, requireUser } from './sessions';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type PhotoRow = Database['public']['Tables']['progress_photos']['Row'];

export const PHOTOS_BUCKET = 'progress-photos';

/** Signed URLs live this long (seconds); lists refetch well before that. */
export const SIGNED_URL_TTL = 60 * 60;

export type ProgressPhoto = {
  id: string;
  /** Calendar day, YYYY-MM-DD. */
  takenOn: string;
  weightKg: number | null;
  storagePath: string;
  /** Signed URL to the picture; null when the object is missing (e.g. seeded demo frames). */
  url: string | null;
  createdAt: string;
};

export type PhotoContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';

const EXTENSION: Record<PhotoContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

const MAX_BYTES = 5 * 1024 * 1024;

function toPhoto(r: PhotoRow, url: string | null): ProgressPhoto {
  return {
    id: r.id,
    takenOn: r.taken_on,
    weightKg: r.weight_kg === null ? null : Number(r.weight_kg),
    storagePath: r.storage_path,
    url,
    createdAt: r.created_at,
  };
}

/** Signed URLs for many paths in one request; missing objects map to null. */
async function signUrls(client: TractaClient, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data, error } = await client.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) throw toApiError(error);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** The signed-in user's photos, newest first, each with a signed URL. */
export async function listPhotos(client: TractaClient): Promise<ProgressPhoto[]> {
  const userId = await requireUser(client);
  const rows = listOf(
    await client
      .from('progress_photos')
      .select('*')
      .eq('owner_id', userId)
      .order('taken_on', { ascending: false })
      .order('created_at', { ascending: false }),
  );
  const urls = await signUrls(
    client,
    rows.map((r) => r.storage_path),
  );
  return rows.map((r) => toPhoto(r, urls.get(r.storage_path) ?? null));
}

export const uploadPhotoInput = z.object({
  takenOn: z.iso.date(),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  /** Omit to use the latest weight logged on or before `takenOn` (if any); null for none. */
  weightKg: z.number().min(20).max(400).nullable().optional(),
});

export type UploadPhotoInput = z.input<typeof uploadPhotoInput> & {
  /** Image bytes (already resized/compressed by the app). */
  data: ArrayBuffer | Uint8Array;
};

async function latestWeight(
  client: TractaClient,
  userId: string,
  onOrBefore: string,
): Promise<number | null> {
  const row = unwrap(
    await client
      .from('body_measurements')
      .select('weight_kg')
      .eq('owner_id', userId)
      .not('weight_kg', 'is', null)
      .lte('measured_on', onOrBefore)
      .order('measured_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return row?.weight_kg === null || row?.weight_kg === undefined ? null : Number(row.weight_kg);
}

function randomSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Uploads a picture and records it. The object goes first; if the row cannot be written the
 * object is removed again, so Storage never keeps an unlisted photo.
 */
export async function uploadPhoto(
  client: TractaClient,
  input: UploadPhotoInput,
): Promise<ProgressPhoto> {
  const userId = await requireUser(client);
  const p = parse(uploadPhotoInput, input);
  const size = input.data.byteLength;
  if (size === 0 || size > MAX_BYTES)
    throw new ApiError('validation', `photo must be 1 byte to ${MAX_BYTES} bytes`);

  const weightKg =
    p.weightKg === undefined ? await latestWeight(client, userId, p.takenOn) : p.weightKg;
  const path = `${userId}/${p.takenOn}-${randomSuffix()}.${EXTENSION[p.contentType]}`;

  const uploaded = await client.storage
    .from(PHOTOS_BUCKET)
    .upload(path, input.data, { contentType: p.contentType, upsert: false });
  if (uploaded.error) throw toApiError(uploaded.error);

  const inserted = await client
    .from('progress_photos')
    .insert({
      owner_id: userId,
      taken_on: p.takenOn,
      weight_kg: weightKg === null ? null : Math.round(weightKg * 100) / 100,
      storage_path: path,
    })
    .select('*')
    .single();
  if (inserted.error) {
    await client.storage.from(PHOTOS_BUCKET).remove([path]);
    throw toApiError(inserted.error);
  }
  const urls = await signUrls(client, [path]);
  return toPhoto(inserted.data, urls.get(path) ?? null);
}

/** Deletes a photo: the row (RLS: owner only), then its object. */
export async function deletePhoto(client: TractaClient, id: string): Promise<void> {
  await requireUser(client);
  const parsed = parse(z.uuid(), id);
  const row = unwrapOne(
    await client
      .from('progress_photos')
      .delete()
      .eq('id', parsed)
      .select('storage_path')
      .maybeSingle(),
    'photo',
  );
  const { error } = await client.storage.from(PHOTOS_BUCKET).remove([row.storage_path]);
  if (error) throw toApiError(error);
}

/**
 * Removes every object under the signed-in user's prefix (used before deleting the account,
 * since Storage bytes cannot be removed from SQL). Returns how many objects were removed.
 */
export async function removeAllPhotoObjects(client: TractaClient): Promise<number> {
  const userId = await requireUser(client);
  const bucket = client.storage.from(PHOTOS_BUCKET);
  let removed = 0;
  for (;;) {
    const { data, error } = await bucket.list(userId, { limit: 100 });
    if (error) throw toApiError(error);
    const paths = (data ?? []).filter((o) => o.id).map((o) => `${userId}/${o.name}`);
    if (paths.length === 0) return removed;
    const res = await bucket.remove(paths);
    if (res.error) throw toApiError(res.error);
    if ((res.data ?? []).length === 0) return removed;
    removed += res.data.length;
  }
}

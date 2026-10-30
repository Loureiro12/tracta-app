import { describe, expect, it } from 'vitest';

import { photos } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

/** Smallest valid JPEG-ish payload: Storage only checks the declared content type. */
const BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9,
]);

async function objectNames(userId: string): Promise<string[]> {
  const { data, error } = await adminClient()
    .storage.from(photos.PHOTOS_BUCKET)
    .list(userId, { limit: 100 });
  if (error) throw error;
  return (data ?? []).map((o) => o.name);
}

describe('photos', () => {
  it('requires a session', async () => {
    await expect(photos.listPhotos(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('uploads to the private bucket and lists newest first with signed URLs', async () => {
    const user = await createTestUser('Photographer');
    await user.client
      .from('body_measurements')
      .insert([
        { measured_on: '2026-10-20', weight_kg: 79.1 },
        { measured_on: '2026-10-25', weight_kg: 78.1 },
        { measured_on: '2026-10-27', weight_kg: 77.0 },
      ])
      .throwOnError();

    const older = await photos.uploadPhoto(user.client, {
      takenOn: '2026-06-01',
      contentType: 'image/jpeg',
      weightKg: 83.5,
      data: BYTES,
    });
    // Weight omitted: the latest weigh-in on or before the day of the photo.
    const today = await photos.uploadPhoto(user.client, {
      takenOn: '2026-10-26',
      contentType: 'image/jpeg',
      data: BYTES.buffer,
    });
    expect(older.weightKg).toBe(83.5);
    expect(today.weightKg).toBe(78.1);
    expect(today.storagePath.startsWith(`${user.id}/2026-10-26-`)).toBe(true);
    expect(today.storagePath.endsWith('.jpg')).toBe(true);

    const list = await photos.listPhotos(user.client);
    expect(list.map((p) => p.id)).toEqual([today.id, older.id]);
    expect(list[0]?.url).toMatch(/\/storage\/v1\/object\/sign\/progress-photos\//);

    // The signed URL serves the bytes; the plain public URL does not (private bucket).
    const signed = await fetch(list[0]!.url!);
    expect(signed.status).toBe(200);
    expect(new Uint8Array(await signed.arrayBuffer())).toEqual(BYTES);
    const publicUrl = user.client.storage.from(photos.PHOTOS_BUCKET).getPublicUrl(today.storagePath)
      .data.publicUrl;
    expect((await fetch(publicUrl)).status).toBeGreaterThanOrEqual(400);
    expect(await objectNames(user.id)).toHaveLength(2);
  });

  it('records no weight when there is no weigh-in, and lists rows without an object', async () => {
    const user = await createTestUser('No scale');
    const photo = await photos.uploadPhoto(user.client, {
      takenOn: '2026-10-26',
      contentType: 'image/png',
      data: BYTES,
    });
    expect(photo.weightKg).toBeNull();
    expect(photo.storagePath.endsWith('.png')).toBe(true);
    // A row whose object is missing (like the seeded demo frames) has no URL.
    await user.client
      .from('progress_photos')
      .insert({ taken_on: '2026-09-01', storage_path: `${user.id}/missing.jpg` })
      .throwOnError();
    const list = await photos.listPhotos(user.client);
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.takenOn === '2026-09-01')?.url).toBeNull();
    expect(list.find((p) => p.id === photo.id)?.url).toBeTruthy();
  });

  it('validates the input', async () => {
    const user = await createTestUser('Validation');
    await expect(
      photos.uploadPhoto(user.client, {
        takenOn: '26/10/2026',
        contentType: 'image/jpeg',
        data: BYTES,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      photos.uploadPhoto(user.client, {
        takenOn: '2026-10-26',
        contentType: 'image/gif' as 'image/jpeg',
        data: BYTES,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      photos.uploadPhoto(user.client, {
        takenOn: '2026-10-26',
        contentType: 'image/jpeg',
        data: new Uint8Array(),
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    expect(await objectNames(user.id)).toEqual([]);
  });

  it("keeps photos private: no reading, listing, signing or deleting another user's", async () => {
    const owner = await createTestUser('Owner');
    const stranger = await createTestUser('Stranger');
    const photo = await photos.uploadPhoto(owner.client, {
      takenOn: '2026-10-26',
      contentType: 'image/jpeg',
      data: BYTES,
    });
    const bucket = stranger.client.storage.from(photos.PHOTOS_BUCKET);

    expect(await photos.listPhotos(stranger.client)).toEqual([]);
    const listed = await bucket.list(owner.id);
    expect(listed.data ?? []).toEqual([]);
    const downloaded = await bucket.download(photo.storagePath);
    expect(downloaded.error).toBeTruthy();
    const signed = await bucket.createSignedUrl(photo.storagePath, 60);
    expect(signed.data?.signedUrl ?? null).toBeNull();
    const upload = await bucket.upload(`${owner.id}/planted.jpg`, BYTES, {
      contentType: 'image/jpeg',
    });
    expect(upload.error).toBeTruthy();
    await bucket.remove([photo.storagePath]);
    await expect(photos.deletePhoto(stranger.client, photo.id)).rejects.toMatchObject({
      code: 'not_found',
    });

    expect(await objectNames(owner.id)).toHaveLength(1);
    expect(await photos.listPhotos(owner.client)).toHaveLength(1);
  });

  it('deletes the row and the object', async () => {
    const user = await createTestUser('Deleter');
    const photo = await photos.uploadPhoto(user.client, {
      takenOn: '2026-10-26',
      contentType: 'image/jpeg',
      data: BYTES,
    });
    await photos.deletePhoto(user.client, photo.id);
    expect(await photos.listPhotos(user.client)).toEqual([]);
    expect(await objectNames(user.id)).toEqual([]);
    await expect(photos.deletePhoto(user.client, photo.id)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('removes every object under the user prefix', async () => {
    const user = await createTestUser('Cleanup');
    for (const takenOn of ['2026-10-01', '2026-10-02', '2026-10-03'])
      await photos.uploadPhoto(user.client, { takenOn, contentType: 'image/jpeg', data: BYTES });
    expect(await photos.removeAllPhotoObjects(user.client)).toBe(3);
    expect(await objectNames(user.id)).toEqual([]);
  });
});

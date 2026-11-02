import fs from 'node:fs/promises'
import path from 'node:path'
import { get, list, put, del, BlobNotFoundError } from '@vercel/blob'
import initialAnimals from '../public/animals.json'

const folder = path.join(process.cwd(), '.data', 'animals');
export const validAnimalId = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);

export async function readAnimals() {
  const records = [];
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let cursor;
    do {
      const page = await list({ prefix: 'animals/records/', cursor, limit: 100 });
      records.push(...await Promise.all(page.blobs.map(async ({ pathname }) => {
        const result = await get(pathname, { access: 'private', useCache: false });
        if (!result || result.statusCode !== 200) throw new Error('Animal record unavailable');
        return new Response(result.stream).json();
      })));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } else {
    let files;
    try { files = await fs.readdir(folder); }
    catch (error) { if (error.code !== 'ENOENT') throw error; files = []; }
    for (const file of files.filter(name => name.endsWith('.json'))) {
      records.push(JSON.parse(await fs.readFile(path.join(folder, file), 'utf8')));
    }
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...records, ...initialAnimals];
}

export async function saveAnimal(animal, image, contentType) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const picture = await put(`animals/photos/${animal.id}`, image, {
      access: 'private', addRandomSuffix: false, contentType,
    });
    try {
      await put(`animals/records/${animal.id}.json`, JSON.stringify(animal), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json',
      });
    } catch (error) {
      await del(picture.url).catch(() => {});
      throw error;
    }
  } else {
    if (process.env.VERCEL) throw new Error('Cloud storage is not configured');
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, `${animal.id}.image`), image);
    await fs.writeFile(path.join(folder, `${animal.id}.json`), JSON.stringify({ ...animal, contentType }));
  }
}

export async function readAnimalPhoto(id) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let result;
    try { result = await get(`animals/photos/${id}`, { access: 'private' }); }
    catch (error) { if (error instanceof BlobNotFoundError) return null; throw error; }
    if (!result || result.statusCode !== 200) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  }
  try {
    const record = JSON.parse(await fs.readFile(path.join(folder, `${id}.json`), 'utf8'));
    return { buffer: await fs.readFile(path.join(folder, `${id}.image`)), contentType: record.contentType };
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { get, list, put } from '@vercel/blob'
import initialShops from '../../public/zooshops.json'

const localFile = path.join(process.cwd(), 'public', 'zooshops.json');
async function readShops() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return JSON.parse(fs.readFileSync(localFile, 'utf8'));
  const shops = [...initialShops];
  let cursor;
  do {
    const page = await list({ prefix: 'zooshops/', cursor, limit: 100 });
    const records = await Promise.all(page.blobs.map(async ({ pathname }) => {
      const result = await get(pathname, { access: 'private', useCache: false });
      if (!result || result.statusCode !== 200) throw new Error('Blob unavailable');
      return new Response(result.stream).json();
    }));
    shops.push(...records);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return shops;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }
  try {
    if (req.method === 'GET') return res.status(200).json(await readShops());
    const { name, address, lat, lng } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.length > 120 ||
        typeof address !== 'string' || !address.trim() || address.length > 250 ||
        !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Укажите название, адрес и корректные координаты' });
    }
    const shop = { name: name.trim(), address: address.trim(), lat, lng };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Each shop is a separate object, so concurrent submissions cannot overwrite one another.
      await put(`zooshops/${randomUUID()}.json`, JSON.stringify(shop), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json',
      });
    } else {
      if (process.env.VERCEL) throw new Error('Cloud storage is not configured');
      const shops = await readShops();
      shops.push(shop);
      fs.writeFileSync(localFile, JSON.stringify(shops, null, 2));
    }
    return res.status(201).json(shop);
  } catch (error) {
    console.error('Zooshops storage:', error.message);
    return res.status(503).json({ error: 'Не удалось обратиться к хранилищу. Попробуйте ещё раз.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

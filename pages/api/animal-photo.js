import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { readAnimalPhoto, validAnimalId } from '../../lib/animals'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!validAnimalId(req.query.id)) return res.status(400).end();
  try {
    const photo = await readAnimalPhoto(req.query.id);
    if (!photo) return res.status(404).end();
    res.setHeader('Content-Type', photo.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    if (photo.buffer) return res.status(200).send(photo.buffer);
    await pipeline(Readable.fromWeb(photo.stream), res);
  } catch (error) {
    console.error('Animal photo:', error.message);
    if (!res.headersSent) res.status(503).end();
    else res.destroy();
  }
}

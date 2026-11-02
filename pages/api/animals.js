import { randomUUID } from 'node:crypto'
import { readAnimals, saveAnimal } from '../../lib/animals'

function validText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function decodePhoto(photo) {
  if (typeof photo !== 'string') return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) return null;
  const type = match[1];
  const valid = (type === 'image/jpeg' && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
    (type === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (type === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
  return valid ? { bytes, type } : null;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }
  try {
    if (req.method === 'GET') return res.status(200).json(await readAnimals());
    const { name, place, email, photo } = req.body || {};
    if (!validText(name, 100) || !validText(place, 500) || !validText(email, 254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Заполните кличку, место пропажи и корректный email.' });
    }
    const image = decodePhoto(photo);
    if (!image) return res.status(400).json({ error: 'Прикрепите фото JPG, PNG или WebP размером до 2 МБ.' });
    const id = randomUUID();
    const animal = {
      id, header: name.trim(), content: place.trim(), email: email.trim(),
      img: `/api/animal-photo?id=${id}`, createdAt: new Date().toISOString(),
    };
    await saveAnimal(animal, image.bytes, image.type);
    return res.status(201).json(animal);
  } catch (error) {
    console.error('Animals storage:', error.message);
    return res.status(503).json({ error: 'Не удалось обратиться к хранилищу. Попробуйте ещё раз.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '3mb' } } };

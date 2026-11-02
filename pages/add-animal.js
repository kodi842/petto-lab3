import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function AddAnimal() {
  const [name, setName] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [photo, setPhoto] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [reading, setReading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(null);
  const fileInput = React.useRef(null);
  const selection = React.useRef(0);

  async function selectPhoto(event) {
    const current = ++selection.current;
    const file = event.target.files?.[0];
    setPhoto(''); setError(''); setReading(false);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Выберите фото JPG, PNG или WebP размером до 2 МБ.');
      event.target.value = '';
      return;
    }
    setReading(true);
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
        reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = data;
      await image.decode();
      if (current === selection.current) setPhoto(data);
    } catch {
      if (current === selection.current) setError('Не удалось открыть изображение. Выберите другое фото.');
    } finally { if (current === selection.current) setReading(false); }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!photo) return setError('Прикрепите фотографию животного.');
    setBusy(true);
    try {
      const response = await fetch('/api/animals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, place, email, photo }),
      });
      if (response.status === 413) throw new Error('Фотография слишком большая. Выберите файл до 2 МБ.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить объявление.');
      setSaved(data);
      setName(''); setPlace(''); setEmail(''); setPhoto('');
      if (fileInput.current) fileInput.current.value = '';
    } catch (e) { setError(e.message || 'Не удалось сохранить объявление. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="shops-page animal-page">
      <Head><title>Добавить животное — Petto</title></Head>
      <nav><Link href="/">← Petto</Link><Link href="/zooshops">Зоомагазины</Link></nav>
      <h1>Добавить животное</h1>
      <p>Опубликуйте карточку потерянного питомца, чтобы с вами могли связаться.</p>
      {saved && <section className="shop-form" role="status">
        <h2>Объявление опубликовано</h2>
        <p>Карточка «{saved.header}» сохранена и уже доступна на главной странице.</p>
        <Link href="/" className="primary-link">Посмотреть на главной</Link>
        <button type="button" className="secondary-button" onClick={() => setSaved(null)}>Добавить ещё животное</button>
      </section>}
      {!saved && <section className="shop-form">
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label>Кличка животного<input value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
            <label>Где и когда пропало<textarea value={place} onChange={e => setPlace(e.target.value)} maxLength={500} rows={3} required /></label>
            <label>Email для связи<input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required aria-describedby="email-note" /></label>
            <p id="email-note" className="field-hint">Посетители смогут написать владельцу на этот адрес.</p>
            <label>Фотография<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} required aria-describedby="photo-note" /></label>
            <p id="photo-note" className="field-hint">JPG, PNG или WebP, до 2 МБ.</p>
            {photo && <img src={photo} alt="Предпросмотр фотографии питомца" className="animal-preview" />}
            {error && <p role="alert" className="error">{error}</p>}
            <button type="submit" disabled={reading || busy}>{busy ? 'Публикация…' : reading ? 'Чтение фотографии…' : 'Опубликовать объявление'}</button>
          </fieldset>
        </form>
      </section>}
    </main>
  );
}

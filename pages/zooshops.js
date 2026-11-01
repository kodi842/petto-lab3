import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const ShopsMap = dynamic(() => import('../components/ShopsMap'), {
  ssr: false, loading: () => <p>Загрузка карты…</p>,
});
export default function Zooshops() {
  const [shops, setShops] = React.useState([]);
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [coords, setCoords] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  React.useEffect(() => {
    fetch('/api/zooshops').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setShops(data);
    }).catch(e => setError(e.message || 'Не удалось загрузить магазины'))
      .finally(() => setLoading(false));
  }, []);
  async function addShop(e) {
    e.preventDefault();
    setError(''); setMessage('');
    if (!coords) return setError('Выберите место на карте');
    setBusy(true);
    try {
      const response = await fetch('/api/zooshops', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, lat: coords.lat, lng: coords.lng }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setShops(current => [...current, data]);
      setName(''); setAddress(''); setCoords(null);
      setMessage('Зоомагазин сохранён на сервере и добавлен на карту.');
    } catch (e) { setError(e.message || 'Не удалось сохранить магазин'); }
    finally { setBusy(false); }
  }
  return (
    <main className="shops-page">
      <Head><title>Зоомагазины — Petto</title></Head>
      <nav><Link href="/">← Petto</Link><Link href="/content">Видео</Link></nav>
      <h1>Зоомагазины Пензы</h1>
      <p>Найдите ближайший магазин или добавьте новый, выбрав место на карте.</p>
      <p>{loading ? 'Загрузка магазинов…' : `Магазинов на карте: ${shops.length}`}</p>
      <ShopsMap shops={shops} onSelect={setCoords} selectedCoords={coords} />
      <section className="shop-form">
        <h2>Новый зоомагазин</h2>
        <form onSubmit={addShop}>
          <label>Название<input value={name} onChange={e => setName(e.target.value)} maxLength={120} required /></label>
          <label>Адрес<input value={address} onChange={e => setAddress(e.target.value)} maxLength={250} required /></label>
          <p>Место: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'кликните по карте'}</p>
          <button type="submit" disabled={busy || loading}>{busy ? 'Сохранение…' : 'Добавить магазин'}</button>
        </form>
        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}
      </section>
    </main>
  );
}

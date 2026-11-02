import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AwesomeSlider from "react-awesome-slider";
import "react-awesome-slider/dist/styles.css";
import "react-awesome-slider/dist/captioned.css";
import styles from '../styles/Home.module.css'

const buttonStyle = {
  padding: "15px",
  borderRadius: "50%",
  background: "red",
  opacity: 0.7,
  fontSize: "20px"
};
const headerStyle = {
  color: 'white',
  position: "absolute",
  zIndex: 5,
  top: '30%',
  left: 0,
  right: 0,
  textAlign: 'center',
  padding: '0 20px',
  margin: 0,
  fontSize: 'clamp(20px, 4vw, 36px)'
}
const contentStyle = {
  color: 'white',
  textAlign: "center",
  top: '50%',
  left: 0,
  right: 0,
  padding: '0 20px',
  fontSize: 'clamp(16px, 3vw, 24px)',
  position: "absolute",
  zIndex: 5
}
const bgImg = {
  position: "fixed",
  zIndex: 3,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%"
};

function sendEmail(email) {
  const body = `Здравствуйте, я нашел вашего питомца.\n-----------\nС уважением, ${localStorage.getItem('user') || 'посетитель Petto'}`;
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Потерянный зверь')}&body=${encodeURIComponent(body)}`;
}

function Animal(props) {
  if (!props.data) return <p>Loading</p>
  const { header, content, img } = props.data;
  return (
    <div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 4, background: 'linear-gradient(transparent, rgba(0,0,0,.7))' }} />
      <h1 style={headerStyle}>{header}</h1> <br />
      <h2 style={contentStyle}>{content}</h2>
      <img
        style={{ ...bgImg, position: 'absolute', objectFit: 'cover' }}
        alt={header}
        src={img}
      />
    </div>
  );
}

export default function Home() {
  const [animals, setAnimals] = React.useState([]);
  const [user, setUser] = React.useState('');
  const [draftName, setDraftName] = React.useState('');
  const [loadError, setLoadError] = React.useState('');
  React.useEffect(() => {
    fetch('/api/animals').then(async response => {
      if (!response.ok) throw new Error('Не удалось загрузить объявления. Обновите страницу.');
      setAnimals(await response.json());
    }).catch(error => setLoadError(error.message));
  }, []);
  React.useEffect(() => {
    setUser(localStorage.getItem('user') || '');
  }, []);

  function logout() {
    localStorage.removeItem('user');
    setUser('');
    setDraftName('');
  }

  function saveName(e) {
    e.preventDefault();
    if (!draftName.trim()) return;
    localStorage.setItem('user', draftName.trim());
    setUser(draftName.trim());
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Petto</title>
        <meta name="description" content="Социальная сеть для питомцев" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav><Link href="/add-animal" className="primary-link">Добавить животное</Link><Link href="/zooshops">Зоомагазины</Link><Link href="/content">Видео</Link><button onClick={logout}>Сменить имя</button></nav>
        <h1>Petto</h1>
        {user ? <p>Здравствуйте, {user}!</p> : <form onSubmit={saveName} className="name-form"><label>Ваше имя<input value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={80} required /></label><button>Сохранить имя</button></form>}
        <p>Помогаем питомцам вернуться домой. Нажмите на карточку, чтобы написать владельцу.</p>
        <p>Орищенко М.Д., Макаров А.С. · группа 23ВВИ1</p>
        {loadError && <p role="alert" className="error">{loadError}</p>}
        <AwesomeSlider style={{ "--slider-height-percentage": "65%" }}>
          {
            animals.map((data, i) => <div key={data.id || i} style={{ zIndex: 2 }} onClick={() => sendEmail(data?.email)}>
              <Animal data={data} />
            </div>)
          }
        </AwesomeSlider>
      </main>

      <footer className={styles.footer}>
        Petto © 2026 · Учебный проект
      </footer>
    </div>
  )
}

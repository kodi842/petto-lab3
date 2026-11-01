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
  zIndex: 4,
  top: '30%',
  left: '40%'
}
const contentStyle = {
  color: 'white',
  textAlign: "center",
  top: '50%',
  left: '25%',
  position: "absolute",
  zIndex: 4
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
  window.location.href = `mailto:${email}?subject=${encodeURIComponent('Потерянный зверь')}&body=${encodeURIComponent(body)}`;
}

function Animal(props) {
  if (!props.data) return <p>Loading</p>
  const { header, content, img } = props.data;
  return (
    <div>
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
  React.useEffect(() => {
    fetch('/animals.json').then(data => data.json()).then(data => setAnimals(data));
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
        <nav><Link href="/zooshops">Зоомагазины</Link><Link href="/content">Видео</Link><button onClick={logout}>Сменить имя</button></nav>
        <h1>Petto</h1>
        {user ? <p>Здравствуйте, {user}!</p> : <form onSubmit={saveName} className="name-form"><label>Ваше имя<input value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={80} required /></label><button>Сохранить имя</button></form>}
        <p>Помогаем питомцам вернуться домой. Нажмите на карточку, чтобы написать владельцу.</p>
        <p>Орищенко М.Д., Макаров А.С. · группа 23ВВИ1</p>
        <AwesomeSlider style={{ "--slider-height-percentage": "65%" }}>
          {
            animals.map((data, i) => <div key={i} style={{ zIndex: 2 }} onClick={() => sendEmail(data?.email)}>
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

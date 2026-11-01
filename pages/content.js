import Head from "next/head";
import YouTube from "react-youtube";
import Link from "next/link";

const opts = {
  height: "390",
  width: "640",
  playerVars: {
    autoplay: 0,
  },
};

export default function Content() {
  return (
    <>
      <Head>
        <title>Content</title>
      </Head>
      <main className="shops-page">
        <nav><Link href="/">← Petto</Link><Link href="/zooshops">Зоомагазины</Link></nav>
        <h1>Видео с YouTube</h1>
        <YouTube videoId="SqcY0GlETPk" opts={opts} />
      </main>
    </>
  );
}

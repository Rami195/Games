import { useState } from "react";
import GameMenu from "./components/GameMenu";
import ImpostorGame from "./games/ImpostorGame";
import SayMyNameGame from "./games/SayMyNameGame";
import MemoryMatchGame from "./games/MemoryMatchGame";

const GAMES = [
  { id: "impostor", title: "El impostor", desc: "Deduce quién es el impostor con pistas.", emoji: "🕵️‍♂️" },
  { id: "saymyname", title: "Say My Name", desc: "Adiviná el nombre correcto con pistas.", emoji: "🎤" },
  { id: "memory", title: "Memory Match", desc: "Encontrá las parejas lo más rápido posible.", emoji: "🧠" },
];

export default function App() {
  const [selected, setSelected] = useState(null);

  // ✅ Solo lo usamos para ocultar "Volver al menú" cuando SayMyName está en play
  const [isSayMyNamePlaying, setIsSayMyNamePlaying] = useState(false);

  const showBackButton =
    selected && !(selected === "saymyname" && isSayMyNamePlaying);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Juegos 🎮</h1>
            <p className="text-slate-300">Elegí un juego para empezar.</p>
          </div>

          {showBackButton && (
            <button
              onClick={() => {
                setSelected(null);
                setIsSayMyNamePlaying(false); // por las dudas
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Volver al menú
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-10">
        {!selected ? (
          <GameMenu games={GAMES} onSelect={setSelected} />
        ) : selected === "impostor" ? (
          <ImpostorGame />
        ) : selected === "saymyname" ? (
          <SayMyNameGame onPlayingChange={setIsSayMyNamePlaying} />
        ) : (
          <MemoryMatchGame />
        )}
      </main>
    </div>
  );
}

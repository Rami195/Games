import { useEffect, useState } from "react";
import GameMenu from "./components/GameMenu";
import ImpostorGame from "./games/ImpostorGame";
import SayMyNameGame from "./games/SayMyNameGame";
import MemoryMatchGame from "./games/MemoryMatchGame";
import RoscoGame from "./games/RoscoGame";

const GAMES = [
  { id: "impostor", title: "El impostor", desc: "Deduce quién es el impostor con pistas.", emoji: "🕵️‍♂️", Component: ImpostorGame },
  { id: "saymyname", title: "Say My Name", desc: "Adiviná el nombre correcto con pistas.", emoji: "🎤", Component: SayMyNameGame },
  { id: "rosco", title: "El Rosco", desc: "De la A a la Z, contrarreloj y con pasapalabra.", emoji: "🔤", Component: RoscoGame },
  { id: "memory", title: "Memory Match", desc: "Encontrá las parejas lo más rápido posible.", emoji: "🧠", Component: MemoryMatchGame },
];

const THEME_KEY = "app-theme";

// Arranca con lo último elegido; si nunca eligió, sigue al sistema.
function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage bloqueado: seguimos con la preferencia del sistema
  }
  const prefiereOscuro =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefiereOscuro ? "dark" : "light";
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useState(initialTheme);

  // El atributo del <html> es lo que activa las variantes dark: de Tailwind
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // si no se puede guardar, el tema igual funciona en esta sesión
    }
  }, [theme]);

  // ✅ Solo lo usamos para ocultar "Volver al menú" cuando SayMyName está en play
  const [isSayMyNamePlaying, setIsSayMyNamePlaying] = useState(false);

  const current = GAMES.find((g) => g.id === selected) ?? null;
  const Current = current?.Component ?? null;

  const showBackButton =
    selected && !(selected === "saymyname" && isSayMyNamePlaying);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <header className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Juegos 🎮</h1>
            <p className="text-slate-600 dark:text-slate-300">Elegí un juego para empezar.</p>
          </div>

          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={() => {
                  setSelected(null);
                  setIsSayMyNamePlaying(false); // por las dudas
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ← Volver al menú
              </button>
            )}

            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <span key={theme} className="animate-pop">
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* key: al cambiar de pantalla se remonta y vuelve a animar la entrada */}
      <main key={selected ?? "menu"} className="mx-auto max-w-5xl px-4 pb-10">
        {!Current ? (
          <GameMenu games={GAMES} onSelect={setSelected} />
        ) : current.id === "saymyname" ? (
          <div className="animate-fade-in-up">
            <Current onPlayingChange={setIsSayMyNamePlaying} />
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <Current />
          </div>
        )}
      </main>
    </div>
  );
}

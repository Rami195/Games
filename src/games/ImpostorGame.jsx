import { useMemo, useState, useEffect } from "react";

const STORAGE_KEY = "impostor-game-state";

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

const WORD_BANK = {
  Objetos: [
    "Llave", "Reloj", "Celular", "Auriculares", "Notebook", "Control remoto",
    "Cargador", "Mochila", "Billetera", "Anteojos", "Paraguas", "Termo",
    "Botella", "Silla", "Mesa", "Cuchillo", "Taza", "Vaso", "Campera",
    "Zapatillas", "Anillo", "Pulsera", "Cuaderno", "Lapicera", "Mouse",
    "Teclado", "Televisor", "Ventilador", "Heladera", "Microondas",
    "Lámpara", "Cortina", "Almohada", "Colchón", "Llave inglesa",
    "Martillo", "Destornillador", "Taladro", "Plancha", "Escoba",
    "Balde", "Cepillo", "Espejo", "Perfume", "Rasuradora",
    "Encendedor", "Cartera", "Pendrive",
  ],

  Comida: [
    "Asado", "Empanadas", "Milanesa", "Pizza", "Hamburguesa", "Papas fritas",
    "Helado", "Choripán", "Locro", "Guiso", "Fideos", "Ravioles",
    "Ñoquis", "Lasagna", "Sushi", "Arroz", "Pollo al horno", "Ensalada",
    "Sandwich", "Tacos", "Burrito", "Puré", "Pastel de papa", "Canelones",
    "Tarta", "Pan", "Medialunas", "Facturas", "Budín", "Tostadas",
    "Queso", "Jamón", "Salame", "Picada", "Aceitunas",
    "Chocolate", "Dulce de leche", "Flan", "Gelatina", "Yogur",
    "Café", "Mate", "Té", "Vino", "Cerveza",
  ],

  Animales: [
    "Perro", "Gato", "Caballo", "Vaca", "Toro", "León", "Tigre", "Elefante",
    "Jirafa", "Mono", "Gorila", "Delfín", "Ballena", "Tiburón", "Pulpo",
    "Águila", "Halcón", "Búho", "Pingüino", "Oso", "Lobo", "Zorro",
    "Conejo", "Ratón", "Hámster", "Serpiente", "Cocodrilo", "Lagarto",
    "Iguana", "Camaleón", "Araña", "Escorpión", "Hormiga", "Abeja",
    "Mosquito", "Mariposa", "Caracol", "Tortuga", "Pez payaso",
    "Caballito de mar", "Medusa", "Rana", "Sapo", "Murciélago",
    "Ciervo", "Jabalí", "Puma", "Yacaré",
  ],

  Peliculas: [
    "El Padrino", "Titanic", "Forrest Gump", "Matrix", "Inception",
    "Gladiador", "El Club de la Pelea", "Pulp Fiction", "El Señor de los Anillos",
    "Star Wars", "Batman", "Joker", "Interstellar", "Avatar", "Rocky",
    "Taxi Driver", "Scarface", "El Resplandor", "Volver al Futuro",
    "Jurassic Park", "Terminator", "Alien", "Depredador", "Toy Story",
    "Buscando a Nemo", "Up", "Coco", "Shrek", "El Rey León",
    "La Lista de Schindler", "Bastardos sin gloria", "Django",
    "El Lobo de Wall Street", "Casino", "Goodfellas",
    "Psicosis", "El Sexto Sentido", "Mad Max",
    "Blade Runner", "Memento", "Her", "La La Land", "Whiplash",
    "Parásitos", "Oldboy", "El Silencio de los Inocentes", "Se7en",
  ],

  Deportes: [
    "Fútbol", "Básquet", "Tenis", "Rugby", "Vóley", "Hockey",
    "Boxeo", "Artes marciales", "Natación", "Atletismo",
    "Ciclismo", "Automovilismo", "Fórmula 1", "Motociclismo",
    "Golf", "Polo", "Handball", "Surf", "Skate",
    "Snowboard", "Esquí", "Levantamiento de pesas",
    "Crossfit", "Triatlón", "Maratón", "Ping pong",
    "Béisbol", "Softbol", "Cricket", "Badminton",
    "Karate", "Judo", "Taekwondo", "Lucha libre",
    "Esgrima", "Remo", "Canotaje", "Ajedrez",
    "E-sports", "Counter-Strike", "League of Legends", "FIFA",
    "NBA", "Copa Libertadores", "Champions League", "Mundial",
    "Copa América", "Dakar",
  ],

  Argentina: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Bariloche",
    "Mar del Plata", "Salta", "Jujuy", "Tucumán", "Patagonia",
    "Aconcagua", "Obelisco", "Casa Rosada", "Plaza de Mayo",
    "Congreso", "Perito Moreno", "Iguazú", "Cataratas",
    "Mate", "Asado", "Dulce de leche", "Fernet", "Empanadas",
    "Alfajores", "Tango", "Folklore", "Rock nacional", "Malvinas",
    "Boca Juniors", "River Plate", "Selección Argentina",
    "Messi", "Maradona", "Gardel", "Soda Stereo", "Charly García",
    "Spinetta", "Mercedes Sosa", "Los Redondos", "Fito Páez",
    "El Eternauta", "Bandera argentina", "Ushuaia", "Calafate",
    "La Bombonera", "Monumental", "Ruta 40", "San Martín de los Andes",
    "Cuyo", "Litoral", "Pampa", "Vino mendocino", "Parrilla",
  ],

  Cantantes: [
    "Michael Jackson", "Madonna", "Elvis Presley", "Freddie Mercury",
    "Beyoncé", "Rihanna", "Taylor Swift", "Adele", "Bruno Mars",
    "Ed Sheeran", "The Weeknd", "Justin Bieber", "Shakira",
    "Bad Bunny", "Daddy Yankee", "Karol G", "Rosalía",
    "Luis Miguel", "Juanes", "Soda Stereo", "Gustavo Cerati",
    "Charly García", "Spinetta", "Fito Páez", "Andrés Calamaro",
    "Joaquín Sabina", "Serrat", "Bob Dylan", "John Lennon",
    "Paul McCartney", "Mick Jagger", "Kurt Cobain", "Axl Rose",
    "Eminem", "Drake", "Kanye West", "Jay-Z", "Snoop Dogg",
    "2Pac", "Notorious B.I.G.", "Lana del Rey", "Billie Eilish",
    "Harry Styles", "Chris Martin", "Coldplay", "David Bowie",
    "Queen", "Metallica", "AC/DC", "U2",
  ],
};

function clampInt(val, min, max) {
  const n = Number.parseInt(val, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ImpostorGame() {
  const categories = useMemo(() => Object.keys(WORD_BANK), []);

  // Cargamos estado guardado UNA VEZ al inicio
  const savedState = useMemo(() => loadGameState(), []);

  const [phase, setPhase] = useState(() => savedState?.phase ?? "setup"); // setup | reveal | debate | results

  // Setup
  const [playersCount, setPlayersCount] = useState(() => savedState?.playersCount ?? 6);
  const [impostorsCount, setImpostorsCount] = useState(() => savedState?.impostorsCount ?? 1);
  const [selectedCategories, setSelectedCategories] = useState(
    () => savedState?.selectedCategories ?? [categories[0]].filter(Boolean)
  );
  const [debateMinutes, setDebateMinutes] = useState(() => savedState?.debateMinutes ?? 3);

  // Game state
  const [secretWord, setSecretWord] = useState(() => savedState?.secretWord ?? "");
  const [players, setPlayers] = useState(() => savedState?.players ?? []); // {id, name, isImpostor}
  const [impostorIndexes, setImpostorIndexes] = useState(() => savedState?.impostorIndexes ?? []);
  const [openPlayerId, setOpenPlayerId] = useState(() => savedState?.openPlayerId ?? null);

  // Debate timer
  const [debateSecondsLeft, setDebateSecondsLeft] = useState(() => savedState?.debateSecondsLeft ?? 0);
  const [isTimerRunning, setIsTimerRunning] = useState(() => savedState?.isTimerRunning ?? false);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const stateToSave = {
      phase,
      playersCount,
      impostorsCount,
      selectedCategories,
      debateMinutes,
      secretWord,
      players,
      impostorIndexes,
      openPlayerId,
      debateSecondsLeft,
      isTimerRunning,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    phase,
    playersCount,
    impostorsCount,
    selectedCategories,
    debateMinutes,
    secretWord,
    players,
    impostorIndexes,
    openPlayerId,
    debateSecondsLeft,
    isTimerRunning,
  ]);

  // Validación dinámica: impostores <= jugadores-1
  useEffect(() => {
    const maxImpostors = Math.max(1, playersCount - 1);
    if (impostorsCount > maxImpostors) setImpostorsCount(maxImpostors);
    if (playersCount < 3) setPlayersCount(3);
  }, [playersCount, impostorsCount]);

  // Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    if (debateSecondsLeft <= 0) {
      setIsTimerRunning(false);
      setPhase("results");
      return;
    }
    const t = setInterval(() => setDebateSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isTimerRunning, debateSecondsLeft]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function startGame() {
    const allWords = selectedCategories.flatMap((c) => WORD_BANK[c] ?? []);
    const word = allWords.length > 0 ? pickRandom(allWords) : "PALABRA";
    setSecretWord(word);

    const indices = shuffle([...Array(playersCount)].map((_, i) => i)).slice(0, impostorsCount);
    indices.sort((a, b) => a - b);
    setImpostorIndexes(indices);

    const newPlayers = Array.from({ length: playersCount }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Jugador ${i + 1}`,
      isImpostor: indices.includes(i),
    }));

    setPlayers(newPlayers);
    setOpenPlayerId(null);

    setPhase("reveal");
    setIsTimerRunning(false);
    setDebateSecondsLeft(debateMinutes * 60);
  }

  function toggleReveal(playerId) {
    setOpenPlayerId((current) => (current === playerId ? null : playerId));
  }

  function beginDebate() {
    setOpenPlayerId(null);
    setPhase("debate");
    setDebateSecondsLeft(debateMinutes * 60);
    setIsTimerRunning(true);
  }

  function pauseResume() {
    setIsTimerRunning((v) => !v);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);

    setPhase("setup");
    setSecretWord("");
    setPlayers([]);
    setImpostorIndexes([]);
    setOpenPlayerId(null);
    setIsTimerRunning(false);
    setDebateSecondsLeft(0);
  }

  const maxImpostors = Math.max(1, playersCount - 1);

  const totalWords = selectedCategories.reduce((acc, c) => acc + (WORD_BANK[c]?.length ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🕵️‍♂️ El Impostor</h2>
            <p className="text-slate-300">Revelen su rol en secreto, debatan y encuentren al impostor.</p>
          </div>

          {phase !== "setup" && (
            <button
              onClick={resetAll}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>

      {/* SETUP */}
      {phase === "setup" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Configuración</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Cantidad de jugadores (min 3)</label>
              <input
                type="number"
                value={playersCount}
                min={3}
                max={20}
                onChange={(e) => setPlayersCount(clampInt(e.target.value, 3, 20))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Cantidad de impostores (1 a {maxImpostors})</label>
              <input
                type="number"
                value={impostorsCount}
                min={1}
                max={maxImpostors}
                onChange={(e) => setImpostorsCount(clampInt(e.target.value, 1, maxImpostors))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
              <p className="text-xs text-slate-400">
                Recomendación: 1 impostor hasta 6 jugadores; 2 impostores a partir de 7-10.
              </p>
            </div>

            {/* Checklist de categorías */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-300">Categorías (podés elegir varias)</label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => {
                  const checked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                        checked
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-black/30 text-slate-300 hover:bg-black/20",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat)}
                        className="accent-emerald-500"
                      />
                      {cat}
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400">Palabras disponibles: {totalWords}</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-300">Tiempo de debate (minutos)</label>
              <input
                type="number"
                value={debateMinutes}
                min={1}
                max={15}
                onChange={(e) => setDebateMinutes(clampInt(e.target.value, 1, 15))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={selectedCategories.length === 0}
            className={[
              "mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition",
              selectedCategories.length === 0
                ? "cursor-not-allowed bg-emerald-500/20 text-emerald-200/40"
                : "cursor-pointer bg-emerald-800 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
            ].join(" ")}
          >
            Comenzar juego
          </button>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <b>Cómo se juega:</b> Cada jugador ve su palabra/rol en secreto. Tripulantes ven la palabra.
            Impostores ven “IMPOSTOR”. Luego debaten y votan.
          </div>
        </div>
      )}

      {/* REVEAL */}
      {phase === "reveal" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Revelar roles</h3>
              <p className="text-slate-300 text-sm">Cada jugador toca su card para ver su rol.</p>
            </div>

            <button
              onClick={beginDebate}
              className="rounded-2xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15"
            >
              Iniciar debate ({debateMinutes} min)
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <SimpleRevealCard
                key={p.id}
                title={p.name}
                isOpen={openPlayerId === p.id}
                onToggle={() => toggleReveal(p.id)}
                backContent={
                  p.isImpostor ? (
                    <div className="text-center">
                      <div className="text-4xl font-black tracking-wide text-rose-300">IMPOSTOR</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm text-slate-200 mb-2">La palabra es</div>
                      <div className="text-4xl font-black tracking-wide text-emerald-200">{secretWord}</div>
                    </div>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* DEBATE */}
      {phase === "debate" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Debate</h3>
              <p className="text-slate-300 text-sm">Hablen, hagan preguntas y voten al final.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 font-mono text-lg">
                {formatTime(debateSecondsLeft)}
              </span>
              <button
                onClick={pauseResume}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                {isTimerRunning ? "Pausar" : "Reanudar"}
              </button>
              <button
                onClick={() => setPhase("results")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Terminar
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <b>Regla sugerida:</b> Cada jugador da una pista sin decir la palabra. Luego ronda de preguntas rápidas.
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Resultados</h3>
              <p className="text-slate-300 text-sm">Revelá impostores y palabra.</p>
            </div>

            <button
              onClick={() => setPhase("reveal")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Volver a cards
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-sm text-slate-300">Palabra</div>
              <div className="mt-2 text-3xl font-black tracking-wide text-emerald-200">{secretWord}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-sm text-slate-300">Impostores</div>
              <div className="mt-2 space-y-1">
                {impostorIndexes.length ? (
                  impostorIndexes.map((i) => (
                    <div key={i} className="text-lg font-semibold text-rose-200">
                      Jugador {i + 1}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-300">No hay datos.</div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15"
          >
            Jugar otra ronda (misma config)
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Card sin rotación: se “destapa” ocupando toda la card.
 * - No se invierte el texto.
 * - No se desborda.
 */
function SimpleRevealCard({ title, isOpen, onToggle, backContent }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
    >
      {/* FRONT */}
      <div
        className={[
          "absolute inset-0 p-4 transition-opacity duration-200",
          isOpen ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="text-xl font-semibold">{title}</div>
          <div className="text-sm text-slate-300">Tocá para mostrar</div>
        </div>
      </div>

      {/* BACK (ocupa toda la card) */}
      <div
        className={[
          "absolute inset-0 p-4 transition-opacity duration-200 bg-black/40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="text-sm text-slate-300">{title}</div>

          <div className="flex-1 grid place-items-center">
            <div className="w-full text-center">{backContent}</div>
          </div>

          <div className="text-sm text-slate-300">Tocá para ocultar</div>
        </div>
      </div>
    </button>
  );
}

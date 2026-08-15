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

/* ===== helpers numéricos seguros (NO traban input) ===== */
function toNumberOrNaN(v) {
  const n = Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? NaN : n;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function onlyDigitsOrEmpty(v) {
  return v === "" || /^\d+$/.test(v);
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
  const savedState = useMemo(() => loadGameState(), []);

  const [phase, setPhase] = useState(() => savedState?.phase ?? "setup"); // setup | reveal | debate | results

  // ✅ Setup (inputs como STRING para no trabar)
  const [playersCount, setPlayersCount] = useState(() =>
    String(savedState?.playersCount ?? 6)
  );
  const [impostorsCount, setImpostorsCount] = useState(() =>
    String(savedState?.impostorsCount ?? 1)
  );
  const [debateMinutes, setDebateMinutes] = useState(() =>
    String(savedState?.debateMinutes ?? 3)
  );

  const [selectedCategories, setSelectedCategories] = useState(
    () => savedState?.selectedCategories ?? [categories[0]].filter(Boolean)
  );

  // Game state
  const [secretWord, setSecretWord] = useState(() => savedState?.secretWord ?? "");
  const [players, setPlayers] = useState(() => savedState?.players ?? []); // {id, name, isImpostor}
  const [impostorIndexes, setImpostorIndexes] = useState(() => savedState?.impostorIndexes ?? []);
  const [openPlayerId, setOpenPlayerId] = useState(() => savedState?.openPlayerId ?? null);

  // Reveal de a uno: turno actual y si el jugador actual ya vio su rol
  const [revealIndex, setRevealIndex] = useState(() => savedState?.revealIndex ?? 0);
  const [hasRevealedCurrent, setHasRevealedCurrent] = useState(
    () => savedState?.hasRevealedCurrent ?? false
  );

  // Debate timer
  const [debateSecondsLeft, setDebateSecondsLeft] = useState(() => savedState?.debateSecondsLeft ?? 0);
  const [isTimerRunning, setIsTimerRunning] = useState(() => savedState?.isTimerRunning ?? false);

  // ✅ valores numéricos derivados (para cálculos)
  const playersCountNum = useMemo(() => {
    const n = toNumberOrNaN(playersCount);
    return Number.isNaN(n) ? 0 : n;
  }, [playersCount]);

  const impostorsCountNum = useMemo(() => {
    const n = toNumberOrNaN(impostorsCount);
    return Number.isNaN(n) ? 0 : n;
  }, [impostorsCount]);

  const debateMinutesNum = useMemo(() => {
    const n = toNumberOrNaN(debateMinutes);
    return Number.isNaN(n) ? 0 : n;
  }, [debateMinutes]);

  const maxImpostors = Math.max(1, (playersCountNum || 3) - 1);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const safePlayers = playersCountNum || (savedState?.playersCount ?? 6);
    const safeImpostors = impostorsCountNum || (savedState?.impostorsCount ?? 1);
    const safeDebate = debateMinutesNum || (savedState?.debateMinutes ?? 3);

    const stateToSave = {
      phase,
      playersCount: safePlayers,
      impostorsCount: safeImpostors,
      selectedCategories,
      debateMinutes: safeDebate,
      secretWord,
      players,
      impostorIndexes,
      openPlayerId,
      revealIndex,
      hasRevealedCurrent,
      debateSecondsLeft,
      isTimerRunning,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    phase,
    playersCountNum,
    impostorsCountNum,
    debateMinutesNum,
    selectedCategories,
    secretWord,
    players,
    impostorIndexes,
    openPlayerId,
    revealIndex,
    hasRevealedCurrent,
    debateSecondsLeft,
    isTimerRunning,
    savedState?.playersCount,
    savedState?.impostorsCount,
    savedState?.debateMinutes,
  ]);

  // ✅ Validación dinámica SIN trabar inputs
  // (cuando cambia playersCount, si los impostores quedan fuera de rango, los ajusta)
  useEffect(() => {
    // Solo ajustar impostores cuando playersCount es un número válido (y ya fue seteado)
    if (!playersCountNum || playersCount === "") return;

    const maxI = Math.max(1, playersCountNum - 1);

    // si impostorsCount está vacío, lo dejamos (no molestamos mientras escribe)
    if (impostorsCount === "") return;

    const i = impostorsCountNum;
    if (!i) return;

    if (i > maxI) setImpostorsCount(String(maxI));
    if (i < 1) setImpostorsCount("1");
  }, [playersCountNum, playersCount, impostorsCount, impostorsCountNum]);

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
    const pCount = clamp(playersCountNum || 6, 3, 20);
    const iCount = clamp(impostorsCountNum || 1, 1, Math.max(1, pCount - 1));
    const dMins = clamp(debateMinutesNum || 3, 1, 15);

    if (selectedCategories.length === 0) {
      alert("Elegí al menos una categoría.");
      return;
    }

    const allWords = selectedCategories.flatMap((c) => WORD_BANK[c] ?? []);
    const word = allWords.length > 0 ? pickRandom(allWords) : "PALABRA";
    setSecretWord(word);

    const indices = shuffle([...Array(pCount)].map((_, i) => i)).slice(0, iCount);
    indices.sort((a, b) => a - b);
    setImpostorIndexes(indices);

    const newPlayers = Array.from({ length: pCount }, (_, i) => ({
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${i}`,
      name: `Jugador ${i + 1}`,
      isImpostor: indices.includes(i),
    }));

    setPlayers(newPlayers);
    setOpenPlayerId(null);
    setRevealIndex(0);
    setHasRevealedCurrent(false);

    setPhase("reveal");
    setIsTimerRunning(false);
    setDebateSecondsLeft(dMins * 60);
  }

  function toggleReveal(playerId) {
    setOpenPlayerId((current) => (current === playerId ? null : playerId));
    setHasRevealedCurrent(true);
  }

  // Pasa el turno al siguiente jugador, tapando la card antes de entregar el dispositivo.
  function nextPlayer() {
    setOpenPlayerId(null);
    setHasRevealedCurrent(false);
    setRevealIndex((i) => i + 1);
  }

  function restartReveal() {
    setOpenPlayerId(null);
    setHasRevealedCurrent(false);
    setRevealIndex(0);
    setPhase("reveal");
  }

  function beginDebate() {
    const dMins = clamp(debateMinutesNum || 3, 1, 15);
    setOpenPlayerId(null);
    setHasRevealedCurrent(false);
    setPhase("debate");
    setDebateSecondsLeft(dMins * 60);
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
    setRevealIndex(0);
    setHasRevealedCurrent(false);
    setIsTimerRunning(false);
    setDebateSecondsLeft(0);

    // opcional: reset de setup
    setPlayersCount("6");
    setImpostorsCount("1");
    setDebateMinutes("3");
    setSelectedCategories([categories[0]].filter(Boolean));
  }

  const totalWords = selectedCategories.reduce((acc, c) => acc + (WORD_BANK[c]?.length ?? 0), 0);

  // Reveal de a uno: jugador del turno actual (índice defensivo por si viene de localStorage)
  const safeRevealIndex = players.length ? clamp(revealIndex, 0, players.length - 1) : 0;
  const currentPlayer = players[safeRevealIndex] ?? null;
  const isLastPlayer = players.length > 0 && safeRevealIndex === players.length - 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🕵️‍♂️ El Impostor</h2>
            <p className="text-slate-600 dark:text-slate-300">Revelen su rol en secreto, debatan y encuentren al impostor.</p>
          </div>

          {phase !== "setup" && (
            <button
              onClick={resetAll}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>

      {/* SETUP */}
      {phase === "setup" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">Configuración</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Cantidad de jugadores (min 3)</label>
              <input
                type="text"
                value={playersCount}
                inputMode="numeric"
                pattern="\d*"
                onChange={(e) => {
                  const v = e.target.value;
                  if (!onlyDigitsOrEmpty(v)) return;
                  setPlayersCount(v);
                }}
                onBlur={() => {
                  const n = toNumberOrNaN(playersCount);
                  if (Number.isNaN(n)) {
                    setPlayersCount("6");
                  } else {
                    setPlayersCount(String(clamp(n, 3, 20)));
                  }
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 outline-none focus:bg-white dark:focus:bg-slate-800"
              />

            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Cantidad de impostores (1 a {maxImpostors})</label>
              <input
                type="number"
                value={impostorsCount}
                min={1}
                max={maxImpostors}
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value;
                  if (!onlyDigitsOrEmpty(v)) return;
                  setImpostorsCount(v);
                }}
                onBlur={() => {
                  const n = toNumberOrNaN(impostorsCount);
                  if (Number.isNaN(n)) setImpostorsCount("1");
                  else setImpostorsCount(String(clamp(n, 1, maxImpostors)));
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 outline-none focus:bg-white dark:focus:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recomendación: 1 impostor hasta 6 jugadores; 2 impostores a partir de 7-10.
              </p>
            </div>

            {/* Checklist de categorías */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Categorías (podés elegir varias)</label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => {
                  const checked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                        checked
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
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

              <p className="text-xs text-slate-500 dark:text-slate-400">Palabras disponibles: {totalWords}</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Tiempo de debate (minutos)</label>
              <input
                type="number"
                value={debateMinutes}
                min={1}
                max={15}
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value;
                  if (!onlyDigitsOrEmpty(v)) return;
                  setDebateMinutes(v);
                }}
                onBlur={() => {
                  const n = toNumberOrNaN(debateMinutes);
                  if (Number.isNaN(n)) setDebateMinutes("3");
                  else setDebateMinutes(String(clamp(n, 1, 15)));
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 outline-none focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={selectedCategories.length === 0}
            className={[
              "mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition",
              selectedCategories.length === 0
                ? "cursor-not-allowed bg-emerald-100 dark:bg-emerald-900 text-emerald-700/40 dark:text-emerald-300/40"
                : "cursor-pointer bg-emerald-600 text-slate-900 dark:text-slate-50 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
            ].join(" ")}
          >
            Comenzar juego
          </button>

          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-200">
            <b>Cómo se juega:</b> Cada jugador ve su palabra/rol en secreto. Tripulantes ven la palabra.
            Impostores ven “IMPOSTOR”. Luego debaten y votan.
          </div>
        </div>
      )}

      {/* REVEAL */}
      {phase === "reveal" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Revelar roles</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Un jugador por vez: mirá tu rol y pasá el dispositivo al siguiente.
              </p>
            </div>

            <span className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
              Turno {safeRevealIndex + 1} de {players.length}
            </span>
          </div>

          {/* Progreso */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {players.map((p, i) => (
              <span
                key={p.id}
                className={[
                  "h-1.5 flex-1 min-w-[16px] rounded-full transition",
                  i < safeRevealIndex
                    ? "bg-emerald-500"
                    : i === safeRevealIndex
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-200 dark:bg-slate-700",
                ].join(" ")}
              />
            ))}
          </div>

          {currentPlayer && (
            <div className="mx-auto mt-5 max-w-md">
              <p className="mb-3 text-center text-sm text-slate-600 dark:text-slate-300">
                Le toca a <b className="text-slate-900 dark:text-slate-50">{currentPlayer.name}</b>. Que nadie más mire la pantalla.
              </p>

              <SimpleRevealCard
                title={currentPlayer.name}
                isOpen={openPlayerId === currentPlayer.id}
                onToggle={() => toggleReveal(currentPlayer.id)}
                backContent={
                  currentPlayer.isImpostor ? (
                    <div className="text-center">
                      <div className="text-4xl font-black tracking-wide text-rose-600 dark:text-rose-400">IMPOSTOR</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm text-slate-700 dark:text-slate-200 mb-2">La palabra es</div>
                      <div className="text-4xl font-black tracking-wide text-emerald-700 dark:text-emerald-300">{secretWord}</div>
                    </div>
                  )
                }
              />

              <button
                onClick={isLastPlayer ? beginDebate : nextPlayer}
                disabled={!hasRevealedCurrent}
                className={[
                  "mt-4 w-full rounded-2xl px-5 py-3 font-semibold transition",
                  !hasRevealedCurrent
                    ? "cursor-not-allowed bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500"
                    : isLastPlayer
                      ? "cursor-pointer bg-emerald-600 text-slate-900 dark:text-slate-50 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                      : "cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600",
                ].join(" ")}
              >
                {isLastPlayer
                  ? `Iniciar debate (${clamp(debateMinutesNum || 3, 1, 15)} min)`
                  : `Pasar a ${players[safeRevealIndex + 1]?.name ?? "el siguiente"} →`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                {hasRevealedCurrent
                  ? "Tapá la card antes de pasar el dispositivo."
                  : "Tocá la card para ver tu rol."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* DEBATE */}
      {phase === "debate" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Debate</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Hablen, hagan preguntas y voten al final.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 font-mono text-lg">
                {formatTime(debateSecondsLeft)}
              </span>
              <button
                onClick={pauseResume}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {isTimerRunning ? "Pausar" : "Reanudar"}
              </button>
              <button
                onClick={() => setPhase("results")}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Terminar
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-200">
            <b>Regla sugerida:</b> Cada jugador da una pista sin decir la palabra. Luego ronda de preguntas rápidas.
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Resultados</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Revelá impostores y palabra.</p>
            </div>

            <button
              onClick={restartReveal}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Volver a cards
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
              <div className="text-sm text-slate-600 dark:text-slate-300">Palabra</div>
              <div className="mt-2 text-3xl font-black tracking-wide text-emerald-700 dark:text-emerald-300">{secretWord}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
              <div className="text-sm text-slate-600 dark:text-slate-300">Impostores</div>
              <div className="mt-2 space-y-1">
                {impostorIndexes.length ? (
                  impostorIndexes.map((i) => (
                    <div key={i} className="text-lg font-semibold text-rose-700 dark:text-rose-300">
                      Jugador {i + 1}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 dark:text-slate-300">No hay datos.</div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="mt-6 w-full rounded-2xl bg-slate-200 dark:bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
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
 */
function SimpleRevealCard({ title, isOpen, onToggle, backContent }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left shadow-sm transition hover:shadow-md"
    >
      {/* FRONT */}
      <div
        className={[
          "absolute inset-0 p-4 transition-all duration-300",
          isOpen ? "scale-95 opacity-0" : "scale-100 opacity-100",
        ].join(" ")}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="text-xl font-semibold">{title}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">Tocá para mostrar</div>
        </div>
      </div>

      {/* BACK */}
      <div
        className={[
          "absolute inset-0 p-4 transition-all duration-300 bg-slate-100 dark:bg-slate-900",
          isOpen ? "scale-100 opacity-100" : "scale-105 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-300">{title}</div>

          <div className="flex-1 grid place-items-center">
            <div className={["w-full text-center", isOpen ? "animate-pop" : ""].join(" ")}>{backContent}</div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-300">Tocá para ocultar</div>
        </div>
      </div>
    </button>
  );
}

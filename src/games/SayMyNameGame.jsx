import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "saymyname-game-state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampInt(v, min, max) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const CARD_BANK = {
  "Películas/Series": [
    "El Padrino", "Titanic", "Matrix", "Inception", "Interstellar", "Joker", "Gladiador", "Pulp Fiction",
    "Fight Club", "Breaking Bad", "Dark", "Stranger Things", "La Casa de Papel", "Game of Thrones",
    "Harry Potter", "El Señor de los Anillos", "Star Wars", "Black Mirror", "The Office", "Peaky Blinders",
    "Parásitos", "Whiplash", "La La Land", "Se7en", "El Silencio de los Inocentes", "Shrek", "Toy Story",
    "El Rey León", "The Boys", "Better Call Saul", "Narcos", "El Marginal", "Los Simuladores",
    "Casados con Hijos", "Chernobyl", "Oppenheimer", "Barbie", "Django", "Bastardos sin gloria",
    "Volver al Futuro", "Jurassic Park", "Terminator", "Alien", "Mad Max", "Blade Runner", "Memento",
    "El Resplandor", "Psicosis", "El Sexto Sentido"
  ],
  "Deportes/Deportistas": [
    "Lionel Messi", "Diego Maradona", "Cristiano Ronaldo", "Neymar", "Mbappé", "Pelé", "Ronaldinho",
    "Stephen Curry", "Michael Jordan", "Kobe Bryant", "LeBron James", "Manu Ginóbili", "Juan Martín del Potro",
    "Novak Djokovic", "Rafael Nadal", "Roger Federer", "Serena Williams", "Usain Bolt", "Michael Phelps",
    "Max Verstappen", "Lewis Hamilton", "Franco Colapinto", "Diego Simeone", "Pep Guardiola",
    "Carlos Tévez", "Ángel Di María", "Dibu Martínez", "Sergio Agüero",
    "Fútbol", "Básquet", "Tenis", "Rugby", "Fórmula 1", "Mundial", "Copa Libertadores",
    "Champions League", "Superclásico", "Boca Juniors", "River Plate", "Ajedrez", "Garry Kasparov",
    "UFC", "Conor McGregor", "Mike Tyson", "Muhammad Ali"
  ],
  "Música/Cantantes": [
    "Michael Jackson", "Madonna", "Freddie Mercury", "Queen", "The Beatles", "John Lennon", "Paul McCartney",
    "David Bowie", "Eminem", "Drake", "Taylor Swift", "Adele", "Rihanna", "Beyoncé",
    "The Weeknd", "Bruno Mars", "Ed Sheeran", "Shakira", "Bad Bunny", "Daddy Yankee", "Karol G",
    "Rosalía", "Luis Miguel", "Soda Stereo", "Gustavo Cerati", "Charly García", "Spinetta", "Fito Páez",
    "Andrés Calamaro", "Los Redondos", "La Renga", "Duki", "Bizarrap", "Tini", "Nicki Nicole", "Wos",
    "Metallica", "AC/DC", "Coldplay", "U2", "Pink Floyd", "Guns N' Roses", "Axl Rose",
    "Nirvana", "Kurt Cobain", "Lady Gaga", "Billie Eilish"
  ],
  "Argentina": [
    "Buenos Aires", "Mendoza", "Córdoba", "Rosario", "Bariloche", "Mar del Plata", "Ushuaia", "El Calafate",
    "Cataratas del Iguazú", "Aconcagua", "Obelisco", "Casa Rosada", "Plaza de Mayo",
    "La Bombonera", "El Monumental", "Ruta 40", "Patagonia", "Mate", "Asado", "Fernet", "Dulce de leche",
    "Alfajor", "Empanadas", "Choripán", "Parrilla", "Vino mendocino", "Tango", "Gardel", "Mercedes Sosa",
    "Soda Stereo", "Malvinas", "Perito Moreno", "San Martín de los Andes",
    "Selección Argentina", "Messi", "Maradona"
  ],
  "Vale Todo": [
    "Tinder", "Netflix", "Uber", "WhatsApp", "Instagram", "TikTok", "Bitcoin", "ChatGPT", "Wi-Fi", "VPN", "Nmap",
    "Vino", "Cerveza", "Resaca", "Karaoke", "After", "Asado con amigos", "Cumpleaños",
    "Boda", "Divorcio", "Jefe tóxico", "Reunión", "Presentación", "Final de la facu", "Trámite",
    "DNI", "Pasaporte", "Aduana", "Aeropuerto", "Hotel", "Playa", "Boliche", "Mate amargo",
    "Fútbol 5", "Control remoto", "Aire acondicionado", "Microondas", "Heladera", "Corte de luz",
    "Banco", "Tarjeta de crédito", "Cuotas", "Inflación", "Dólar", "Propina", "Delivery"
  ],
};

const ROUNDS = [
  {
    id: 1,
    name: "Ronda 1",
    baseSeconds: 30,
    can: "Hablar, actuar, hacer sonidos, señalar, cantar, tararear.",
    cant: "Decir la palabra o una parte clara de la palabra.",
  },
  {
    id: 2,
    name: "Ronda 2",
    baseSeconds: 30,
    can: "Decir UNA sola palabra y actuar.",
    cant: "Decir la palabra, tararear/cantar, hacer sonidos.",
  },
  {
    id: 3,
    name: "Ronda 3",
    baseSeconds: 30,
    can: "Solo actuar.",
    cant: "Hacer sonidos o decir cualquier palabra.",
  },
  {
    id: 4,
    name: "Ronda ⚡",
    baseSeconds: 15,
    can: "Un intento por tarjeta. Rápido.",
    cant: "Dormirse 😅",
  },
];

// 👇 Un “theme” completo por equipo (todo el layout se tiñe)
const TEAM_THEME = [
  {
    name: "Azul",
    // Background general del panel del juego
    pageBg: "bg-gradient-to-br from-sky-950/35 via-slate-950/30 to-black/40",
    // Bordes y acentos
    border: "border-sky-400/25",
    ring: "ring-sky-400/25",
    softBg: "bg-sky-500/5",
    // Textos / badges
    dot: "text-sky-300",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-200",
    // Palabra (color principal del equipo)
    word: "text-sky-200",
  },
  {
    name: "Rojo",
    pageBg: "bg-gradient-to-br from-rose-950/30 via-slate-950/30 to-black/40",
    border: "border-rose-400/25",
    ring: "ring-rose-400/25",
    softBg: "bg-rose-500/5",
    dot: "text-rose-300",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-200",
    word: "text-rose-200",
  },
  {
    name: "Verde",
    pageBg: "bg-gradient-to-br from-emerald-950/28 via-slate-950/30 to-black/40",
    border: "border-emerald-400/25",
    ring: "ring-emerald-400/25",
    softBg: "bg-emerald-500/5",
    dot: "text-emerald-300",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-200",
    word: "text-emerald-200",
  },
  {
    name: "Violeta",
    pageBg: "bg-gradient-to-br from-violet-950/28 via-slate-950/30 to-black/40",
    border: "border-violet-400/25",
    ring: "ring-violet-400/25",
    softBg: "bg-violet-500/5",
    dot: "text-violet-300",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-200",
    word: "text-violet-200",
  },
];

export default function SayMyNameGame({ onPlayingChange }) {
  const categories = useMemo(() => Object.keys(CARD_BANK), []);
  const saved = useMemo(() => loadState(), []);

  const [phase, setPhase] = useState(() => saved?.phase ?? "setup");
  const [teamsCount, setTeamsCount] = useState(() => saved?.teamsCount ?? 2);
  const [cardsPerTeam, setCardsPerTeam] = useState(() => saved?.cardsPerTeam ?? 20);
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    () => saved?.selectedCategories ?? [categories[0]].filter(Boolean)
  );

  const [membersPerTeam, setMembersPerTeam] = useState(
    () =>
      saved?.membersPerTeam ??
      Array.from({ length: saved?.teamsCount ?? 2 }, () => 2)
  );

  const [roundIndex, setRoundIndex] = useState(() => saved?.roundIndex ?? 0);
  const [currentTeam, setCurrentTeam] = useState(() => saved?.currentTeam ?? 0);
  const [currentSlot, setCurrentSlot] = useState(() => saved?.currentSlot ?? 0);
  const [turnsDone, setTurnsDone] = useState(() => saved?.turnsDone ?? 0);

  const [scores, setScores] = useState(
    () => saved?.scores ?? Array.from({ length: 2 }, () => 0)
  );

  const [deck, setDeck] = useState(() => saved?.deck ?? []);

  const [secondsLeft, setSecondsLeft] = useState(() => saved?.secondsLeft ?? 0);
  const [running, setRunning] = useState(() => saved?.running ?? false);

  const round = ROUNDS[roundIndex];
  const topCard = deck?.[0] ?? null;

  const theme = TEAM_THEME[currentTeam] ?? TEAM_THEME[0];

  function getTurnSeconds() {
    return ROUNDS[roundIndex]?.baseSeconds ?? 30;
  }

  const totalTurnsThisRound = useMemo(() => {
    const sum = membersPerTeam.reduce((acc, n) => acc + (n ?? 0), 0);
    return Math.max(1, sum);
  }, [membersPerTeam]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function buildCardsPool() {
    return selectedCategories.flatMap((c) =>
      (CARD_BANK[c] ?? []).map((answer) => ({
        id: crypto.randomUUID(),
        answer,
        category: c,
      }))
    );
  }
  useEffect(() => {
    onPlayingChange?.(phase === "play");
  }, [phase, onPlayingChange]);

  useEffect(() => {
    setScores((prev) => Array.from({ length: teamsCount }, (_, i) => prev?.[i] ?? 0));
    setMembersPerTeam((prev) => Array.from({ length: teamsCount }, (_, i) => prev?.[i] ?? 2));

    setCurrentTeam((t) => Math.min(t, teamsCount - 1));
    setCurrentSlot((s) => Math.max(0, s));
  }, [teamsCount]);

  useEffect(() => {
    const stateToSave = {
      phase,
      teamsCount,
      cardsPerTeam,
      selectedCategories,
      membersPerTeam,
      roundIndex,
      currentTeam,
      currentSlot,
      turnsDone,
      scores,
      deck,
      secondsLeft,
      running,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    phase,
    teamsCount,
    cardsPerTeam,
    selectedCategories,
    membersPerTeam,
    roundIndex,
    currentTeam,
    currentSlot,
    turnsDone,
    scores,
    deck,
    secondsLeft,
    running,
  ]);

  function getNextTurn(team, slot) {
    const maxSlots = Math.max(1, ...membersPerTeam.map((n) => n || 1));

    let nextTeam = team;
    for (let tries = 0; tries < teamsCount; tries++) {
      nextTeam = (nextTeam + 1) % teamsCount;
      if ((membersPerTeam[nextTeam] ?? 1) > slot) return { team: nextTeam, slot };
    }

    for (let s = slot + 1; s < maxSlots; s++) {
      for (let t = 0; t < teamsCount; t++) {
        if ((membersPerTeam[t] ?? 1) > s) return { team: t, slot: s };
      }
    }

    return { team: 0, slot: 0 };
  }

  function autoAdvanceRoundIfNeeded(nextTurnsDone) {
    if (nextTurnsDone < totalTurnsThisRound) return false;

    const nextRoundIndex = roundIndex + 1;

    if (nextRoundIndex >= ROUNDS.length) {
      setPhase("results");
      setRunning(false);
      return true;
    }

    setRoundIndex(nextRoundIndex);
    setTurnsDone(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setSecondsLeft(ROUNDS[nextRoundIndex].baseSeconds);
    setRunning(false);
    return true;
  }

  useEffect(() => {
    if (!running) return;

    if (secondsLeft <= 0) {
      setRunning(false);

      const nextTurnsDone = turnsDone + 1;

      const advancedRound = autoAdvanceRoundIfNeeded(nextTurnsDone);
      if (advancedRound) return;

      setTurnsDone(nextTurnsDone);

      const next = getNextTurn(currentTeam, currentSlot);
      setCurrentTeam(next.team);
      setCurrentSlot(next.slot);

      setSecondsLeft(getTurnSeconds());
      return;
    }

    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [
    running,
    secondsLeft,
    currentTeam,
    currentSlot,
    membersPerTeam,
    teamsCount,
    roundIndex,
    turnsDone,
    totalTurnsThisRound,
  ]);

  function startGame() {
    const pool = buildCardsPool();
    const need = Math.max(10, cardsPerTeam * teamsCount);
    const baseDeck = shuffle(pool).slice(0, Math.min(pool.length, need));

    setDeck(baseDeck);

    setScores(Array.from({ length: teamsCount }, () => 0));
    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);

    setSecondsLeft(ROUNDS[0].baseSeconds);
    setRunning(false);
    setPhase("play");
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("setup");
    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);
    setScores(Array.from({ length: 2 }, () => 0));
    setDeck([]);
    setSecondsLeft(0);
    setRunning(false);
  }

  function startTurn() {
    setSecondsLeft(getTurnSeconds());
    setRunning(true);
  }

  function pauseResume() {
    setRunning((v) => !v);
  }

  function markGuessed() {
    if (!topCard || !running) return;
    setScores((prev) => prev.map((s, i) => (i === currentTeam ? s + 1 : s)));
    setDeck((prev) => prev.slice(1));
  }

  function passCard() {
    if (!topCard || !running) return;
    setDeck((prev) => (prev.length <= 1 ? prev : [...prev.slice(1), prev[0]]));
  }

  const poolCount = selectedCategories.reduce((acc, c) => acc + (CARD_BANK[c]?.length ?? 0), 0);
  const canStart = selectedCategories.length > 0;

  const memberNumberHuman = currentSlot + 1;
  const membersThisTeam = membersPerTeam[currentTeam] ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🎤 Say My Name</h2>
            <p className="text-slate-300">
              Mazo compartido + tema por equipo (background cambia según el turno).
            </p>
          </div>

          {phase !== "setup" && (
            <div className="relative">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Reiniciar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">¿Seguro?</span>

                  <button
                    onClick={resetAll}
                    className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-black hover:bg-rose-400"
                  >
                    Sí, reiniciar
                  </button>

                  <button
                    onClick={() => setConfirmReset(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SETUP */}
      {phase === "setup" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Configuración</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Equipos (2 a 4)</label>
              <input
                type="number"
                value={teamsCount}
                min={2}
                max={4}
                onChange={(e) => setTeamsCount(clampInt(e.target.value, 2, 4))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                Tamaño del mazo (cartasPorEquipo × equipos)
              </label>
              <input
                type="number"
                value={cardsPerTeam}
                min={10}
                max={80}
                onChange={(e) => setCardsPerTeam(clampInt(e.target.value, 10, 80))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-300">Integrantes por equipo</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: teamsCount }, (_, i) => {
                  const t = TEAM_THEME[i] ?? TEAM_THEME[0];
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-slate-300 mb-2">
                        Equipo {i + 1}{" "}
                        <span className={["ml-2 rounded-lg px-2 py-0.5 text-[11px]", t.badgeBg, t.badgeText].join(" ")}>
                          {t.name}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={membersPerTeam[i] ?? 2}
                        onChange={(e) => {
                          const v = clampInt(e.target.value, 1, 10);
                          setMembersPerTeam((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
                      />
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400">
                Total turnos por ronda: {totalTurnsThisRound}. 30s (R1–R3) y 15s (⚡).
              </p>
            </div>

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
              <p className="text-xs text-slate-400">Cartas disponibles en selección: {poolCount}</p>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={!canStart}
            className={[
              "mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition",
              !canStart
                ? "cursor-not-allowed bg-emerald-500/20 text-emerald-200/40"
                : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
            ].join(" ")}
          >
            Comenzar juego
          </button>
        </div>
      )}

      {/* PLAY: el “tema” cambia en todo este bloque */}
      {phase === "play" && (
        <div
          className={[
            "rounded-2xl border p-6 space-y-4",
            "border-white/10",
            theme.pageBg,
            theme.softBg,
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-300">{round.name}</div>

              <div className="text-xl font-bold flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5",
                    "bg-black/20",
                    theme.border,
                  ].join(" ")}
                >
                  <span className={theme.dot}>●</span>
                  Equipo {currentTeam + 1}
                  <span className={["ml-2 rounded-lg px-2 py-0.5 text-[11px]", theme.badgeBg, theme.badgeText].join(" ")}>
                    {theme.name}
                  </span>
                </span>

                <span className="text-slate-400 font-normal">
                  Integrante {memberNumberHuman}/{membersThisTeam}
                </span>

                <span className="text-slate-500 font-normal">• mazo compartido</span>
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Turnos en esta ronda: {turnsDone}/{totalTurnsThisRound}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={["rounded-2xl border bg-black/30 px-4 py-2 font-mono text-lg", theme.border].join(" ")}>
                {formatTime(secondsLeft)}
              </span>

              <button
                onClick={running ? pauseResume : startTurn}
                className={["rounded-xl border bg-white/5 px-4 py-2 text-sm hover:bg-white/10", theme.border].join(" ")}
              >
                {running ? "Pausar" : "Iniciar turno"}
              </button>
            </div>
          </div>

          <div className={["rounded-xl border bg-black/20 p-4 text-sm", theme.border].join(" ")}>
            <div className="text-emerald-200">
              <b>Podés:</b> {round.can}
            </div>
            <div className="mt-1 text-rose-200">
              <b>No podés:</b> {round.cant}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="grid gap-2 sm:grid-cols-4">
            {scores.map((s, i) => {
              const t = TEAM_THEME[i] ?? TEAM_THEME[0];
              const isActive = i === currentTeam;

              return (
                <div
                  key={i}
                  className={[
                    "rounded-xl border bg-black/20 px-4 py-3",
                    "border-white/10",
                    isActive ? `ring-2 ${t.ring}` : "",
                  ].join(" ")}
                >
                  <div className="text-xs text-slate-300">
                    Equipo {i + 1}{" "}
                    <span className={["ml-2 rounded-lg px-2 py-0.5 text-[11px]", t.badgeBg, t.badgeText].join(" ")}>
                      {t.name}
                    </span>
                  </div>
                  <div className="text-2xl font-black">{s}</div>
                </div>
              );
            })}
          </div>

          {!running ? (
            <div className={["rounded-2xl border bg-black/20 p-8 text-center", theme.border].join(" ")}>
              <div className="text-sm text-slate-300 mb-2">Turno preparado</div>
              <div className="text-2xl font-black">
                <span className={theme.badgeText}>Equipo {currentTeam + 1}</span> • Integrante {memberNumberHuman}/{membersThisTeam}
              </div>
              <div className="mt-2 text-slate-300">
                Tocá <b>Iniciar turno</b> para mostrar la tarjeta y empezar el tiempo.
              </div>
            </div>
          ) : (
            <AlwaysVisibleCard
              category={topCard ? topCard.category : "Sin cartas"}
              value={topCard ? topCard.answer : "No quedan cartas"}
              borderClass={theme.border}
              wordClass={theme.word}
              tintClass={theme.softBg}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={markGuessed}
              disabled={!topCard || !running}
              className={[
                "rounded-2xl px-5 py-3 font-semibold transition",
                !topCard || !running
                  ? "cursor-not-allowed bg-white/5 text-slate-400"
                  : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400",
              ].join(" ")}
            >
              ✅ Adivinada (+1)
            </button>

            <button
              onClick={passCard}
              disabled={!topCard || !running}
              className={[
                "rounded-2xl border bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10",
                theme.border,
                !topCard || !running ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              ].join(" ")}
            >
              ↩ Pasar
            </button>
          </div>

          <div className="text-xs text-slate-400">Cartas restantes: {deck.length}</div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Resultados</h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {scores.map((s, i) => {
              const t = TEAM_THEME[i] ?? TEAM_THEME[0];
              return (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-slate-300">
                    Equipo {i + 1}{" "}
                    <span className={["ml-2 rounded-lg px-2 py-0.5 text-[11px]", t.badgeBg, t.badgeText].join(" ")}>
                      {t.name}
                    </span>
                  </div>
                  <div className="text-3xl font-black">{s}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setPhase("setup")}
            className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15"
          >
            Volver a configuración
          </button>
        </div>
      )}
    </div>
  );
}

function AlwaysVisibleCard({ category, value, borderClass, wordClass, tintClass }) {
  return (
    <div
      className={[
        "relative h-40 w-full overflow-hidden rounded-2xl border bg-black/30 p-5",
        borderClass,
        tintClass,
      ].join(" ")}
    >
      <div className="text-sm text-slate-300">Categoría</div>
      <div className="mt-1 text-xl font-bold">{category}</div>

      <div className="h-full -mt-2 grid place-items-center">
        <div className="text-center">
          <div className={["text-4xl font-black tracking-wide", wordClass].join(" ")}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

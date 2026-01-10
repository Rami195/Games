import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "saymyname-game-state-v3";

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

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------- Banco de cartas ----------
const CARD_BANK = {
  "Películas/Series": [
    "El Padrino","Titanic","Matrix","Inception","Interstellar","Joker","Gladiador","Pulp Fiction",
    "Fight Club","Breaking Bad","Dark","Stranger Things","La Casa de Papel","Game of Thrones",
    "Harry Potter","El Señor de los Anillos","Star Wars","Black Mirror","The Office","Peaky Blinders",
    "Parásitos","Whiplash","La La Land","Se7en","El Silencio de los Inocentes","Shrek","Toy Story",
    "El Rey León","The Boys","Better Call Saul","Narcos","El Marginal","Los Simuladores",
    "Casados con Hijos","Chernobyl","Oppenheimer","Barbie","Django","Bastardos sin gloria",
    "Volver al Futuro","Jurassic Park","Terminator","Alien","Mad Max","Blade Runner","Memento",
    "El Resplandor","Psicosis","El Sexto Sentido"
  ],
  "Deportes/Deportistas": [
    "Lionel Messi","Diego Maradona","Cristiano Ronaldo","Neymar","Mbappé","Pelé","Ronaldinho",
    "Stephen Curry","Michael Jordan","Kobe Bryant","LeBron James","Manu Ginóbili","Juan Martín del Potro",
    "Novak Djokovic","Rafael Nadal","Roger Federer","Serena Williams","Usain Bolt","Michael Phelps",
    "Max Verstappen","Lewis Hamilton","Franco Colapinto","Diego Simeone","Pep Guardiola",
    "Carlos Tévez","Ángel Di María","Dibu Martínez","Sergio Agüero",
    "Fútbol","Básquet","Tenis","Rugby","Fórmula 1","Mundial","Copa Libertadores",
    "Champions League","Superclásico","Boca Juniors","River Plate","Ajedrez","Garry Kasparov",
    "UFC","Conor McGregor","Mike Tyson","Muhammad Ali"
  ],
  "Música/Cantantes": [
    "Michael Jackson","Madonna","Freddie Mercury","Queen","The Beatles","John Lennon","Paul McCartney",
    "David Bowie","Eminem","Drake","Taylor Swift","Adele","Rihanna","Beyoncé",
    "The Weeknd","Bruno Mars","Ed Sheeran","Shakira","Bad Bunny","Daddy Yankee","Karol G",
    "Rosalía","Luis Miguel","Soda Stereo","Gustavo Cerati","Charly García","Spinetta","Fito Páez",
    "Andrés Calamaro","Los Redondos","La Renga","Duki","Bizarrap","Tini","Nicki Nicole","Wos",
    "Metallica","AC/DC","Coldplay","U2","Pink Floyd","Guns N' Roses","Axl Rose",
    "Nirvana","Kurt Cobain","Lady Gaga","Billie Eilish"
  ],
  "Argentina": [
    "Buenos Aires","Mendoza","Córdoba","Rosario","Bariloche","Mar del Plata","Ushuaia","El Calafate",
    "Cataratas del Iguazú","Aconcagua","Obelisco","Casa Rosada","Plaza de Mayo",
    "La Bombonera","El Monumental","Ruta 40","Patagonia","Mate","Asado","Fernet","Dulce de leche",
    "Alfajor","Empanadas","Choripán","Parrilla","Vino mendocino","Tango","Gardel","Mercedes Sosa",
    "Soda Stereo","Malvinas","Perito Moreno","San Martín de los Andes",
    "Selección Argentina","Messi","Maradona"
  ],
  "Vale Todo": [
    "Tinder","Netflix","Uber","WhatsApp","Instagram","TikTok","Bitcoin","ChatGPT","Wi-Fi","VPN",
    "Vino","Cerveza","Resaca","Karaoke","After","Asado","Cumpleaños",
    "Boda","Divorcio","Jefe tóxico","Reunión","Presentación","Final de la facu","Trámite",
    "DNI","Pasaporte","Aduana","Aeropuerto","Hotel","Playa","Boliche","Mate amargo",
    "Fútbol 5","Control remoto","Aire acondicionado","Microondas","Heladera","Corte de luz",
    "Banco","Tarjeta de crédito","Cuotas","Inflación","Dólar","Propina","Delivery"
  ],
};

// ---------- Rondas ----------
const ROUNDS = [
  { id: 1, name: "Ronda 1", baseSeconds: 90, can: "Hablar, actuar, hacer sonidos, señalar, cantar, tararear.", cant: "Decir la palabra o una parte clara de la palabra." },
  { id: 2, name: "Ronda 2", baseSeconds: 90, can: "Decir UNA sola palabra y actuar.", cant: "Decir la palabra, tararear/cantar, hacer sonidos." },
  { id: 3, name: "Ronda 3", baseSeconds: 90, can: "Solo actuar.", cant: "Hacer sonidos o decir cualquier palabra." },
  { id: 4, name: "Ronda ⚡", baseSeconds: 45, can: "Un intento por tarjeta. Rápido.", cant: "Dormirse 😅" },
];

// Theme completo por equipo
const TEAM_THEME = [
  { name: "Azul", pageBg: "bg-gradient-to-br from-sky-950/35 via-slate-950/30 to-black/40", border: "border-sky-400/25", ring: "ring-sky-400/25", softBg: "bg-sky-500/5", dot: "text-sky-300", badgeBg: "bg-sky-500/15", badgeText: "text-sky-200", word: "text-sky-200" },
  { name: "Rojo", pageBg: "bg-gradient-to-br from-rose-950/30 via-slate-950/30 to-black/40", border: "border-rose-400/25", ring: "ring-rose-400/25", softBg: "bg-rose-500/5", dot: "text-rose-300", badgeBg: "bg-rose-500/15", badgeText: "text-rose-200", word: "text-rose-200" },
  { name: "Verde", pageBg: "bg-gradient-to-br from-emerald-950/28 via-slate-950/30 to-black/40", border: "border-emerald-400/25", ring: "ring-emerald-400/25", softBg: "bg-emerald-500/5", dot: "text-emerald-300", badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-200", word: "text-emerald-200" },
  { name: "Violeta", pageBg: "bg-gradient-to-br from-violet-950/28 via-slate-950/30 to-black/40", border: "border-violet-400/25", ring: "ring-violet-400/25", softBg: "bg-violet-500/5", dot: "text-violet-300", badgeBg: "bg-violet-500/15", badgeText: "text-violet-200", word: "text-violet-200" },
];

function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// inputs numéricos controlados
function toNumberOrNaN(v) {
  const n = Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? NaN : n;
}
function clampNumber(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function onlyDigitsOrEmpty(v) {
  return v === "" || /^\d+$/.test(v);
}

export default function SayMyNameGame({ onPlayingChange }) {
  const categories = useMemo(() => Object.keys(CARD_BANK), []);
  const saved = useMemo(() => loadState(), []);

  // phase: setup -> draft -> play -> results
  const [phase, setPhase] = useState(() => saved?.phase ?? "setup");

  // móvil-friendly
  const [teamsCount, setTeamsCount] = useState(() => String(saved?.teamsCount ?? 2));
  const [deckTotal, setDeckTotal] = useState(() => String(saved?.deckTotal ?? 30));

  const [selectedCategories, setSelectedCategories] = useState(
    () => saved?.selectedCategories ?? [categories[0]].filter(Boolean)
  );

  const [membersPerTeam, setMembersPerTeam] = useState(() => {
    const baseTeams = saved?.teamsCount ?? 2;
    const arr = saved?.membersPerTeam ?? Array.from({ length: baseTeams }, () => 2);
    return Array.from({ length: baseTeams }, (_, i) => String(arr[i] ?? 2));
  });

  const [roundIndex, setRoundIndex] = useState(() => saved?.roundIndex ?? 0);
  const [currentTeam, setCurrentTeam] = useState(() => saved?.currentTeam ?? 0);
  const [currentSlot, setCurrentSlot] = useState(() => saved?.currentSlot ?? 0);
  const [turnsDone, setTurnsDone] = useState(() => saved?.turnsDone ?? 0);

  // ✅ aciertos (totales de la partida)
  const [roundScores, setRoundScores] = useState(
    () => saved?.roundScores ?? Array.from({ length: saved?.teamsCount ?? 2 }, () => 0)
  );

  // ✅ marcador global
  const [globalWins, setGlobalWins] = useState(
    () => saved?.globalWins ?? Array.from({ length: saved?.teamsCount ?? 2 }, () => 0)
  );

  // ✅ deck de la ronda (se consume)
  const [deck, setDeck] = useState(() => saved?.deck ?? []);

  // ✅ baseDeck: cartas “originales” para recargar cada ronda
  const [baseDeck, setBaseDeck] = useState(() => saved?.baseDeck ?? []);

  // timer
  const [secondsLeft, setSecondsLeft] = useState(() => saved?.secondsLeft ?? 0);
  const [running, setRunning] = useState(() => saved?.running ?? false);

  // reset confirm
  const [confirmReset, setConfirmReset] = useState(() => saved?.confirmReset ?? false);

  // draft
  const [draftParticipants, setDraftParticipants] = useState(() => saved?.draftParticipants ?? []);
  const [draftIndex, setDraftIndex] = useState(() => saved?.draftIndex ?? 0);

  const round = ROUNDS[roundIndex];
  const topCard = deck?.[0] ?? null;

  // números
  const teamsCountNum = useMemo(() => {
    const n = toNumberOrNaN(teamsCount);
    return Number.isNaN(n) ? 0 : n;
  }, [teamsCount]);

  const deckTotalNum = useMemo(() => {
    const n = toNumberOrNaN(deckTotal);
    return Number.isNaN(n) ? 0 : n;
  }, [deckTotal]);

  const membersPerTeamNum = useMemo(() => {
    return membersPerTeam.map((v) => {
      const n = toNumberOrNaN(v);
      return Number.isNaN(n) ? 0 : n;
    });
  }, [membersPerTeam]);

  const safeTeamsForUI = teamsCountNum || 2;
  const theme = TEAM_THEME[currentTeam] ?? TEAM_THEME[0];

  useEffect(() => {
    onPlayingChange?.(phase === "play");
  }, [phase, onPlayingChange]);

  useEffect(() => {
    if (!teamsCountNum) return;
    const t = clampNumber(teamsCountNum, 2, 4);

    setRoundScores((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? 0));
    setGlobalWins((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? 0));
    setMembersPerTeam((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? "2"));

    setCurrentTeam((x) => Math.min(x, t - 1));
    setCurrentSlot((s) => Math.max(0, s));
  }, [teamsCountNum]);

  // Persistencia
  useEffect(() => {
    const tc = toNumberOrNaN(teamsCount);
    const safeTeams = Number.isNaN(tc) ? (saved?.teamsCount ?? 2) : clampNumber(tc, 2, 4);

    const dt = toNumberOrNaN(deckTotal);
    const safeDeckTotal = Number.isNaN(dt) ? (saved?.deckTotal ?? 30) : clampNumber(dt, 10, 200);

    const safeMembers = Array.from({ length: safeTeams }, (_, i) => {
      const n = toNumberOrNaN(membersPerTeam[i] ?? "2");
      if (Number.isNaN(n)) return 2;
      return clampNumber(n, 1, 12);
    });

    const stateToSave = {
      phase,
      teamsCount: safeTeams,
      deckTotal: safeDeckTotal,
      selectedCategories,
      membersPerTeam: safeMembers,

      roundIndex,
      currentTeam,
      currentSlot,
      turnsDone,

      roundScores,
      globalWins,

      deck,
      baseDeck,

      secondsLeft,
      running,
      confirmReset,

      draftParticipants,
      draftIndex,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    phase,
    teamsCount,
    deckTotal,
    selectedCategories,
    membersPerTeam,
    roundIndex,
    currentTeam,
    currentSlot,
    turnsDone,
    roundScores,
    globalWins,
    deck,
    baseDeck,
    secondsLeft,
    running,
    confirmReset,
    draftParticipants,
    draftIndex,
    saved?.teamsCount,
    saved?.deckTotal,
    saved?.membersPerTeam,
  ]);

  useEffect(() => {
    setConfirmReset(false);
  }, [phase]);

  const totalParticipants = useMemo(() => {
    const sum = membersPerTeamNum.slice(0, safeTeamsForUI).reduce((acc, n) => acc + (n || 0), 0);
    return Math.max(1, sum);
  }, [membersPerTeamNum, safeTeamsForUI]);

  const totalTurnsThisRound = totalParticipants;

  const poolCount = selectedCategories.reduce((acc, c) => acc + (CARD_BANK[c]?.length ?? 0), 0);
  const canStartDraft = selectedCategories.length > 0;

  const draftValidMultiple = deckTotalNum > 0 && deckTotalNum % totalParticipants === 0;
  const quota = draftValidMultiple ? deckTotalNum / totalParticipants : 0;
  const sampleCount = quota * 2;

  function toggleCategory(cat) {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function buildCardsPool() {
    const pool = selectedCategories.flatMap((c) =>
      (CARD_BANK[c] ?? []).map((answer) => ({ id: safeUUID(), answer, category: c }))
    );
    return shuffle(pool);
  }

  function buildParticipantsList() {
    const participants = [];
    const t = safeTeamsForUI;
    const maxSlots = Math.max(1, ...membersPerTeamNum.slice(0, t).map((n) => n || 1));

    for (let slot = 0; slot < maxSlots; slot++) {
      for (let team = 0; team < t; team++) {
        const members = membersPerTeamNum[team] || 1;
        if (members > slot) {
          participants.push({
            id: `${team}-${slot}`,
            team,
            slot,
            label: `Equipo ${team + 1} • Integrante ${slot + 1}/${members}`,
            options: [],
            picks: [],
            quota: 0,
            sampleCount: 0,
          });
        }
      }
    }
    return participants;
  }

  function startDraft() {
    const pool = buildCardsPool();
    const total = deckTotalNum;

    if (!Number.isInteger(total) || total <= 0) {
      alert("Ingresá un tamaño de mazo válido.");
      return;
    }
    if (total % totalParticipants !== 0) {
      alert(`El tamaño del mazo (${total}) debe ser múltiplo del total de participantes (${totalParticipants}).`);
      return;
    }

    const q = total / totalParticipants;
    const sc = q * 2;

    if (sc <= 0) {
      alert("El tamaño del mazo es muy chico para armar selección.");
      return;
    }

    let bag = [...pool];

    const participants = buildParticipantsList().map((p) => {
      if (bag.length < sc) bag = shuffle(pool);

      const options = bag.slice(0, sc);
      bag = bag.slice(sc);

      return { ...p, options, picks: [], quota: q, sampleCount: sc };
    });

    setDraftParticipants(participants);
    setDraftIndex(0);

    // limpiar juego previo
    setRoundScores(Array.from({ length: safeTeamsForUI }, () => 0));
    setGlobalWins((prev) => Array.from({ length: safeTeamsForUI }, (_, i) => prev?.[i] ?? 0));

    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);

    setSecondsLeft(ROUNDS[0].baseSeconds);
    setRunning(false);

    setDeck([]);
    setBaseDeck([]);

    setPhase("draft");
  }

  function togglePick(cardId) {
    setDraftParticipants((prev) => {
      const copy = [...prev];
      const p = copy[draftIndex];
      if (!p) return prev;

      const picks = new Set(p.picks);
      if (picks.has(cardId)) picks.delete(cardId);
      else picks.add(cardId);

      if (picks.size > p.quota) return prev;

      copy[draftIndex] = { ...p, picks: Array.from(picks) };
      return copy;
    });
  }

  function finalizeDraftToDeck() {
    const chosen = draftParticipants.flatMap((pp) => pp.options.filter((c) => pp.picks.includes(c.id)));

    if (chosen.length !== deckTotalNum) {
      alert(`Error: mazo final tiene ${chosen.length} cartas y debería tener ${deckTotalNum}.`);
      return;
    }

    // ✅ baseDeck se usa para recargar cada ronda
    const base = shuffle(chosen);
    setBaseDeck(base);
    setDeck(shuffle(base)); // ronda 1

    setRoundScores(Array.from({ length: safeTeamsForUI }, () => 0));

    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);

    setSecondsLeft(ROUNDS[0].baseSeconds);
    setRunning(false);

    setPhase("play");
  }

  function nextParticipantDraft() {
    const p = draftParticipants[draftIndex];
    if (!p) return;

    if (p.picks.length !== p.quota) {
      alert(`Tenés que elegir exactamente ${p.quota} cartas.`);
      return;
    }

    if (draftIndex < draftParticipants.length - 1) {
      setDraftIndex(draftIndex + 1);
      return;
    }

    finalizeDraftToDeck();
  }

  // --- turnos ---
  function getNextTurn(team, slot) {
    const t = safeTeamsForUI;
    const maxSlots = Math.max(1, ...membersPerTeamNum.slice(0, t).map((n) => n || 1));

    let nextTeam = team;
    for (let tries = 0; tries < t; tries++) {
      nextTeam = (nextTeam + 1) % t;
      if ((membersPerTeamNum[nextTeam] || 1) > slot) return { team: nextTeam, slot };
    }

    for (let s = slot + 1; s < maxSlots; s++) {
      for (let tt = 0; tt < t; tt++) {
        if ((membersPerTeamNum[tt] || 1) > s) return { team: tt, slot: s };
      }
    }

    return { team: 0, slot: 0 };
  }

  function getTurnSeconds() {
    return ROUNDS[roundIndex]?.baseSeconds ?? 30;
  }

  function advanceToNextRoundOrFinish() {
    const nextRound = roundIndex + 1;

    // ✅ si ya fue la última ronda => finalizar juego
    if (nextRound >= ROUNDS.length) {
      // ganador por aciertos totales
      const max = Math.max(...roundScores);
      const winners = roundScores
        .map((v, i) => ({ v, i }))
        .filter((x) => x.v === max)
        .map((x) => x.i);

      // si hay empate, no suma nadie
      if (winners.length === 1) {
        const winner = winners[0];
        setGlobalWins((prev) => prev.map((x, i) => (i === winner ? x + 1 : x)));
      }

      setRunning(false);
      setPhase("results");
      return;
    }

    // ✅ avanzar ronda: recargar deck con baseDeck
    setRoundIndex(nextRound);
    setTurnsDone(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setSecondsLeft(ROUNDS[nextRound].baseSeconds);
    setRunning(false);

    setDeck(shuffle(baseDeck));
  }

  // Timer
  useEffect(() => {
    if (phase !== "play") return;

    // ✅ si se acabaron las cartas => termina la ronda y avanza
    if (deck.length === 0 && baseDeck.length > 0) {
      setRunning(false);
      advanceToNextRoundOrFinish();
      return;
    }

    if (!running) return;

    if (secondsLeft <= 0) {
      setRunning(false);

      const nextTurnsDone = turnsDone + 1;

      // si terminaron los turnos pero todavía quedan cartas, pasamos al siguiente jugador
      if (nextTurnsDone < totalTurnsThisRound) {
        setTurnsDone(nextTurnsDone);
        const next = getNextTurn(currentTeam, currentSlot);
        setCurrentTeam(next.team);
        setCurrentSlot(next.slot);
        setSecondsLeft(getTurnSeconds());
        return;
      }

      // ✅ terminaron los turnos de la ronda => avanza de ronda
      setTurnsDone(nextTurnsDone);
      advanceToNextRoundOrFinish();
      return;
    }

    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [
    phase,
    running,
    secondsLeft,
    turnsDone,
    roundIndex,
    currentTeam,
    currentSlot,
    totalTurnsThisRound,
    deck.length,
    baseDeck.length,
    roundScores,
  ]);

  function startTurn() {
    if (deck.length === 0) return;
    setSecondsLeft(getTurnSeconds());
    setRunning(true);
  }

  function pauseResume() {
    setRunning((v) => !v);
  }

  function markGuessed() {
    if (!topCard || !running) return;

    setRoundScores((prev) => prev.map((s, i) => (i === currentTeam ? s + 1 : s)));

    setDeck((prev) => {
      const nextDeck = prev.slice(1);
      // ✅ si con esto se acabó, la lógica del useEffect avanza de ronda
      return nextDeck;
    });
  }

  function passCard() {
    if (!topCard || !running) return;
    setDeck((prev) => (prev.length <= 1 ? prev : [...prev.slice(1), prev[0]]));
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);

    setPhase("setup");

    setTeamsCount("2");
    setDeckTotal("30");

    setSelectedCategories([categories[0]].filter(Boolean));
    setMembersPerTeam(["2", "2"]);

    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);

    setRoundScores([0, 0]);
    setGlobalWins([0, 0]);

    setDeck([]);
    setBaseDeck([]);

    setSecondsLeft(0);
    setRunning(false);

    setDraftParticipants([]);
    setDraftIndex(0);

    setConfirmReset(false);
  }

  const membersThisTeam = membersPerTeamNum[currentTeam] || 1;

  // Ganador final (results)
  const maxRound = roundScores.length ? Math.max(...roundScores) : 0;
  const roundWinners = roundScores
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v === maxRound)
    .map((x) => x.i);

  const winnerLabel = roundWinners.length === 1 ? `Ganó el Equipo ${roundWinners[0] + 1}` : "Empate";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🎤 Say My Name</h2>
            <p className="text-slate-300">
              Draft por participantes + turnos automáticos + mazo por ronda (se recarga).
            </p>
          </div>

          {phase !== "setup" && (
            <div className="flex items-center gap-2">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Reiniciar
                </button>
              ) : (
                <>
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
                </>
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
                type="text"
                value={teamsCount}
                inputMode="numeric"
                pattern="\d*"
                onChange={(e) => {
                  const v = e.target.value;
                  if (!onlyDigitsOrEmpty(v)) return;
                  setTeamsCount(v);
                }}
                onBlur={() => {
                  const n = toNumberOrNaN(teamsCount);
                  if (Number.isNaN(n)) setTeamsCount("2");
                  else setTeamsCount(String(clampNumber(n, 2, 4)));
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Tamaño del mazo total (ej: 30)</label>
              <input
                type="text"
                value={deckTotal}
                inputMode="numeric"
                pattern="\d*"
                onChange={(e) => {
                  const v = e.target.value;
                  if (!onlyDigitsOrEmpty(v)) return;
                  setDeckTotal(v);
                }}
                onBlur={() => {
                  const n = toNumberOrNaN(deckTotal);
                  if (Number.isNaN(n)) setDeckTotal("10");
                  else setDeckTotal(String(clampNumber(n, 10, 200)));
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
              />
              <div className="text-xs text-slate-400">
                Debe ser múltiplo del total de participantes ({totalParticipants}).
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-300">Integrantes por equipo</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: safeTeamsForUI }, (_, i) => {
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
                        type="text"
                        value={membersPerTeam[i] ?? "2"}
                        inputMode="numeric"
                        pattern="\d*"
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!onlyDigitsOrEmpty(v)) return;
                          setMembersPerTeam((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                        }}
                        onBlur={() => {
                          const raw = membersPerTeam[i] ?? "";
                          const n = toNumberOrNaN(raw);
                          const safe = Number.isNaN(n) ? 2 : clampNumber(n, 1, 12);
                          setMembersPerTeam((prev) => prev.map((x, idx) => (idx === i ? String(safe) : x)));
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                <div>
                  Participantes totales: <b>{totalParticipants}</b>
                </div>
                <div className="mt-1 text-slate-300">
                  {draftValidMultiple ? (
                    <>
                      Cada participante verá <b>{sampleCount}</b> cartas y elegirá <b>{quota}</b>. (Mazo final:{" "}
                      {deckTotalNum})
                    </>
                  ) : (
                    <>
                      ⚠️ El mazo ({deckTotalNum || "—"}) <b>no</b> es múltiplo de {totalParticipants}. Ajustalo para
                      poder iniciar.
                    </>
                  )}
                </div>
              </div>
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
                      <input type="checkbox" checked={checked} onChange={() => toggleCategory(cat)} className="accent-emerald-500" />
                      {cat}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">Cartas disponibles en selección: {poolCount}</p>
            </div>
          </div>

          <button
            onClick={startDraft}
            disabled={!canStartDraft || !draftValidMultiple}
            className={[
              "mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition",
              !canStartDraft || !draftValidMultiple
                ? "cursor-not-allowed bg-emerald-500/20 text-emerald-200/40"
                : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
            ].join(" ")}
          >
            Comenzar (selección de cartas)
          </button>
        </div>
      )}

      {/* DRAFT */}
      {phase === "draft" && draftParticipants.length > 0 && (() => {
        const p = draftParticipants[draftIndex];
        const t = TEAM_THEME[p.team] ?? TEAM_THEME[0];

        const pickedCount = p.picks.length;
        const mustPick = p.quota;

        return (
          <div className={["rounded-2xl border p-6 space-y-4 border-white/10", t.pageBg, t.softBg].join(" ")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-300">Selección de cartas</div>
                <div className="text-xl font-bold">
                  <span className={t.badgeText}>{p.label}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Participante {draftIndex + 1}/{draftParticipants.length} • Elegí {p.quota} de {p.sampleCount}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm("¿Volver a configuración? Se perderá la selección actual.")) {
                      setPhase("setup");
                      setDraftParticipants([]);
                      setDraftIndex(0);
                      setDeck([]);
                      setBaseDeck([]);
                      setRunning(false);
                      setSecondsLeft(0);
                    }
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Volver a configuración
                </button>

                <button
                  onClick={nextParticipantDraft}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold text-black transition",
                    pickedCount === mustPick ? "bg-emerald-500 hover:bg-emerald-400 cursor-pointer" : "bg-emerald-500/40 cursor-not-allowed",
                  ].join(" ")}
                  disabled={pickedCount !== mustPick}
                >
                  {draftIndex === draftParticipants.length - 1 ? "Terminar y jugar" : "Siguiente participante"}
                </button>
              </div>
            </div>

            <div className={["rounded-xl border bg-black/20 p-4", t.border].join(" ")}>
              <div className="text-slate-200">
                Seleccionadas: <b className={t.badgeText}>{pickedCount}</b> / {mustPick}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Tocá una tarjeta para marcarla. No podés elegir más de {mustPick}.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {p.options.map((c) => {
                const checked = p.picks.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => togglePick(c.id)}
                    className={[
                      "text-left rounded-2xl border p-4 transition",
                      checked ? [t.border, t.softBg, "ring-2", t.ring].join(" ") : "border-white/10 bg-black/20 hover:bg-black/30",
                    ].join(" ")}
                  >
                    <div className="text-xs text-slate-400">{c.category}</div>
                    <div className={["text-lg font-bold", checked ? t.badgeText : "text-white"].join(" ")}>
                      {c.answer}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {checked ? "✅ Seleccionada" : "Tocar para seleccionar"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* PLAY */}
      {phase === "play" && (
        <div className={["rounded-2xl border p-6 space-y-4 border-white/10", theme.pageBg, theme.softBg].join(" ")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-300">{round.name}</div>

              <div className="text-xl font-bold flex flex-wrap items-center gap-2">
                <span className={["inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 bg-black/20", theme.border].join(" ")}>
                  <span className={theme.dot}>●</span>
                  Equipo {currentTeam + 1}
                  <span className={["ml-2 rounded-lg px-2 py-0.5 text-[11px]", theme.badgeBg, theme.badgeText].join(" ")}>
                    {theme.name}
                  </span>
                </span>

                <span className="text-slate-400 font-normal">
                  Integrante {currentSlot + 1}/{membersThisTeam}
                </span>

                <span className="text-slate-500 font-normal">• mazo por ronda</span>
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Turnos en esta ronda: {Math.min(turnsDone, totalTurnsThisRound)}/{totalTurnsThisRound} • Cartas restantes: {deck.length}
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

          {/* ✅ Botón arriba */}
          <button
            onClick={markGuessed}
            disabled={!topCard || !running}
            className={[
              "w-full rounded-2xl px-5 py-3 font-semibold transition",
              !topCard || !running ? "cursor-not-allowed bg-white/5 text-slate-400" : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400",
            ].join(" ")}
          >
            ✅ Adivinada (+1)
          </button>

          {/* Card */}
          {!running ? (
            <div className={["rounded-2xl border bg-black/20 p-8 text-center", theme.border].join(" ")}>
              <div className="text-sm text-slate-300 mb-2">Turno preparado</div>
              <div className="text-2xl font-black">
                <span className={theme.badgeText}>Equipo {currentTeam + 1}</span> • Integrante {currentSlot + 1}/{membersThisTeam}
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

          {/* ✅ Botón abajo */}
          <button
            onClick={passCard}
            disabled={!topCard || !running}
            className={[
              "w-full rounded-2xl border bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10",
              theme.border,
              !topCard || !running ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            ].join(" ")}
          >
            ↩ Pasar
          </button>

          <div className="text-xs text-slate-400">
            Si se acaban las cartas, <b>termina la ronda</b> y pasa automáticamente a la siguiente (recargando el mazo).
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Resultado final</h3>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-lg font-bold">{winnerLabel}</div>
            <div className="text-sm text-slate-300">
              Aciertos totales: {roundScores.map((v, i) => `E${i + 1}: ${v}`).join(" • ")}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              Marcador global: {globalWins.map((v, i) => `E${i + 1}: ${v}`).join(" • ")}
            </div>
            {roundWinners.length > 1 && (
              <div className="mt-2 text-xs text-slate-400">Hubo empate: no se sumó +1 global a ningún equipo.</div>
            )}
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
    <div className={["relative h-40 w-full overflow-hidden rounded-2xl border bg-black/30 p-5", borderClass, tintClass].join(" ")}>
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

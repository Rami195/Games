import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "saymyname-game-state-v4";

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
import { CARD_BANK } from "./cardBank";

// ---------- Rondas (✅ 3 rondas) ----------
const ROUNDS = [
  {
    id: 1,
    name: "Ronda 1 — Mímica",
    defaultSeconds: 30,
    can: "Solo actuar / mímica (sin hablar, sin sonidos).",
    cant: "Decir palabras, hacer sonidos, cantar/tararear.",
  },
  {
    id: 2,
    name: "Ronda 2 — Una palabra",
    defaultSeconds: 30,
    can: "Decir UNA sola palabra.",
    cant: "Decir más de una palabra, cantar/tararear, hacer sonidos.",
  },
  {
    id: 3,
    name: "Ronda ⚡ — Relámpago",
    defaultSeconds: 15,
    can: "Decir UNA sola palabra. Pueden adivinar todos los equipos.",
    cant: "Decir más de una palabra, hacer sonidos, cantar/tararear.",
  },
];

// Theme completo por equipo
const TEAM_THEME = [
  {
    name: "Azul",
    pageBg: "bg-gradient-to-br from-sky-950/35 via-slate-950/30 to-black/40",
    border: "border-sky-400/25",
    ring: "ring-sky-400/25",
    softBg: "bg-sky-500/5",
    dot: "text-sky-300",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-200",
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

function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function randomTeamIndex(teams) {
  const t = Math.max(2, Math.min(4, teams || 2));
  return Math.floor(Math.random() * t);
}

function winnerLabelFromScores(scores) {
  if (!scores?.length) return "Empate";
  const max = Math.max(...scores);
  const winners = scores
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v === max)
    .map((x) => x.i);
  return winners.length === 1 ? `Equipo ${winners[0] + 1}` : "Empate";
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

  // ✅ tiempos configurables por ronda
  const [roundSeconds, setRoundSeconds] = useState(() => {
    const fromSaved = saved?.roundSeconds;
    const base =
      Array.isArray(fromSaved) && fromSaved.length === ROUNDS.length
        ? fromSaved
        : ROUNDS.map((r) => r.defaultSeconds);
    return base.map((v) => String(v));
  });

  const [roundIndex, setRoundIndex] = useState(() => saved?.roundIndex ?? 0);
  const [currentTeam, setCurrentTeam] = useState(() => saved?.currentTeam ?? 0);
  const [currentSlot, setCurrentSlot] = useState(() => saved?.currentSlot ?? 0);
  const [turnsDone, setTurnsDone] = useState(() => saved?.turnsDone ?? 0);

  // ✅ aciertos acumulados de toda la partida (para ganador final)
  const [roundScores, setRoundScores] = useState(
    () => saved?.roundScores ?? Array.from({ length: saved?.teamsCount ?? 2 }, () => 0)
  );

  // ✅ puntajes por ronda (para “quién ganó cada ronda”)
  const [scoresByRound, setScoresByRound] = useState(() => {
    const t = saved?.teamsCount ?? 2;
    const base = saved?.scoresByRound;
    if (Array.isArray(base) && base.length === ROUNDS.length) return base;
    return Array.from({ length: ROUNDS.length }, () => Array.from({ length: t }, () => 0));
  });

  // ✅ marcador global
  const [globalWins, setGlobalWins] = useState(
    () => saved?.globalWins ?? Array.from({ length: saved?.teamsCount ?? 2 }, () => 0)
  );

  const [deck, setDeck] = useState(() => saved?.deck ?? []);
  const [baseDeck, setBaseDeck] = useState(() => saved?.baseDeck ?? []);

  // timer
  const [secondsLeft, setSecondsLeft] = useState(() => saved?.secondsLeft ?? 0);
  const [running, setRunning] = useState(() => saved?.running ?? false);

  // reset confirm
  const [confirmReset, setConfirmReset] = useState(() => saved?.confirmReset ?? false);

  // draft
  const [draftParticipants, setDraftParticipants] = useState(() => saved?.draftParticipants ?? []);
  const [draftIndex, setDraftIndex] = useState(() => saved?.draftIndex ?? 0);

  // ✅ equipo inicial aleatorio (ronda 1) + rotación por ronda
  const [startTeamSeed, setStartTeamSeed] = useState(() => saved?.startTeamSeed ?? 0);

  const round = ROUNDS[roundIndex];
  const isLightning = round?.id === 3;
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

  // Ajustes cuando cambia teamsCount
  useEffect(() => {
    if (!teamsCountNum) return;
    const t = clampNumber(teamsCountNum, 2, 4);

    setRoundScores((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? 0));
    setGlobalWins((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? 0));
    setMembersPerTeam((prev) => Array.from({ length: t }, (_, i) => prev?.[i] ?? "2"));

    setScoresByRound((prev) => {
      const base = Array.from({ length: ROUNDS.length }, (_, r) => {
        const row = prev?.[r] ?? [];
        return Array.from({ length: t }, (_, i) => row?.[i] ?? 0);
      });
      return base;
    });

    setCurrentTeam((x) => Math.min(x, t - 1));
    setCurrentSlot((s) => Math.max(0, s));
    setStartTeamSeed((seed) => (seed >= 0 ? Math.min(seed, t - 1) : 0));
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

    const safeRoundSeconds = Array.from({ length: ROUNDS.length }, (_, i) => {
      const raw = roundSeconds?.[i] ?? String(ROUNDS[i].defaultSeconds);
      const n = toNumberOrNaN(raw);
      if (Number.isNaN(n)) return ROUNDS[i].defaultSeconds;
      return clampNumber(n, 5, 300);
    });

    const safeScoresByRound = Array.from({ length: ROUNDS.length }, (_, r) => {
      const row = scoresByRound?.[r] ?? [];
      return Array.from({ length: safeTeams }, (_, i) => row?.[i] ?? 0);
    });

    const stateToSave = {
      phase,
      teamsCount: safeTeams,
      deckTotal: safeDeckTotal,
      selectedCategories,
      membersPerTeam: safeMembers,

      roundSeconds: safeRoundSeconds,

      roundIndex,
      currentTeam,
      currentSlot,
      turnsDone,

      roundScores,
      scoresByRound: safeScoresByRound, // ✅

      globalWins,
      startTeamSeed, // ✅

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
    roundSeconds,
    roundIndex,
    currentTeam,
    currentSlot,
    turnsDone,
    roundScores,
    scoresByRound,
    globalWins,
    startTeamSeed,
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
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
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

  function getTurnSeconds(idx = roundIndex) {
    const raw = roundSeconds?.[idx] ?? String(ROUNDS[idx]?.defaultSeconds ?? 30);
    const n = toNumberOrNaN(raw);
    if (Number.isNaN(n)) return ROUNDS[idx]?.defaultSeconds ?? 30;
    return clampNumber(n, 5, 300);
  }

  // ✅ inicio de ronda: rota según seed (r0=seed, r1=seed+1, r2=seed+2 ...)
  function getRoundStartTeam(rIdx) {
    const t = safeTeamsForUI;
    return (startTeamSeed + rIdx) % t;
  }

  function startDraft() {
    const pool = buildCardsPool();
    const total = deckTotalNum;

    if (!Number.isInteger(total) || total <= 0) {
      alert("Ingresá un tamaño de mazo válido.");
      return;
    }
    if (total % totalParticipants !== 0) {
      alert(
        `El tamaño del mazo (${total}) debe ser múltiplo del total de participantes (${totalParticipants}).`
      );
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
    setScoresByRound(Array.from({ length: ROUNDS.length }, () => Array.from({ length: safeTeamsForUI }, () => 0)));

    setGlobalWins((prev) => Array.from({ length: safeTeamsForUI }, (_, i) => prev?.[i] ?? 0));

    setRoundIndex(0);
    setTurnsDone(0);

    setSecondsLeft(getTurnSeconds(0));
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
    const chosen = draftParticipants.flatMap((pp) =>
      pp.options.filter((c) => pp.picks.includes(c.id))
    );

    if (chosen.length !== deckTotalNum) {
      alert(`Error: mazo final tiene ${chosen.length} cartas y debería tener ${deckTotalNum}.`);
      return;
    }

    const base = shuffle(chosen);
    setBaseDeck(base);
    setDeck(shuffle(base)); // ronda 1

    setRoundScores(Array.from({ length: safeTeamsForUI }, () => 0));
    setScoresByRound(Array.from({ length: ROUNDS.length }, () => Array.from({ length: safeTeamsForUI }, () => 0)));

    setRoundIndex(0);
    setTurnsDone(0);

    // ✅ seed aleatorio para ronda 1, y a partir de ahí rota
    const seed = randomTeamIndex(safeTeamsForUI);
    setStartTeamSeed(seed);

    setCurrentTeam(seed);
    setCurrentSlot(0);

    setSecondsLeft(getTurnSeconds(0));
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

  // ✅ snapshot del ganador por ronda: se guarda cuando la ronda termina
  function snapshotRoundResult(rIdx) {
    setScoresByRound((prev) => {
      const next = Array.from({ length: ROUNDS.length }, (_, r) => [...(prev?.[r] ?? [])]);
      const row = next[rIdx] ?? [];
      next[rIdx] = Array.from({ length: safeTeamsForUI }, (_, i) => row?.[i] ?? 0);

      // guardamos el score actual acumulado de esa ronda
      // (tomamos roundScores, pero eso es total de partida; entonces calculamos “aciertos de la ronda” con delta)
      // ✅ Mejor: mantenemos “score de ronda actual” sumando aquí mismo en markGuessed.
      // Para simplificar: guardamos el snapshot del score actual de ronda en `currentRoundScoresRef`:
      return next;
    });
  }

  // ✅ score SOLO de la ronda actual (para poder decir quién ganó cada ronda)
  const [currentRoundScores, setCurrentRoundScores] = useState(() => {
    const t = saved?.teamsCount ?? 2;
    return saved?.currentRoundScores ?? Array.from({ length: t }, () => 0);
  });

  // mantener currentRoundScores al cambiar equipos
  useEffect(() => {
    setCurrentRoundScores((prev) => Array.from({ length: safeTeamsForUI }, (_, i) => prev?.[i] ?? 0));
  }, [safeTeamsForUI]);

  // incluir en persistencia (rápido y útil)
  useEffect(() => {
    // nada: ya persiste arriba (lo metemos en stateToSave abajo)
  }, []);

  // 🔧 re-inyectar currentRoundScores en persistencia sin duplicar useEffect
  // (lo agregamos al stateToSave del efecto grande, por eso lo sumamos a deps)
  // -> lo agregamos aquí:
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {}, [currentRoundScores]);

  // Reemplazamos el useEffect de persistencia para incluir currentRoundScores:
  // (Ya está arriba; como no podemos “editar” ese bloque aquí, lo incluimos en stateToSave manualmente)
  // ✅ Solución: guardamos también en localStorage justo aquí (idempotente).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.currentRoundScores = currentRoundScores;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {}
  }, [currentRoundScores]);

  function advanceToNextRoundOrFinish() {
    const nextRound = roundIndex + 1;

    // ✅ antes de avanzar: guardar ganador de ESTA ronda (roundIndex)
    setScoresByRound((prev) => {
      const next = Array.from({ length: ROUNDS.length }, (_, r) => {
        const row = prev?.[r] ?? [];
        return Array.from({ length: safeTeamsForUI }, (_, i) => row?.[i] ?? 0);
      });
      next[roundIndex] = Array.from({ length: safeTeamsForUI }, (_, i) => currentRoundScores?.[i] ?? 0);
      return next;
    });

    // ✅ si ya fue la última ronda => finalizar juego
    if (nextRound >= ROUNDS.length) {
      const max = Math.max(...roundScores);
      const winners = roundScores
        .map((v, i) => ({ v, i }))
        .filter((x) => x.v === max)
        .map((x) => x.i);

      if (winners.length === 1) {
        const winner = winners[0];
        setGlobalWins((prev) => prev.map((x, i) => (i === winner ? x + 1 : x)));
      }

      setRunning(false);
      setPhase("results");
      return;
    }

    // ✅ avanzar ronda: recAssert
    setTurnsDone(0);

    // ✅ equipo inicial: rota según seed (no random cada ronda)
    const startTeam = getRoundStartTeam(nextRound);
    setCurrentTeam(startTeam);
    setCurrentSlot(0);

    setRunning(false);
    setDeck(shuffle(baseDeck));

    setRoundIndex(nextRound);
    setSecondsLeft(getTurnSeconds(nextRound));

    // ✅ reset del score de la ronda nueva
    setCurrentRoundScores(Array.from({ length: safeTeamsForUI }, () => 0));
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

      if (nextTurnsDone < totalTurnsThisRound) {
        setTurnsDone(nextTurnsDone);
        const next = getNextTurn(currentTeam, currentSlot);
        setCurrentTeam(next.team);
        setCurrentSlot(next.slot);
        setSecondsLeft(getTurnSeconds(roundIndex));
        return;
      }

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
    currentRoundScores,
  ]);

  function startTurn() {
    if (deck.length === 0) return;
    setSecondsLeft(getTurnSeconds(roundIndex));
    setRunning(true);
  }

  function pauseResume() {
    setRunning((v) => !v);
  }

  // ✅ permite elegir a qué equipo sumar (relámpago)
  function markGuessed(teamToScore = currentTeam) {
    if (!topCard || !running) return;

    // total de partida
    setRoundScores((prev) => prev.map((s, i) => (i === teamToScore ? s + 1 : s)));

    // score de la ronda actual
    setCurrentRoundScores((prev) => prev.map((s, i) => (i === teamToScore ? s + 1 : s)));

    setDeck((prev) => prev.slice(1));
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

    setRoundSeconds(ROUNDS.map((r) => String(r.defaultSeconds)));

    setRoundIndex(0);
    setCurrentTeam(0);
    setCurrentSlot(0);
    setTurnsDone(0);

    setRoundScores([0, 0]);
    setCurrentRoundScores([0, 0]);
    setScoresByRound(Array.from({ length: ROUNDS.length }, () => [0, 0]));

    setGlobalWins([0, 0]);
    setStartTeamSeed(0);

    setDeck([]);
    setBaseDeck([]);

    setSecondsLeft(0);
    setRunning(false);

    setDraftParticipants([]);
    setDraftIndex(0);

    setConfirmReset(false);
  }

  const membersThisTeam = membersPerTeamNum[currentTeam] || 1;

  // ✅ Ganador final (results) por total de partida
  const finalWinner = winnerLabelFromScores(roundScores);
  const finalWinnerText = finalWinner === "Empate" ? "Empate" : `Ganador: ${finalWinner}`;

  // ✅ Ganador por ronda (results)
  const perRoundWinners = useMemo(() => {
    const list = [];
    for (let r = 0; r < ROUNDS.length; r++) {
      const row = scoresByRound?.[r] ?? Array.from({ length: safeTeamsForUI }, () => 0);
      list.push({
        roundName: ROUNDS[r].name,
        winner: winnerLabelFromScores(row),
        row,
      });
    }
    return list;
  }, [scoresByRound, safeTeamsForUI]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🎤 Say My Name</h2>
            <p className="text-slate-300">
              3 rondas (Mímica → 1 palabra → ⚡ Relámpago) + draft por participantes + mazo por ronda (se recarga).
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

            {/* ✅ tiempos por ronda */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-300">Tiempo por ronda (segundos)</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROUNDS.map((r, idx) => (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-slate-300 mb-2">{r.name}</div>
                    <input
                      type="text"
                      value={roundSeconds[idx] ?? String(r.defaultSeconds)}
                      inputMode="numeric"
                      pattern="\d*"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!onlyDigitsOrEmpty(v)) return;
                        setRoundSeconds((prev) => prev.map((x, i) => (i === idx ? v : x)));
                      }}
                      onBlur={() => {
                        const raw = roundSeconds[idx] ?? "";
                        const n = toNumberOrNaN(raw);
                        const safe = Number.isNaN(n) ? r.defaultSeconds : clampNumber(n, 5, 300);
                        setRoundSeconds((prev) => prev.map((x, i) => (i === idx ? String(safe) : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:bg-black/20"
                    />
                    <div className="mt-2 text-xs text-slate-400">Min: 5s • Max: 300s</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                El equipo que empieza la Ronda 1 es <b>al azar</b> y en cada ronda siguiente empieza el <b>siguiente equipo</b>.
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
                        <span
                          className={[
                            "ml-2 rounded-lg px-2 py-0.5 text-[11px]",
                            t.badgeBg,
                            t.badgeText,
                          ].join(" ")}
                        >
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
                    pickedCount === mustPick
                      ? "bg-emerald-500 hover:bg-emerald-400 cursor-pointer"
                      : "bg-emerald-500/40 cursor-not-allowed",
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
                      checked
                        ? [t.border, t.softBg, "ring-2", t.ring].join(" ")
                        : "border-white/10 bg-black/20 hover:bg-black/30",
                    ].join(" ")}
                  >
                    <div className="text-xs text-slate-400">{c.category}</div>
                    <div className={["text-lg font-bold", checked ? t.badgeText : "text-white"].join(" ")}>
                      {c.answer}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{checked ? "✅ Seleccionada" : "Tocar para seleccionar"}</div>
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

                <span className="text-slate-500 font-normal">
                  • empieza ronda: <b>Equipo {getRoundStartTeam(roundIndex) + 1}</b>
                </span>
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

          {/* ✅ Botones de puntaje */}
          {!isLightning ? (
            <button
              onClick={() => markGuessed(currentTeam)}
              disabled={!topCard || !running}
              className={[
                "w-full rounded-2xl px-5 py-3 font-semibold transition",
                !topCard || !running
                  ? "cursor-not-allowed bg-white/5 text-slate-400"
                  : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400",
              ].join(" ")}
            >
              ✅ Adivinada (+1)
            </button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: safeTeamsForUI }, (_, i) => {
                const tt = TEAM_THEME[i] ?? TEAM_THEME[0];
                return (
                  <button
                    key={i}
                    onClick={() => markGuessed(i)}
                    disabled={!topCard || !running}
                    className={[
                      "w-full rounded-2xl px-5 py-3 font-semibold transition",
                      !topCard || !running
                        ? "cursor-not-allowed bg-white/5 text-slate-400"
                        : ["cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400", "border", tt.border].join(" "),
                    ].join(" ")}
                  >
                    ✅ Adivinada (+1) — Equipo {i + 1}
                  </button>
                );
              })}
            </div>
          )}

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
              <div className="mt-2 text-xs text-slate-400">
                {isLightning
                  ? "En ⚡ Relámpago, adivinan todos: el punto se lo das al equipo que acertó."
                  : "El punto va al equipo del turno."}
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
            Si se acaban las cartas, <b>termina la ronda</b> y pasa automáticamente a la siguiente (recargando el mazo).<br />
            El equipo que empieza la Ronda 1 es <b>al azar</b> y luego rota: R2 empieza el siguiente, R3 el siguiente.
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Resultado final</h3>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-lg font-bold">{finalWinnerText}</div>

            <div className="mt-2 text-sm text-slate-300">
              Puntos totales: {roundScores.map((v, i) => `E${i + 1}: ${v}`).join(" • ")}
            </div>

            <div className="mt-2 text-sm text-slate-300">
              Marcador global: {globalWins.map((v, i) => `E${i + 1}: ${v}`).join(" • ")}
            </div>

            <div className="mt-4 text-sm font-semibold text-slate-200">Ganador por ronda</div>
            <div className="mt-2 space-y-2">
              {perRoundWinners.map((r, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-sm text-slate-200">
                    <b>{r.roundName}:</b> {r.winner === "Empate" ? "Empate" : `Ganó ${r.winner}`}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {r.row.map((v, i) => `E${i + 1}: ${v}`).join(" • ")}
                  </div>
                </div>
              ))}
            </div>

            {finalWinner === "Empate" && (
              <div className="mt-3 text-xs text-slate-400">Hubo empate en el total: no se sumó +1 global a ningún equipo.</div>
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

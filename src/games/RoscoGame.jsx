import { useEffect, useMemo, useState } from "react";
import { ROSCO_BANK, ROSCO_LETTERS, ROSCO_NIVELES } from "./roscoBank";

const STORAGE_KEY = "rosco-game-state";

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
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

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

const TEAM_THEME = [
  {
    name: "Azul",
    pageBg: "bg-gradient-to-br from-sky-50 dark:from-sky-950 via-white dark:via-slate-900 to-slate-50 dark:to-slate-800",
    border: "border-sky-300 dark:border-sky-700",
    ring: "ring-sky-500",
    softBg: "bg-sky-50 dark:bg-sky-950",
    badgeBg: "bg-sky-100 dark:bg-sky-900",
    badgeText: "text-sky-700 dark:text-sky-300",
    dot: "text-sky-600 dark:text-sky-400",
  },
  {
    name: "Rojo",
    pageBg: "bg-gradient-to-br from-rose-50 dark:from-rose-950 via-white dark:via-slate-900 to-slate-50 dark:to-slate-800",
    border: "border-rose-300 dark:border-rose-700",
    ring: "ring-rose-500",
    softBg: "bg-rose-50 dark:bg-rose-950",
    badgeBg: "bg-rose-100 dark:bg-rose-900",
    badgeText: "text-rose-700 dark:text-rose-300",
    dot: "text-rose-600 dark:text-rose-400",
  },
];

// Opciones de una letra en el nivel pedido. Si no hay al menos dos no se les
// puede dar una definición distinta a cada equipo, así que completamos con los
// otros niveles (pasa con la Ñ y la X, donde el idioma no da para más).
function opcionesPara(letra, nivel) {
  const porNivel = ROSCO_BANK[letra] ?? {};
  const propias = porNivel[nivel] ?? [];
  if (propias.length >= 2) return propias;

  const resto = ROSCO_NIVELES.filter((n) => n.id !== nivel).flatMap((n) => porNivel[n.id] ?? []);
  return [...propias, ...resto];
}

// Arma los dos roscos a la vez para garantizar definiciones distintas por equipo.
function buildRoscos(nivel) {
  const a = [];
  const b = [];

  for (const letra of ROSCO_LETTERS) {
    const opciones = shuffle(opcionesPara(letra, nivel));
    if (opciones.length === 0) continue;

    const paraA = opciones[0];
    const paraB = opciones[1 % opciones.length];

    a.push({ letra, ...paraA, estado: "pendiente" });
    b.push({ letra, ...paraB, estado: "pendiente" });
  }

  return [a, b];
}

// Próxima letra pendiente, dando la vuelta al rosco. -1 si no queda ninguna.
function nextPendingIndex(rosco, fromIndex) {
  const n = rosco.length;
  for (let step = 1; step <= n; step++) {
    const i = (fromIndex + step) % n;
    if (rosco[i].estado === "pendiente") return i;
  }
  return rosco[fromIndex]?.estado === "pendiente" ? fromIndex : -1;
}

export default function RoscoGame() {
  const saved = useMemo(() => loadState(), []);

  const [phase, setPhase] = useState(() => saved?.phase ?? "setup"); // setup | play | results

  // Tiempo configurable por equipo (uno por equipo, para poder dar ventaja)
  const [timeTeam1, setTimeTeam1] = useState(() => String(saved?.timeTeam1 ?? 240));
  const [timeTeam2, setTimeTeam2] = useState(() => String(saved?.timeTeam2 ?? 240));

  // Dificultad de las definiciones, igual para los dos equipos
  const [dificultad, setDificultad] = useState(() => saved?.dificultad ?? "medio");

  const [teams, setTeams] = useState(() => saved?.teams ?? []);
  const [currentTeam, setCurrentTeam] = useState(() => saved?.currentTeam ?? 0);
  const [running, setRunning] = useState(() => saved?.running ?? false);

  // Se muestra al cambiar de turno cuando el equipo anterior falló
  const [lastReveal, setLastReveal] = useState(() => saved?.lastReveal ?? null);

  // El lector ve la respuesta para poder juzgar; se puede tapar si el celular circula
  const [showAnswer, setShowAnswer] = useState(() => saved?.showAnswer ?? true);

  const [confirmReset, setConfirmReset] = useState(false);

  const time1Num = useMemo(() => {
    const n = toNumberOrNaN(timeTeam1);
    return Number.isNaN(n) ? 0 : n;
  }, [timeTeam1]);

  const time2Num = useMemo(() => {
    const n = toNumberOrNaN(timeTeam2);
    return Number.isNaN(n) ? 0 : n;
  }, [timeTeam2]);

  // Persistencia
  useEffect(() => {
    const stateToSave = {
      phase,
      timeTeam1: time1Num || (saved?.timeTeam1 ?? 240),
      timeTeam2: time2Num || (saved?.timeTeam2 ?? 240),
      teams,
      currentTeam,
      running,
      lastReveal,
      showAnswer,
      dificultad,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    phase,
    time1Num,
    time2Num,
    dificultad,
    teams,
    currentTeam,
    running,
    lastReveal,
    showAnswer,
    saved?.timeTeam1,
    saved?.timeTeam2,
  ]);

  const active = teams[currentTeam] ?? null;
  const activeCard = active && active.index >= 0 ? active.rosco[active.index] : null;
  const activeOutOfTime = !!active && active.secondsLeft <= 0;
  const activeDone = !!active && (activeOutOfTime || active.index < 0);

  // Reloj: corre sólo para el equipo activo y sólo mientras el turno está en marcha.
  useEffect(() => {
    if (phase !== "play" || !running || activeDone) return;

    const t = setInterval(() => {
      setTeams((prev) => {
        const cur = prev[currentTeam];
        if (!cur || cur.secondsLeft <= 0) return prev;

        const copy = [...prev];
        copy[currentTeam] = { ...cur, secondsLeft: cur.secondsLeft - 1 };
        return copy;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [phase, running, activeDone, currentTeam]);

  function startGame() {
    const t1 = clamp(time1Num || 240, 30, 900);
    const t2 = clamp(time2Num || 240, 30, 900);

    const [roscoA, roscoB] = buildRoscos(dificultad);

    setTeams([
      { rosco: roscoA, index: 0, aciertos: 0, fallos: 0, secondsLeft: t1 },
      { rosco: roscoB, index: 0, aciertos: 0, fallos: 0, secondsLeft: t2 },
    ]);

    setTimeTeam1(String(t1));
    setTimeTeam2(String(t2));

    setCurrentTeam(0);
    setRunning(false);
    setLastReveal(null);
    setPhase("play");
  }

  // ¿Puede seguir jugando este equipo?
  function teamCanPlay(team) {
    return !!team && team.secondsLeft > 0 && team.index >= 0;
  }

  // Pasa el turno al rival. Si el rival no puede jugar, se queda el actual.
  // Si ninguno puede, termina el juego.
  function passTurn(updatedTeams) {
    const other = currentTeam === 0 ? 1 : 0;

    if (teamCanPlay(updatedTeams[other])) {
      setCurrentTeam(other);
      setRunning(false);
      return;
    }

    if (teamCanPlay(updatedTeams[currentTeam])) {
      setRunning(false);
      return;
    }

    setRunning(false);
    setPhase("results");
  }

  // Marca la letra actual y decide si el turno sigue o cambia de equipo.
  function resolveCard(estado) {
    if (!activeCard || !running) return;

    const copy = teams.map((t) => ({ ...t, rosco: [...t.rosco] }));
    const team = copy[currentTeam];

    if (estado !== "pendiente") {
      team.rosco[team.index] = { ...team.rosco[team.index], estado };
      if (estado === "acierto") team.aciertos += 1;
      if (estado === "fallo") team.fallos += 1;
    }

    team.index = nextPendingIndex(team.rosco, team.index);
    setTeams(copy);

    // Rosco completo: gana quien lo termina, se corta la partida.
    if (team.index < 0 && estado === "acierto") {
      setRunning(false);
      setLastReveal(null);
      setPhase("results");
      return;
    }

    if (estado === "acierto") {
      setLastReveal(null);
      return; // acierta y sigue jugando
    }

    setLastReveal(
      estado === "fallo"
        ? { letra: activeCard.letra, respuesta: activeCard.respuesta, equipo: currentTeam }
        : null
    );
    passTurn(copy);
  }

  // El equipo activo se quedó sin tiempo: se confirma y pasa al rival.
  function handleTimeUp() {
    setLastReveal(null);
    passTurn(teams);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("setup");
    setTeams([]);
    setCurrentTeam(0);
    setRunning(false);
    setLastReveal(null);
    setTimeTeam1("240");
    setTimeTeam2("240");
    setDificultad("medio");
    setConfirmReset(false);
  }

  const theme = TEAM_THEME[currentTeam] ?? TEAM_THEME[0];

  // Resultado final: más aciertos; desempata menos fallos.
  const finalText = useMemo(() => {
    if (teams.length < 2) return "Sin datos";
    const [t1, t2] = teams;

    if (t1.aciertos !== t2.aciertos) {
      return `Ganador: Equipo ${t1.aciertos > t2.aciertos ? 1 : 2}`;
    }
    if (t1.fallos !== t2.fallos) {
      return `Ganador: Equipo ${t1.fallos < t2.fallos ? 1 : 2} (mismos aciertos, menos fallos)`;
    }
    return "Empate";
  }, [teams]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">🔤 El Rosco</h2>
            <p className="text-slate-600 dark:text-slate-300">
              De la A a la Z: acertá, fallá o pedí pasapalabra. Cada equipo tiene su propio rosco y su propio reloj.
            </p>
          </div>

          {phase !== "setup" && (
            <div className="flex items-center gap-2">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Reiniciar
                </button>
              ) : (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-300">¿Seguro?</span>
                  <button
                    onClick={resetAll}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                  >
                    Sí, reiniciar
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
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
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">Configuración</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Tiempo del Equipo 1 (segundos)", value: timeTeam1, set: setTimeTeam1, theme: TEAM_THEME[0] },
              { label: "Tiempo del Equipo 2 (segundos)", value: timeTeam2, set: setTimeTeam2, theme: TEAM_THEME[1] },
            ].map((f) => (
              <div key={f.label} className="space-y-2">
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  {f.label}{" "}
                  <span className={["ml-1 rounded-lg px-2 py-0.5 text-[11px]", f.theme.badgeBg, f.theme.badgeText].join(" ")}>
                    {f.theme.name}
                  </span>
                </label>
                <input
                  type="text"
                  value={f.value}
                  inputMode="numeric"
                  pattern="\d*"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!onlyDigitsOrEmpty(v)) return;
                    f.set(v);
                  }}
                  onBlur={() => {
                    const n = toNumberOrNaN(f.value);
                    f.set(String(Number.isNaN(n) ? 240 : clamp(n, 30, 900)));
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 outline-none focus:bg-white dark:focus:bg-slate-800"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Min: 30s • Max: 900s (15 min)</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "2 min", v: "120" },
              { label: "3 min", v: "180" },
              { label: "4 min", v: "240" },
              { label: "5 min", v: "300" },
            ].map((p) => (
              <button
                key={p.v}
                onClick={() => {
                  setTimeTeam1(p.v);
                  setTimeTeam2(p.v);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Ambos: {p.label}
              </button>
            ))}
          </div>

          {/* Dificultad de las definiciones */}
          <div className="mt-6 space-y-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">Dificultad de las definiciones</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROSCO_NIVELES.map((n) => {
                const activo = dificultad === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setDificultad(n.id)}
                    className={[
                      "cursor-pointer rounded-xl border p-3 text-left transition",
                      activo
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    <div className={["font-semibold", activo ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"].join(" ")}>
                      {n.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{n.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={startGame}
            className="mt-6 w-full cursor-pointer rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
          >
            Comenzar rosco
          </button>

          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-200">
            <b>Cómo se juega:</b> una persona hace de <b>lector</b> y se queda con el celular: lee la definición en voz
            alta y ve la respuesta, así puede marcar si acertaron. Si el equipo{" "}
            <b className="text-emerald-700 dark:text-emerald-300">acierta</b>, sigue con la letra siguiente. Si{" "}
            <b className="text-rose-700 dark:text-rose-300">falla</b> o pide <b>pasapalabra</b>, el turno pasa al rival. El reloj de cada
            equipo corre sólo durante su turno. Gana quien complete el rosco o quien tenga más aciertos cuando se
            acaben los dos relojes.
          </div>
        </div>
      )}

      {/* PLAY */}
      {phase === "play" && active && (
        <div className={["rounded-2xl border p-6 space-y-4 border-slate-200 dark:border-slate-700", theme.pageBg, theme.softBg].join(" ")}>
          {/* Marcadores */}
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((t, i) => {
              const th = TEAM_THEME[i] ?? TEAM_THEME[0];
              const isActive = i === currentTeam;
              return (
                <div
                  key={i}
                  className={[
                    "rounded-xl border bg-slate-50 dark:bg-slate-800 p-3",
                    th.border,
                    isActive ? ["ring-2", th.ring].join(" ") : "opacity-70",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      <span className={th.dot}>●</span> Equipo {i + 1}
                    </span>
                    <span
                      className={[
                        "font-mono text-lg",
                        // Late en rojo cuando al equipo en juego le quedan 10s
                        isActive && running && t.secondsLeft > 0 && t.secondsLeft <= 10
                          ? "animate-heartbeat font-bold text-rose-600 dark:text-rose-400"
                          : "",
                      ].join(" ")}
                    >
                      {formatTime(t.secondsLeft)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    ✅ {t.aciertos} • ❌ {t.fallos} • Quedan{" "}
                    {t.rosco.filter((c) => c.estado === "pendiente").length}
                    {t.secondsLeft <= 0 && <span className="ml-2 text-rose-600 dark:text-rose-400">Sin tiempo</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rosco del equipo activo */}
          <Rosco rosco={active.rosco} currentIndex={active.index} ringClass={theme.ring} />

          {/* Se acabó el tiempo del equipo activo */}
          {activeOutOfTime ? (
            <div className="rounded-2xl border border-rose-300 dark:border-rose-700 bg-slate-50 dark:bg-slate-800 p-8 text-center">
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">⏱ Se acabó el tiempo</div>
              <div className="mt-2 text-slate-600 dark:text-slate-300">
                El Equipo {currentTeam + 1} terminó su rosco con {active.aciertos} aciertos.
              </div>
              <button
                onClick={handleTimeUp}
                className="mt-4 w-full cursor-pointer rounded-2xl bg-slate-200 dark:bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Continuar
              </button>
            </div>
          ) : !running ? (
            /* Cambio de turno: la definición queda tapada hasta que el equipo esté listo */
            <div className={["rounded-2xl border bg-slate-50 dark:bg-slate-800 p-8 text-center", theme.border].join(" ")}>
              {lastReveal && (
                <div className="animate-shake mb-4 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950 p-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">El Equipo {lastReveal.equipo + 1} falló la </span>
                  <b>{lastReveal.letra}</b>
                  <span className="text-slate-600 dark:text-slate-300">. La respuesta era </span>
                  <b className="text-emerald-700 dark:text-emerald-300">{lastReveal.respuesta}</b>
                </div>
              )}

              <div className="text-sm text-slate-600 dark:text-slate-300">Turno de</div>
              <div className={["text-3xl font-black", theme.badgeText].join(" ")}>Equipo {currentTeam + 1}</div>
              <div className="mt-2 text-slate-600 dark:text-slate-300">
                El celular queda con <b>quien lee</b>. Tocá <b>Iniciar turno</b> para ver la definición y arrancar el
                reloj.
              </div>

              <button
                onClick={() => setRunning(true)}
                className="mt-4 w-full cursor-pointer rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
              >
                Iniciar turno ({formatTime(active.secondsLeft)})
              </button>
            </div>
          ) : (
            <>
              {/* Definición en juego. La key hace que cada letra entre animada. */}
              <div
                key={activeCard?.letra}
                className={["animate-flip-in rounded-2xl border bg-slate-50 dark:bg-slate-800 p-6 shadow-sm", theme.border].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Empieza con la
                    <span className="ml-2 rounded-lg bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[11px] normal-case tracking-normal text-slate-600 dark:text-slate-300">
                      {ROSCO_NIVELES.find((n) => n.id === dificultad)?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setRunning(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Pausar
                  </button>
                </div>

                <div className={["text-7xl font-black leading-none", theme.badgeText].join(" ")}>
                  {activeCard?.letra}
                </div>

                <div className="mt-4 text-xl text-slate-800 dark:text-slate-100">{activeCard?.pista}</div>

                {/* Quien lee necesita la respuesta para poder marcar si acertaron */}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-amber-700/80 dark:text-amber-300/80">
                      🤫 Respuesta — solo quien lee
                    </div>
                    <div className="truncate text-2xl font-black text-amber-800 dark:text-amber-200">
                      {showAnswer ? activeCard?.respuesta : "• • • • • •"}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAnswer((v) => !v)}
                    className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    {showAnswer ? "🙈 Tapar" : "👁 Ver"}
                  </button>
                </div>
              </div>

              {/* Botones */}
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => resolveCard("acierto")}
                  className="cursor-pointer rounded-2xl bg-emerald-600 px-5 py-4 font-semibold text-white transition hover:bg-emerald-500"
                >
                  ✅ Adiviné
                </button>
                <button
                  onClick={() => resolveCard("fallo")}
                  className="cursor-pointer rounded-2xl bg-rose-600 px-5 py-4 font-semibold text-white transition hover:bg-rose-500"
                >
                  ❌ Fallé
                </button>
              </div>

              <button
                onClick={() => resolveCard("pendiente")}
                className={["w-full cursor-pointer rounded-2xl border bg-slate-200 dark:bg-slate-700 px-5 py-4 font-semibold transition hover:bg-slate-300 dark:hover:bg-slate-600", theme.border].join(" ")}
              >
                ↔ Pasapalabra
              </button>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Si acertás seguís vos. Si fallás o pedís pasapalabra, el turno pasa al otro equipo.
              </div>
            </>
          )}
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && teams.length === 2 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">Resultado final</h3>

          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
            <div className="text-lg font-bold">{finalText}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {teams.map((t, i) => `Equipo ${i + 1}: ${t.aciertos} aciertos • ${t.fallos} fallos`).join("  |  ")}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {teams.map((t, i) => {
              const th = TEAM_THEME[i] ?? TEAM_THEME[0];
              return (
                <div key={i} className={["rounded-2xl border bg-slate-50 dark:bg-slate-800 p-4", th.border].join(" ")}>
                  <div className="font-semibold">
                    <span className={th.dot}>●</span> Rosco del Equipo {i + 1}
                  </div>

                  <Rosco rosco={t.rosco} currentIndex={-1} ringClass={th.ring} />

                  <div className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
                    {t.rosco.map((c) => (
                      <div key={c.letra} className="flex gap-2">
                        <span
                          className={[
                            "w-6 shrink-0 font-bold",
                            c.estado === "acierto"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : c.estado === "fallo"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500 dark:text-slate-400",
                          ].join(" ")}
                        >
                          {c.letra}
                        </span>
                        <span className="text-slate-700 dark:text-slate-200">{c.respuesta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={startGame}
            className="mt-6 w-full cursor-pointer rounded-2xl bg-slate-200 dark:bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Jugar otro rosco (misma configuración)
          </button>

          <button
            onClick={() => setPhase("setup")}
            className="mt-2 w-full cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Volver a configuración
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * El rosco: las letras en círculo, coloreadas según su estado.
 */
function Rosco({ rosco, currentIndex, ringClass }) {
  const total = rosco.length;

  return (
    <div className="mx-auto my-4 w-full max-w-sm">
      <div className="relative aspect-square">
        {rosco.map((c, i) => {
          // -90° para que la primera letra quede arriba
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const left = 50 + 42 * Math.cos(angle);
          const top = 50 + 42 * Math.sin(angle);
          const isCurrent = i === currentIndex;

          return (
            <div
              // La key incluye el estado: al resolverse la letra el nodo se
              // remonta y vuelve a dispararse el pop.
              key={`${c.letra}-${c.estado}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              className={[
                "absolute grid h-[11%] w-[11%] -translate-x-1/2 -translate-y-1/2 place-items-center",
                "rounded-full border text-[min(3.2vw,0.95rem)] font-bold transition",
                c.estado !== "pendiente" ? "animate-pop" : "",
                c.estado === "acierto"
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                  : c.estado === "fallo"
                    ? "border-rose-300 dark:border-rose-700 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                    : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200",
                isCurrent ? ["ring-2 scale-125", ringClass].join(" ") : "",
              ].join(" ")}
            >
              {c.letra}
            </div>
          );
        })}

        {/* Centro: letra en juego */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div
              key={currentIndex >= 0 ? rosco[currentIndex]?.letra : "vacio"}
              className="animate-pop text-5xl font-black text-slate-900 dark:text-slate-50"
            >
              {currentIndex >= 0 ? rosco[currentIndex]?.letra : "🔤"}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {rosco.filter((c) => c.estado === "acierto").length} / {total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

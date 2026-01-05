import { useMemo, useState } from "react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EMOJIS = ["🍕", "🚀", "🎮", "🐱", "⚽", "🎧"]; // 6 pares => 12 cartas

export default function MemoryMatchGame() {
  const initialCards = useMemo(() => {
    const base = EMOJIS.flatMap((e) => [
      { id: crypto.randomUUID(), value: e },
      { id: crypto.randomUUID(), value: e },
    ]);
    return shuffle(base);
  }, []);

  const [cards, setCards] = useState(
    initialCards.map((c) => ({ ...c, matched: false }))
  );
  const [open, setOpen] = useState([]); // ids abiertos (máx 2)
  const [moves, setMoves] = useState(0);

  const allMatched = cards.every((c) => c.matched);

  function reset() {
    const base = EMOJIS.flatMap((e) => [
      { id: crypto.randomUUID(), value: e },
      { id: crypto.randomUUID(), value: e },
    ]);
    const mixed = shuffle(base).map((c) => ({ ...c, matched: false }));
    setCards(mixed);
    setOpen([]);
    setMoves(0);
  }

  function onFlip(card) {
    if (card.matched) return;
    if (open.includes(card.id)) return;
    if (open.length === 2) return;

    const nextOpen = [...open, card.id];
    setOpen(nextOpen);

    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);

      const [aId, bId] = nextOpen;
      const a = cards.find((c) => c.id === aId);
      const b = cards.find((c) => c.id === bId);

      if (a && b && a.value === b.value) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === aId || c.id === bId ? { ...c, matched: true } : c
          )
        );
        setOpen([]);
      } else {
        setTimeout(() => setOpen([]), 700);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">🧠 Memory Match</h2>
          <p className="text-slate-300">Encontrá todas las parejas.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            Movidas: <b>{moves}</b>
          </span>
          <button
            onClick={reset}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {allMatched && (
        <div className="mt-4 rounded-xl border border-white/10 bg-emerald-500/10 p-4 text-emerald-200">
          ¡Ganaste! 🎉 Te tomó <b>{moves}</b> movidas.
        </div>
      )}

      <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6">
        {cards.map((card) => {
          const isOpen = open.includes(card.id) || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => onFlip(card)}
              className={[
                "aspect-square rounded-2xl border border-white/10 text-2xl",
                "grid place-items-center transition",
                isOpen ? "bg-white/10" : "bg-black/30 hover:bg-black/20",
                card.matched ? "ring-2 ring-emerald-400/40" : "",
              ].join(" ")}
            >
              {isOpen ? card.value : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

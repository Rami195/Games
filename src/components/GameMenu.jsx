export default function GameMenu({ games, onSelect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-3xl">{g.emoji}</div>
              <h2 className="mt-3 text-xl font-semibold">{g.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{g.desc}</p>
            </div>
            <span className="mt-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 group-hover:bg-white/10">
              Jugar
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

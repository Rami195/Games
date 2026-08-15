export default function GameMenu({ games, onSelect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g, i) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          style={{ animationDelay: `${i * 70}ms` }}
          className="group animate-fade-in-up cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-3xl transition-transform duration-200 group-hover:scale-110">{g.emoji}</div>
              <h2 className="mt-3 text-xl font-semibold">{g.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{g.desc}</p>
            </div>
            <span className="mt-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-700 dark:text-slate-200 transition group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
              Jugar
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

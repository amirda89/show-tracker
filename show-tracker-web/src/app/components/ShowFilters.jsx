const STATUS_OPTIONS = [
  "All",
  "Watching",
  "Plan to watch",
  "On hold",
  "Completed",
  "Dropped",
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "series", label: "Series" },
  { value: "movie", label: "Movies" },
];

export default function ShowFilters({
  shows = [],
  activeFilter,
  onFilterChange,
  typeFilter = "all",
  onTypeFilterChange,
}) {
  return (
    <div className="mb-6 space-y-3">
      {onTypeFilterChange && (
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((item) => {
            const active = typeFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTypeFilterChange(item.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => {
          const count =
            status === "All"
              ? shows.length
              : shows.filter((s) => s.status === status).length;
          const active = activeFilter === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onFilterChange(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-white/70 text-gray-600 border border-gray-200/80 hover:bg-white dark:bg-gray-900/70 dark:text-gray-400 dark:border-gray-800"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}

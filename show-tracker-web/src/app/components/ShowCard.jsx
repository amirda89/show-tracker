export default function ShowCard({
  show,
  isBusy = false,
  onEdit,
  onDelete,
  onEpisodeChange,
  onMarkCompleted,
}) {
  const mediaType = show.media_type ?? show.mediaType ?? "series";
  const isMovie = mediaType === "movie";
  const currentEpisode = show.currentEpisode ?? show.current_episode ?? 0;
  const totalEpisodes = show.total_episodes ?? show.totalEpisodes ?? null;
  const isCompleted = show.status === "Completed";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                  {show.title}
                </h3>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isMovie
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                  }`}
                >
                  {isMovie ? "Movie" : "Series"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {show.status}
                </p>
                {show.profilename && (
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                    {show.profilename}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEdit(show)}
                disabled={isBusy}
                aria-label={`Edit ${show.title}`}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="m16 4 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => onDelete(show.id)}
                disabled={isBusy}
                aria-label={`Delete ${show.title}`}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Series episode controls vs Movie action */}
          {isMovie ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Feature film
              </span>

              {!isCompleted ? (
                <button
                  type="button"
                  onClick={() => onMarkCompleted?.(show)}
                  disabled={isBusy}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Mark completed
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Watched
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Episode
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEpisodeChange(show, "decrement")}
                  disabled={isBusy || currentEpisode <= 0}
                  aria-label="Remove episode"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  −
                </button>

                <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {totalEpisodes
                    ? `${currentEpisode} / ${totalEpisodes}`
                    : currentEpisode}
                </span>

                <button
                  type="button"
                  onClick={() => onEpisodeChange(show, "increment")}
                  disabled={
                    isBusy ||
                    (totalEpisodes !== null && currentEpisode >= totalEpisodes)
                  }
                  aria-label="Add episode"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {isBusy && (
            <p className="mt-2 text-right text-xs text-gray-400">Saving...</p>
          )}
        </div>
      </div>
    </article>
  );
}

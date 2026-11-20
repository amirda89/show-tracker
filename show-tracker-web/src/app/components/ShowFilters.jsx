"use client";

const STATUSES = [
  "All",
  "Watching",
  "Plan to watch",
  "On hold",
  "Completed",
  "Dropped",
];

export default function ShowFilters({ shows, activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-[6px] overflow-x-auto py-[22px] pb-[14px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STATUSES.map((status) => {
        const count =
          status === "All"
            ? shows.length
            : shows.filter((show) => show.status === status).length;

        const isActive = activeFilter === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onFilterChange(status)}
            aria-pressed={isActive}
            className={`flex-none rounded-full border px-[14px] py-[6px] text-[13px] transition ${
              isActive
                ? "border-[#14141c] bg-[#14141c] text-white dark:border-[#f2f2f7] dark:bg-[#f2f2f7] dark:text-[#14141c]"
                : "border-[#e4e4ec] bg-white text-[#6b6b7b] hover:bg-[#f1f1f6] dark:border-[#262634] dark:bg-[#16161f] dark:text-[#9090a3] dark:hover:bg-[#1e1e29]"
            }`}
          >
            {status}

            <b
              className={`ml-[5px] font-semibold ${
                isActive
                  ? "text-white dark:text-[#14141c]"
                  : "text-[#14141c] opacity-70 dark:text-[#f2f2f7]"
              }`}
            >
              {count}
            </b>
          </button>
        );
      })}
    </div>
  );
}

export default function EmptyState({ activeFilter }) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-dashed border-[#e4e4ec] px-5 py-11 text-center text-[#6b6b7b] dark:border-[#262634] dark:text-[#9090a3]">
      <div className="mb-[6px] text-[34px]">📺</div>

      <p>
        {activeFilter === "All"
          ? "No shows yet. Add your first one above."
          : `No shows with status "${activeFilter}".`}
      </p>
    </div>
  );
}

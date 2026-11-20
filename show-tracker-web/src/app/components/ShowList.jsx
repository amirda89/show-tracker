import ShowCard from "./ShowCard";
import EmptyState from "./EmptyState";

export default function ShowList({
  shows,
  activeFilter,
  busyShowIds,
  onEdit,
  onDelete,
  onEpisodeChange,
}) {
  if (!shows.length) {
    return <EmptyState activeFilter={activeFilter} />;
  }

  return (
    <div className="mt-6 space-y-3">
      {shows.map((show) => (
        <ShowCard
          key={show.id}
          show={show}
          isBusy={busyShowIds.includes(show.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onEpisodeChange={onEpisodeChange}
        />
      ))}
    </div>
  );
}

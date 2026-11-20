import ShowTracker from "./components/ShowTracker";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f8] bg-[radial-gradient(600px_300px_at_15%_-5%,rgba(99,102,241,0.1),transparent),radial-gradient(500px_280px_at_95%_0%,rgba(139,92,246,0.1),transparent)] text-[#14141c] antialiased dark:bg-[#0c0c12] dark:text-[#f2f2f7]">
      <ShowTracker />
    </div>
  );
}

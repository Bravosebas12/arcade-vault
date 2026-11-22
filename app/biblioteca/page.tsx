import { BestScoreSlot } from "@/features/game-detail/components/GameLeaderboard";
import { GAMES } from "@/features/games/data/catalog";
import { LibraryScreen } from "@/features/library/components/LibraryScreen";

export default function LibraryPage() {
  // Each card's "MEJOR PUNTUACIÓN" streams from Supabase as a server slot, so the client grid
  // (search, filters, tilt) stays prerendered and never queries the database itself.
  const bestScores = Object.fromEntries(GAMES.map((g) => [g.id, <BestScoreSlot key={g.id} game={g} />]));
  return <LibraryScreen bestScores={bestScores} />;
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CATS, GAMES } from "@/features/games/data/catalog";
import { filterGames } from "@/features/games/lib/filter-games";
import type { CategoryFilter } from "@/features/games/model/game";
import { Filters } from "@/features/library/components/Filters";
import { GameCard } from "@/features/library/components/GameCard";
import { Hero } from "@/features/library/components/Hero";

export function LibraryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("TODOS");
  const games = useMemo(() => filterGames(GAMES, query, category), [query, category]);

  return (
    <div className="fade-in">
      <Hero />
      <Filters query={query} category={category} categories={CATS} onQueryChange={setQuery} onCategoryChange={setCategory} />
      <div className="av-grid">
        {games.map((g) => (
          <GameCard key={g.id} game={g} onSelect={(game) => router.push(`/juegos/${game.id}`)} />
        ))}
        {games.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
            <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>NO HAY RESULTADOS</div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}

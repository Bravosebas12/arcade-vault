import { Suspense } from "react";
import { fallbackHallTabs, HallOfFameData } from "@/features/hall-of-fame/components/HallOfFameData";
import { HallOfFameScreen } from "@/features/hall-of-fame/components/HallOfFameScreen";

export default function HallOfFamePage() {
  // Games and leaderboards are read at request time; the prerendered shell shows the catalog fallback.
  return (
    <Suspense fallback={<HallOfFameScreen tabs={fallbackHallTabs()} />}>
      <HallOfFameData />
    </Suspense>
  );
}

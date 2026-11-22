import { ActivitySection } from "@/features/home/components/ActivitySection";
import { HomeScreen } from "@/features/home/components/HomeScreen";

export default function HomePage() {
  // The activity section reads Supabase on the server, so it is passed as a slot to the client HomeScreen.
  return <HomeScreen activity={<ActivitySection />} />;
}

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SearchBar from "@/components/layout/SearchBar";

import WelcomeCard from "@/components/home/WelcomeCard";
import DailyBriefing from "@/components/home/DailyBriefing";
import ContinueLearning from "@/components/home/ContinueLearning";
import MissionCard from "@/components/home/MissionCard";
import QuickActions from "@/components/home/QuickActions";
import RecommendationCard from "@/components/home/RecommendationCard";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-[#09090B] text-white">
      <Sidebar />

      <section className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-10">
          <Topbar />

          <SearchBar />

          <WelcomeCard />

          <DailyBriefing />

          <div className="grid gap-6 lg:grid-cols-2">
            <ContinueLearning />

            <MissionCard />
          </div>

          <QuickActions />

          <RecommendationCard />
        </div>
      </section>
    </main>
  );
}
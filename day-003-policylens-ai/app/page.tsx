import Header from "@/components/Header";
import UploadPanel from "@/components/UploadPanel";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">

      <Header />

      <div className="mx-auto grid max-w-7xl gap-8 px-8 py-10 lg:grid-cols-2">

        <UploadPanel />

        <ChatPanel />

      </div>

    </main>
  );
}
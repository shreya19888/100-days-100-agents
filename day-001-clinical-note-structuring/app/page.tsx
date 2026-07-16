import Header from "../components/Header";
import ClinicalNoteForm from "../components/ClinicalNoteForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 md:py-12">
        <Header />
        <ClinicalNoteForm />
      </div>
    </main>
  );
}
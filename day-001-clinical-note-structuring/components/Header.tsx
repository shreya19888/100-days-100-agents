export default function Header() {
  return (
    <header className="mb-12 text-center">
      <div className="mb-4 text-6xl">🩺</div>

      <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
        Clinical Note Structuring Assistant
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
        Transform unstructured clinical notes into organized SOAP notes using AI.
      </p>
    </header>
  );
}
export default function Header() {
  return (
    <header className="mb-8 text-center">
      <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
        🩺 AI Healthcare Assistant
      </div>

      <h1 className="mt-6 bg-gradient-to-r from-white via-blue-200 to-cyan-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
        Clinical Note
        <br />
        Structuring Assistant
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
        Convert messy free-text clinical notes into structured SOAP
        documentation using GPT-4.1.
      </p>
    </header>
  );
}
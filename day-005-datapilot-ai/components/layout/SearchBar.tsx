import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">

        <Search className="text-zinc-500" />

        <input
          placeholder="Search datasets, metrics or ask AI..."
          className="w-full bg-transparent outline-none placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}
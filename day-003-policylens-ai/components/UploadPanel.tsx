"use client";

import { useRef, useState } from "react";

export default function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);

  async function handleSelectFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);

    setFiles((prev) => [...prev, ...selectedFiles]);

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Upload failed:", await response.text());
      } 
      else {
        const data = await response.json();
        console.log("Upload successful:", data);
      }
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-2xl font-bold text-white">
        Knowledge Base
      </h2>

      <p className="mt-2 text-zinc-400">
        Upload HR policies, employee handbooks, and benefits documents.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleSelectFile}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
      >
        + Upload Documents
      </button>

      <div className="mt-8 space-y-3">
        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-6 text-center text-zinc-500">
            No documents uploaded yet.
          </div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-4"
            >
              <p className="font-medium text-white">{file.name}</p>

              <p className="mt-1 text-sm text-zinc-400">
                Uploading / Processing...
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
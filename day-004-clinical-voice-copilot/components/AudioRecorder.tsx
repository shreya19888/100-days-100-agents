"use client";

import { useRef, useState } from "react";

type Props = {
  onTranscript: (text: string) => void;
};

export default function AudioRecorder({
  onTranscript,
}: Props) {
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();

        formData.append(
          "audio",
          new File([blob], "recording.webm", {
            type: "audio/webm",
          })
        );

        try {
          const response = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to transcribe audio.");
          }

          const data = await response.json();

          console.log("Transcription:", data);

          onTranscript(data.transcript);
        } catch (error) {
          console.error(error);
          onTranscript("Failed to transcribe audio.");
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error(error);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-4">
      {!recording ? (
        <button
          onClick={startRecording}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          🎙 Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
        >
          ⏹ Stop Recording
        </button>
      )}
    </div>
  );
}
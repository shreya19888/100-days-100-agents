"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function PhotoUploader({
  onSubmit,
  busy,
}: {
  onSubmit: (file: File, previewUrl: string) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCameraStarting(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Attach stream after the <video> mounts
  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      setError("Couldn't start the camera preview. Please try again or upload a photo.");
      stopCamera();
    });
  }, [cameraOpen, stopCamera]);

  const acceptFile = useCallback((next: File | undefined | null) => {
    setError(null);
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WEBP photo.");
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError("Please use a photo under 8MB.");
      return;
    }
    const url = URL.createObjectURL(next);
    setFile(next);
    setPreview(url);
  }, []);

  async function openCamera() {
    setError(null);

    if (!window.isSecureContext) {
      setError(
        "Camera needs a secure connection. Use http://localhost:3000 (not a network IP) or HTTPS.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support camera access. Please upload a photo instead.");
      return;
    }

    setCameraStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      });

      streamRef.current = stream;
      setCameraOpen(true);
      setCameraStarting(false);
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
      setCameraStarting(false);

      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Camera permission was blocked. Allow camera access in your browser settings, then try again.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera was found on this device. Please upload a photo instead.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError("Your camera may be in use by another app. Close it and try again.");
      } else {
        setError("We couldn't open the camera. Please upload a photo instead.");
      }
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera isn't ready yet. Wait a moment, then try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Couldn't capture this frame. Please try again.");
      return;
    }

    // Mirror selfie so it matches what the user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );

    if (!blob) {
      setError("Couldn't save the photo. Please try again.");
      return;
    }

    const captured = new File([blob], `charme-selfie-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    acceptFile(captured);
    stopCamera();
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className={`charme-card rounded-[2rem] border-dashed p-6 transition md:p-10 ${
          dragOver ? "border-charme-leaf bg-charme-leaf-soft/40" : ""
        }`}
      >
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-charme-sand/60">
            {cameraOpen ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
                {cameraStarting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-charme-ink/40 text-sm text-charme-cream">
                    Opening camera…
                  </div>
                ) : null}
              </>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected selfie preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-charme-muted">
                <ImagePlus className="h-10 w-10 opacity-70" />
                <p className="text-sm">Drop a front-facing selfie here</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display text-3xl text-charme-ink md:text-4xl">Let&apos;s meet your skin.</h3>
            <p className="mt-3 text-sm leading-relaxed text-charme-muted md:text-base">
              Use a front-facing photo in natural, even lighting. Keep your face centered and filling
              most of the frame — remove heavy makeup if possible.
            </p>
            <p className="mt-4 rounded-2xl bg-charme-leaf-soft/50 px-4 py-3 text-sm text-charme-ink/80">
              Your photo is used to generate your skin snapshot. We don&apos;t need to know who you are
              to help you understand your skin.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {cameraOpen ? (
                <>
                  <Button onClick={capturePhoto} disabled={busy || cameraStarting}>
                    <Camera className="h-4 w-4" />
                    Take photo
                  </Button>
                  <Button variant="secondary" onClick={stopCamera} disabled={busy}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                  >
                    <Upload className="h-4 w-4" />
                    Upload photo
                  </Button>
                  <Button variant="secondary" onClick={openCamera} disabled={busy || cameraStarting}>
                    <Camera className="h-4 w-4" />
                    {cameraStarting ? "Opening…" : "Camera"}
                  </Button>
                  <Button
                    onClick={() => file && preview && onSubmit(file, preview)}
                    disabled={!file || !preview || busy}
                  >
                    Begin my skin story
                  </Button>
                </>
              )}
            </div>
            {error ? <p className="mt-4 text-sm text-charme-clay">{error}</p> : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

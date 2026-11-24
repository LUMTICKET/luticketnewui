"use client";

import { useRef, useState } from "react";
import { POSTER_ACCEPT, posterSrc, preparePoster } from "@/lib/poster";
import { updateEventPoster } from "@/lib/auth";

/**
 * Poster / flyer picker for listings. Gives the parent a ready-to-send data URL
 * (or null) through onChange; the image is resized in the browser first.
 */
export function PosterUpload({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setWorking(true);
    try {
      onChange(await preparePoster(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use that image.");
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-navy-950">Poster / flyer</span>
        <span className="text-xs text-ink-faint">Optional · JPG, PNG or WebP</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        This is the image customers see on the Lumticket website next to your listing. A portrait or square image works best.
      </p>

      <input
        ref={inputRef}
        id="poster"
        type="file"
        accept={POSTER_ACCEPT}
        className="sr-only"
        disabled={disabled || working}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Poster preview" className="max-h-72 w-full max-w-[16rem] rounded-xl border border-line object-cover" />
          <div className="flex gap-3 text-sm font-semibold">
            <button type="button" disabled={disabled || working} onClick={() => inputRef.current?.click()} className="text-navy-950 hover:text-gold-600">
              Replace
            </button>
            <button type="button" disabled={disabled || working} onClick={() => onChange(null)} className="text-ink-muted underline hover:text-navy-950">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="poster"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && !working) void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm ${
            dragging ? "border-navy-950 bg-surface-alt" : "border-line hover:border-navy-300"
          }`}
        >
          <span className="font-semibold text-navy-950">{working ? "Preparing image…" : "Upload poster or flyer"}</span>
          <span className="mt-1 text-xs text-ink-muted">Click to choose a file, or drag and drop it here</span>
        </label>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}

/**
 * Poster controls for an already-published listing: add, change or remove the
 * poster and save it straight away. Customers see the new image on the website.
 */
export function PosterEditor({
  token,
  eventId,
  title,
  image,
  onSaved,
}: {
  token: string;
  eventId: number | string;
  title: string;
  image: unknown;
  onSaved: (image: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const current = posterSrc(image);

  async function save(next: string | null) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const updated = await updateEventPoster(token, eventId, next);
      onSaved(updated?.image ?? null);
      setNote(next ? "Poster saved. It now shows on the website." : "Poster removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update the poster.");
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    try {
      await save(await preparePoster(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use that image.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-3">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt={`${title} poster`} className="h-40 w-full rounded-xl border border-line object-cover" loading="lazy" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-line text-xs text-ink-muted">
          No poster yet
        </div>
      )}
      <input ref={inputRef} type="file" accept={POSTER_ACCEPT} className="sr-only" aria-label={`Upload poster for ${title}`} disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="mt-2 flex gap-4 text-sm font-semibold">
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="text-navy-950 hover:text-gold-600">
          {busy ? "Saving…" : current ? "Change poster" : "Add poster"}
        </button>
        {current && (
          <button type="button" disabled={busy} onClick={() => void save(null)} className="text-ink-muted underline hover:text-navy-950">
            Remove
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-error">{error}</p>}
      {note && <p role="status" className="mt-1 text-xs text-success">{note}</p>}
    </div>
  );
}

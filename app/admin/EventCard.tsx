"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { getFrames, getPhotos } from "@/lib/data";
import type { Frame, Photo } from "@/lib/types";
import type { AdminEvent } from "./AdminDashboard";

export default function EventCard({
  event,
  onChanged,
}: {
  event: AdminEvent;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${event.slug}`
      : `/${event.slug}`;

  const reload = useCallback(async () => {
    const [f, p] = await Promise.all([getFrames(event.id), getPhotos(event.id)]);
    setFrames(f);
    setPhotos(p);
  }, [event.id]);

  useEffect(() => {
    if (!open) return;
    reload().catch(console.error);
    QRCode.toDataURL(eventUrl, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 2,
    }).then(setQrDataUrl);
  }, [open, reload, eventUrl]);

  async function apiCall(path: string, options: RequestInit, busyKey: string) {
    setBusy(busyKey);
    setMessage(null);
    try {
      const res = await fetch(path, options);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error ?? "Erro na operação.");
        return false;
      }
      return true;
    } finally {
      setBusy(null);
    }
  }

  async function uploadFrame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const nomeInput = form.elements.namedItem("nome") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("event_id", event.id);
    data.append("nome", nomeInput.value);
    data.append("ordem", String(frames.length));

    if (await apiCall("/api/admin/frames", { method: "POST", body: data }, "frame-up")) {
      form.reset();
      await reload();
      onChanged();
    }
  }

  async function deleteFrame(id: string) {
    if (!confirm("Excluir esta moldura?")) return;
    if (await apiCall(`/api/admin/frames/${id}`, { method: "DELETE" }, `frame-${id}`)) {
      await reload();
      onChanged();
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Remover esta foto da galeria?")) return;
    if (await apiCall(`/api/admin/photos/${id}`, { method: "DELETE" }, `photo-${id}`)) {
      await reload();
      onChanged();
    }
  }

  async function deleteEvent() {
    if (
      !confirm(
        `Excluir a festa "${event.nome}"?\n\nISSO APAGA TUDO: molduras e todas as ${event.photosCount} fotos da galeria. Não dá para desfazer.`
      )
    )
      return;
    if (await apiCall(`/api/admin/events/${event.id}`, { method: "DELETE" }, "event-del")) {
      onChanged();
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-pink-200 bg-white shadow">
      {/* Cabeçalho do card */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <div>
          <p className="font-bold text-festa-pink-dark">{event.nome}</p>
          <p className="text-xs text-gray-400">
            <span className="font-mono">/{event.slug}</span>
            {event.data_festa && ` · ${event.data_festa.split("-").reverse().join("/")}`}
            {` · ${event.framesCount} moldura(s) · ${event.photosCount} foto(s)`}
          </p>
        </div>
        <span className="text-festa-pink">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-pink-100 p-4">
          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-festa-pink-dark transition active:scale-95"
            >
              {copied ? "✅ Copiado!" : "🔗 Copiar link"}
            </button>
            <a
              href={`/${event.slug}/galeria`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-festa-pink-dark transition active:scale-95"
            >
              🖼️ Ver galeria
            </a>
            <a
              href={`/api/admin/events/${event.id}/zip`}
              className={`rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-festa-pink-dark transition active:scale-95 ${
                event.photosCount === 0 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              📦 Baixar fotos (.zip)
            </a>
            <button
              onClick={deleteEvent}
              disabled={busy === "event-del"}
              className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-50"
            >
              {busy === "event-del" ? "Excluindo..." : "🗑️ Excluir festa"}
            </button>
          </div>

          {message && <p className="mt-2 text-sm text-red-500">{message}</p>}

          {/* QR Code */}
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-pink-50 p-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code de ${event.nome}`} className="h-28 w-28 rounded-lg bg-white p-1" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center text-xs text-gray-400">
                Gerando...
              </div>
            )}
            <div className="text-sm">
              <p className="font-medium text-festa-pink-dark">QR code da festa</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-500">{eventUrl}</p>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`qrcode-${event.slug}.png`}
                  className="mt-2 inline-block rounded-full bg-festa-pink px-4 py-2 text-xs font-bold text-white transition active:scale-95"
                >
                  ⬇️ Baixar QR code
                </a>
              )}
            </div>
          </div>

          {/* Molduras */}
          <h3 className="mt-5 text-sm font-bold text-festa-pink-dark">
            Molduras ({frames.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-3">
            {frames.map((frame) => (
              <div key={frame.id} className="w-24">
                <div className="aspect-[9/16] overflow-hidden rounded-lg border border-pink-200 bg-gradient-to-b from-pink-50 to-purple-50">
                  <img
                    src={frame.imagem_url}
                    alt={frame.nome ?? "Moldura"}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-1 truncate text-center text-[10px] text-gray-500">
                  {frame.nome ?? "Sem nome"}
                </p>
                <button
                  onClick={() => deleteFrame(frame.id)}
                  disabled={busy === `frame-${frame.id}`}
                  className="mt-1 w-full rounded-full bg-red-50 py-1 text-[10px] text-red-500 transition active:scale-95 disabled:opacity-50"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={uploadFrame} className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="file"
              accept="image/png"
              required
              className="text-xs text-gray-500 file:mr-2 file:rounded-full file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:text-xs file:font-medium file:text-festa-pink-dark"
            />
            <input
              type="text"
              name="nome"
              placeholder="Nome da moldura (opcional)"
              className="rounded-full border border-pink-200 px-4 py-2 text-xs outline-none focus:border-festa-pink"
            />
            <button
              type="submit"
              disabled={busy === "frame-up"}
              className="rounded-full bg-festa-pink px-4 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              {busy === "frame-up" ? "Enviando..." : "⬆️ Adicionar moldura"}
            </button>
          </form>
          <p className="mt-1 text-[10px] text-gray-400">
            PNG com fundo transparente, proporção 9:16 (ex: 1080×1920).
          </p>

          {/* Moderação da galeria */}
          <h3 className="mt-5 text-sm font-bold text-festa-pink-dark">
            Fotos da galeria ({photos.length})
          </h3>
          {photos.length === 0 ? (
            <p className="mt-2 text-xs text-gray-400">Nenhuma foto publicada ainda.</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((photo) => (
                <div key={photo.id}>
                  <a href={photo.imagem_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={photo.imagem_url}
                      alt={photo.autor_nome ?? "Foto"}
                      loading="lazy"
                      className="aspect-[9/16] w-full rounded-lg object-cover"
                    />
                  </a>
                  <p className="mt-1 truncate text-center text-[10px] text-gray-500">
                    {photo.autor_nome ?? "Anônimo"}
                  </p>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    disabled={busy === `photo-${photo.id}`}
                    className="mt-1 w-full rounded-full bg-red-50 py-1 text-[10px] text-red-500 transition active:scale-95 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

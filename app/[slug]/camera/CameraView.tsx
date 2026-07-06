"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getEvent, getFrame, publishPhoto, isDemoMode } from "@/lib/data";
import type { Evento, Frame } from "@/lib/types";

type FacingMode = "user" | "environment";

// Resolução da foto final (proporção 9:16, igual às molduras)
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;

export default function CameraView() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frame");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);

  const [event, setEvent] = useState<Evento | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Foto capturada (null = ainda na câmera)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [autorNome, setAutorNome] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Carrega evento e moldura
  useEffect(() => {
    if (!slug || !frameId) return;
    getEvent(slug).then(setEvent).catch(console.error);
    getFrame(frameId)
      .then((f) => {
        setFrame(f);
        if (f) {
          // Pré-carrega a imagem da moldura para o momento da captura
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = f.imagem_url;
          frameImgRef.current = img;
        }
      })
      .catch(console.error);
  }, [slug, frameId]);

  // Liga a câmera (e religa ao trocar frontal/traseira)
  useEffect(() => {
    if (capturedBlob) return; // câmera pausada durante o preview da foto
    let cancelled = false;

    async function startCamera() {
      setCameraReady(false);
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Este navegador não suporta acesso à câmera, ou a página não está em HTTPS."
        );
        return;
      }

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      // Tenta do mais específico ao mais simples: alguns PCs/webcams
      // falham com constraints de resolução ou facingMode.
      const attempts: MediaStreamConstraints[] = [
        {
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        },
        { video: { facingMode }, audio: false },
        { video: true, audio: false },
      ];

      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
          const name = err instanceof DOMException ? err.name : "";
          // Sem permissão ou sem câmera: não adianta tentar de novo
          if (name === "NotAllowedError" || name === "NotFoundError") break;
        }
      }

      if (!stream) {
        console.error(lastError);
        const name = lastError instanceof DOMException ? lastError.name : "";
        const messages: Record<string, string> = {
          NotAllowedError:
            "Acesso à câmera negado. Permita a câmera no cadeado da barra de endereço. No Windows, verifique também em Configurações → Privacidade → Câmera se o acesso está liberado para apps e para o navegador.",
          NotFoundError: "Nenhuma câmera foi encontrada neste dispositivo.",
          NotReadableError:
            "A câmera está em uso por outro programa (Teams, Zoom, OBS...). Feche o outro programa e toque em Tentar novamente.",
          AbortError:
            "A câmera parou de responder. Feche outros programas que possam estar usando ela e tente novamente.",
          SecurityError:
            "O navegador bloqueou a câmera por segurança. Acesse via HTTPS ou localhost.",
        };
        const detail =
          lastError instanceof Error ? ` (${lastError.name})` : "";
        setCameraError(
          (messages[name] ?? "Não foi possível acessar a câmera.") + detail
        );
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari exige playsInline + play() explícito
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode, capturedBlob, retryKey]);

  // Libera o object URL da foto anterior
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const frameImg = frameImgRef.current;
    if (!video || !frameImg || video.videoWidth === 0) return;

    if (!frameImg.complete) {
      await new Promise<void>((resolve) => {
        frameImg.onload = () => resolve();
        frameImg.onerror = () => resolve();
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Desenha o vídeo com "object-fit: cover" (corta o excesso, centralizado)
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const scale = Math.max(OUTPUT_WIDTH / vw, OUTPUT_HEIGHT / vh);
    const sw = OUTPUT_WIDTH / scale;
    const sh = OUTPUT_HEIGHT / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.save();
    if (facingMode === "user") {
      // Espelha a câmera frontal para a foto ficar igual ao preview
      ctx.translate(OUTPUT_WIDTH, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    ctx.restore();

    // Moldura por cima, esticada para cobrir todo o canvas
    if (frameImg.naturalWidth > 0) {
      ctx.drawImage(frameImg, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) return;

    setCapturedBlob(blob);
    setCapturedUrl(URL.createObjectURL(blob));
    setPublished(false);
    setPublishError(null);
  }, [facingMode]);

  const download = useCallback(() => {
    if (!capturedUrl) return;
    const a = document.createElement("a");
    a.href = capturedUrl;
    a.download = `foto-${slug}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [capturedUrl, slug]);

  const publish = useCallback(async () => {
    if (!capturedBlob || !event) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await publishPhoto({
        eventId: event.id,
        frameId: frame?.id ?? null,
        blob: capturedBlob,
        autorNome: autorNome.trim() || undefined,
      });
      setPublished(true);
    } catch (err) {
      console.error(err);
      setPublishError(
        err instanceof Error ? err.message : "Erro ao publicar. Tente novamente."
      );
    } finally {
      setPublishing(false);
    }
  }, [capturedBlob, event, frame, autorNome]);

  if (!frameId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-8 text-center text-white">
        <p>Nenhuma moldura selecionada.</p>
        <Link href={`/${slug}/molduras`} className="text-pink-400 underline">
          Escolher moldura
        </Link>
      </main>
    );
  }

  // ---------- Preview da foto capturada ----------
  if (capturedBlob && capturedUrl) {
    return (
      <main className="flex min-h-dvh flex-col items-center bg-black">
        <div className="relative flex w-full max-w-md flex-1 items-center justify-center overflow-hidden">
          <img
            src={capturedUrl}
            alt="Sua foto"
            className="max-h-[70dvh] w-auto rounded-xl shadow-2xl"
          />
        </div>
        <div className="w-full max-w-md space-y-3 p-4 pb-8">
          {published ? (
            <div className="rounded-xl bg-green-500/20 p-3 text-center text-green-300">
              ✅ Foto publicada na galeria!
            </div>
          ) : (
            <input
              type="text"
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              placeholder="Seu nome (opcional)"
              maxLength={40}
              className="w-full rounded-full bg-white/10 px-5 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20"
            />
          )}
          {publishError && (
            <p className="text-center text-sm text-red-400">{publishError}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={download}
              className="rounded-full bg-white px-4 py-3 font-bold text-gray-900 transition active:scale-95"
            >
              ⬇️ Salvar
            </button>
            {published ? (
              <Link
                href={`/${slug}/galeria`}
                className="rounded-full bg-festa-pink px-4 py-3 text-center font-bold text-white transition active:scale-95"
              >
                Ver galeria
              </Link>
            ) : (
              <button
                onClick={publish}
                disabled={publishing || isDemoMode()}
                className="rounded-full bg-festa-pink px-4 py-3 font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                {publishing ? "Enviando..." : "🎉 Publicar"}
              </button>
            )}
          </div>
          {isDemoMode() && !published && (
            <p className="text-center text-xs text-white/50">
              Modo demo: publicar na galeria requer o Supabase configurado.
            </p>
          )}
          <button
            onClick={() => {
              setCapturedBlob(null);
              setCapturedUrl(null);
            }}
            className="w-full rounded-full border border-white/30 px-4 py-3 font-medium text-white transition active:scale-95"
          >
            🔄 Tirar outra
          </button>
        </div>
      </main>
    );
  }

  // ---------- Câmera ao vivo ----------
  return (
    <main className="flex min-h-dvh flex-col bg-black">
      <div className="relative mx-auto flex w-full max-w-md flex-1 items-center justify-center overflow-hidden">
        <div className="relative aspect-[9/16] max-h-[calc(100dvh-7rem)] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${
              facingMode === "user" ? "-scale-x-100" : ""
            }`}
          />
          {frame && (
            <img
              src={frame.imagem_url}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          )}
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              Abrindo câmera...
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 p-8 text-center text-white">
              <p className="text-sm">{cameraError}</p>
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className="rounded-full bg-festa-pink px-6 py-3 font-bold text-white transition active:scale-95"
              >
                🔄 Tentar novamente
              </button>
            </div>
          )}
        </div>
        <Link
          href={`/${slug}/molduras`}
          className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-sm text-white"
        >
          ← Molduras
        </Link>
      </div>

      <div className="flex items-center justify-center gap-10 py-5">
        <Link
          href={`/${slug}/galeria`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl"
        >
          🖼️
        </Link>
        <button
          onClick={capture}
          disabled={!cameraReady}
          aria-label="Tirar foto"
          className="h-18 w-18 rounded-full border-4 border-white bg-festa-pink p-1 shadow-lg transition active:scale-90 disabled:opacity-40"
          style={{ width: 72, height: 72 }}
        />
        <button
          onClick={() =>
            setFacingMode((m) => (m === "user" ? "environment" : "user"))
          }
          aria-label="Trocar câmera"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl"
        >
          🔄
        </button>
      </div>
    </main>
  );
}

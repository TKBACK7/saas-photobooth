import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getFrames } from "@/lib/data";
import { estiloTema, temaDoEvento } from "@/lib/tema";

export const dynamic = "force-dynamic";

export default async function EventLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const frames = await getFrames(event.id);
  const tema = temaDoEvento(event);
  // Se só existe uma moldura, pula a tela de escolha
  const tirarFotoHref =
    frames.length === 1
      ? `/${slug}/camera?frame=${frames[0].id}`
      : `/${slug}/molduras`;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center"
      style={estiloTema(tema)}
    >
      <span className="text-6xl">🎉</span>
      <div>
        <p
          className="text-sm font-medium uppercase tracking-widest opacity-80"
          style={{ color: "var(--tema)" }}
        >
          Que bom que você veio!
        </p>
        <h1
          className="mt-2 text-3xl font-extrabold drop-shadow-sm"
          style={{ color: "var(--tema)" }}
        >
          {event.nome}
        </h1>
      </div>
      <p className="max-w-xs text-gray-600">
        Tire uma foto com a moldura da festa e ajude a eternizar esse momento
        tão especial!
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href={tirarFotoHref}
          className="rounded-full px-8 py-4 text-lg font-bold text-white shadow-lg transition active:scale-95"
          style={{ backgroundColor: "var(--tema)" }}
        >
          📸 Tirar foto
        </Link>
        <Link
          href={`/${slug}/galeria`}
          className="rounded-full border-2 bg-white px-8 py-3 font-bold shadow transition active:scale-95"
          style={{ borderColor: "var(--tema)", color: "var(--tema)" }}
        >
          🖼️ Ver galeria da festa
        </Link>
      </div>
    </main>
  );
}

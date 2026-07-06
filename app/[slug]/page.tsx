import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getFrames } from "@/lib/data";

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
  // Se só existe uma moldura, pula a tela de escolha
  const tirarFotoHref =
    frames.length === 1
      ? `/${slug}/camera?frame=${frames[0].id}`
      : `/${slug}/molduras`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-pink-100 via-festa-cream to-purple-100 p-8 text-center">
      <span className="text-6xl">🎉</span>
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-festa-pink-dark">
          Que bom que você veio!
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-festa-pink drop-shadow-sm">
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
          className="rounded-full bg-festa-pink px-8 py-4 text-lg font-bold text-white shadow-lg transition active:scale-95"
        >
          📸 Tirar foto
        </Link>
        <Link
          href={`/${slug}/galeria`}
          className="rounded-full border-2 border-festa-pink bg-white px-8 py-3 font-bold text-festa-pink shadow transition active:scale-95"
        >
          🖼️ Ver galeria da festa
        </Link>
      </div>
    </main>
  );
}

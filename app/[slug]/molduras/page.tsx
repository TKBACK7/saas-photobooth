/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getFrames } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MoldurasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const frames = await getFrames(event.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 via-festa-cream to-purple-100 p-6">
      <div className="mx-auto max-w-md">
        <Link href={`/${slug}`} className="text-sm text-festa-pink-dark">
          ← Voltar
        </Link>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-festa-pink">
          Escolha sua moldura
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Toque para abrir a câmera
        </p>

        {frames.length === 0 ? (
          <p className="mt-12 text-center text-gray-500">
            Nenhuma moldura cadastrada para este evento ainda. 😢
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4">
            {frames.map((frame) => (
              <Link
                key={frame.id}
                href={`/${slug}/camera?frame=${frame.id}`}
                className="overflow-hidden rounded-2xl border-2 border-pink-200 bg-white shadow-md transition active:scale-95"
              >
                <div className="aspect-[9/16] w-full bg-gradient-to-b from-pink-50 to-purple-50">
                  <img
                    src={frame.imagem_url}
                    alt={frame.nome ?? "Moldura"}
                    className="h-full w-full object-contain"
                  />
                </div>
                {frame.nome && (
                  <p className="truncate p-2 text-center text-sm font-medium text-festa-pink-dark">
                    {frame.nome}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

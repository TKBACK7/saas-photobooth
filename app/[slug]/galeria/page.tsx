/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getPhotos, isDemoMode } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function GaleriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const photos = await getPhotos(event.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 via-festa-cream to-purple-100 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between py-2">
          <Link href={`/${slug}`} className="text-sm text-festa-pink-dark">
            ← Voltar
          </Link>
          <Link
            href={`/${slug}/molduras`}
            className="rounded-full bg-festa-pink px-4 py-2 text-sm font-bold text-white shadow"
          >
            📸 Tirar foto
          </Link>
        </div>
        <h1 className="mt-2 text-center text-2xl font-extrabold text-festa-pink">
          Galeria da festa
        </h1>
        <p className="text-center text-sm text-gray-500">{event.nome}</p>

        {photos.length === 0 ? (
          <div className="mt-16 text-center text-gray-500">
            <p className="text-4xl">📷</p>
            <p className="mt-2">
              {isDemoMode()
                ? "Modo demo: a galeria fica disponível com o Supabase configurado."
                : "Ainda não tem fotos por aqui. Seja a primeira pessoa a postar!"}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.imagem_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-xl bg-white shadow"
              >
                <img
                  src={photo.imagem_url}
                  alt={photo.autor_nome ? `Foto de ${photo.autor_nome}` : "Foto da festa"}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover transition group-active:scale-105"
                />
                {photo.autor_nome && (
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-xs text-white">
                    {photo.autor_nome}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

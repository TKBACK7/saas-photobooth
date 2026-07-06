import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getSupabaseAdmin, isAdmin, storagePathFromPublicUrl } from "@/lib/admin";

export const maxDuration = 60;

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// Baixa todas as fotos do evento em um único .zip (para o organizador).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const sb = getSupabaseAdmin();

  const { data: event } = await sb.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const { data: photos, error } = await sb
    .from("photos")
    .select("*")
    .eq("event_id", id)
    .order("criado_em", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: "Este evento ainda não tem fotos." }, { status: 404 });
  }

  const zip = new JSZip();
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const path = storagePathFromPublicUrl(photo.imagem_url, "photos");
    if (!path) continue;
    const { data: blob } = await sb.storage.from("photos").download(path);
    if (!blob) continue;
    const autor = photo.autor_nome ? `-${sanitize(photo.autor_nome)}` : "";
    zip.file(
      `foto-${String(i + 1).padStart(3, "0")}${autor}.jpg`,
      await blob.arrayBuffer()
    );
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="fotos-${sanitize(event.slug)}.zip"`,
    },
  });
}

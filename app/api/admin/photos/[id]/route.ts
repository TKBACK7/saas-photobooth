import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin, storagePathFromPublicUrl } from "@/lib/admin";

// Moderação: remove uma foto da galeria (linha do banco + arquivo do Storage).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const sb = getSupabaseAdmin();

  const { data: photo } = await sb.from("photos").select("*").eq("id", id).maybeSingle();
  if (!photo) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  const { error } = await sb.from("photos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const path = storagePathFromPublicUrl(photo.imagem_url, "photos");
  if (path) await sb.storage.from("photos").remove([path]);

  return NextResponse.json({ ok: true });
}

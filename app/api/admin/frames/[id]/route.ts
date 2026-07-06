import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin, storagePathFromPublicUrl } from "@/lib/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const sb = getSupabaseAdmin();

  const { data: frame } = await sb.from("frames").select("*").eq("id", id).maybeSingle();
  if (!frame) {
    return NextResponse.json({ error: "Moldura não encontrada." }, { status: 404 });
  }

  // Fotos antigas referenciam a moldura; solta a referência antes de excluir.
  await sb.from("photos").update({ frame_id: null }).eq("frame_id", id);

  const { error } = await sb.from("frames").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const path = storagePathFromPublicUrl(frame.imagem_url, "frames");
  if (path) await sb.storage.from("frames").remove([path]);

  return NextResponse.json({ ok: true });
}

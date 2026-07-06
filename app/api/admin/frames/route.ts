import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin } from "@/lib/admin";

// Upload de moldura: recebe multipart (arquivo PNG + dados) e cadastra no banco.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const eventId = String(form?.get("event_id") ?? "");
  const nome = String(form?.get("nome") ?? "").trim() || null;
  const ordem = Number(form?.get("ordem") ?? 0) || 0;

  if (!(file instanceof File) || !eventId) {
    return NextResponse.json({ error: "Envie o arquivo e o evento." }, { status: 400 });
  }
  if (file.type !== "image/png") {
    return NextResponse.json(
      { error: "A moldura precisa ser PNG (com fundo transparente)." },
      { status: 400 }
    );
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 8 MB)." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const path = `${eventId}/${crypto.randomUUID()}.png`;
  const { error: upError } = await sb.storage
    .from("frames")
    .upload(path, file, { contentType: "image/png" });
  if (upError) {
    return NextResponse.json({ error: upError.message }, { status: 400 });
  }

  const { data: urlData } = sb.storage.from("frames").getPublicUrl(path);
  const { data, error } = await sb
    .from("frames")
    .insert({ event_id: eventId, nome, imagem_url: urlData.publicUrl, ordem })
    .select()
    .single();
  if (error) {
    await sb.storage.from("frames").remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

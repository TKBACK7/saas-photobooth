import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin } from "@/lib/admin";

// Atualiza dados do evento (por enquanto: cor do tema).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const corTema = body?.cor_tema === null ? null : String(body?.cor_tema ?? "");

  if (corTema !== null && !/^#[0-9a-fA-F]{6}$/.test(corTema)) {
    return NextResponse.json({ error: "Cor inválida." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("events")
    .update({ cor_tema: corTema })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// Exclui um evento por completo: fotos e molduras do Storage + linhas do banco
// (frames e photos caem em cascata pelo FK).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const sb = getSupabaseAdmin();

  for (const bucket of ["photos", "frames"]) {
    const { data: objects } = await sb.storage.from(bucket).list(id, { limit: 1000 });
    if (objects && objects.length > 0) {
      await sb.storage.from(bucket).remove(objects.map((o) => `${id}/${o.name}`));
    }
  }

  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

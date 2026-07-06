import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin } from "@/lib/admin";

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

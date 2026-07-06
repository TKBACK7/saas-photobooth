import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? "").trim();
  const nome = String(body?.nome ?? "").trim();
  const dataFesta = body?.data_festa ? String(body.data_festa) : null;
  const corTema = body?.cor_tema ? String(body.cor_tema) : null;

  if (!nome) {
    return NextResponse.json({ error: "Informe o nome da festa." }, { status: 400 });
  }
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido: use só letras minúsculas, números e hífen (3 a 50 caracteres)." },
      { status: 400 }
    );
  }
  if (corTema && !/^#[0-9a-fA-F]{6}$/.test(corTema)) {
    return NextResponse.json({ error: "Cor inválida." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("events")
    .insert({ slug, nome, data_festa: dataFesta, cor_tema: corTema })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? `O slug "${slug}" já está em uso.` : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data);
}

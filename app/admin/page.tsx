import { adminConfigured, getSupabaseAdmin, isAdmin, missingAdminEnv } from "@/lib/admin";
import LoginForm from "./LoginForm";
import AdminDashboard, { AdminEvent } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-4xl">🔧</span>
        <h1 className="text-xl font-bold text-festa-pink">Painel não configurado</h1>
        <p className="max-w-md text-gray-600">
          Defina as variáveis de ambiente abaixo (no <code>.env.local</code> e na
          Vercel) e reinicie o servidor:
        </p>
        <ul className="rounded-xl bg-pink-50 p-4 text-left font-mono text-sm text-festa-pink-dark">
          {missingAdminEnv().map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </main>
    );
  }

  if (!(await isAdmin())) {
    return <LoginForm />;
  }

  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("events")
    .select("*, frames(count), photos(count)")
    .order("criado_em", { ascending: false });

  const events: AdminEvent[] = (data ?? []).map((e) => ({
    id: e.id,
    slug: e.slug,
    nome: e.nome,
    data_festa: e.data_festa,
    framesCount: e.frames?.[0]?.count ?? 0,
    photosCount: e.photos?.[0]?.count ?? 0,
  }));

  return <AdminDashboard events={events} />;
}

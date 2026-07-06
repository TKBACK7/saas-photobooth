"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useState } from "react";
import EventCard from "./EventCard";

export type AdminEvent = {
  id: string;
  slug: string;
  nome: string;
  data_festa: string | null;
  cor_tema: string | null;
  framesCount: number;
  photosCount: number;
};

function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 50);
}

export default function AdminDashboard({ events }: { events: AdminEvent[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [dataFesta, setDataFesta] = useState("");
  const [corTema, setCorTema] = useState("#475569");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, slug, data_festa: dataFesta || null, cor_tema: corTema }),
    });
    setCreating(false);
    if (res.ok) {
      setNome("");
      setSlug("");
      setSlugEdited(false);
      setDataFesta("");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Erro ao criar evento.");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 via-white to-gray-50 p-4 pb-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-2xl font-extrabold text-slate-800">
            🎪 Painel do organizador
          </h1>
          <button
            onClick={logout}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-slate-700 transition active:scale-95"
          >
            Sair
          </button>
        </div>

        {/* Criar evento */}
        <form
          onSubmit={createEvent}
          className="mt-4 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow"
        >
          <h2 className="font-bold text-slate-700">➕ Nova festa</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="Nome da festa (ex: Aniversário do João)"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-slate-500 sm:col-span-2"
            />
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              placeholder="link (ex: joao5anos)"
              required
              className="rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:border-slate-500"
            />
            <input
              type="date"
              value={dataFesta}
              onChange={(e) => setDataFesta(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-gray-600 outline-none focus:border-slate-500"
            />
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 sm:col-span-2">
              <input
                type="color"
                value={corTema}
                onChange={(e) => setCorTema(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              Cor do tema da festa (botões e títulos das páginas do evento)
            </label>
          </div>
          {slug && (
            <p className="mt-2 text-xs text-gray-400">
              Link da festa: <span className="font-mono">/{slug}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="mt-3 rounded-full bg-slate-800 px-6 py-3 font-bold text-white shadow transition active:scale-95 disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar festa"}
          </button>
        </form>

        {/* Lista de eventos */}
        <h2 className="mt-8 font-bold text-slate-700">
          🎉 Festas ({events.length})
        </h2>
        {events.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhuma festa criada ainda.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onChanged={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

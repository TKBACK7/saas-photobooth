import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Utilidades do painel admin — SÓ podem ser importadas em código de servidor
// (páginas server component e route handlers), nunca em componentes "use client".

export function missingAdminEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  return missing;
}

export function adminConfigured(): boolean {
  return missingAdminEnv().length === 0;
}

// Token de sessão derivado da senha: trocar a senha invalida as sessões.
export function sessionToken(): string {
  return createHash("sha256")
    .update(`photobooth-admin|${process.env.ADMIN_PASSWORD}`)
    .digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const store = await cookies();
  return store.get("admin_session")?.value === sessionToken();
}

// Cliente com service_role: ignora RLS. Uso exclusivo no servidor.
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Extrai o caminho interno do Storage a partir da URL pública.
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

import { supabase, supabaseConfigured } from "./supabase";
import type { Evento, Frame, Photo } from "./types";

// Modo demo: permite testar o app localmente antes de configurar o Supabase.
// Com o Supabase configurado, tudo passa a vir do banco.
const DEMO_EVENT: Evento = {
  id: "demo-event",
  slug: "kamilly3anos",
  nome: "Confeitaria da Kamilly Maria",
  data_festa: null,
  cor_tema: "#f0559d",
};

const DEMO_FRAMES: Frame[] = [
  {
    id: "demo-frame-1",
    event_id: "demo-event",
    nome: "Moldura Confeitaria 1",
    imagem_url: "/frames/moldura1.png",
    ordem: 0,
  },
  {
    id: "demo-frame-2",
    event_id: "demo-event",
    nome: "Moldura Confeitaria 2",
    imagem_url: "/frames/moldura2.png",
    ordem: 1,
  },
];

export function isDemoMode(): boolean {
  return !supabaseConfigured;
}

export async function getEvent(slug: string): Promise<Evento | null> {
  if (!supabase) {
    return slug === DEMO_EVENT.slug ? DEMO_EVENT : null;
  }
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFrames(eventId: string): Promise<Frame[]> {
  if (!supabase) {
    return eventId === DEMO_EVENT.id ? DEMO_FRAMES : [];
  }
  const { data, error } = await supabase
    .from("frames")
    .select("*")
    .eq("event_id", eventId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFrame(frameId: string): Promise<Frame | null> {
  if (!supabase) {
    return DEMO_FRAMES.find((f) => f.id === frameId) ?? null;
  }
  const { data, error } = await supabase
    .from("frames")
    .select("*")
    .eq("id", frameId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPhotos(eventId: string): Promise<Photo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function publishPhoto(params: {
  eventId: string;
  frameId: string | null;
  blob: Blob;
  autorNome?: string;
}): Promise<Photo> {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado — publicar na galeria só funciona com o banco conectado."
    );
  }
  const fileName = `${params.eventId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(fileName, params.blob, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("photos")
    .insert({
      event_id: params.eventId,
      frame_id: params.frameId,
      imagem_url: urlData.publicUrl,
      autor_nome: params.autorNome || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

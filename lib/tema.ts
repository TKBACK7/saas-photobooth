import type { Evento } from "./types";

// Cor neutra padrão para eventos sem cor personalizada (slate-600)
export const TEMA_PADRAO = "#475569";

export function temaDoEvento(evento: Pick<Evento, "cor_tema"> | null): string {
  const cor = evento?.cor_tema;
  return cor && /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : TEMA_PADRAO;
}

// Estilo para o <main> das páginas do evento: define a variável --tema
// e um fundo com tom suave derivado da cor.
export function estiloTema(cor: string): React.CSSProperties {
  return {
    ["--tema" as string]: cor,
    background: `linear-gradient(to bottom, color-mix(in srgb, ${cor} 14%, white), white)`,
  };
}

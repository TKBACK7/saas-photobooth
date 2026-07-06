export type Evento = {
  id: string;
  slug: string;
  nome: string;
  data_festa: string | null;
};

export type Frame = {
  id: string;
  event_id: string;
  nome: string | null;
  imagem_url: string;
  ordem: number;
};

export type Photo = {
  id: string;
  event_id: string;
  frame_id: string | null;
  imagem_url: string;
  autor_nome: string | null;
  criado_em: string;
};

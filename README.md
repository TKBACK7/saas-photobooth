# 📸 Photobooth de Festa

Web app mobile-first de photobooth digital para festas: o convidado escaneia o
QR code, escolhe uma moldura, tira a foto com a moldura sobreposta e publica na
galeria pública do evento.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Storage).

## Rodando localmente (modo demo)

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/kamilly3anos`. Sem o Supabase configurado o app
roda em **modo demo**: evento e molduras vêm de dados locais
(`public/frames/`), a câmera e o download funcionam, mas publicar/ver galeria
fica desabilitado.

> ⚠️ `getUserMedia` exige HTTPS (ou `localhost`). Para testar no celular na
> rede local, use um túnel (ex: `npx ngrok http 3000`) ou o preview da Vercel.

## Conectando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   (cria tabelas, políticas RLS, buckets `frames`/`photos` e o evento seed).
3. No **Storage → frames**, faça upload dos PNGs de `public/frames/` e copie as
   URLs públicas.
4. Insira as molduras na tabela `frames` (exemplo comentado no fim do schema.sql).
5. Copie `.env.local.example` para `.env.local` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
6. Reinicie o `npm run dev`.

## Rotas

| Rota | Descrição |
|---|---|
| `/[slug]` | Landing do evento (nome da festa + botões) |
| `/[slug]/molduras` | Escolha de moldura (pulada se houver só uma) |
| `/[slug]/camera?frame=[id]` | Câmera com moldura sobreposta + captura |
| `/[slug]/galeria` | Feed público de fotos do evento |

## Como funciona a captura

O `<video>` (getUserMedia) fica em um contêiner 9:16 com a moldura PNG por
cima via CSS. Ao capturar, o frame do vídeo é desenhado num canvas 1080×1920
com corte tipo `object-fit: cover` (espelhado se for a câmera frontal) e a
moldura é desenhada por cima. O canvas vira um JPEG via `toBlob`, que pode ser
baixado ou enviado ao bucket `photos` + registrado na tabela `photos`.

## Deploy (Vercel)

Importe o repositório na Vercel e defina as duas variáveis de ambiente
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. O QR code do
evento deve apontar para `https://SEU-DOMINIO/[slug]`.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-5xl">📸</span>
      <h1 className="text-2xl font-bold text-festa-pink">Photobooth de Festa</h1>
      <p className="max-w-sm text-gray-600">
        Acesse pelo QR code do evento para tirar fotos com a moldura da festa.
      </p>
      <p className="text-sm text-gray-400">
        Exemplo: <code className="rounded bg-pink-100 px-2 py-1">/kamilly3anos</code>
      </p>
    </main>
  );
}

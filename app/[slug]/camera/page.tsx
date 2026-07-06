import { Suspense } from "react";
import CameraView from "./CameraView";

export default function CameraPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Carregando câmera...
        </main>
      }
    >
      <CameraView />
    </Suspense>
  );
}

"use client";
// Composant CLIENT : le seul qui « vit » dans le navigateur.
//
// Toutes les 30 s, router.refresh() redemande la page au serveur. Next.js réexécute les
// composants serveur (donc relit la base) et ne remplace que ce qui a changé, sans
// recharger la page ni perdre la position de défilement ou un mail déplié.
// Il ne reçoit qu'une date ; aucune donnée sensible ne transite par lui.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formaterHeure } from "@/lib/format";

const INTERVALLE_MS = 30_000;

export function Rafraichir({ genereAt }: { genereAt: string }) {
  const router = useRouter();

  useEffect(() => {
    const minuterie = setInterval(() => {
      // Onglet en arrière-plan : inutile d'interroger le serveur
      if (document.visibilityState === "visible") router.refresh();
    }, INTERVALLE_MS);
    return () => clearInterval(minuterie);
  }, [router]);

  return (
    <p className="text-xs text-slate-500" aria-live="polite">
      Mis à jour à {formaterHeure(genereAt)} · actualisation automatique toutes
      les 30 s
    </p>
  );
}

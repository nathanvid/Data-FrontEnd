// Écran B : Mes échanges.
//
// Même découpage que l'écran A : la page est statique, la lecture du cookie et de la
// base se fait dans <Echanges>, derrière <Suspense>.
import { Suspense } from "react";
import { lireTableauDeBord } from "@/lib/tableau-de-bord";
import { ListeMails } from "@/components/ListeMails";
import { LienInvalide } from "@/components/LienInvalide";
import { Rafraichir } from "@/components/Rafraichir";

export default function PageEchanges() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">Chargement de vos échanges…</p>
      }
    >
      <Echanges />
    </Suspense>
  );
}

async function Echanges() {
  const tdb = await lireTableauDeBord();
  if (!tdb) return <LienInvalide />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Vos mails et leurs réponses</h2>
        <Rafraichir genereAt={tdb.genere_at} />
      </div>
      <p className="text-sm text-slate-600">
        Chaque mail que vous envoyez passe par plusieurs étapes avant que le
        personnage vous réponde. Le détail d&apos;un échange s&apos;affiche dès
        que la réponse est arrivée dans votre boîte.
      </p>
      <ListeMails
        mails={tdb.mails}
        personnages={tdb.personnages}
        carnet={tdb.carnet}
      />
    </div>
  );
}

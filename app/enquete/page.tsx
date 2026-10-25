// Écran A : Mon enquête.
//
// La page elle-même est statique. Ce qui dépend de l'étudiant (lecture du cookie, appel
// à la base) est dans <Enquete>, placé derrière <Suspense> : Next.js envoie d'abord la
// coquille (en-tête, onglets, titre), puis la suite dès que la base a répondu.
// Avec cacheComponents activé, lire un cookie hors d'un <Suspense> est une erreur de build.
import { Suspense } from "react";
import { lireTableauDeBord } from "@/lib/tableau-de-bord";
import { CarteEnquete } from "@/components/CarteEnquete";
import { Compteurs } from "@/components/Compteurs";
import { ListePersonnages } from "@/components/ListePersonnages";
import { CarnetEnquete } from "@/components/CarnetEnquete";
import { LienInvalide } from "@/components/LienInvalide";
import { Rafraichir } from "@/components/Rafraichir";

export default function PageEnquete() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">Chargement de votre enquête…</p>
      }
    >
      <Enquete />
    </Suspense>
  );
}

async function Enquete() {
  const tdb = await lireTableauDeBord();
  if (!tdb) return <LienInvalide />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Bonjour {tdb.etudiant.prenom}, voici où en est votre enquête
        </h2>
        <Rafraichir genereAt={tdb.genere_at} />
      </div>

      <Compteurs
        compteurs={tdb.compteurs}
        nbPersonnages={tdb.personnages.length}
      />

      <section className="space-y-3">
        <h3 className="font-semibold">Carte des contacts</h3>
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          <CarteEnquete
            personnages={tdb.personnages}
            recommandations={tdb.recommandations}
          />
        </div>
        <p className="text-xs text-slate-500">
          Une flèche signifie qu&apos;un personnage vous a recommandé auprès
          d&apos;un collègue. Seules les recommandations que vous avez obtenues
          apparaissent.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Carnet d&apos;enquête</h3>
        <CarnetEnquete carnet={tdb.carnet} personnages={tdb.personnages} />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Les personnages</h3>
        <ListePersonnages
          personnages={tdb.personnages}
          recommandations={tdb.recommandations}
        />
      </section>
    </div>
  );
}

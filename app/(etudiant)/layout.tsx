// Mise en page du site étudiant : en-tête et onglets. Composant SERVEUR, statique :
// il ne lit pas le cookie, donc Next.js peut le préparer à l'avance (« coquille statique »).
// Le groupe « (etudiant) » ne change pas les adresses : /enquete reste /enquete.
import type { Metadata } from "next";
import { Onglets } from "@/components/Onglets";

export const metadata: Metadata = {
  title: "Mon enquête · MonCoinBureau Pro",
  description:
    "Suivi de votre enquête auprès des salariés de MonCoinBureau Pro",
};

const ONGLETS = [
  { href: "/enquete", libelle: "Mon enquête" },
  { href: "/echanges", libelle: "Mes échanges" },
  { href: "/fonctionnement", libelle: "Comment ça marche" },
];

export default function LayoutEtudiant({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            MonCoinBureau Pro
          </p>
          <h1 className="mb-2 text-xl font-bold">
            Tableau de bord de votre enquête
          </h1>
          <Onglets onglets={ONGLETS} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}

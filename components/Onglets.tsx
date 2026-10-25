"use client";
// Composant CLIENT : il a besoin de connaître l'adresse courante (usePathname) pour
// surligner l'onglet actif, information disponible seulement dans le navigateur.
// Il ne reçoit aucune donnée de la base, seulement la liste des onglets.
import Link from "next/link";
import { usePathname } from "next/navigation";

export type Onglet = {
  href: string;
  libelle: string;
  exact?: boolean; // actif seulement sur l'adresse exacte (ex. /admin, parent des autres)
};

export function Onglets({ onglets }: { onglets: Onglet[] }) {
  return <Barre onglets={onglets} chemin={usePathname()} />;
}

// Même barre sans onglet actif : repli de <Suspense> sur les routes dynamiques
// (ex. /admin/etudiants/[id]), où l'adresse n'est connue qu'à la requête.
export function OngletsStatiques({ onglets }: { onglets: Onglet[] }) {
  return <Barre onglets={onglets} chemin={null} />;
}

function Barre({
  onglets,
  chemin,
}: {
  onglets: Onglet[];
  chemin: string | null;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Sections">
      {onglets.map((o) => {
        const actif =
          chemin !== null &&
          (o.exact ? chemin === o.href : chemin.startsWith(o.href));
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={actif ? "page" : undefined}
            className={
              "whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm font-medium " +
              (actif
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800")
            }
          >
            {o.libelle}
          </Link>
        );
      })}
    </nav>
  );
}

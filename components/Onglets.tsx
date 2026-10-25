"use client";
// Composant CLIENT : il a besoin de connaître l'adresse courante (usePathname) pour
// surligner l'onglet actif, information disponible seulement dans le navigateur.
// Il ne reçoit aucune donnée de la base.
import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/enquete", libelle: "Mon enquête" },
  { href: "/echanges", libelle: "Mes échanges" },
  { href: "/fonctionnement", libelle: "Comment ça marche" },
];

export function Onglets() {
  const chemin = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Sections">
      {ONGLETS.map((o) => {
        const actif = chemin.startsWith(o.href);
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

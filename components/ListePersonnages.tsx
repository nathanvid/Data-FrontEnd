// Les personnages sous forme de fiches : lisible sur téléphone (où le graphe devient petit)
// et par les lecteurs d'écran. Donne aussi l'adresse mail à utiliser. Composant SERVEUR.
import type { Personnage, Recommandation } from "@/lib/types-tableau";
import { ETATS } from "@/lib/libelles";

const PASTILLES = {
  verrouille: "bg-slate-100 text-slate-600",
  accessible: "bg-indigo-50 text-indigo-700",
  contacte: "bg-amber-50 text-amber-800",
  a_repondu: "bg-emerald-50 text-emerald-800",
} as const;

export function ListePersonnages({
  personnages,
  recommandations,
}: {
  personnages: Personnage[];
  recommandations: Recommandation[];
}) {
  const prenom = new Map(personnages.map((p) => [p.id, p.prenom]));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {personnages.map((p) => {
        const recommandePar = recommandations
          .filter((r) => r.vers === p.id)
          .map((r) => prenom.get(r.de) ?? r.de);
        return (
          <li
            key={p.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {p.prenom} {p.nom}
                </p>
                <p className="text-sm text-slate-500">{p.role}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${PASTILLES[p.etat]}`}
              >
                {ETATS[p.etat].libelle}
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-xs text-slate-600">
              {p.email}
            </p>
            <p className="mt-2 text-sm text-slate-600">{ETATS[p.etat].aide}</p>
            {p.porte_entree && (
              <p className="mt-1 text-xs text-slate-500">
                Porte d&apos;entrée : joignable sans recommandation.
              </p>
            )}
            {recommandePar.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Recommandé par : {recommandePar.join(", ")}
              </p>
            )}
            {p.refus_recus > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                {p.refus_recus === 1
                  ? "1 tentative refusée"
                  : `${p.refus_recus} tentatives refusées`}{" "}
                faute de recommandation.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

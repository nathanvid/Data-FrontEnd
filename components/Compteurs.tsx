// Les trois chiffres clés de l'enquête. Composant SERVEUR.
import type { TableauDeBord } from "@/lib/types-tableau";

export function Compteurs({
  compteurs,
  nbPersonnages,
}: {
  compteurs: TableauDeBord["compteurs"];
  nbPersonnages: number;
}) {
  const part =
    compteurs.faits_total > 0
      ? (compteurs.faits_decouverts / compteurs.faits_total) * 100
      : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Faits découverts</p>
        <p className="text-3xl font-bold">
          {compteurs.faits_decouverts}
          <span className="text-lg font-medium text-slate-400">
            {" "}
            / {compteurs.faits_total}
          </span>
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-100" aria-hidden>
          <div
            className="h-2 rounded-full bg-indigo-600"
            style={{ width: `${part}%` }}
          />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">
          Personnages qui vous ont répondu
        </p>
        <p className="text-3xl font-bold">
          {compteurs.personnages_atteints}
          <span className="text-lg font-medium text-slate-400">
            {" "}
            / {nbPersonnages}
          </span>
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Recommandations obtenues</p>
        <p className="text-3xl font-bold">{compteurs.recos_obtenues}</p>
      </div>
    </div>
  );
}

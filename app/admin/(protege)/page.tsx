// Vue d'ensemble : état de la file de mails, interrupteurs du simulateur, activité du jour.
import { Suspense } from "react";
import Link from "next/link";
import { lireApercu } from "@/lib/admin/donnees";
import { formaterCout, formaterDate } from "@/lib/format";
import { Rafraichir } from "@/components/Rafraichir";
import { changerMode, changerPause } from "../actions";

export default function PageApercu() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <Apercu />
    </Suspense>
  );
}

async function Apercu() {
  const a = await lireApercu();
  const p = a.parametres;
  const alertes = a.file.aRevoir + a.file.envoisErreur + a.file.messagesErreur;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Vue d&apos;ensemble</h2>
        <Rafraichir genereAt={new Date().toISOString()} />
      </div>

      {alertes > 0 && (
        <Link
          href="/admin/mails"
          className="block rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 hover:bg-rose-100"
        >
          <span className="font-semibold">
            {alertes} mail{alertes > 1 ? "s" : ""} demande
            {alertes > 1 ? "nt" : ""} votre attention
          </span>{" "}
          ({a.file.aRevoir} réponse(s) à revoir, {a.file.envoisErreur} envoi(s)
          en erreur, {a.file.messagesErreur} mail(s) entrant(s) bloqué(s)) →
        </Link>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold">Simulateur</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-500">Envoi des réponses</p>
                <p
                  className={`text-lg font-bold ${p.pause ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {p.pause ? "En pause" : "Actif"}
                </p>
              </div>
              <form action={changerPause}>
                <input type="hidden" name="pause" value={String(!p.pause)} />
                <button
                  className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${p.pause ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  {p.pause ? "Reprendre les envois" : "Mettre en pause"}
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              En pause, les mails des étudiants sont toujours reçus et traités,
              mais aucune réponse ne part.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Délai de réponse</p>
            <form action={changerMode} className="mt-1 flex flex-wrap gap-2">
              {(
                [
                  [
                    "seance",
                    "Séance",
                    `${p.delai_seance_min_s / 60}–${p.delai_seance_max_s / 60} min`,
                  ],
                  [
                    "intersession",
                    "Intersession",
                    `${p.delai_inter_min_min / 60}–${p.delai_inter_max_min / 60} h, ${p.plage_debut.slice(0, 5)}–${p.plage_fin.slice(0, 5)} en semaine`,
                  ],
                ] as const
              ).map(([valeur, libelle, detail]) => (
                <button
                  key={valeur}
                  name="mode"
                  value={valeur}
                  disabled={p.mode === valeur}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${p.mode === valeur ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-800" : "border-slate-300 hover:bg-slate-50"}`}
                >
                  {libelle}
                  <span className="block text-xs font-normal text-slate-500">
                    {detail}
                  </span>
                </button>
              ))}
            </form>
            <p className="mt-2 text-xs text-slate-500">
              S&apos;applique aux réponses programmées à partir de maintenant.
              Dernier changement : {formaterDate(p.maj_at)}.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">File des mails</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tuile libelle="Reçus, en file" valeur={a.file.aTraiter} />
          <Tuile libelle="En traitement" valeur={a.file.enCours} />
          <Tuile libelle="Réponses programmées" valeur={a.file.programmes} />
          <Tuile libelle="Réponses à revoir" valeur={a.file.aRevoir} alerte />
          <Tuile
            libelle="Envois en erreur"
            valeur={a.file.envoisErreur}
            alerte
          />
          <Tuile
            libelle="Entrants bloqués"
            valeur={a.file.messagesErreur}
            alerte
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Aujourd&apos;hui</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tuile libelle="Mails traités" valeur={a.jour.echanges} />
          <Tuile libelle="Dont réponses" valeur={a.jour.reponses} />
          <Tuile libelle="Étudiants actifs" valeur={a.jour.etudiantsActifs} />
          <Tuile
            libelle="Coût LLM (total module)"
            valeur={`${formaterCout(a.jour.cout)} (${formaterCout(a.coutTotal)})`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Classes</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2 text-right">Étudiants</th>
                <th className="px-4 py-2 text-right">Faits en moyenne</th>
                <th className="px-4 py-2 text-right">11 faits sur 11</th>
                <th className="px-4 py-2 text-right">
                  Actifs aujourd&apos;hui
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {a.classes.map((c) => (
                <tr key={c.classe}>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/progression?classe=${encodeURIComponent(c.classe)}`}
                      className="text-indigo-700 hover:underline"
                    >
                      {c.classe}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">{c.etudiants}</td>
                  <td className="px-4 py-2 text-right">
                    {(c.faits / Math.max(c.etudiants, 1))
                      .toFixed(1)
                      .replace(".", ",")}{" "}
                    / 11
                  </td>
                  <td className="px-4 py-2 text-right">{c.complets}</td>
                  <td className="px-4 py-2 text-right">{c.actifs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tuile({
  libelle,
  valeur,
  alerte = false,
}: {
  libelle: string;
  valeur: number | string;
  alerte?: boolean;
}) {
  const rouge = alerte && typeof valeur === "number" && valeur > 0;
  return (
    <div
      className={`rounded-lg border p-3 ${rouge ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}
    >
      <p className="text-xs text-slate-500">{libelle}</p>
      <p className={`text-xl font-bold ${rouge ? "text-rose-700" : ""}`}>
        {valeur}
      </p>
    </div>
  );
}

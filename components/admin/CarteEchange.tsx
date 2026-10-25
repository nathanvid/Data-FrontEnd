// Un échange vu par le formateur : tout est visible, y compris l'évaluation et la réponse
// pas encore envoyée. Composant SERVEUR ; `children` reçoit les actions éventuelles.
import Link from "next/link";
import type { ReactNode } from "react";
import type { EchangeAdmin } from "@/lib/admin/donnees";
import { ISSUES_ADMIN, STATUTS_ENVOI } from "@/lib/admin/libelles";
import { formaterCout, formaterDate, formaterHeure } from "@/lib/format";

export function Pastille({
  libelle,
  couleur,
}: {
  libelle: string;
  couleur: string;
}) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${couleur}`}
    >
      {libelle}
    </span>
  );
}

export function CarteEchange({
  e,
  noms,
  libellesFaits,
  avecEtudiant = true,
  ouvert = false,
  children,
}: {
  e: EchangeAdmin;
  noms: Map<string, string>;
  libellesFaits?: Map<string, string>;
  avecEtudiant?: boolean;
  ouvert?: boolean;
  children?: ReactNode;
}) {
  const issue = ISSUES_ADMIN[e.issue] ?? {
    libelle: e.issue,
    couleur: "bg-slate-100",
  };
  const envoi = e.envoi ? STATUTS_ENVOI[e.envoi.statut] : null;
  const perso =
    (e.personnage_id && noms.get(e.personnage_id)) || e.destinataire;

  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {formaterDate(e.recu_at)}
            {avecEtudiant && (
              <>
                {" · "}
                {e.etudiant ? (
                  <Link
                    href={`/admin/etudiants/${e.etudiant.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {e.etudiant.prenom} {e.etudiant.nom} ({e.etudiant.classe})
                  </Link>
                ) : (
                  <span className="font-mono">{e.expediteur}</span>
                )}
              </>
            )}
            {" → "}
            <span className="font-medium text-slate-700">{perso}</span>
            {e.en_copie && " (en copie)"}
          </p>
          <p className="mt-1 font-semibold">{e.sujet || "(sans objet)"}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Pastille {...issue} />
          {e.generique && (
            <Pastille
              libelle="Générique"
              couleur="bg-orange-50 text-orange-800"
            />
          )}
          {envoi && (
            <Pastille
              libelle={
                e.envoi?.statut === "en_attente"
                  ? `Programmée ${formaterHeure(e.envoi.send_at)}`
                  : envoi.libelle
              }
              couleur={envoi.couleur}
            />
          )}
        </div>
      </header>

      <div className="space-y-3 p-4 text-sm">
        {e.envoi?.derniere_erreur && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-rose-800">
            <span className="font-semibold">Motif : </span>
            {e.envoi.derniere_erreur}
          </p>
        )}

        <details open={ouvert} className="rounded-md border border-slate-200">
          <summary className="cursor-pointer px-3 py-2 font-medium text-slate-700">
            Mail de l&apos;étudiant
          </summary>
          <p className="whitespace-pre-line border-t border-slate-100 px-3 py-2 leading-relaxed">
            {e.texte_etudiant || "(vide)"}
          </p>
        </details>

        {e.justification && (
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Évaluation
            </p>
            <p className="mt-1 text-slate-700">{e.justification}</p>
          </div>
        )}

        {(e.recos_accordees.length > 0 || e.faits_debloques.length > 0) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-emerald-800">
            {e.recos_accordees.length > 0 && (
              <p>
                Recommandation vers :{" "}
                {e.recos_accordees.map((id) => noms.get(id) ?? id).join(", ")}
              </p>
            )}
            {e.faits_debloques.length > 0 && (
              <p>
                Faits :{" "}
                {e.faits_debloques
                  .map((id) => libellesFaits?.get(id) ?? id)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Sans formulaire d'édition, on montre la réponse (texte de l'outbox s'il existe) */}
        {!children && (e.envoi?.texte || e.texte_reponse) && (
          <details className="rounded-md border border-slate-200">
            <summary className="cursor-pointer px-3 py-2 font-medium text-indigo-700">
              Réponse du personnage
            </summary>
            <p className="whitespace-pre-line border-t border-slate-100 px-3 py-2 leading-relaxed">
              {e.envoi?.texte ?? e.texte_reponse}
            </p>
          </details>
        )}

        {children}

        <p className="text-xs text-slate-400">
          Échange n°{e.id}
          {e.modele && ` · ${e.modele}`}
          {e.cout_usd !== null && ` · ${formaterCout(e.cout_usd)}`}
          {e.envoye_at && ` · arrivée ${formaterDate(e.envoye_at)}`}
        </p>
      </div>
    </article>
  );
}

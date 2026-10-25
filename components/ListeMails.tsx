// Écran B : vos mails, du plus récent au plus ancien, et ce qu'il est advenu de chacun.
// La base a déjà masqué tout ce qui n'est pas encore arrivé (issue, réponse, faits…) :
// ce composant affiche ce qu'il reçoit, sans rien filtrer. Composant SERVEUR.
//
// Les réponses sont repliées dans un <details> : il s'ouvre sans JavaScript, et
// router.refresh() le laisse ouvert puisque React ne contrôle pas son attribut « open ».
import type {
  Destinataire,
  FaitDecouvert,
  Mail,
  Personnage,
  StatutEnvoi,
} from "@/lib/types-tableau";
import { ISSUES, NIVEAUX_DOCUMENT, STATUTS } from "@/lib/libelles";
import {
  formaterCout,
  formaterDate,
  formaterHeure,
  formaterLatence,
  formaterNombre,
} from "@/lib/format";

const PASTILLES: Record<StatutEnvoi, string> = {
  en_attente: "bg-slate-100 text-slate-600",
  en_traitement: "bg-amber-50 text-amber-800",
  programme: "bg-indigo-50 text-indigo-700",
  envoye: "bg-emerald-50 text-emerald-800",
  sans_reponse: "bg-slate-100 text-slate-600",
};

export function ListeMails({
  mails,
  personnages,
  carnet,
}: {
  mails: Mail[];
  personnages: Personnage[];
  carnet: FaitDecouvert[];
}) {
  if (mails.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Vous n&apos;avez encore écrit à personne. Choisissez un personnage
        accessible dans l&apos;onglet « Mon enquête » et envoyez-lui un mail :
        il apparaîtra ici quelques instants plus tard.
      </p>
    );
  }

  const noms = new Map(personnages.map((p) => [p.id, `${p.prenom} ${p.nom}`]));
  const faits = new Map(carnet.map((f) => [f.fait_id, f.texte]));

  return (
    <ol className="space-y-4">
      {mails.map((m, i) => (
        <li
          key={`${m.recu_at}-${i}`}
          className="rounded-lg border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-100 p-4">
            <p className="text-xs text-slate-500">
              Envoyé {formaterDate(m.recu_at)}
            </p>
            <p className="mt-1 font-semibold">{m.sujet || "(sans objet)"}</p>
            {m.extrait && (
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">
                {m.extrait}
              </p>
            )}
          </div>
          <ul className="divide-y divide-slate-100">
            {m.destinataires.map((d) => (
              <li key={d.adresse} className="p-4">
                <LigneDestinataire d={d} noms={noms} faits={faits} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function LigneDestinataire({
  d,
  noms,
  faits,
}: {
  d: Destinataire;
  noms: Map<string, string>;
  faits: Map<string, string>;
}) {
  const nom = (d.personnage_id && noms.get(d.personnage_id)) || d.adresse;
  const issue = d.issue ? ISSUES[d.issue] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold">{nom}</span>
          {d.en_copie && (
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              en copie
            </span>
          )}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PASTILLES[d.statut]}`}
        >
          {d.statut === "programme" && d.etapes.send_at
            ? `Programmé à ${formaterHeure(d.etapes.send_at)}`
            : STATUTS[d.statut]}
        </span>
      </div>

      <Etapes d={d} />

      {issue && (
        <div className="rounded-md bg-slate-50 p-3 text-sm">
          <p className="font-medium">{issue.titre}</p>
          <p className="mt-1 text-slate-600">{issue.explication}</p>
          {d.acces_via && (
            <p className="mt-1 text-xs text-slate-500">
              {d.acces_via.porte_entree
                ? "Accès : porte d'entrée, joignable sans recommandation."
                : d.acces_via.recommande_par.length > 0
                  ? `Accès : recommandé par ${d.acces_via.recommande_par
                      .map((id) => noms.get(id) ?? id)
                      .join(", ")}.`
                  : null}
            </p>
          )}
        </div>
      )}

      {d.reponse && (
        <details className="group rounded-md border border-slate-200">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-indigo-700">
            Lire la réponse
          </summary>
          <p className="whitespace-pre-line border-t border-slate-100 px-3 py-2 text-sm leading-relaxed">
            {d.reponse}
          </p>
        </details>
      )}

      {d.recos_obtenues && d.recos_obtenues.length > 0 && (
        <p className="text-sm text-emerald-800">
          Nouvelle recommandation :{" "}
          {d.recos_obtenues.map((id) => noms.get(id) ?? id).join(", ")}
        </p>
      )}

      {d.faits_decouverts && d.faits_decouverts.length > 0 && (
        <div className="text-sm">
          <p className="font-medium text-emerald-800">
            {d.faits_decouverts.length === 1
              ? "Fait découvert grâce à ce mail :"
              : "Faits découverts grâce à ce mail :"}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
            {d.faits_decouverts.map((id) => (
              <li key={id}>{faits.get(id) ?? id}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Les coulisses n'ont de sens qu'une fois l'échange visible (issue connue) */}
      {issue && <Coulisses d={d} />}
    </div>
  );
}

// Frise des étapes déjà franchies. Avant l'envoi, seule l'heure prévue est connue :
// la base garde l'issue et le contenu pour elle jusque-là.
function Etapes({ d }: { d: Destinataire }) {
  const e = d.etapes;
  const etapes: { libelle: string; at: string }[] = [
    { libelle: "Reçu", at: e.recu_at },
    { libelle: "Pris en charge", at: e.pris_at },
    { libelle: "Traité", at: e.traite_at },
    {
      libelle: e.envoye_at ? "Réponse envoyée" : "Envoi programmé",
      at: e.envoye_at ?? e.send_at,
    },
  ].filter((x): x is { libelle: string; at: string } => x.at !== null);

  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {etapes.map((x) => (
        <li key={x.libelle}>
          {x.libelle} à{" "}
          <span className="font-medium text-slate-700">
            {formaterHeure(x.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}

// Ce que l'IA a lu et ce que l'échange a coûté. Les échanges antérieurs
// à la mesure n'ont pas de métriques : « non mesuré ».
function Coulisses({ d }: { d: Destinataire }) {
  const m = d.metriques;
  const valeur = (v: number | null | undefined, f: (n: number) => string) =>
    v === null || v === undefined ? "non mesuré" : f(v);

  return (
    <details className="rounded-md border border-dashed border-slate-200">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-500">
        Coulisses techniques
      </summary>
      <div className="space-y-2 border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">Jetons lus</dt>
            <dd>{valeur(m?.tokens_in, formaterNombre)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Jetons écrits</dt>
            <dd>{valeur(m?.tokens_out, formaterNombre)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Coût</dt>
            <dd>{valeur(m?.cout_usd, formaterCout)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Temps de réponse</dt>
            <dd>{valeur(m?.latence_ms, formaterLatence)}</dd>
          </div>
        </dl>
        {d.documents && d.documents.length > 0 && (
          <div>
            <p className="text-slate-400">Documents consultés</p>
            <ul className="mt-1 space-y-0.5">
              {d.documents.map((doc) => (
                <li key={doc.nom}>
                  {doc.nom}{" "}
                  <span className="text-slate-400">
                    · {NIVEAUX_DOCUMENT[doc.niveau]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

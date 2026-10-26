// Fiche d'un étudiant : où il en est avec chaque personnage, pistes pour l'aider,
// et tous ses échanges en clair.
import { Suspense } from "react";
import Link from "next/link";
import { lireEtudiant, lireJeu } from "@/lib/admin/donnees";
import { calculerPistes } from "@/lib/admin/indices";
import { envoiIndicePossible } from "@/lib/admin/mailgun";
import { STATUTS_ENTRANT } from "@/lib/admin/libelles";
import { formaterDate } from "@/lib/format";
import { Rafraichir } from "@/components/Rafraichir";
import { CarteEchange, Pastille } from "@/components/admin/CarteEchange";
import { RedacteurIndice } from "@/components/admin/RedacteurIndice";

export default function PageEtudiant({
  params,
}: PageProps<"/admin/etudiants/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <Fiche params={params} />
    </Suspense>
  );
}

const ETATS = {
  verrouille: { libelle: "Verrouillé", couleur: "bg-slate-100 text-slate-600" },
  accessible: { libelle: "Joignable", couleur: "bg-indigo-50 text-indigo-700" },
  refuse: {
    libelle: "Refusé (sans reco)",
    couleur: "bg-amber-50 text-amber-800",
  },
  atteint: { libelle: "A répondu", couleur: "bg-emerald-50 text-emerald-800" },
  complet: { libelle: "Fini", couleur: "bg-emerald-600 text-white" },
} as const;

async function Fiche({
  params,
}: {
  params: PageProps<"/admin/etudiants/[id]">["params"];
}) {
  const { id } = await params;
  const [donnees, jeu] = await Promise.all([lireEtudiant(id), lireJeu()]);
  if (!donnees) {
    return (
      <p className="text-sm text-slate-600">
        Étudiant introuvable.{" "}
        <Link
          href="/admin/progression"
          className="text-indigo-700 hover:underline"
        >
          Retour à la progression
        </Link>
      </p>
    );
  }
  const { etudiant, echanges, deblocages, recommandations, note, entrants } =
    donnees;

  const noms = new Map(
    jeu.personnages.map((p) => [p.id, `${p.prenom} ${p.nom}`]),
  );
  const texteFait = new Map(jeu.faits.map((f) => [f.id, f.texte]));
  const faitsTrouves = new Set(deblocages.map((d) => d.fait_id));
  const acces = new Set([
    ...jeu.personnages.filter((p) => p.porte_entree).map((p) => p.id),
    ...recommandations.map((r) => r.vers_personnage),
  ]);
  const mails = new Map<string, number>();
  const refus = new Map<string, number>();
  const atteints = new Set<string>();
  for (const e of echanges) {
    if (!e.personnage_id) continue;
    if (e.issue === "reponse" || e.issue === "refus_sans_reco")
      mails.set(e.personnage_id, (mails.get(e.personnage_id) ?? 0) + 1);
    if (e.issue === "refus_sans_reco")
      refus.set(e.personnage_id, (refus.get(e.personnage_id) ?? 0) + 1);
    if (e.issue === "reponse") atteints.add(e.personnage_id);
  }

  const pistes = calculerPistes({
    personnages: jeu.personnages,
    faits: jeu.faits,
    aretes: jeu.aretes,
    faitsTrouves,
    acces,
    mailsParPersonnage: mails,
    refusParPersonnage: refus,
  });

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm">
          <Link
            href={`/admin/progression?classe=${encodeURIComponent(etudiant.classe)}`}
            className="text-indigo-700 hover:underline"
          >
            ← {etudiant.classe}
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">
            {etudiant.prenom} {etudiant.nom}
            {!etudiant.actif && (
              <span className="ml-2 text-sm text-rose-700">(inactif)</span>
            )}
          </h2>
          <Rafraichir genereAt={new Date().toISOString()} />
        </div>
        <p className="font-mono text-sm text-slate-600">{etudiant.email}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Chiffre
            libelle="Faits"
            valeur={`${faitsTrouves.size} / ${jeu.faits.length}`}
          />
          <Chiffre
            libelle="Personnages atteints"
            valeur={`${atteints.size} / ${jeu.personnages.length}`}
          />
          <Chiffre libelle="Recommandations" valeur={recommandations.length} />
          <Chiffre libelle="Mails génériques" valeur={note?.generiques ?? 0} />
          {note && (
            <Chiffre
              libelle="Note provisoire"
              valeur={`${String(note.note_sur_20).replace(".", ",")} / 20`}
            />
          )}
        </div>
        <p className="text-xs text-slate-500">
          <a
            href={`/?t=${etudiant.jeton}`}
            target="_blank"
            className="text-indigo-700 hover:underline"
          >
            Ouvrir son tableau de bord
          </a>{" "}
          (ce navigateur gardera ensuite son lien en mémoire, à la place du
          vôtre).
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold">Personnages</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Personnage</th>
                <th className="px-3 py-2">État</th>
                <th className="px-3 py-2">Accès</th>
                <th className="px-3 py-2 text-right">Mails</th>
                <th className="px-3 py-2">Faits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jeu.personnages.map((p) => {
                const sesFaits = jeu.faits.filter(
                  (f) => f.personnage_id === p.id,
                );
                const trouves = sesFaits.filter((f) => faitsTrouves.has(f.id));
                const etat =
                  sesFaits.length > 0 && trouves.length === sesFaits.length
                    ? "complet"
                    : atteints.has(p.id)
                      ? "atteint"
                      : refus.has(p.id) && !acces.has(p.id)
                        ? "refuse"
                        : acces.has(p.id)
                          ? "accessible"
                          : "verrouille";
                const par = recommandations
                  .filter((r) => r.vers_personnage === p.id)
                  .map((r) => noms.get(r.de_personnage) ?? r.de_personnage);
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">
                        {p.prenom} {p.nom}
                      </p>
                      <p className="text-xs text-slate-500">{p.role}</p>
                    </td>
                    <td className="px-3 py-2">
                      <Pastille
                        {...ETATS[etat]}
                        libelle={
                          etat === "atteint"
                            ? `${trouves.length} / ${sesFaits.length} fait${trouves.length > 1 ? "s" : ""} débloqué${trouves.length > 1 ? "s" : ""}`
                            : ETATS[etat].libelle
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.porte_entree
                        ? "Porte d'entrée"
                        : par.length > 0
                          ? `Reco de ${par.join(", ")}`
                          : "–"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {mails.get(p.id) ?? 0}
                      {refus.has(p.id) && (
                        <span className="text-xs text-amber-700">
                          {" "}
                          ({refus.get(p.id)} refus)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <ul className="space-y-0.5 text-xs">
                        {sesFaits.map((f) => (
                          <li
                            key={f.id}
                            className={
                              faitsTrouves.has(f.id)
                                ? "text-emerald-800"
                                : "text-slate-400"
                            }
                          >
                            {faitsTrouves.has(f.id) ? "✓" : "○"} {f.id}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Pistes et indices</h3>
        <p className="text-sm text-slate-600">
          Ce qu&apos;il reste à trouver auprès des personnages déjà joignables,
          et les recommandations qui ouvriraient les autres. Les personnages qui
          ont déjà opposé un refus sont en tête.
        </p>
        <RedacteurIndice
          etudiant={{ id: etudiant.id, prenom: etudiant.prenom }}
          pistes={pistes}
          envoiPossible={envoiIndicePossible()}
        />
      </section>

      {entrants.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Mails reçus pas encore traités</h3>
          <ul className="space-y-1 text-sm">
            {entrants.map((m) => (
              <li key={m.id}>
                {formaterDate(m.recu_at)} → {m.destinataire} :{" "}
                {m.sujet || "(sans objet)"}{" "}
                <span
                  className={
                    m.statut === "erreur"
                      ? "font-semibold text-rose-700"
                      : "text-slate-500"
                  }
                >
                  ({STATUTS_ENTRANT[m.statut] ?? m.statut})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold">
          Échanges <span className="text-slate-400">({echanges.length})</span>
        </h3>
        {echanges.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Aucun échange pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-3">
            {echanges.map((e) => (
              <CarteEchange
                key={e.id}
                e={e}
                noms={noms}
                libellesFaits={texteFait}
                avecEtudiant={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chiffre({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{libelle}</p>
      <p className="text-lg font-bold">{valeur}</p>
    </div>
  );
}

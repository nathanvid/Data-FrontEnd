// Mails : ce qui attend une décision du formateur, ce qui est en route, et le journal.
import { Suspense } from "react";
import Link from "next/link";
import {
  TAILLE_JOURNAL,
  lireClasses,
  lireFileMails,
  lireJeu,
  lireJournal,
} from "@/lib/admin/donnees";
import { ISSUES_ADMIN, STATUTS_ENTRANT } from "@/lib/admin/libelles";
import { formaterDate, formaterHeure } from "@/lib/format";
import { Rafraichir } from "@/components/Rafraichir";
import { CarteEchange } from "@/components/admin/CarteEchange";
import { FormulaireReponse } from "@/components/admin/FormulaireReponse";
import { envoyerMaintenant, relancerMessage } from "../../actions";

export default function PageMails({ searchParams }: PageProps<"/admin/mails">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <Mails searchParams={searchParams} />
    </Suspense>
  );
}

const premier = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || undefined;

async function Mails({
  searchParams,
}: {
  searchParams: PageProps<"/admin/mails">["searchParams"];
}) {
  const sp = await searchParams;
  const filtres = {
    classe: premier(sp.classe),
    issue: premier(sp.issue),
    personnage: premier(sp.personnage),
  };
  const [file, journal, jeu, classes] = await Promise.all([
    lireFileMails(),
    lireJournal(filtres),
    lireJeu(),
    lireClasses(),
  ]);
  const noms = new Map(
    jeu.personnages.map((p) => [p.id, `${p.prenom} ${p.nom}`]),
  );
  const parEmail = new Map(
    jeu.personnages.map((p) => [p.email, `${p.prenom} ${p.nom}`]),
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Mails</h2>
        <Rafraichir genereAt={new Date().toISOString()} />
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold">
          Réponses à revoir{" "}
          <span className="text-slate-400">({file.aRevoir.length})</span>
        </h3>
        <p className="text-sm text-slate-600">
          Réponses retenues par les garde-fous (trop longue, coupée, chiffre
          inventé, collègue non nommé…) ou en échec d&apos;envoi. Tant
          qu&apos;elles sont ici, l&apos;étudiant voit « en cours de traitement
          » et n&apos;obtient pas les faits ni les recommandations qu&apos;elles
          apportent.
        </p>
        {file.aRevoir.length === 0 ? (
          <Vide>Rien à revoir.</Vide>
        ) : (
          <div className="space-y-4">
            {file.aRevoir.map((e) => (
              <CarteEchange key={e.id} e={e} noms={noms}>
                {e.envoi && (
                  <FormulaireReponse
                    outboxId={e.envoi.id}
                    texte={e.envoi.texte}
                  />
                )}
              </CarteEchange>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">
          Mails reçus pas encore traités{" "}
          <span className="text-slate-400">({file.entrants.length})</span>
        </h3>
        {file.entrants.length === 0 ? (
          <Vide>Aucun mail en attente de traitement.</Vide>
        ) : (
          <Tableau entetes={["Reçu", "De", "À", "Objet", "État", ""]}>
            {file.entrants.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap px-3 py-2">
                  {formaterDate(m.recu_at)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{m.expediteur}</td>
                <td className="px-3 py-2">
                  {parEmail.get(m.destinataire) ?? m.destinataire}
                  {m.en_copie && " (copie)"}
                </td>
                <td className="px-3 py-2">{m.sujet || "(sans objet)"}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      m.statut === "erreur" ? "font-semibold text-rose-700" : ""
                    }
                  >
                    {STATUTS_ENTRANT[m.statut] ?? m.statut}
                  </span>
                  {m.tentatives > 0 && (
                    <span className="text-xs text-slate-400">
                      {" "}
                      · {m.tentatives} essai(s)
                    </span>
                  )}
                  {m.derniere_erreur && (
                    <span className="block text-xs text-rose-700">
                      {m.derniere_erreur}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {m.statut === "erreur" && (
                    <form action={relancerMessage}>
                      <input type="hidden" name="message_id" value={m.id} />
                      <button className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                        Relancer
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">
          Réponses programmées{" "}
          <span className="text-slate-400">({file.programmes.length})</span>
        </h3>
        {file.programmes.length === 0 ? (
          <Vide>Aucune réponse en attente d&apos;envoi.</Vide>
        ) : (
          <div className="space-y-3">
            {file.programmes.map((e) => (
              <CarteEchange key={e.id} e={e} noms={noms}>
                {e.envoi && (
                  <details className="rounded-md border border-slate-200">
                    <summary className="cursor-pointer px-3 py-2 font-medium text-indigo-700">
                      Réponse prévue à {formaterHeure(e.envoi.send_at)} : lire
                      ou corriger
                    </summary>
                    <div className="space-y-2 border-t border-slate-100 p-3">
                      {e.envoi.statut === "en_attente" && (
                        <form action={envoyerMaintenant}>
                          <input
                            type="hidden"
                            name="outbox_id"
                            value={e.envoi.id}
                          />
                          <button className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                            Envoyer maintenant
                          </button>
                        </form>
                      )}
                      <FormulaireReponse
                        outboxId={e.envoi.id}
                        texte={e.envoi.texte}
                      />
                    </div>
                  </details>
                )}
              </CarteEchange>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Journal des échanges</h3>
        <form className="flex flex-wrap items-end gap-2 text-sm">
          <Choix
            nom="classe"
            libelle="Classe"
            valeur={filtres.classe}
            options={classes.map((c) => [c, c])}
          />
          <Choix
            nom="personnage"
            libelle="Personnage"
            valeur={filtres.personnage}
            options={jeu.personnages.map((p) => [p.id, `${p.prenom} ${p.nom}`])}
          />
          <Choix
            nom="issue"
            libelle="Issue"
            valeur={filtres.issue}
            options={Object.entries(ISSUES_ADMIN).map(([k, v]) => [
              k,
              v.libelle,
            ])}
          />
          <button className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-900">
            Filtrer
          </button>
          <Link
            href="/admin/mails"
            className="px-2 py-1.5 text-slate-500 hover:text-slate-800"
          >
            Réinitialiser
          </Link>
        </form>
        <p className="text-xs text-slate-500">
          Les {TAILLE_JOURNAL} échanges les plus récents correspondant aux
          filtres.
        </p>
        {journal.length === 0 ? (
          <Vide>Aucun échange.</Vide>
        ) : (
          <div className="space-y-3">
            {journal.map((e) => (
              <CarteEchange key={e.id} e={e} noms={noms} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
      {children}
    </p>
  );
}

function Tableau({
  entetes,
  children,
}: {
  entetes: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            {entetes.map((t, i) => (
              <th key={i} className="px-3 py-2">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Choix({
  nom,
  libelle,
  valeur,
  options,
}: {
  nom: string;
  libelle: string;
  valeur: string | undefined;
  options: [string, string][];
}) {
  return (
    <label className="text-xs text-slate-500">
      {libelle}
      <select
        name={nom}
        defaultValue={valeur ?? ""}
        className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
      >
        <option value="">Tous</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

// Envoi des liens personnels du tableau de bord, classe par classe, depuis
// admin@pro.moncoinbureau.fr. Chaque envoi est noté dans envois_liens : le bouton principal
// ne sert que ceux qui n'ont encore rien reçu ; un renvoi se fait étudiant par étudiant.
import { Suspense } from "react";
import Link from "next/link";
import { lireClasses } from "@/lib/admin/donnees";
import {
  OBJET_LIEN,
  adresseSite,
  corpsLien,
  lireEnvoisLiens,
} from "@/lib/admin/liens";
import { EXPEDITEUR, envoiIndicePossible } from "@/lib/admin/mailgun";
import { formaterDate } from "@/lib/format";
import { BoutonEnvoiLiens } from "@/components/admin/BoutonEnvoiLiens";

export default function PageLiens({ searchParams }: PageProps<"/admin/liens">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <Liens searchParams={searchParams} />
    </Suspense>
  );
}

async function Liens({
  searchParams,
}: {
  searchParams: PageProps<"/admin/liens">["searchParams"];
}) {
  const [sp, classes, site] = await Promise.all([
    searchParams,
    lireClasses(),
    adresseSite(),
  ]);
  const demandee = Array.isArray(sp.classe) ? sp.classe[0] : sp.classe;
  // Par défaut la classe de test : on vérifie le rendu avant d'écrire aux étudiants
  const classe =
    (demandee && classes.includes(demandee) && demandee) ||
    classes.find((c) => c === "test") ||
    classes[0];
  const etudiants = classe ? await lireEnvoisLiens(classe) : [];
  const envoiPossible = envoiIndicePossible();
  const manquants = etudiants?.filter((e) => e.envois.length === 0) ?? [];
  const pret = envoiPossible && etudiants !== null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Liens personnels</h2>

      {etudiants === null && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Le journal des envois (table <code>envois_liens</code>) n&apos;existe
          pas encore : appliquez{" "}
          <code>simulateur/migration_envois_liens.sql</code> dans Supabase.
          L&apos;envoi reste bloqué d&apos;ici là.
        </p>
      )}
      {!envoiPossible && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Envoi désactivé : définissez MAILGUN_API_KEY et ADMIN_REPONDRE_A sur
          le serveur.
        </p>
      )}

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm md:grid-cols-3">
        <p>
          <span className="block text-xs text-slate-500">Expéditeur</span>
          {EXPEDITEUR}
        </p>
        <p>
          <span className="block text-xs text-slate-500">
            Réponses des étudiants vers
          </span>
          {process.env.ADMIN_REPONDRE_A ?? "(non renseigné)"}
        </p>
        <p>
          <span className="block text-xs text-slate-500">
            Adresse du site dans les liens
            {!process.env.SITE_URL && " (déduite, fixez SITE_URL)"}
          </span>
          {site}
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Classes">
        {classes.map((c) => (
          <Link
            key={c}
            href={`/admin/liens?classe=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1 text-sm ${c === classe ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white hover:bg-slate-50"}`}
          >
            {c}
          </Link>
        ))}
      </nav>

      {classe && etudiants && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm">
              <span className="font-semibold">
                {etudiants.length - manquants.length} / {etudiants.length}
              </span>{" "}
              étudiant(s) de {classe} ont reçu leur lien.
            </p>
            <div className="flex flex-wrap gap-3">
              <BoutonEnvoiLiens
                classe={classe}
                cible="manquants"
                essai
                discret
                libelle="Tester (mode test Mailgun)"
                confirmation={`Tester l'envoi pour ${manquants.length} étudiant(s) de ${classe} ? Mailgun vérifie tout mais ne délivre rien.`}
                desactive={!pret || manquants.length === 0}
              />
              <BoutonEnvoiLiens
                classe={classe}
                cible="manquants"
                libelle={`Envoyer aux ${manquants.length} restant(s)`}
                confirmation={`Envoyer leur lien personnel à ${manquants.length} étudiant(s) de ${classe} ?`}
                desactive={!pret || manquants.length === 0}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">Étudiant</th>
                  <th className="px-3 py-2">Adresse</th>
                  <th className="px-3 py-2">Lien envoyé</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {etudiants.map((e) => {
                  const dernier = e.envois[0];
                  return (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        {e.prenom} {e.nom}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{e.email}</td>
                      <td className="px-3 py-2">
                        {dernier ? (
                          <span className="text-emerald-700">
                            {formaterDate(dernier.envoye_at)}
                            {e.envois.length > 1 &&
                              ` (${e.envois.length} fois)`}
                            {dernier.email !== e.email && (
                              <span className="block text-xs text-amber-700">
                                à {dernier.email}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">jamais</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <BoutonEnvoiLiens
                          classe={classe}
                          cible={e.id}
                          renvoi={Boolean(dernier)}
                          discret
                          libelle={dernier ? "Renvoyer" : "Envoyer"}
                          confirmation={
                            dernier
                              ? `${e.prenom} a déjà reçu son lien. Le renvoyer à ${e.email} ?`
                              : `Envoyer son lien à ${e.email} ?`
                          }
                          desactive={!pret}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold">
          Aperçu du message
        </summary>
        <p className="mt-3 text-xs text-slate-500">Objet : {OBJET_LIEN}</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-700">
          {corpsLien({ prenom: "Prénom", jeton: "…", site })}
        </pre>
      </details>
    </div>
  );
}

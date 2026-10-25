// Progression d'une classe : qui a trouvé quel fait, qui a atteint quel personnage.
// Une ligne par étudiant, une colonne par fait (regroupés par personnage), et en bas
// le nombre d'étudiants qui ont trouvé chaque fait.
import { Suspense } from "react";
import Link from "next/link";
import { lireClasses, lireJeu, lireProgression } from "@/lib/admin/donnees";
import { formaterDate } from "@/lib/format";
import { Rafraichir } from "@/components/Rafraichir";

export default function PageProgression({
  searchParams,
}: PageProps<"/admin/progression">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <Progression searchParams={searchParams} />
    </Suspense>
  );
}

async function Progression({
  searchParams,
}: {
  searchParams: PageProps<"/admin/progression">["searchParams"];
}) {
  const [sp, classes, jeu] = await Promise.all([
    searchParams,
    lireClasses(),
    lireJeu(),
  ]);
  const demandee = Array.isArray(sp.classe) ? sp.classe[0] : sp.classe;
  const classe =
    (demandee && classes.includes(demandee) && demandee) ||
    classes.find((c) => c !== "test") ||
    classes[0];
  const lignes = classe ? await lireProgression(classe) : [];

  // Colonnes : les faits, regroupés par personnage dans l'ordre du jeu
  const groupes = jeu.personnages
    .map((p) => ({
      p,
      faits: jeu.faits.filter((f) => f.personnage_id === p.id),
    }))
    .filter((g) => g.faits.length > 0);
  const colonnes = groupes.flatMap((g) => g.faits);
  const total = colonnes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Progression</h2>
        <Rafraichir genereAt={new Date().toISOString()} />
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Classes">
        {classes.map((c) => (
          <Link
            key={c}
            href={`/admin/progression?classe=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1 text-sm ${c === classe ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white hover:bg-slate-50"}`}
          >
            {c}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="bg-slate-50">
              <th
                rowSpan={2}
                className="sticky left-0 bg-slate-50 px-3 py-2 text-left"
              >
                Étudiant
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2 text-right"
                title="Mails traités (réponses et refus)"
              >
                Mails
              </th>
              <th rowSpan={2} className="px-2 py-2 text-right">
                Faits
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2 text-right"
                title="Personnages qui ont répondu"
              >
                Atteints
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2 text-right"
                title="Mails jugés génériques"
              >
                Génér.
              </th>
              <th rowSpan={2} className="px-2 py-2 text-right">
                Note /20
              </th>
              {groupes.map((g) => (
                <th
                  key={g.p.id}
                  colSpan={g.faits.length}
                  className="border-l border-slate-200 px-2 py-1 text-center"
                  title={g.p.role}
                >
                  {g.p.prenom}
                </th>
              ))}
              <th
                rowSpan={2}
                className="border-l border-slate-200 px-3 py-2 text-left"
              >
                Dernier mail
              </th>
            </tr>
            <tr className="bg-slate-50">
              {groupes.flatMap((g) =>
                g.faits.map((f, i) => (
                  <th
                    key={f.id}
                    title={f.texte}
                    className={`px-1 pb-2 text-center font-normal ${i === 0 ? "border-l border-slate-200" : ""}`}
                  >
                    <span className="inline-block max-w-16 truncate align-bottom">
                      {f.id.replace(`${f.personnage_id}_`, "")}
                    </span>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((l) => (
              <tr key={l.etudiant.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap">
                  <Link
                    href={`/admin/etudiants/${l.etudiant.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {l.etudiant.nom} {l.etudiant.prenom}
                  </Link>
                </td>
                <td className="px-2 py-2 text-right">{l.mails}</td>
                <td className="px-2 py-2 text-right font-semibold">
                  {l.faits.size}/{total}
                </td>
                <td className="px-2 py-2 text-right">
                  {l.atteints.size}/{jeu.personnages.length}
                </td>
                <td
                  className={`px-2 py-2 text-right ${l.generiques > 0 ? "text-orange-700" : ""}`}
                >
                  {l.generiques}
                </td>
                <td className="px-2 py-2 text-right">
                  {l.note === null ? "–" : String(l.note).replace(".", ",")}
                </td>
                {groupes.flatMap((g) =>
                  g.faits.map((f, i) => {
                    const trouve = l.faits.has(f.id);
                    const etat = trouve
                      ? "trouvé"
                      : l.atteints.has(g.p.id)
                        ? "personnage atteint, fait pas encore trouvé"
                        : l.acces.has(g.p.id)
                          ? "personnage joignable, pas encore atteint"
                          : "personnage verrouillé";
                    return (
                      <td
                        key={f.id}
                        title={`${f.id} : ${etat}`}
                        className={`px-1 py-2 text-center ${i === 0 ? "border-l border-slate-200" : ""}`}
                      >
                        <span
                          aria-label={etat}
                          className={`inline-block h-4 w-4 rounded ${
                            trouve
                              ? "bg-emerald-500"
                              : l.atteints.has(g.p.id)
                                ? "bg-amber-200"
                                : l.acces.has(g.p.id)
                                  ? "bg-indigo-100"
                                  : "bg-slate-100"
                          }`}
                        />
                      </td>
                    );
                  }),
                )}
                <td className="border-l border-slate-200 px-3 py-2 text-xs whitespace-nowrap text-slate-500">
                  {l.dernierMail ? formaterDate(l.dernierMail) : "jamais"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs text-slate-600">
            <tr>
              <td className="sticky left-0 bg-slate-50 px-3 py-2 font-semibold">
                Trouvé par
              </td>
              <td colSpan={5} />
              {colonnes.map((f) => {
                const n = lignes.filter((l) => l.faits.has(f.id)).length;
                return (
                  <td
                    key={f.id}
                    title={f.texte}
                    className={`px-1 py-2 text-center font-semibold ${
                      groupes.some((g) => g.faits[0]?.id === f.id)
                        ? "border-l border-slate-200"
                        : ""
                    } ${n === 0 ? "text-rose-700" : ""}`}
                  >
                    {n}
                  </td>
                );
              })}
              <td className="border-l border-slate-200" />
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="flex flex-wrap gap-4 text-xs text-slate-600">
        <Legende couleur="bg-emerald-500">Fait trouvé</Legende>
        <Legende couleur="bg-amber-200">
          Personnage atteint, fait manquant
        </Legende>
        <Legende couleur="bg-indigo-100">
          Personnage joignable, jamais atteint
        </Legende>
        <Legende couleur="bg-slate-100">Personnage verrouillé</Legende>
      </ul>
      <p className="text-xs text-slate-500">
        Survolez un en-tête de colonne pour lire le fait. Les chiffres tiennent
        compte de tout ce qui a été obtenu, y compris les réponses pas encore
        arrivées chez l&apos;étudiant.
      </p>
    </div>
  );
}

function Legende({
  couleur,
  children,
}: {
  couleur: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${couleur}`} />
      {children}
    </li>
  );
}

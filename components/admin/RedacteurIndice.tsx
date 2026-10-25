"use client";
// Pistes pour débloquer un étudiant, et rédaction d'un message d'indice.
// Chaque piste montre le critère secret de l'évaluateur (pour le formateur seulement) et
// deux suggestions à insérer dans le message ; le formateur relit et adapte avant d'envoyer.
import { useActionState, useState } from "react";
import { envoyerIndice } from "@/app/admin/actions";
import type { Piste } from "@/lib/admin/indices";

const SIGNATURE = "\n\nBonne enquête,\nNathan Vidal";

export function RedacteurIndice({
  etudiant,
  pistes,
  envoiPossible,
}: {
  etudiant: { id: string; prenom: string };
  pistes: Piste[];
  envoiPossible: boolean;
}) {
  const [texte, setTexte] = useState(
    `Bonjour ${etudiant.prenom},\n${SIGNATURE}`,
  );
  const [copie, setCopie] = useState(false);
  const [etat, action, enCours] = useActionState(envoyerIndice, null);

  function inserer(paragraphe: string) {
    setTexte((t) => {
      const i = t.lastIndexOf(SIGNATURE);
      return i === -1
        ? `${t}\n\n${paragraphe}`
        : `${t.slice(0, i).trimEnd()}\n\n${paragraphe}${t.slice(i)}`;
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        {pistes.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Aucune piste : tout ce qui est joignable a été trouvé.
          </p>
        )}
        {pistes.map((p) => (
          <div
            key={p.cle}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {p.type === "acces" ? "Débloquer " : "Fait "}
                <span className="font-mono text-xs">{p.cible}</span>
                <span className="font-normal text-slate-500">
                  {" "}
                  · écrire à {p.personnage.prenom} {p.personnage.nom}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {p.mailsEnvoyes} mail(s) à {p.personnage.prenom}
                {p.refus > 0 && (
                  <span className="font-semibold text-amber-700">
                    {" "}
                    · {p.refus} refus de {p.cible}
                  </span>
                )}
              </p>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-slate-500">
                Critère de l&apos;évaluateur (secret)
              </summary>
              <p className="mt-1 whitespace-pre-line rounded bg-slate-50 p-2 text-xs text-slate-700">
                {p.condition}
              </p>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inserer(p.legere)}
                title={p.legere}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                + Indice léger
              </button>
              <button
                type="button"
                onClick={() => inserer(p.appuyee)}
                title={p.appuyee}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                + Indice appuyé
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        action={action}
        className="space-y-2 lg:sticky lg:top-4 lg:self-start"
      >
        <input type="hidden" name="etudiant_id" value={etudiant.id} />
        <label className="block text-xs font-semibold text-slate-500">
          Objet
          <input
            name="sujet"
            defaultValue="Un coup de pouce pour votre enquête"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-500">
          Message
          <textarea
            name="texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={14}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!envoiPossible || enCours}
            onClick={(ev) => {
              if (
                !confirm(`Envoyer cet indice par mail à ${etudiant.prenom} ?`)
              )
                ev.preventDefault();
            }}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Envoyer par mail"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(texte);
              setCopie(true);
              setTimeout(() => setCopie(false), 2000);
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {copie ? "Copié" : "Copier le texte"}
          </button>
          {etat?.ok && <p className="text-sm text-emerald-700">{etat.ok}</p>}
          {etat?.erreur && (
            <p className="text-sm text-rose-700">{etat.erreur}</p>
          )}
        </div>
        {!envoiPossible && (
          <p className="text-xs text-slate-500">
            Envoi par mail désactivé : définissez MAILGUN_API_KEY et
            ADMIN_REPONDRE_A (la boîte qui recevra les réponses des étudiants)
            sur le serveur. En attendant, copiez le texte.
          </p>
        )}
      </form>
    </div>
  );
}

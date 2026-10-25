"use client";
// Relecture d'une réponse retenue par les garde-fous (outbox « a_revoir ») : le formateur
// corrige le texte, puis le valide (envoi immédiat), l'enregistre, ou annule l'envoi.
import { useActionState } from "react";
import { traiterReponse } from "@/app/admin/actions";

export function FormulaireReponse({
  outboxId,
  texte,
}: {
  outboxId: number;
  texte: string;
}) {
  const [etat, action, enCours] = useActionState(traiterReponse, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="outbox_id" value={outboxId} />
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Réponse du personnage (modifiable)
        <textarea
          name="texte"
          defaultValue={texte}
          rows={12}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-sans text-sm normal-case tracking-normal text-slate-900"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          name="intention"
          value="envoyer"
          disabled={enCours}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Valider et envoyer
        </button>
        <button
          name="intention"
          value="enregistrer"
          disabled={enCours}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Enregistrer sans envoyer
        </button>
        <button
          name="intention"
          value="annuler"
          disabled={enCours}
          onClick={(ev) => {
            if (
              !confirm(
                "Annuler l'envoi ? L'étudiant ne recevra jamais cette réponse, ni les faits ou recommandations qu'elle apporte.",
              )
            )
              ev.preventDefault();
          }}
          className="rounded-md px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          Annuler l&apos;envoi
        </button>
        {etat?.ok && <p className="text-sm text-emerald-700">{etat.ok}</p>}
        {etat?.erreur && <p className="text-sm text-rose-700">{etat.erreur}</p>}
      </div>
    </form>
  );
}

"use client";
// Un bouton d'envoi de liens : à toute la classe (ceux qui n'ont rien reçu), ou à un seul
// étudiant. Demande confirmation, puis affiche le résultat renvoyé par le serveur.
import { useActionState } from "react";
import { envoyerLiens } from "@/app/admin/actions";

export function BoutonEnvoiLiens({
  classe,
  cible,
  renvoi = false,
  essai = false,
  libelle,
  confirmation,
  desactive = false,
  discret = false,
}: {
  classe: string;
  cible: string;
  renvoi?: boolean;
  essai?: boolean;
  libelle: string;
  confirmation: string;
  desactive?: boolean;
  discret?: boolean;
}) {
  const [etat, action, enCours] = useActionState(envoyerLiens, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classe" value={classe} />
      <input type="hidden" name="cible" value={cible} />
      {renvoi && <input type="hidden" name="renvoi" value="oui" />}
      {essai && <input type="hidden" name="essai" value="oui" />}
      <button
        disabled={desactive || enCours}
        onClick={(ev) => {
          if (!confirm(confirmation)) ev.preventDefault();
        }}
        className={
          discret
            ? "rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
            : "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        }
      >
        {enCours ? "Envoi…" : libelle}
      </button>
      {etat?.ok && <p className="text-sm text-emerald-700">{etat.ok}</p>}
      {etat?.erreur && <p className="text-sm text-rose-700">{etat.erreur}</p>}
    </form>
  );
}

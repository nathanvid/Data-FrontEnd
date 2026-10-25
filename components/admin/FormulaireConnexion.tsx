"use client";
import { useActionState } from "react";
import { connexion } from "@/app/admin/actions";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(connexion, null);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium">
        Mot de passe
        <input
          type="password"
          name="mot_de_passe"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      {etat?.erreur && <p className="text-sm text-rose-700">{etat.erreur}</p>}
      <button
        disabled={enCours}
        className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {enCours ? "Vérification…" : "Se connecter"}
      </button>
    </form>
  );
}

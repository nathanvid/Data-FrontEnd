// Connexion à l'administration. La page est statique ; seul le formulaire est un
// composant client (pour afficher l'erreur sans recharger).
import { adminConfiguree } from "@/lib/admin/session";
import { FormulaireConnexion } from "@/components/admin/FormulaireConnexion";

export default function PageConnexion() {
  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        MonCoinBureau Pro · formateur
      </p>
      <h1 className="mb-6 text-xl font-bold">Administration</h1>
      {adminConfiguree() ? (
        <FormulaireConnexion />
      ) : (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          L&apos;administration est fermée : définissez ADMIN_MOT_DE_PASSE (12
          caractères minimum) dans les variables d&apos;environnement du
          serveur.
        </p>
      )}
    </main>
  );
}

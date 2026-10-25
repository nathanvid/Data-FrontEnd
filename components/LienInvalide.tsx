// Affiché quand le cookie est absent, mal formé, inconnu de la base ou lié à un étudiant inactif.
// Le même message dans tous les cas : on ne dit pas pourquoi le lien ne marche pas.
export function LienInvalide() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h2 className="mb-2 text-lg font-semibold">Lien personnel requis</h2>
      <p className="text-sm">
        Pour voir votre enquête, ouvrez le lien personnel que votre formateur
        vous a envoyé. Si vous l&apos;avez déjà utilisé et que ce message
        apparaît, demandez-lui un nouveau lien.
      </p>
    </div>
  );
}

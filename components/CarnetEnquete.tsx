// Carnet d'enquête : le texte des faits découverts, dans l'ordre de découverte.
// La base n'envoie que les faits dont le mail est déjà arrivé. Composant SERVEUR.
import type { FaitDecouvert, Personnage } from "@/lib/types-tableau";
import { formaterDate } from "@/lib/format";

export function CarnetEnquete({
  carnet,
  personnages,
}: {
  carnet: FaitDecouvert[];
  personnages: Personnage[];
}) {
  const nom = new Map(personnages.map((p) => [p.id, `${p.prenom} ${p.nom}`]));

  if (carnet.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Aucun fait découvert pour l&apos;instant. Quand un personnage vous
        confie une information importante, elle apparaît ici.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {carnet.map((f) => (
        <li
          key={f.fait_id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {nom.get(f.personnage_id) ?? f.personnage_id}
            </span>{" "}
            · {formaterDate(f.decouvert_at)}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{f.texte}</p>
        </li>
      ))}
    </ol>
  );
}

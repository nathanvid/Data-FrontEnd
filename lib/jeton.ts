// Constantes partagées entre proxy.ts et le serveur.
// Rien de secret ici : seulement le nom du cookie et le format attendu du jeton.

export const NOM_COOKIE = "mcb_jeton";

// Durée de vie du cookie : jusqu'à la fin du module (environ 4 mois)
export const DUREE_COOKIE_S = 60 * 60 * 24 * 120;

// Un jeton est un uuid (etudiants.jeton). On rejette tout le reste avant même d'interroger la base.
const FORMAT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function estUnJeton(
  valeur: string | undefined | null,
): valeur is string {
  return typeof valeur === "string" && FORMAT_UUID.test(valeur);
}

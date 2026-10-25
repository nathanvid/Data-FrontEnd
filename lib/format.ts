// Mise en forme des dates, toujours à l'heure de Paris.
// On fixe le fuseau : le serveur (Hostinger) et le navigateur doivent afficher la même heure,
// sinon React signale une différence entre le rendu serveur et le rendu client.

const FUSEAU = "Europe/Paris";

const heure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
});
const jourHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formaterHeure(iso: string): string {
  return heure.format(new Date(iso));
}

export function formaterDate(iso: string): string {
  return jourHeure.format(new Date(iso));
}

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

// Coût LLM : en dollars, tel que renvoyé par l'API (pas de conversion en euros)
const dollars = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});
const entier = new Intl.NumberFormat("fr-FR");

export function formaterCout(usd: number): string {
  return dollars.format(usd);
}

export function formaterNombre(n: number): string {
  return entier.format(n);
}

export function formaterLatence(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

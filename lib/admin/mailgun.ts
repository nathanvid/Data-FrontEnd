// Envoi d'un indice à un étudiant, par Mailgun (même domaine et même clé que
// scripts/preparer-liens.mjs).
//
// Les réponses de l'étudiant ne doivent PAS revenir sur pro.moncoinbureau.fr : ses routes
// Mailgun alimentent le simulateur, l'indice deviendrait un mail adressé à un personnage.
// D'où ADMIN_REPONDRE_A, obligatoire : sans lui, l'envoi est désactivé.
import "server-only";

const DOMAINE = process.env.MAILGUN_DOMAINE ?? "pro.moncoinbureau.fr";
const API = process.env.MAILGUN_API ?? "https://api.eu.mailgun.net";
const EXPEDITEUR =
  process.env.MAILGUN_EXPEDITEUR ??
  "MonCoinBureau Pro <admin@pro.moncoinbureau.fr>";

export function envoiIndicePossible(): boolean {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.ADMIN_REPONDRE_A);
}

export async function envoyerMail({
  a,
  sujet,
  texte,
}: {
  a: string;
  sujet: string;
  texte: string;
}): Promise<void> {
  const cle = process.env.MAILGUN_API_KEY;
  const repondreA = process.env.ADMIN_REPONDRE_A;
  if (!cle || !repondreA) throw new Error("Envoi non configuré");

  const formulaire = new URLSearchParams({
    from: EXPEDITEUR,
    to: a,
    subject: sujet,
    text: texte,
    "h:Reply-To": repondreA,
    "o:tracking": "no",
    "o:tag": "indice",
  });
  const reponse = await fetch(`${API}/v3/${DOMAINE}/messages`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`api:${cle}`).toString("base64"),
    },
    body: formulaire,
  });
  if (!reponse.ok) {
    console.error("Mailgun :", reponse.status, await reponse.text());
    throw new Error("Mailgun a refusé l'envoi");
  }
}

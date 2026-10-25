// Envoi d'un mail à un étudiant (indice, lien personnel), par Mailgun (même domaine et
// même clé que scripts/preparer-liens.mjs). Expéditeur : admin@pro.moncoinbureau.fr.
//
// Les réponses de l'étudiant ne doivent PAS revenir sur pro.moncoinbureau.fr : ses routes
// Mailgun alimentent le simulateur, l'indice deviendrait un mail adressé à un personnage.
// D'où ADMIN_REPONDRE_A, obligatoire : sans lui, l'envoi est désactivé.
import "server-only";

const DOMAINE = process.env.MAILGUN_DOMAINE ?? "pro.moncoinbureau.fr";
const API = process.env.MAILGUN_API ?? "https://api.eu.mailgun.net";
export const EXPEDITEUR =
  process.env.MAILGUN_EXPEDITEUR ??
  "MonCoinBureau Pro <admin@pro.moncoinbureau.fr>";

export function envoiIndicePossible(): boolean {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.ADMIN_REPONDRE_A);
}

// Renvoie l'identifiant Mailgun du message. essai : mode test, accepté mais jamais délivré.
export async function envoyerMail({
  a,
  sujet,
  texte,
  tag = "indice",
  essai = false,
}: {
  a: string;
  sujet: string;
  texte: string;
  tag?: string;
  essai?: boolean;
}): Promise<string> {
  const cle = process.env.MAILGUN_API_KEY;
  const repondreA = process.env.ADMIN_REPONDRE_A;
  if (!cle || !repondreA) throw new Error("Envoi non configuré");

  const formulaire = new URLSearchParams({
    from: EXPEDITEUR,
    to: a,
    subject: sujet,
    text: texte,
    "h:Reply-To": repondreA,
    // Sans suivi : Mailgun réécrirait sinon les liens (et donc le jeton) via sa redirection
    "o:tracking": "no",
    "o:tracking-clicks": "no",
    "o:tracking-opens": "no",
    "o:tag": tag,
  });
  if (essai) formulaire.set("o:testmode", "yes");
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
  const { id } = (await reponse.json()) as { id: string };
  return id;
}

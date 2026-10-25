// Prépare, puis envoie sur demande explicite, les liens personnels du tableau de bord.
//
// Par défaut, N'ENVOIE RIEN. Écrit dans envois/ (jamais versionné) :
//   - liens-<classe>.csv : une ligne par étudiant (email, objet, corps du message)
//   - apercu-<classe>.txt : les messages en clair, pour relecture
//
// Usage :
//   node --env-file=.env.local scripts/preparer-liens.mjs --site https://mon-site.fr [--classe lyon]
//     [--repondre-a vous@exemple.fr] [--essai | --envoyer]
//
// Sans --classe : toutes les classes réelles (est_test = false), étudiants actifs uniquement.
// --classe test : les deux comptes de test, pour vérifier le rendu avant tout le reste.
// --essai   : appelle Mailgun en mode test (vérifie clé et domaine, aucun email délivré)
// --envoyer : envoie réellement via Mailgun. Les adresses déjà servies sont notées dans
//             envois/envoyes-<classe>.json et ne reçoivent jamais un second email.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function argument(nom) {
  const i = process.argv.indexOf(`--${nom}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const site = argument("site")?.replace(/\/+$/, "");
const classe = argument("classe");
if (!site || !/^https?:\/\//.test(site)) {
  console.error("Indiquez l'adresse publique du site : --site https://...");
  process.exit(2);
}

const envoyer = process.argv.includes("--envoyer");
const essai = process.argv.includes("--essai");
// Les réponses ne doivent PAS revenir sur pro.moncoinbureau.fr : ses routes Mailgun
// alimentent le simulateur. On les dirige vers une vraie boîte.
const repondreA = argument("repondre-a");
const expediteur =
  process.env.MAILGUN_EXPEDITEUR ??
  "MonCoinBureau Pro <admin@pro.moncoinbureau.fr>";
if ((envoyer || essai) && !repondreA) {
  console.error(
    "Indiquez la boîte qui recevra les réponses : --repondre-a vous@exemple.fr",
  );
  process.exit(2);
}

const url = process.env.SUPABASE_URL;
const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !cle) {
  console.error(
    "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant : lancez avec --env-file=.env.local",
  );
  process.exit(2);
}

const supabase = createClient(url, cle, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Lecture seule : aucune écriture dans la base
let requete = supabase
  .from("etudiants")
  .select("prenom, nom, email, classe, jeton")
  .eq("actif", true)
  .order("classe")
  .order("nom");
requete = classe ? requete.eq("classe", classe) : requete.eq("est_test", false);

const { data: etudiants, error } = await requete;
if (error) {
  console.error("Lecture impossible :", error.message);
  process.exit(1);
}
if (etudiants.length === 0) {
  console.error("Aucun étudiant actif trouvé.");
  process.exit(1);
}

const OBJET = "MonCoinBureau Pro : votre tableau de bord personnel";

function corps({ prenom, jeton }) {
  return `Bonjour ${prenom},

Votre tableau de bord du simulateur MonCoinBureau Pro est disponible. Vous y retrouverez votre carnet d'enquête et votre progression.

Votre lien personnel :
${site}/?t=${jeton}

Ce lien est à vous seul : il vous identifie sans mot de passe. Merci de ne pas le partager ni de le projeter en classe.
Après une première ouverture, votre navigateur s'en souvient pendant plusieurs mois. Si vous changez d'appareil ou de navigateur, rouvrez simplement ce lien.

En cas de problème, répondez à ce message.

Bonne enquête,
Nathan Vidal`;
}

// Échappement CSV : guillemets doublés, champ toujours entre guillemets
const champ = (v) => `"${String(v).replaceAll('"', '""')}"`;

const lignes = [["prenom", "nom", "email", "classe", "objet", "corps"]];
const apercu = [];
for (const e of etudiants) {
  const texte = corps(e);
  lignes.push([e.prenom, e.nom, e.email, e.classe, OBJET, texte]);
  apercu.push(
    `De : ${expediteur}\nRépondre à : ${repondreA ?? "(non renseigné)"}\n` +
      `À : ${e.email}\nObjet : ${OBJET}\n\n${texte}\n\n${"=".repeat(60)}\n`,
  );
}

const suffixe = classe ?? "toutes";
mkdirSync("envois", { recursive: true });
// BOM UTF-8 : sans lui, Excel affiche mal les accents
writeFileSync(
  `envois/liens-${suffixe}.csv`,
  "﻿" + lignes.map((l) => l.map(champ).join(",")).join("\r\n") + "\r\n",
);
writeFileSync(`envois/apercu-${suffixe}.txt`, apercu.join("\n"));

const parClasse = Object.groupBy(etudiants, (e) => e.classe);
for (const [c, liste] of Object.entries(parClasse))
  console.log(`${c} : ${liste.length}`);
console.log(`→ envois/liens-${suffixe}.csv et envois/apercu-${suffixe}.txt`);

if (!envoyer && !essai) {
  console.log("Rien n'a été envoyé.");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Envoi Mailgun (région UE : le domaine pro.moncoinbureau.fr y est déclaré)
// ---------------------------------------------------------------------
const cleMailgun = process.env.MAILGUN_API_KEY;
const domaine = process.env.MAILGUN_DOMAINE ?? "pro.moncoinbureau.fr";
const api = process.env.MAILGUN_API ?? "https://api.eu.mailgun.net";
if (!cleMailgun) {
  console.error("MAILGUN_API_KEY manquant dans .env.local");
  process.exit(2);
}

const journal = `envois/envoyes-${suffixe}.json`;
const dejaEnvoyes = existsSync(journal)
  ? JSON.parse(readFileSync(journal, "utf8"))
  : {};

let envoyes = 0;
let ignores = 0;
for (const e of etudiants) {
  if (dejaEnvoyes[e.email]) {
    ignores++;
    continue;
  }
  const formulaire = new URLSearchParams({
    from: expediteur,
    to: `${e.prenom} ${e.nom} <${e.email}>`,
    subject: OBJET,
    text: corps(e),
    "h:Reply-To": repondreA,
    // Sans suivi : Mailgun réécrirait sinon le lien (et donc le jeton) via sa propre redirection
    "o:tracking": "no",
    "o:tracking-clicks": "no",
    "o:tracking-opens": "no",
    "o:tag": "liens-tableau-de-bord",
  });
  if (essai) formulaire.set("o:testmode", "yes");

  const reponse = await fetch(`${api}/v3/${domaine}/messages`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`api:${cleMailgun}`).toString("base64"),
    },
    body: formulaire,
  });
  if (!reponse.ok) {
    console.error(`✘ ${e.email} : ${reponse.status} ${await reponse.text()}`);
    // On s'arrête au premier refus : inutile d'insister avec une clé ou un domaine invalide
    process.exit(1);
  }
  const { id } = await reponse.json();
  if (envoyer) {
    dejaEnvoyes[e.email] = { id, at: new Date().toISOString() };
    writeFileSync(journal, JSON.stringify(dejaEnvoyes, null, 2));
  }
  envoyes++;
  console.log(`✔ ${e.email}${essai ? " (mode test, non délivré)" : ""}`);
}
console.log(
  `${envoyes} ${essai ? "accepté(s) en mode test" : "envoyé(s)"}, ${ignores} déjà servi(s).`,
);

// Pistes pour aider un étudiant bloqué : ce qu'il lui reste à trouver, et à qui le demander.
// Fonctions pures, sans accès à la base : elles croisent les données du jeu (faits,
// carte des recommandations, avec leurs conditions secrètes) et la progression de l'étudiant.
//
// Deux sortes de pistes :
//   - « fait »  : un personnage déjà joignable a encore un fait à livrer ;
//   - « acces » : un personnage verrouillé peut être débloqué par un collègue déjà joignable.
// Chaque piste porte deux suggestions de message, « légère » (à qui écrire) et « appuyée »
// (sur quel sujet), que le formateur relit et adapte avant tout envoi.
import type { AreteAdmin, FaitAdmin, PersonnageAdmin } from "./donnees";

export type Piste = {
  cle: string;
  type: "fait" | "acces";
  personnage: PersonnageAdmin; // à qui écrire
  cible: string; // fait visé, ou personnage à débloquer
  condition: string; // critère exact de l'évaluateur (secret)
  mailsEnvoyes: number; // mails déjà écrits à ce personnage
  refus: number; // refus reçus du personnage à débloquer (pistes « acces »)
  legere: string;
  appuyee: string;
};

// « L'étudiant pose une question… » → « posez une question… »
const VERBES: [RegExp, string][] = [
  [/^pose /, "posez "],
  [/^parle /, "parlez "],
  [/^demande /, "demandez "],
  [/^évoque /, "évoquez "],
  [/^questionne /, "questionnez "],
  [/^veut /, "cherchez à "],
  [/^a fourni /, "fournissez "],
];

function versVous(condition: string): string | null {
  const m = condition.match(/^L['’]étudiant\s+([\s\S]*)$/);
  if (!m) return null;
  let suite = m[1].trim();
  for (const [verbe, imperatif] of VERBES) {
    if (verbe.test(suite)) {
      suite = suite.replace(verbe, imperatif);
      return suite.replace(/\.\s*$/, "");
    }
  }
  return null;
}

const nomComplet = (p: PersonnageAdmin) => `${p.prenom} ${p.nom}`;

export function calculerPistes({
  personnages,
  faits,
  aretes,
  faitsTrouves,
  acces,
  mailsParPersonnage,
  refusParPersonnage,
}: {
  personnages: PersonnageAdmin[];
  faits: FaitAdmin[];
  aretes: AreteAdmin[];
  faitsTrouves: Set<string>;
  acces: Set<string>; // personnages joignables
  mailsParPersonnage: Map<string, number>;
  refusParPersonnage: Map<string, number>;
}): Piste[] {
  const parId = new Map(personnages.map((p) => [p.id, p]));
  const pistes: Piste[] = [];

  // Faits restant chez les personnages joignables
  for (const f of faits) {
    const p = parId.get(f.personnage_id);
    if (!p || faitsTrouves.has(f.id) || !acces.has(p.id)) continue;
    const dejaEcrit = (mailsParPersonnage.get(p.id) ?? 0) > 0;
    pistes.push({
      cle: `fait:${f.id}`,
      type: "fait",
      personnage: p,
      cible: f.id,
      condition: f.condition,
      mailsEnvoyes: mailsParPersonnage.get(p.id) ?? 0,
      refus: 0,
      legere: dejaEcrit
        ? `${nomComplet(p)} (${p.role}) a encore des choses à vous apprendre. Relisez ses réponses : sur quel point de son quotidien pourriez-vous lui demander des précisions ?`
        : `Vous n'avez pas encore écrit à ${nomComplet(p)} (${p.role}), qui accepte pourtant de vous répondre. C'est sans doute le moment de le faire.`,
      appuyee: `Avec ${nomComplet(p)}, intéressez-vous au fonctionnement concret de son travail. Une question précise, propre à MonCoinBureau Pro, vous fera avancer plus qu'une question générale.`,
    });
  }

  // Personnages verrouillés que l'étudiant peut débloquer
  for (const a of aretes) {
    const de = parId.get(a.de_personnage);
    const vers = parId.get(a.vers_personnage);
    if (!de || !vers || acces.has(vers.id) || !acces.has(de.id)) continue;
    const consigne = versVous(a.condition);
    pistes.push({
      cle: `acces:${a.de_personnage}:${a.vers_personnage}`,
      type: "acces",
      personnage: de,
      cible: vers.id,
      condition: a.condition,
      mailsEnvoyes: mailsParPersonnage.get(de.id) ?? 0,
      refus: refusParPersonnage.get(vers.id) ?? 0,
      legere: `Pour être mis en relation avec ${nomComplet(vers)} (${vers.role}), ${nomComplet(de)} est sans doute la bonne personne à qui écrire.`,
      appuyee: consigne
        ? `Pour obtenir une recommandation vers ${nomComplet(vers)}, écrivez à ${nomComplet(de)} et ${consigne}.`
        : `Pour obtenir une recommandation vers ${nomComplet(vers)}, écrivez à ${nomComplet(de)} sur un sujet qui concerne directement le travail de ${vers.prenom}.`,
    });
  }

  // Les personnages qui ont déjà refusé l'étudiant d'abord : il bute dessus
  return pistes.sort(
    (x, y) =>
      y.refus - x.refus ||
      (x.type === y.type ? 0 : x.type === "acces" ? -1 : 1),
  );
}

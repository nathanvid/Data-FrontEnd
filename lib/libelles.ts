// Tous les textes affichés aux étudiants, en vocabulaire métier et au vouvoiement.
// Un seul fichier pour pouvoir relire et corriger le ton d'un coup.
import type {
  EtatPersonnage,
  Issue,
  Personnage,
  StatutEnvoi,
} from "./types-tableau";

export const ETATS: Record<EtatPersonnage, { libelle: string; aide: string }> =
  {
    verrouille: {
      libelle: "Verrouillé",
      aide: "Ce personnage ne vous répondra qu'après une recommandation d'un collègue.",
    },
    accessible: {
      libelle: "Accessible",
      aide: "Vous pouvez lui écrire : il vous répondra.",
    },
    contacte: {
      libelle: "Contacté",
      aide: "Votre mail est en route ou en cours de traitement.",
    },
    a_repondu: {
      libelle: "A répondu",
      aide: "Vous avez reçu au moins une réponse de ce personnage.",
    },
    fini: {
      libelle: "Fini",
      aide: "Vous avez découvert tout ce que ce personnage pouvait vous apprendre.",
    },
  };

// Libellé de la pastille : après une réponse, le nombre de faits débloqués
// plutôt que « A répondu » (sans le total, qui renseignerait sur ce qu'il reste).
export function libelleEtat(p: Personnage): string {
  if (p.etat !== "a_repondu") return ETATS[p.etat].libelle;
  if (p.faits_decouverts === 0) return "Aucun fait débloqué";
  return p.faits_decouverts === 1
    ? "1 fait débloqué"
    : `${p.faits_decouverts} faits débloqués`;
}

export const STATUTS: Record<StatutEnvoi, string> = {
  en_attente: "Reçu, en file d'attente",
  en_traitement: "En cours de traitement",
  programme: "Réponse programmée",
  envoye: "Réponse envoyée",
  sans_reponse: "Pas de réponse prévue",
};

// Explications pédagogiques des issues
export const ISSUES: Record<Issue, { titre: string; explication: string }> = {
  reponse: {
    titre: "Le personnage vous a répondu",
    explication:
      "Votre mail a été lu et le personnage vous a écrit une réponse.",
  },
  refus_sans_reco: {
    titre: "Refus : pas de recommandation",
    explication:
      "Ce personnage ne répond qu'aux personnes recommandées par un collègue. " +
      "Il vous a renvoyé vers son responsable. Obtenez d'abord une recommandation.",
  },
  en_copie: {
    titre: "En copie : pas de réponse",
    explication:
      "Un personnage en copie lit le mail mais ne répond pas. " +
      "Écrivez-lui directement si vous voulez sa réponse.",
  },
  limite_depassee: {
    titre: "Trop de mails en peu de temps",
    explication:
      "Vous avez écrit plusieurs fois au même personnage en moins d'une heure. " +
      "Comme un vrai collègue débordé, il ne répond plus pour l'instant. Réessayez plus tard.",
  },
  destinataire_inconnu: {
    titre: "Adresse inconnue",
    explication:
      "Cette adresse ne correspond à aucun salarié de MonCoinBureau Pro. " +
      "Vérifiez l'orthographe dans l'organigramme.",
  },
  ignore_auto: {
    titre: "Message automatique ignoré",
    explication:
      "Ce message ressemblait à une réponse automatique (absence, accusé de réception) : " +
      "il n'a pas été transmis au personnage.",
  },
};

// Documents que le personnage avait sous les yeux pour vous répondre
export const NIVEAUX_DOCUMENT: Record<"facade" | "metier", string> = {
  facade: "Document public",
  metier: "Document interne",
};

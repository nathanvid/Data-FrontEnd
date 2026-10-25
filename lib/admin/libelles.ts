// Libellés de l'administration (vocabulaire formateur, plus technique que celui des étudiants)

export const ISSUES_ADMIN: Record<string, { libelle: string; couleur: string }> = {
  reponse: { libelle: "Réponse", couleur: "bg-emerald-50 text-emerald-800" },
  refus_sans_reco: { libelle: "Refus sans reco", couleur: "bg-amber-50 text-amber-800" },
  limite_depassee: { libelle: "Limite dépassée", couleur: "bg-orange-50 text-orange-800" },
  en_copie: { libelle: "En copie", couleur: "bg-slate-100 text-slate-600" },
  destinataire_inconnu: { libelle: "Destinataire inconnu", couleur: "bg-rose-50 text-rose-700" },
  expediteur_inconnu: { libelle: "Expéditeur inconnu", couleur: "bg-rose-50 text-rose-700" },
  ignore_auto: { libelle: "Message auto ignoré", couleur: "bg-slate-100 text-slate-600" },
};

export const STATUTS_ENVOI: Record<string, { libelle: string; couleur: string }> = {
  a_revoir: { libelle: "À revoir", couleur: "bg-rose-50 text-rose-700" },
  erreur: { libelle: "Erreur d'envoi", couleur: "bg-rose-50 text-rose-700" },
  en_attente: { libelle: "Programmée", couleur: "bg-indigo-50 text-indigo-700" },
  en_cours: { libelle: "Envoi en cours", couleur: "bg-indigo-50 text-indigo-700" },
  envoye: { libelle: "Envoyée", couleur: "bg-emerald-50 text-emerald-800" },
  annule: { libelle: "Annulée", couleur: "bg-slate-100 text-slate-600" },
};

export const STATUTS_ENTRANT: Record<string, string> = {
  a_traiter: "En file",
  en_cours: "En traitement",
  erreur: "En erreur",
  traite: "Traité",
};

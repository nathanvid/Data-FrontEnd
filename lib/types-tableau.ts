// Forme du JSON renvoyé par la fonction SQL tableau_de_bord(jeton).
// Écrite à la main : `supabase gen types` ne voit qu'un `Json` opaque pour une fonction jsonb.
// Toute modification de la fonction SQL doit être reportée ici.

export type EtatPersonnage =
  "verrouille" | "accessible" | "contacte" | "a_repondu" | "fini";

export type Issue =
  | "reponse"
  | "refus_sans_reco"
  | "ignore_auto"
  | "destinataire_inconnu"
  | "en_copie"
  | "limite_depassee";

// Progression d'un mail vers UN destinataire
export type StatutEnvoi =
  | "en_attente" // reçu, pas encore pris en charge par WF2
  | "en_traitement" // pris en charge (ou en vérification par le formateur)
  | "programme" // réponse prête, envoi prévu à etapes.send_at
  | "envoye" // réponse arrivée dans la boîte de l'étudiant
  | "sans_reponse"; // traité, aucune réponse prévue (en copie, limite…)

export type Personnage = {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  email: string;
  porte_entree: boolean;
  etat: EtatPersonnage;
  refus_recus: number;
  faits_decouverts: number;
};

export type Recommandation = { de: string; vers: string; obtenue_at: string };

export type FaitDecouvert = {
  fait_id: string;
  personnage_id: string;
  texte: string;
  decouvert_at: string;
};

export type Destinataire = {
  personnage_id: string | null;
  adresse: string;
  en_copie: boolean;
  statut: StatutEnvoi;
  etapes: {
    recu_at: string;
    pris_at: string | null;
    traite_at: string | null;
    send_at: string | null;
    envoye_at: string | null;
  };
  // Tout ce qui suit vaut null tant que le mail n'est pas arrivé
  issue: Issue | null;
  acces_via: { porte_entree: boolean; recommande_par: string[] } | null;
  documents: { nom: string; niveau: "facade" | "metier" }[] | null;
  metriques: {
    tokens_in: number | null;
    tokens_out: number | null;
    cout_usd: number | null;
    latence_ms: number | null;
  } | null;
  reponse: string | null;
  recos_obtenues: string[] | null;
  faits_decouverts: string[] | null;
};

export type Mail = {
  recu_at: string;
  sujet: string | null;
  extrait: string | null;
  destinataires: Destinataire[];
};

export type TableauDeBord = {
  etudiant: { prenom: string; classe: string };
  genere_at: string;
  compteurs: {
    faits_decouverts: number;
    faits_total: number;
    personnages_atteints: number;
    recos_obtenues: number;
  };
  personnages: Personnage[];
  recommandations: Recommandation[];
  carnet: FaitDecouvert[];
  mails: Mail[];
};

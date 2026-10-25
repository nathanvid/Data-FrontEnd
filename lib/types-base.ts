// Types de la base, issus de `supabase gen types typescript` (12/10/2026), puis allégés :
// vues, relations et fonctions propres à n8n retirées (le site n'en a pas besoin).
// Pour une version complète à jour : npm run types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      carte_acces: {
        Row: {
          condition: string;
          de_personnage: string;
          vers_personnage: string;
        };
        Insert: {
          condition: string;
          de_personnage: string;
          vers_personnage: string;
        };
        Update: {
          condition?: string;
          de_personnage?: string;
          vers_personnage?: string;
        };
        Relationships: [];
      };
      deblocages: {
        Row: {
          debloque_at: string;
          echange_id: number | null;
          etudiant_id: string;
          fait_id: string;
        };
        Insert: {
          debloque_at?: string;
          echange_id?: number | null;
          etudiant_id: string;
          fait_id: string;
        };
        Update: {
          debloque_at?: string;
          echange_id?: number | null;
          etudiant_id?: string;
          fait_id?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          contenu: string;
          maj_at: string;
          niveau: string;
          nom: string;
        };
        Insert: {
          contenu?: string;
          maj_at?: string;
          niveau: string;
          nom: string;
        };
        Update: {
          contenu?: string;
          maj_at?: string;
          niveau?: string;
          nom?: string;
        };
        Relationships: [];
      };
      echanges: {
        Row: {
          cout_usd: number | null;
          documents_injectes: string[] | null;
          envoye_at: string | null;
          etudiant_id: string | null;
          evaluation: Json | null;
          faits_debloques: string[];
          generique: boolean | null;
          id: number;
          issue: string;
          latence_ms: number | null;
          message_entrant_id: number;
          modele: string | null;
          personnage_id: string | null;
          recos_accordees: string[];
          recu_at: string;
          sujet: string | null;
          texte_etudiant: string | null;
          texte_reponse: string | null;
          tokens_in: number | null;
          tokens_out: number | null;
          traite_at: string;
        };
        Insert: {
          cout_usd?: number | null;
          documents_injectes?: string[] | null;
          envoye_at?: string | null;
          etudiant_id?: string | null;
          evaluation?: Json | null;
          faits_debloques?: string[];
          generique?: boolean | null;
          id?: never;
          issue: string;
          latence_ms?: number | null;
          message_entrant_id: number;
          modele?: string | null;
          personnage_id?: string | null;
          recos_accordees?: string[];
          recu_at: string;
          sujet?: string | null;
          texte_etudiant?: string | null;
          texte_reponse?: string | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          traite_at?: string;
        };
        Update: {
          cout_usd?: number | null;
          documents_injectes?: string[] | null;
          envoye_at?: string | null;
          etudiant_id?: string | null;
          evaluation?: Json | null;
          faits_debloques?: string[];
          generique?: boolean | null;
          id?: never;
          issue?: string;
          latence_ms?: number | null;
          message_entrant_id?: number;
          modele?: string | null;
          personnage_id?: string | null;
          recos_accordees?: string[];
          recu_at?: string;
          sujet?: string | null;
          texte_etudiant?: string | null;
          texte_reponse?: string | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          traite_at?: string;
        };
        Relationships: [];
      };
      envois_liens: {
        Row: {
          email: string;
          envoye_at: string;
          etudiant_id: string;
          id: number;
          mailgun_id: string | null;
        };
        Insert: {
          email: string;
          envoye_at?: string;
          etudiant_id: string;
          id?: never;
          mailgun_id?: string | null;
        };
        Update: {
          email?: string;
          envoye_at?: string;
          etudiant_id?: string;
          id?: never;
          mailgun_id?: string | null;
        };
        Relationships: [];
      };
      etudiants: {
        Row: {
          actif: boolean;
          classe: string;
          cree_at: string;
          email: string;
          est_test: boolean;
          groupe: string | null;
          id: string;
          jeton: string;
          nom: string;
          prenom: string;
        };
        Insert: {
          actif?: boolean;
          classe: string;
          cree_at?: string;
          email: string;
          est_test?: boolean;
          groupe?: string | null;
          id?: string;
          jeton?: string;
          nom: string;
          prenom: string;
        };
        Update: {
          actif?: boolean;
          classe?: string;
          cree_at?: string;
          email?: string;
          est_test?: boolean;
          groupe?: string | null;
          id?: string;
          jeton?: string;
          nom?: string;
          prenom?: string;
        };
        Relationships: [];
      };
      faits: {
        Row: {
          condition: string;
          id: string;
          ordre: number;
          personnage_id: string;
          texte: string;
        };
        Insert: {
          condition: string;
          id: string;
          ordre?: number;
          personnage_id: string;
          texte: string;
        };
        Update: {
          condition?: string;
          id?: string;
          ordre?: number;
          personnage_id?: string;
          texte?: string;
        };
        Relationships: [];
      };
      messages_entrants: {
        Row: {
          derniere_erreur: string | null;
          destinataire: string;
          en_copie: boolean;
          en_tetes: Json | null;
          expediteur: string;
          expediteur_nom: string | null;
          id: number;
          in_reply_to: string | null;
          message_id: string;
          pris_at: string | null;
          recu_at: string;
          refs: string | null;
          statut: string;
          sujet: string | null;
          tentatives: number;
          texte: string | null;
          texte_complet: string | null;
        };
        Insert: {
          derniere_erreur?: string | null;
          destinataire: string;
          en_copie?: boolean;
          en_tetes?: Json | null;
          expediteur: string;
          expediteur_nom?: string | null;
          id?: never;
          in_reply_to?: string | null;
          message_id: string;
          pris_at?: string | null;
          recu_at?: string;
          refs?: string | null;
          statut?: string;
          sujet?: string | null;
          tentatives?: number;
          texte?: string | null;
          texte_complet?: string | null;
        };
        Update: {
          derniere_erreur?: string | null;
          destinataire?: string;
          en_copie?: boolean;
          en_tetes?: Json | null;
          expediteur?: string;
          expediteur_nom?: string | null;
          id?: never;
          in_reply_to?: string | null;
          message_id?: string;
          pris_at?: string | null;
          recu_at?: string;
          refs?: string | null;
          statut?: string;
          sujet?: string | null;
          tentatives?: number;
          texte?: string | null;
          texte_complet?: string | null;
        };
        Relationships: [];
      };
      notes_manuelles: {
        Row: {
          ajustement: number | null;
          chatbot_evite: boolean | null;
          commentaire: string | null;
          etudiant_id: string;
        };
        Insert: {
          ajustement?: number | null;
          chatbot_evite?: boolean | null;
          commentaire?: string | null;
          etudiant_id: string;
        };
        Update: {
          ajustement?: number | null;
          chatbot_evite?: boolean | null;
          commentaire?: string | null;
          etudiant_id?: string;
        };
        Relationships: [];
      };
      outbox: {
        Row: {
          derniere_erreur: string | null;
          echange_id: number;
          envoye_at: string | null;
          from_email: string;
          from_nom: string;
          id: number;
          in_reply_to: string | null;
          mailgun_id: string | null;
          pris_at: string | null;
          refs: string | null;
          send_at: string;
          statut: string;
          sujet: string;
          tentatives: number;
          texte: string;
          to_email: string;
        };
        Insert: {
          derniere_erreur?: string | null;
          echange_id: number;
          envoye_at?: string | null;
          from_email: string;
          from_nom: string;
          id?: never;
          in_reply_to?: string | null;
          mailgun_id?: string | null;
          pris_at?: string | null;
          refs?: string | null;
          send_at: string;
          statut?: string;
          sujet: string;
          tentatives?: number;
          texte: string;
          to_email: string;
        };
        Update: {
          derniere_erreur?: string | null;
          echange_id?: number;
          envoye_at?: string | null;
          from_email?: string;
          from_nom?: string;
          id?: never;
          in_reply_to?: string | null;
          mailgun_id?: string | null;
          pris_at?: string | null;
          refs?: string | null;
          send_at?: string;
          statut?: string;
          sujet?: string;
          tentatives?: number;
          texte?: string;
          to_email?: string;
        };
        Relationships: [];
      };
      parametres: {
        Row: {
          afficher_feedback: boolean;
          delai_inter_max_min: number;
          delai_inter_min_min: number;
          delai_seance_max_s: number;
          delai_seance_min_s: number;
          id: number;
          maj_at: string;
          max_mails_global_heure: number;
          max_reponses_fil_heure: number;
          mode: string;
          pause: boolean;
          plage_debut: string;
          plage_fin: string;
          revelation: boolean;
        };
        Insert: {
          afficher_feedback?: boolean;
          delai_inter_max_min?: number;
          delai_inter_min_min?: number;
          delai_seance_max_s?: number;
          delai_seance_min_s?: number;
          id?: number;
          maj_at?: string;
          max_mails_global_heure?: number;
          max_reponses_fil_heure?: number;
          mode?: string;
          pause?: boolean;
          plage_debut?: string;
          plage_fin?: string;
          revelation?: boolean;
        };
        Update: {
          afficher_feedback?: boolean;
          delai_inter_max_min?: number;
          delai_inter_min_min?: number;
          delai_seance_max_s?: number;
          delai_seance_min_s?: number;
          id?: number;
          maj_at?: string;
          max_mails_global_heure?: number;
          max_reponses_fil_heure?: number;
          mode?: string;
          pause?: boolean;
          plage_debut?: string;
          plage_fin?: string;
          revelation?: boolean;
        };
        Relationships: [];
      };
      personnages: {
        Row: {
          actif: boolean;
          documents: string[];
          email: string;
          fiche: string;
          id: string;
          nom: string;
          porte_entree: boolean;
          prenom: string;
          reponses_refus: string[];
          responsable_id: string | null;
          role: string;
          signature: string;
        };
        Insert: {
          actif?: boolean;
          documents?: string[];
          email: string;
          fiche?: string;
          id: string;
          nom: string;
          porte_entree?: boolean;
          prenom: string;
          reponses_refus?: string[];
          responsable_id?: string | null;
          role: string;
          signature: string;
        };
        Update: {
          actif?: boolean;
          documents?: string[];
          email?: string;
          fiche?: string;
          id?: string;
          nom?: string;
          porte_entree?: boolean;
          prenom?: string;
          reponses_refus?: string[];
          responsable_id?: string | null;
          role?: string;
          signature?: string;
        };
        Relationships: [];
      };
      recommandations: {
        Row: {
          accordee_at: string;
          de_personnage: string;
          echange_id: number | null;
          etudiant_id: string;
          id: number;
          vers_personnage: string;
        };
        Insert: {
          accordee_at?: string;
          de_personnage: string;
          echange_id?: number | null;
          etudiant_id: string;
          id?: never;
          vers_personnage: string;
        };
        Update: {
          accordee_at?: string;
          de_personnage?: string;
          echange_id?: number | null;
          etudiant_id?: string;
          id?: never;
          vers_personnage?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      // Seule vue lue par le site (administration) : la note de l'enquête
      v_note_enquete: {
        Row: {
          classe: string | null;
          groupe: string | null;
          nom: string | null;
          prenom: string | null;
          email: string | null;
          mails: number | null;
          faits: number | null;
          enveloppe: boolean | null;
          atteints: number | null;
          generiques: number | null;
          refus: number | null;
          chatbot_evite: boolean | null;
          ajustement: number | null;
          note_sur_10: number | null;
          note_sur_20: number | null;
          commentaire: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calcul_send_at: { Args: never; Returns: string };
      contexte_echange: {
        Args: { p_etudiant: string; p_personnage: string };
        Returns: Json;
      };
      enregistrer_resultat: {
        Args: {
          p_cout_usd?: number;
          p_documents?: string[];
          p_etudiant?: string;
          p_evaluation?: Json;
          p_faits?: string[];
          p_generique?: boolean;
          p_issue: string;
          p_latence_ms?: number;
          p_message_id: number;
          p_modele?: string;
          p_personnage?: string;
          p_recos?: string[];
          p_texte_reponse?: string;
          p_tokens_in?: number;
          p_tokens_out?: number;
        };
        Returns: number;
      };
      marquer_envoye: {
        Args: { p_mailgun_id: string; p_outbox_id: number };
        Returns: undefined;
      };
      tableau_de_bord: { Args: { p_jeton: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

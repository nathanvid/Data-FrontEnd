"use server";
// Toutes les écritures de l'administration. Chaque action est joignable par une simple
// requête POST : elle vérifie donc elle-même la session (exigerAdmin) et valide ses entrées.
//
// Chaque mise à jour porte une condition sur le statut actuel (« seulement si encore
// a_revoir », etc.) : si n8n a pris la ligne entre-temps, l'action ne fait rien et le dit,
// au lieu d'écraser un envoi en cours.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { supabaseServeur } from "@/lib/supabase-serveur";
import {
  COOKIE_ADMIN,
  DUREE_SESSION_S,
  creerValeurSession,
  exigerAdmin,
  motDePasseCorrect,
} from "@/lib/admin/session";
import { envoyerMail } from "@/lib/admin/mailgun";
import {
  OBJET_LIEN,
  TAG_LIEN,
  adresseSite,
  corpsLien,
} from "@/lib/admin/liens";

export type EtatAction = { ok?: string; erreur?: string } | null;

function entier(formData: FormData, nom: string): number {
  const n = Number(formData.get(nom));
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`${nom} invalide`);
  return n;
}

function texte(formData: FormData, nom: string): string {
  const v = formData.get(nom);
  return typeof v === "string" ? v : "";
}

// ---------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------
export async function connexion(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  if (!motDePasseCorrect(texte(formData, "mot_de_passe"))) {
    // Ralentit les essais en série
    await new Promise((r) => setTimeout(r, 1000));
    return { erreur: "Mot de passe incorrect." };
  }
  (await cookies()).set(COOKIE_ADMIN, creerValeurSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: DUREE_SESSION_S,
  });
  redirect("/admin");
}

export async function deconnexion(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_ADMIN, path: "/admin" });
  redirect("/admin/connexion");
}

// ---------------------------------------------------------------------
// Interrupteurs du simulateur (table parametres, ligne unique)
// ---------------------------------------------------------------------
export async function changerPause(formData: FormData): Promise<void> {
  await exigerAdmin();
  const pause = texte(formData, "pause") === "true";
  const { error } = await supabaseServeur()
    .from("parametres")
    .update({ pause, maj_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error("Mise à jour impossible : pause");
  refresh();
}

export async function changerMode(formData: FormData): Promise<void> {
  await exigerAdmin();
  const mode = texte(formData, "mode");
  if (mode !== "seance" && mode !== "intersession")
    throw new Error("mode invalide");
  const { error } = await supabaseServeur()
    .from("parametres")
    .update({ mode, maj_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error("Mise à jour impossible : mode");
  refresh();
}

// ---------------------------------------------------------------------
// Réponses à revoir (outbox a_revoir / erreur) et réponses programmées
// ---------------------------------------------------------------------
export async function traiterReponse(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  await exigerAdmin();
  const id = entier(formData, "outbox_id");
  const intention = texte(formData, "intention");
  const nouveauTexte = texte(formData, "texte").trim();
  const maintenant = new Date().toISOString();
  const s = supabaseServeur();

  let requete;
  let message: string;
  if (intention === "envoyer") {
    if (!nouveauTexte) return { erreur: "La réponse est vide." };
    // Remise en file : le workflow d'envoi la prend à son prochain passage
    requete = s
      .from("outbox")
      .update({
        texte: nouveauTexte,
        statut: "en_attente",
        send_at: maintenant,
        tentatives: 0,
        derniere_erreur: null,
      })
      .eq("id", id)
      .in("statut", ["a_revoir", "erreur", "en_attente"]);
    message =
      "Validée : la réponse part au prochain passage du workflow d'envoi.";
  } else if (intention === "enregistrer") {
    if (!nouveauTexte) return { erreur: "La réponse est vide." };
    requete = s
      .from("outbox")
      .update({ texte: nouveauTexte })
      .eq("id", id)
      .in("statut", ["a_revoir", "erreur", "en_attente"]);
    message = "Texte enregistré.";
  } else if (intention === "annuler") {
    requete = s
      .from("outbox")
      .update({ statut: "annule" })
      .eq("id", id)
      .in("statut", ["a_revoir", "erreur", "en_attente"]);
    message = "Envoi annulé : l'étudiant ne recevra pas cette réponse.";
  } else {
    return { erreur: "Action inconnue." };
  }

  const { data, error } = await requete.select("id");
  if (error) {
    console.error("traiterReponse :", error.message);
    return { erreur: "La base a refusé la mise à jour." };
  }
  if (!data || data.length === 0)
    return {
      erreur:
        "Rien n'a changé : cette réponse est déjà partie ou en cours d'envoi.",
    };
  refresh();
  return { ok: message };
}

// Avance l'heure d'envoi d'une réponse programmée
export async function envoyerMaintenant(formData: FormData): Promise<void> {
  await exigerAdmin();
  const id = entier(formData, "outbox_id");
  const { error } = await supabaseServeur()
    .from("outbox")
    .update({ send_at: new Date().toISOString() })
    .eq("id", id)
    .eq("statut", "en_attente");
  if (error) throw new Error("Mise à jour impossible : outbox");
  refresh();
}

// ---------------------------------------------------------------------
// Mails entrants en erreur : remise en file pour le workflow de traitement
// ---------------------------------------------------------------------
export async function relancerMessage(formData: FormData): Promise<void> {
  await exigerAdmin();
  const id = entier(formData, "message_id");
  const { error } = await supabaseServeur()
    .from("messages_entrants")
    .update({
      statut: "a_traiter",
      tentatives: 0,
      derniere_erreur: null,
      pris_at: null,
    })
    .eq("id", id)
    .eq("statut", "erreur");
  if (error) throw new Error("Mise à jour impossible : messages_entrants");
  refresh();
}

// ---------------------------------------------------------------------
// Indice envoyé par mail à un étudiant
// ---------------------------------------------------------------------
export async function envoyerIndice(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  await exigerAdmin();
  const etudiantId = texte(formData, "etudiant_id");
  const sujet = texte(formData, "sujet").trim();
  const corps = texte(formData, "texte").trim();
  if (!sujet || !corps)
    return { erreur: "Objet et message sont obligatoires." };

  const { data: etudiant } = await supabaseServeur()
    .from("etudiants")
    .select("prenom, nom, email")
    .eq("id", etudiantId)
    .maybeSingle();
  if (!etudiant) return { erreur: "Étudiant introuvable." };

  try {
    await envoyerMail({
      a: `${etudiant.prenom} ${etudiant.nom} <${etudiant.email}>`,
      sujet,
      texte: corps,
    });
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Envoi impossible." };
  }
  return { ok: `Indice envoyé à ${etudiant.email}.` };
}

// ---------------------------------------------------------------------
// Liens personnels du tableau de bord
// ---------------------------------------------------------------------
// cible = "manquants" : tous les étudiants actifs de la classe qui n'ont encore rien reçu.
// cible = <id étudiant> : un seul, avec renvoi = "oui" s'il l'a déjà reçu.
// La liste est recalculée ici à partir de envois_liens, jamais reprise du formulaire :
// une page restée ouverte ou un double clic ne renvoient pas le lien une seconde fois.
export async function envoyerLiens(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  await exigerAdmin();
  const classe = texte(formData, "classe");
  const cible = texte(formData, "cible");
  const renvoi = texte(formData, "renvoi") === "oui";
  const essai = texte(formData, "essai") === "oui";
  const s = supabaseServeur();

  let requete = s
    .from("etudiants")
    .select("id, prenom, nom, email, jeton")
    .eq("actif", true)
    .eq("classe", classe)
    .order("nom");
  if (cible !== "manquants") requete = requete.eq("id", cible);
  const { data: etudiants, error } = await requete;
  if (error) return { erreur: "Lecture des étudiants impossible." };

  const { data: envois, error: erreurEnvois } = await s
    .from("envois_liens")
    .select("etudiant_id")
    .in(
      "etudiant_id",
      etudiants.map((e) => e.id),
    );
  if (erreurEnvois)
    return {
      erreur:
        "Journal des envois introuvable : appliquez d'abord simulateur/migration_envois_liens.sql.",
    };
  const servis = new Set(envois.map((e) => e.etudiant_id));
  const aEnvoyer = etudiants.filter((e) => renvoi || !servis.has(e.id));
  if (aEnvoyer.length === 0)
    return { ok: "Rien à envoyer : tout le monde a déjà reçu son lien." };

  const site = await adresseSite();
  let envoyes = 0;
  for (const e of aEnvoyer) {
    let mailgunId: string;
    try {
      mailgunId = await envoyerMail({
        a: `${e.prenom} ${e.nom} <${e.email}>`,
        sujet: OBJET_LIEN,
        texte: corpsLien({ prenom: e.prenom, jeton: e.jeton, site }),
        tag: TAG_LIEN,
        essai,
      });
    } catch (err) {
      // On s'arrête au premier refus : inutile d'insister avec une clé ou un domaine invalide
      refresh();
      return {
        erreur: `${envoyes} envoyé(s), puis échec pour ${e.email} : ${err instanceof Error ? err.message : "envoi impossible"}.`,
      };
    }
    if (!essai) {
      const { error: erreurJournal } = await s
        .from("envois_liens")
        .insert({ etudiant_id: e.id, email: e.email, mailgun_id: mailgunId });
      if (erreurJournal) {
        // Le mail est parti mais n'est pas noté : on s'arrête plutôt que de risquer un doublon
        console.error("envois_liens :", erreurJournal.message);
        refresh();
        return {
          erreur: `Lien envoyé à ${e.email} mais non noté dans le journal : envoi interrompu après ${envoyes + 1} mail(s).`,
        };
      }
    }
    envoyes++;
  }
  refresh();
  return {
    ok: essai
      ? `${envoyes} mail(s) acceptés par Mailgun en mode test (aucun délivré).`
      : `${envoyes} lien(s) envoyé(s).`,
  };
}

// Envoi des liens personnels du tableau de bord depuis l'administration (/admin/liens).
// Même message que scripts/preparer-liens.mjs : modifier les deux ensemble.
//
// Les envois sont notés dans la table envois_liens (simulateur/migration_envois_liens.sql) :
// c'est elle qui empêche un second mail involontaire, pas l'affichage de la page.
import "server-only";

import { headers } from "next/headers";
import { supabaseServeur } from "../supabase-serveur";
import { exigerAdmin } from "./session";

export const OBJET_LIEN = "MonCoinBureau Pro : votre tableau de bord personnel";
export const TAG_LIEN = "liens-tableau-de-bord";

export function corpsLien({
  prenom,
  jeton,
  site,
}: {
  prenom: string;
  jeton: string;
  site: string;
}): string {
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

// Adresse publique du site, qui figure dans les liens. SITE_URL si défini, sinon l'adresse
// par laquelle le formateur consulte l'administration (affichée avant tout envoi).
export async function adresseSite(): Promise<string> {
  const configuree = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configuree) return configuree;
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole =
    h.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

export type EtudiantLien = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  envois: { envoye_at: string; email: string }[];
};

// null : la table envois_liens n'existe pas encore (migration non appliquée)
export async function lireEnvoisLiens(
  classe: string,
): Promise<EtudiantLien[] | null> {
  await exigerAdmin();
  const s = supabaseServeur();
  const [etudiants, envois] = await Promise.all([
    s
      .from("etudiants")
      .select("id, prenom, nom, email")
      .eq("actif", true)
      .eq("classe", classe)
      .order("nom"),
    s
      .from("envois_liens")
      .select("etudiant_id, email, envoye_at")
      .order("envoye_at", { ascending: false }),
  ]);
  if (etudiants.error) {
    console.error("admin, liens :", etudiants.error.message);
    throw new Error("Lecture impossible : étudiants");
  }
  if (envois.error) {
    console.error("admin, envois_liens :", envois.error.message);
    return null;
  }
  return etudiants.data.map((e) => ({
    ...e,
    envois: envois.data.filter((v) => v.etudiant_id === e.id),
  }));
}

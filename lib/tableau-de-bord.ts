// Seul point d'accès aux données du site.
// Lit le jeton dans le cookie, appelle la fonction SQL tableau_de_bord(), renvoie le JSON
// déjà filtré par Postgres. Aucun filtrage ici : la règle anti-divulgâchage vit en SQL.
import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServeur } from "./supabase-serveur";
import { NOM_COOKIE, estUnJeton } from "./jeton";
import type { TableauDeBord } from "./types-tableau";

// cache() de React : si la mise en page et la page demandent les données pendant
// la même requête, la base n'est interrogée qu'une fois. Rien n'est gardé entre deux requêtes.
export const lireTableauDeBord = cache(
  async (): Promise<TableauDeBord | null> => {
    const jeton = (await cookies()).get(NOM_COOKIE)?.value;
    if (!estUnJeton(jeton)) return null;

    const { data, error } = await supabaseServeur().rpc("tableau_de_bord", {
      p_jeton: jeton,
    });
    if (error) {
      // Détail dans les journaux du serveur, jamais dans la page
      console.error("tableau_de_bord :", error.message);
      throw new Error("Lecture du tableau de bord impossible");
    }

    // null = jeton inconnu ou étudiant inactif
    return data as TableauDeBord | null;
  },
);

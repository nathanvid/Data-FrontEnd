// Client Supabase côté SERVEUR uniquement, avec la clé service.
//
// `import "server-only"` est un garde-fou de compilation : si un composant client
// (fichier marqué "use client") importe ce fichier, même indirectement, `next build`
// échoue. La clé service ne peut donc pas se retrouver dans le code envoyé au navigateur.
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types-base";

let client: SupabaseClient<Database> | undefined;

export function supabaseServeur(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    throw new Error(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant (voir .env.example)",
    );
  }

  client = createClient<Database>(url, cle, {
    // Pas de session utilisateur Supabase : le serveur parle à la base en son nom propre
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

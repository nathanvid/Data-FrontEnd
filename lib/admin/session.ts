// Accès à l'administration : un mot de passe unique (ADMIN_MOT_DE_PASSE), puis un cookie
// de session signé, valable 12 h.
//
// Le cookie contient « <expiration>.<signature> ». La signature est un HMAC de l'expiration,
// avec une clé tirée du mot de passe : sans le mot de passe, impossible de fabriquer un
// cookie valide, et changer le mot de passe déconnecte toutes les sessions.
//
// exigerAdmin() est appelé au début de CHAQUE lecture de données et de CHAQUE action :
// une action serveur est joignable par une simple requête POST, sans passer par la page.
import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_ADMIN = "mcb_admin";
export const DUREE_SESSION_S = 60 * 60 * 12;
const LONGUEUR_MIN = 12;

function motDePasse(): string | null {
  const mdp = process.env.ADMIN_MOT_DE_PASSE;
  return mdp && mdp.length >= LONGUEUR_MIN ? mdp : null;
}

// L'administration est fermée tant que le mot de passe n'est pas configuré
export function adminConfiguree(): boolean {
  return motDePasse() !== null;
}

// Comparaison à temps constant : les deux empreintes ont toujours la même longueur
export function motDePasseCorrect(saisi: string): boolean {
  const mdp = motDePasse();
  if (!mdp) return false;
  const a = createHash("sha256").update(saisi).digest();
  const b = createHash("sha256").update(mdp).digest();
  return timingSafeEqual(a, b);
}

function signer(expiration: string, mdp: string): string {
  return createHmac("sha256", `mcb-admin:${mdp}`)
    .update(expiration)
    .digest("base64url");
}

export function creerValeurSession(): string {
  const mdp = motDePasse();
  if (!mdp) throw new Error("ADMIN_MOT_DE_PASSE manquant ou trop court");
  const expiration = String(Math.floor(Date.now() / 1000) + DUREE_SESSION_S);
  return `${expiration}.${signer(expiration, mdp)}`;
}

function sessionValide(valeur: string | undefined): boolean {
  const mdp = motDePasse();
  if (!mdp || !valeur) return false;
  const [expiration, signature] = valeur.split(".");
  if (!expiration || !signature || !/^\d+$/.test(expiration)) return false;
  if (Number(expiration) < Date.now() / 1000) return false;
  const attendue = Buffer.from(signer(expiration, mdp));
  const recue = Buffer.from(signature);
  return attendue.length === recue.length && timingSafeEqual(attendue, recue);
}

export async function estAdmin(): Promise<boolean> {
  // La validité dépend de l'heure : jamais calculée au prérendu, toujours à la requête
  await connection();
  return sessionValide((await cookies()).get(COOKIE_ADMIN)?.value);
}

// À appeler avant toute lecture ou écriture : renvoie vers la connexion sinon
export async function exigerAdmin(): Promise<void> {
  if (!(await estAdmin())) redirect("/admin/connexion");
}

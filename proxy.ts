// Proxy (anciennement « middleware ») : s'exécute sur le serveur avant chaque page.
//
// Rôle : transformer le lien personnel /?t=<jeton> en cookie, puis rediriger
// vers la même adresse SANS le jeton (il ne reste ni dans l'historique, ni dans
// la barre d'adresse, ni dans une capture d'écran projetée).
//
// Le proxy ne vérifie que le FORMAT du jeton. La vraie vérification se fait à chaque
// affichage par la fonction SQL tableau_de_bord(), qui renvoie null si le jeton est
// inconnu ou l'étudiant inactif : un cookie inventé ne donne donc accès à rien.
import { NextResponse, type NextRequest } from "next/server";
import { DUREE_COOKIE_S, NOM_COOKIE, estUnJeton } from "./lib/jeton";

export function proxy(request: NextRequest) {
  const jeton = request.nextUrl.searchParams.get("t");
  const racine = request.nextUrl.pathname === "/";
  if (jeton === null && !racine) return NextResponse.next();

  // Adresse de destination : sans le jeton, et la racine mène à l'écran A
  const cible = request.nextUrl.clone();
  cible.searchParams.delete("t");
  if (racine) cible.pathname = "/enquete";
  const reponse = NextResponse.redirect(cible);
  if (jeton === null) return reponse;

  if (estUnJeton(jeton)) {
    reponse.cookies.set(NOM_COOKIE, jeton, {
      httpOnly: true, // illisible par le JavaScript de la page
      secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
      sameSite: "lax",
      path: "/",
      maxAge: DUREE_COOKIE_S,
    });
  } else {
    // Lien abîmé : on oublie aussi un éventuel ancien cookie
    reponse.cookies.delete(NOM_COOKIE);
  }
  return reponse;
}

export const config = {
  // Toutes les pages, sauf les fichiers techniques de Next.js et les images
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

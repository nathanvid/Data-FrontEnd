// Administration : réservée au formateur (mot de passe, voir lib/admin/session.ts).
// La navigation est dans (protege)/layout.tsx, pour ne pas l'afficher sur la page de connexion.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration · MonCoinBureau Pro",
};

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return children;
}

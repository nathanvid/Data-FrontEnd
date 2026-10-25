// Mise en page racine, commune au site étudiant et à l'administration : seulement
// <html>, <body> et la police. Chaque partie ajoute son propre en-tête :
// app/(etudiant)/layout.tsx et app/admin/layout.tsx.
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MonCoinBureau Pro",
  robots: { index: false, follow: false }, // pages personnelles : pas d'indexation
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

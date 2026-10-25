// Mise en page commune : en-tête et onglets. Composant SERVEUR, statique :
// il ne lit pas le cookie, donc Next.js peut le préparer à l'avance (« coquille statique »).
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Onglets } from "@/components/Onglets";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mon enquête · MonCoinBureau Pro",
  description:
    "Suivi de votre enquête auprès des salariés de MonCoinBureau Pro",
  robots: { index: false, follow: false }, // pages personnelles : pas d'indexation
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              MonCoinBureau Pro
            </p>
            <h1 className="mb-2 text-xl font-bold">
              Tableau de bord de votre enquête
            </h1>
            <Onglets />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

// En-tête de l'administration. Statique : la vérification de session se fait dans chaque
// page, derrière <Suspense> (lire un cookie dans une mise en page bloquerait toute la page).
import { Suspense } from "react";
import { Onglets, OngletsStatiques } from "@/components/Onglets";
import { deconnexion } from "../actions";

const ONGLETS = [
  { href: "/admin", libelle: "Vue d'ensemble", exact: true },
  { href: "/admin/mails", libelle: "Mails" },
  { href: "/admin/progression", libelle: "Progression" },
];

export default function LayoutProtege({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                MonCoinBureau Pro · formateur
              </p>
              <h1 className="mb-2 text-xl font-bold">Administration</h1>
            </div>
            <form action={deconnexion}>
              <button className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                Se déconnecter
              </button>
            </form>
          </div>
          <div className="[&_a]:text-slate-300 [&_a:hover]:text-white [&_a[aria-current]]:border-indigo-400 [&_a[aria-current]]:text-white">
            <Suspense fallback={<OngletsStatiques onglets={ONGLETS} />}>
              <Onglets onglets={ONGLETS} />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}

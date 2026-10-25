"use client";
// Composant CLIENT : animation pas à pas du parcours d'un mail dans les 3 workflows.
// Il ne reçoit aucune donnée de la base : tout le contenu est écrit ici, en dur, et ne
// révèle aucune condition secrète. Seul l'état « étape affichée » vit dans le navigateur.
import { useEffect, useState } from "react";

type Nature = "vous" | "regle" | "ia" | "attente" | "auto";

type Etape = {
  court: string; // libellé sous la case
  titre: string;
  explication: string;
  nature: Nature;
  trace?: string; // ce qui est écrit dans la base
  statut?: string; // libellé correspondant dans « Mes échanges »
};

const ETAPES: Etape[] = [
  {
    court: "Vous",
    titre: "Vous envoyez un mail",
    explication:
      "À l'adresse @pro.moncoinbureau.fr d'un personnage. Plus aucun humain n'intervient ensuite.",
    nature: "vous",
  },
  {
    court: "Réception",
    titre: "Le mail est rangé",
    explication:
      "Le workflow 1 note expéditeur, destinataires, objet et texte. Il ne juge rien.",
    nature: "auto",
    trace: "mail reçu, en attente",
    statut: "Reçu",
  },
  {
    court: "Règles",
    titre: "Vérifications sans IA",
    explication:
      "Êtes-vous inscrit ? Le personnage est-il joignable ? Le rythme est-il raisonnable ? Si une règle bloque, tout s'arrête ici.",
    nature: "regle",
    trace: "mail pris en charge",
    statut: "Pris en charge",
  },
  {
    court: "Dossier",
    titre: "Le contexte est rassemblé",
    explication:
      "Rôle du personnage, documents qu'il a sous les yeux, historique de vos échanges : l'IA reçoit ce contexte, et rien d'autre.",
    nature: "auto",
  },
  {
    court: "Évaluateur",
    titre: "IA 1 : l'évaluateur juge",
    explication:
      "Il lit votre mail et décide ce que le personnage peut vous apprendre, et s'il vous recommande. Il ne rédige rien.",
    nature: "ia",
  },
  {
    court: "Personnage",
    titre: "IA 2 : le personnage rédige",
    explication:
      "Il écrit la réponse dans son style, à partir de la seule décision de l'évaluateur.",
    nature: "ia",
    trace: "réponse + heure d'envoi",
    statut: "Traité",
  },
  {
    court: "Attente",
    titre: "La réponse patiente",
    explication:
      "2 à 5 minutes en séance, plusieurs heures entre deux séances.",
    nature: "attente",
    statut: "Envoi programmé",
  },
  {
    court: "Envoi",
    titre: "La réponse part",
    explication:
      "Le workflow 3 l'envoie depuis l'adresse du personnage, dans le fil de votre mail.",
    nature: "auto",
    trace: "heure d'envoi",
    statut: "Réponse envoyée",
  },
];

// Bandeau au-dessus du rail : nombre d'étapes couvertes par chaque acteur
const GROUPES = [
  { libelle: "Vous", etapes: 1, trait: "bg-slate-900" },
  { libelle: "WF 1", etapes: 1, trait: "bg-sky-500" },
  { libelle: "WF 2 · Traitement", etapes: 4, trait: "bg-violet-500" },
  { libelle: "WF 3 · Envoi", etapes: 2, trait: "bg-emerald-500" },
];

const NATURES: Record<Nature, { libelle: string; classe: string }> = {
  vous: { libelle: "Vous", classe: "border-slate-300 text-slate-700" },
  regle: { libelle: "Règle", classe: "border-amber-400 text-amber-800" },
  ia: { libelle: "IA", classe: "border-fuchsia-400 text-fuchsia-800" },
  attente: { libelle: "Attente", classe: "border-slate-300 text-slate-500" },
  auto: { libelle: "Automatique", classe: "border-slate-300 text-slate-600" },
};

const DUREE_ETAPE_MS = 3200;

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

export function ParcoursMail() {
  const [index, setIndex] = useState(0);
  const [lecture, setLecture] = useState(false);
  const derniere = ETAPES.length - 1;

  // Lecture automatique : avance d'une étape à intervalle régulier, s'arrête à la fin
  useEffect(() => {
    if (!lecture || index >= derniere) return;
    const minuterie = setTimeout(() => {
      setIndex(index + 1);
      if (index + 1 >= derniere) setLecture(false);
    }, DUREE_ETAPE_MS);
    return () => clearTimeout(minuterie);
  }, [lecture, index, derniere]);

  const etape = ETAPES[index];

  function aller(i: number) {
    setLecture(false);
    setIndex(i);
  }

  function lancer() {
    // Arrivé au bout, « Rejouer » repart du début
    if (index >= derniere) {
      setIndex(0);
      setLecture(true);
    } else {
      setLecture((l) => !l);
    }
  }

  return (
    <div className="border border-slate-300 bg-white">
      {/* Rail : bandeau des acteurs, puis une case par étape */}
      <div className="border-b border-slate-200 px-3 pt-3 pb-4 sm:px-5">
        <div className="grid grid-cols-8 gap-1">
          {GROUPES.map((g) => (
            <div key={g.libelle} style={{ gridColumn: `span ${g.etapes}` }}>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {g.libelle}
              </p>
              <div className={`mt-1 h-0.5 ${g.trait}`} />
            </div>
          ))}
        </div>
        <ol className="mt-3 grid grid-cols-8 gap-1">
          {ETAPES.map((e, i) => {
            const fait = i < index;
            const actif = i === index;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => aller(i)}
                  aria-label={`Étape ${i + 1} : ${e.titre}`}
                  aria-current={actif ? "step" : undefined}
                  className={
                    "flex h-9 w-full items-center justify-center rounded-sm border font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 motion-reduce:transition-none " +
                    (actif
                      ? "border-slate-900 bg-slate-900 text-white"
                      : fait
                        ? "border-slate-300 bg-slate-100 text-slate-700"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-400")
                  }
                >
                  {actif ? <Enveloppe /> : deuxChiffres(i + 1)}
                </button>
                <span
                  className={
                    "mt-1 hidden truncate text-center text-[11px] sm:block " +
                    (actif ? "font-medium text-slate-900" : "text-slate-500")
                  }
                >
                  {e.court}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Détail de l'étape affichée */}
      <div
        className="grid gap-4 px-3 py-4 sm:px-5 md:grid-cols-[1fr_13rem]"
        aria-live="polite"
      >
        <div
          key={index}
          className="animate-[apparition_.3s_ease-out] motion-reduce:animate-none"
        >
          <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
            {deuxChiffres(index + 1)}/{deuxChiffres(ETAPES.length)}
            <span
              className={`rounded-sm border px-1.5 uppercase tracking-wider ${NATURES[etape.nature].classe}`}
            >
              {NATURES[etape.nature].libelle}
            </span>
          </p>
          <h4 className="mt-1.5 text-base font-semibold text-slate-900">
            {etape.titre}
          </h4>
          <p className="mt-1 leading-relaxed text-slate-600">
            {etape.explication}
          </p>
        </div>
        <dl className="space-y-2 border-t border-slate-200 pt-3 font-mono text-xs md:border-t-0 md:border-l md:pt-0 md:pl-4">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-400">
              Écrit dans la base
            </dt>
            <dd className={etape.trace ? "text-slate-800" : "text-slate-300"}>
              {etape.trace ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-400">
              Mes échanges
            </dt>
            <dd className={etape.statut ? "text-slate-800" : "text-slate-300"}>
              {etape.statut ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Commandes */}
      <div className="flex items-center gap-1 border-t border-slate-200 bg-slate-50 px-3 py-2 sm:px-5">
        <button
          type="button"
          onClick={lancer}
          className="whitespace-nowrap rounded-sm bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
        >
          {lecture ? "Pause" : index >= derniere ? "Rejouer" : "Lecture"}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => aller(Math.max(0, index - 1))}
          disabled={index === 0}
          aria-label="Étape précédente"
          className="rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-slate-500 disabled:opacity-40"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => aller(Math.min(derniere, index + 1))}
          disabled={index === derniere}
          aria-label="Étape suivante"
          className="rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-slate-500 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}

// Le mail en cours : il passe d'une case à l'autre
function Enveloppe() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

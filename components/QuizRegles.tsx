"use client";
// Composant CLIENT : petit « vrai ou faux » pour vérifier qu'on a compris les règles du
// jeu. Les questions ne portent que sur des règles publiques (déjà décrites sur la page),
// jamais sur les conditions secrètes. Rien n'est enregistré : l'état reste local.
import { useState } from "react";

type Question = { affirmation: string; vrai: boolean; explication: string };

const QUESTIONS: Question[] = [
  {
    affirmation: "Mettre un personnage en copie suffit pour qu'il me réponde.",
    vrai: false,
    explication: "En copie, il lit mais ne répond pas.",
  },
  {
    affirmation: "Je peux écrire à n'importe quel personnage dès le début.",
    vrai: false,
    explication:
      "Seules les deux portes d'entrée répondent à tous. Les autres attendent une recommandation.",
  },
  {
    affirmation: "Cinq relances en dix minutes accélèrent la réponse.",
    vrai: false,
    explication: "C'est l'inverse : le personnage cesse de répondre un moment.",
  },
  {
    affirmation: "Qui écrit, à qui, à quel rythme : c'est vérifié sans IA.",
    vrai: true,
    explication:
      "Ces règles passent avant l'IA : rapides, gratuites, prévisibles.",
  },
];

export function QuizRegles() {
  const [reponses, setReponses] = useState<(boolean | null)[]>(
    QUESTIONS.map(() => null),
  );
  const repondues = reponses.filter((r) => r !== null).length;
  const justes = reponses.filter((r, i) => r === QUESTIONS[i].vrai).length;

  return (
    <div>
      <ol className="border-t border-slate-900">
        {QUESTIONS.map((q, i) => {
          const r = reponses[i];
          const correct = r === q.vrai;
          return (
            <li
              key={i}
              className="grid gap-x-4 gap-y-2 border-b border-slate-200 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <p className="text-slate-800">
                <span className="mr-2 font-mono text-xs text-slate-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q.affirmation}
              </p>
              <div className="flex gap-1">
                {[true, false].map((choix) => {
                  const choisi = r === choix;
                  return (
                    <button
                      key={String(choix)}
                      type="button"
                      disabled={r !== null}
                      aria-pressed={choisi}
                      onClick={() =>
                        setReponses((rs) =>
                          rs.map((x, j) => (j === i ? choix : x)),
                        )
                      }
                      className={
                        "w-16 rounded-sm border px-2 py-1 text-xs font-medium " +
                        (r === null
                          ? "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
                          : choix === q.vrai
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : choisi
                              ? "border-rose-300 bg-rose-50 text-rose-700 line-through"
                              : "border-slate-200 text-slate-300")
                      }
                    >
                      {choix ? "Vrai" : "Faux"}
                    </button>
                  );
                })}
              </div>
              {r !== null && (
                <p
                  className="text-xs text-slate-600 sm:col-span-2 sm:pl-7"
                  aria-live="polite"
                >
                  <span
                    className={
                      "font-semibold " +
                      (correct ? "text-emerald-700" : "text-rose-700")
                    }
                  >
                    {correct ? "Juste." : "Raté."}
                  </span>{" "}
                  {q.explication}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between py-2 font-mono text-xs text-slate-500">
        <span>
          {repondues === QUESTIONS.length
            ? `Score : ${justes}/${QUESTIONS.length}`
            : `${repondues}/${QUESTIONS.length} répondues`}
        </span>
        {repondues > 0 && (
          <button
            type="button"
            onClick={() => setReponses(QUESTIONS.map(() => null))}
            className="underline underline-offset-4 hover:text-slate-900"
          >
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}

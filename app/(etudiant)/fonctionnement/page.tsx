// Écran C : Comment ça marche.
//
// Page statique : elle ne lit ni le cookie ni la base, Next.js la prépare donc au build.
// Les deux îlots interactifs (parcours animé, vrai ou faux) sont des composants client
// sans aucune donnée : leur contenu est écrit en dur. La page décrit les 3 workflows en
// vocabulaire métier, sans rien dire des conditions secrètes (quels faits, quelles
// recommandations). Les compteurs de la classe en direct viendront en phase 2.
//
// Parti pris visuel : une page de documentation plutôt qu'une page vitrine. Traits fins,
// coins à peine arrondis, tableaux et listes à lignes plutôt que grilles de cartes.
import { ParcoursMail } from "@/components/ParcoursMail";
import { QuizRegles } from "@/components/QuizRegles";

const SOMMAIRE = [
  { id: "parcours", libelle: "Parcours d'un mail" },
  { id: "relais", libelle: "Le relais" },
  { id: "regles-ia", libelle: "Règles ou IA" },
  { id: "regles", libelle: "Règles du jeu" },
  { id: "quiz", libelle: "Vrai ou faux" },
  { id: "tableau", libelle: "Ce que vous voyez" },
  { id: "votre-workflow", libelle: "Votre workflow" },
];

type Regle = { titre: string; resume: string; detail?: string };

const REGLES: Regle[] = [
  {
    titre: "Portes d'entrée",
    resume: "Deux personnages répondent à tout le monde.",
    detail:
      "Les autres ne répondent qu'aux personnes qu'un collègue leur a recommandées.",
  },
  {
    titre: "Recommandations",
    resume: "Un personnage peut vous présenter à un collègue.",
    detail:
      "Il le fait si votre demande le justifie. Le collègue devient alors joignable.",
  },
  {
    titre: "Faits",
    resume: "Chaque personnage détient des informations utiles.",
    detail:
      "Il ne les partage que si votre mail le convainc. Ce qui le convainc reste secret : c'est le cœur de l'enquête.",
  },
  {
    titre: "Copie",
    resume: "Un personnage en copie lit, mais ne répond pas.",
    detail: "Écrivez-lui directement si vous attendez sa réponse.",
  },
  {
    titre: "Rythme",
    resume: "Trop de mails en moins d'une heure : il se tait un moment.",
    detail: "Comme un collègue débordé, il reprendra plus tard.",
  },
];

const WORKFLOWS = [
  {
    numero: 1,
    titre: "Réception",
    declencheur: "Un mail arrive",
    prend: "—",
    depose: "Le mail reçu, en attente",
    pastille: "bg-sky-500",
  },
  {
    numero: 2,
    titre: "Traitement",
    declencheur: "À intervalle régulier",
    prend: "Les mails en attente",
    depose: "La réponse, avec une heure d'envoi",
    pastille: "bg-violet-500",
  },
  {
    numero: 3,
    titre: "Envoi",
    declencheur: "À intervalle régulier",
    prend: "Les réponses dont l'heure est venue",
    depose: "L'heure d'envoi",
    pastille: "bg-emerald-500",
  },
];

type Concept = { titre: string; simulateur: string; vous: string };

const CONCEPTS: Concept[] = [
  {
    titre: "Déclencheur",
    simulateur: "Un mail reçu lance WF 1 ; une horloge lance WF 2 et WF 3.",
    vous: "Quel événement ou quel horaire démarre votre automatisation ?",
  },
  {
    titre: "File d'attente",
    simulateur: "Le travail attend dans la base : une panne ne perd rien.",
    vous: "Où le travail en cours est-il stocké entre deux étapes ?",
  },
  {
    titre: "Règles avant l'IA",
    simulateur: "Inscription, joignabilité, rythme : vérifiés sans IA.",
    vous: "Quelles décisions tiennent en un simple « si… alors » ?",
  },
  {
    titre: "Une IA par rôle",
    simulateur: "L'évaluateur juge, le personnage rédige.",
    vous: "Pouvez-vous découper la tâche de l'IA en rôles testables ?",
  },
  {
    titre: "Traçabilité",
    simulateur: "Chaque étape est horodatée, d'où « Mes échanges ».",
    vous: "Comment saurez-vous où en est chaque élément, et pourquoi il a échoué ?",
  },
];

export default function PageFonctionnement() {
  return (
    <div className="space-y-12 pb-8 text-sm">
      {/* En-tête : titre, chapô et chiffres clés en ligne */}
      <header className="grid gap-6 border-b border-slate-900 pb-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Entre votre mail et la réponse
          </h2>
          <p className="max-w-xl leading-relaxed text-slate-600">
            Personne ne lit vos mails à la main : trois workflows automatisés
            s&apos;enchaînent. Les comprendre vous aide à mieux enquêter, et à
            concevoir votre propre workflow.
          </p>
        </div>
        <dl className="flex divide-x divide-slate-200 border border-slate-200">
          <Chiffre valeur="3" libelle="workflows" />
          <Chiffre valeur="2" libelle="modèles d'IA" />
          <Chiffre valeur="0" libelle="humain" />
        </dl>
      </header>

      <div className="grid gap-12 lg:grid-cols-[11rem_1fr]">
        {/* Sommaire collant à gauche sur grand écran, en ligne sur mobile */}
        <nav
          aria-label="Sommaire de la page"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            Sommaire
          </p>
          <ol className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
            {SOMMAIRE.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  <span className="mr-1.5 font-mono text-xs text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.libelle}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-14">
          <Section
            id="parcours"
            numero={1}
            titre="Le parcours d'un mail"
            chapo="Lancez la lecture ou cliquez sur une étape du rail."
          >
            <ParcoursMail />
          </Section>

          <Section
            id="relais"
            numero={2}
            titre="Un relais, pas une chaîne"
            chapo="Les workflows ne se parlent jamais. Chacun prend son travail dans la base et y dépose son résultat."
          >
            <Tableau
              entetes={[
                "Workflow",
                "Démarre quand",
                "Prend dans la base",
                "Dépose dans la base",
              ]}
            >
              {WORKFLOWS.map((w) => (
                <tr
                  key={w.numero}
                  className="border-t border-slate-200 align-top"
                >
                  <th
                    scope="row"
                    className="py-2.5 pr-4 text-left font-medium text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className={`h-2 w-2 ${w.pastille}`} aria-hidden />
                      <span className="font-mono text-xs text-slate-400">
                        WF {w.numero}
                      </span>
                      {w.titre}
                    </span>
                  </th>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {w.declencheur}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{w.prend}</td>
                  <td className="py-2.5 text-slate-600">{w.depose}</td>
                </tr>
              ))}
            </Tableau>
            <Repli resume="Pourquoi passer par la base ?">
              Comme les bons de commande d&apos;une cuisine : le serveur les
              accroche, le cuisinier les prend quand il est libre. Si une étape
              tombe en panne, rien ne se perd et le travail reprend où il
              s&apos;était arrêté.
            </Repli>
          </Section>

          <Section
            id="regles-ia"
            numero={3}
            titre="Règles d'abord, IA ensuite"
            chapo="Le traitement filtre avec des règles simples. L'IA n'intervient que pour comprendre le texte."
          >
            <Entonnoir />
            <Tableau entetes={["", "Règle", "IA"]}>
              <LigneComparaison
                critere="Exemple"
                regle="« L'expéditeur est-il inscrit ? »"
                ia="« Ce mail est-il convaincant ? »"
              />
              <LigneComparaison
                critere="Vitesse"
                regle="Instantanée"
                ia="Quelques secondes"
              />
              <LigneComparaison
                critere="Coût"
                regle="Gratuite"
                ia="Payante, au volume de texte"
              />
              <LigneComparaison
                critere="Résultat"
                regle="Toujours le même"
                ia="Nuancé, mais peut varier"
              />
            </Tableau>
          </Section>

          <Section
            id="regles"
            numero={4}
            titre="Les règles du jeu"
            chapo="Dépliez une règle pour le détail."
          >
            <ul className="border-t border-slate-200">
              {REGLES.map((r) => (
                <li key={r.titre} className="border-b border-slate-200">
                  <Repli
                    sansCadre
                    resume={
                      <span className="grid gap-x-4 sm:grid-cols-[9rem_1fr]">
                        <span className="font-medium text-slate-900">
                          {r.titre}
                        </span>
                        <span className="text-slate-600">{r.resume}</span>
                      </span>
                    }
                  >
                    <span className="sm:ml-[10rem]">{r.detail}</span>
                  </Repli>
                </li>
              ))}
              <li className="grid gap-x-4 gap-y-2 border-b border-slate-200 py-3 pl-5 sm:grid-cols-[9rem_1fr]">
                <span className="font-medium text-slate-900">Délai</span>
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Une réponse prête attend avant de partir, comme dans une
                    vraie entreprise.
                  </p>
                  <Frise
                    libelle="En séance"
                    duree="2 à 5 min"
                    largeur="w-[8%]"
                  />
                  <Frise
                    libelle="Entre deux séances"
                    duree="plusieurs heures"
                    largeur="w-full"
                  />
                </div>
              </li>
            </ul>
          </Section>

          <Section
            id="quiz"
            numero={5}
            titre="Vrai ou faux"
            chapo="Quatre affirmations pour vérifier les règles avant votre prochain mail."
          >
            <QuizRegles />
          </Section>

          <Section
            id="tableau"
            numero={6}
            titre="Ce que ce tableau de bord vous montre"
          >
            <div className="grid border border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
              <ListeVisibilite
                titre="Visible"
                marque="+"
                classe="text-emerald-700"
                items={[
                  "Les étapes de chaque mail et leur heure, dans « Mes échanges ».",
                  "Le contenu d'un échange, une fois la réponse dans votre boîte.",
                  "Les coulisses : documents consultés, jetons, coût en dollars, temps de calcul.",
                ]}
              />
              <ListeVisibilite
                titre="Jamais envoyé à votre navigateur"
                marque="–"
                classe="text-rose-700"
                items={[
                  "Les conditions qui décident des réponses.",
                  "Les fiches des personnages.",
                  "Les informations que vous n'avez pas encore obtenues.",
                ]}
              />
            </div>
            <p className="text-xs text-slate-500">
              Avant l&apos;envoi de la réponse, seule l&apos;heure prévue
              s&apos;affiche. Les échanges les plus anciens n&apos;ont pas été
              mesurés.
            </p>
          </Section>

          <Section
            id="votre-workflow"
            numero={7}
            titre="Pour concevoir votre workflow"
            chapo="Cinq principes du simulateur, et la question à vous poser pour chacun."
          >
            <ol className="border-t border-slate-900">
              {CONCEPTS.map((c, i) => (
                <li
                  key={c.titre}
                  className="grid gap-x-6 gap-y-1 border-b border-slate-200 py-3 sm:grid-cols-[10rem_1fr_1fr]"
                >
                  <p className="font-medium text-slate-900">
                    <span className="mr-2 font-mono text-xs text-slate-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c.titre}
                  </p>
                  <p className="text-slate-500">{c.simulateur}</p>
                  <p className="border-l-2 border-indigo-500 pl-3 font-medium text-slate-900">
                    {c.vous}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  numero,
  titre,
  chapo,
  children,
}: {
  id: string;
  numero: number;
  titre: string;
  chapo?: string;
  children: React.ReactNode;
}) {
  const idTitre = `titre-${id}`;
  return (
    <section
      id={id}
      aria-labelledby={idTitre}
      className="scroll-mt-6 space-y-4"
    >
      <div className="space-y-1">
        <h3
          id={idTitre}
          className="flex items-baseline gap-3 text-base font-semibold text-slate-900"
        >
          <span className="font-mono text-xs font-normal text-slate-400">
            {String(numero).padStart(2, "0")}
          </span>
          {titre}
        </h3>
        {chapo && <p className="max-w-2xl text-slate-500">{chapo}</p>}
      </div>
      {children}
    </section>
  );
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="px-4 py-2">
      <dt className="sr-only">{libelle}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-semibold text-slate-900">
          {valeur}
        </span>
        <span className="text-xs text-slate-500">{libelle}</span>
      </dd>
    </div>
  );
}

// Tableau à traits fins ; défile horizontalement sur petit écran plutôt que de casser
function Tableau({
  entetes,
  children,
}: {
  entetes: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[34rem] border-b border-slate-200">
        <thead>
          <tr className="border-t border-slate-900">
            {entetes.map((e, i) => (
              <th
                key={i}
                scope="col"
                className="py-2 pr-4 text-left font-mono text-[11px] font-normal uppercase tracking-wider text-slate-400"
              >
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function LigneComparaison({
  critere,
  regle,
  ia,
}: {
  critere: string;
  regle: string;
  ia: string;
}) {
  return (
    <tr className="border-t border-slate-200">
      <th
        scope="row"
        className="w-24 py-2 pr-4 text-left font-medium text-slate-900"
      >
        {critere}
      </th>
      <td className="py-2 pr-4 text-slate-600">{regle}</td>
      <td className="py-2 text-slate-600">{ia}</td>
    </tr>
  );
}

// Bloc dépliable natif (<details>) : pas de JavaScript, accessible au clavier
function Repli({
  resume,
  children,
  sansCadre = false,
}: {
  resume: React.ReactNode;
  children: React.ReactNode;
  sansCadre?: boolean;
}) {
  return (
    <details
      className={
        "group " +
        (sansCadre ? "" : "rounded-sm border border-slate-200 bg-slate-50 px-3")
      }
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
        <span
          className="mt-px font-mono text-xs text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden
        >
          ▸
        </span>
        <span className="flex-1">{resume}</span>
      </summary>
      <div className="pb-3 pl-5 leading-relaxed text-slate-600">{children}</div>
    </details>
  );
}

// Entonnoir du traitement : chaque filtre est un peu plus étroit que le précédent
function Entonnoir() {
  const niveaux = [
    { texte: "Expéditeur inscrit ?", ia: false },
    { texte: "Personnage joignable ?", ia: false },
    { texte: "Rythme raisonnable ?", ia: false },
    { texte: "Évaluateur : que vous apprendre ?", ia: true },
    { texte: "Personnage : rédaction", ia: true },
  ];
  return (
    <figure className="space-y-2">
      <ol className="space-y-1">
        {niveaux.map((n, i) => (
          <li
            key={i}
            style={{ marginLeft: `${i * 6}%`, marginRight: `${i * 6}%` }}
            className={
              "flex items-center justify-between gap-3 border-l-2 px-3 py-1.5 " +
              (n.ia
                ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-950"
                : "border-amber-500 bg-amber-50 text-amber-950")
            }
          >
            <span>{n.texte}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider opacity-60">
              {n.ia ? "IA" : "Règle"}
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="text-xs text-slate-500">
        Une règle non respectée arrête tout : l&apos;IA n&apos;est même pas
        appelée.
      </figcaption>
    </figure>
  );
}

function Frise({
  libelle,
  duree,
  largeur,
}: {
  libelle: string;
  duree: string;
  largeur: string;
}) {
  return (
    <div className="max-w-md">
      <p className="flex justify-between text-xs text-slate-500">
        <span>{libelle}</span>
        <span className="font-mono text-slate-900">{duree}</span>
      </p>
      <div className="mt-1 h-1.5 bg-slate-100">
        <div className={`h-1.5 bg-slate-900 ${largeur}`} />
      </div>
    </div>
  );
}

function ListeVisibilite({
  titre,
  marque,
  classe,
  items,
}: {
  titre: string;
  marque: string;
  classe: string;
  items: string[];
}) {
  return (
    <div className="p-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
        {titre}
      </p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-slate-700">
            <span className={`font-mono font-semibold ${classe}`} aria-hidden>
              {marque}
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

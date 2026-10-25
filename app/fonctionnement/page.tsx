// Écran C : Comment ça marche.
//
// Page entièrement statique : elle ne lit ni le cookie ni la base, Next.js la prépare
// donc au build. Elle décrit les 3 workflows du simulateur en vocabulaire métier,
// sans rien dire des conditions secrètes (quels faits, quelles recommandations).
// Les compteurs de la classe en direct viendront en phase 2.

type Workflow = {
  numero: number;
  titre: string;
  declencheur: string;
  etapes: string[];
  depot: string;
  repere: string; // libellé correspondant dans « Mes échanges »
};

const WORKFLOWS: Workflow[] = [
  {
    numero: 1,
    titre: "Réception",
    declencheur: "Un mail arrive sur une adresse @pro.moncoinbureau.fr.",
    etapes: [
      "Le service de messagerie transmet le mail au workflow.",
      "Le workflow note l'expéditeur, les destinataires, l'objet et le texte.",
    ],
    depot: "Le mail est rangé dans le registre des mails reçus, en attente.",
    repere: "Reçu",
  },
  {
    numero: 2,
    titre: "Traitement",
    declencheur:
      "Régulièrement, le workflow vient chercher les mails en attente.",
    etapes: [
      "Il vérifie que l'expéditeur est bien un étudiant inscrit.",
      "Il identifie le personnage et vérifie que vous pouvez le joindre : porte d'entrée ou recommandation.",
      "Il rassemble le dossier du personnage : son rôle, ses documents, votre historique avec lui.",
      "Un premier modèle d'IA, l'évaluateur, lit votre mail et décide ce que le personnage peut vous apprendre.",
      "Un second modèle d'IA, le personnage, rédige la réponse dans son style.",
    ],
    depot:
      "Le résultat est enregistré, et la réponse attend dans la boîte d'envoi avec une heure d'envoi.",
    repere: "Pris en charge, puis Traité",
  },
  {
    numero: 3,
    titre: "Envoi",
    declencheur:
      "Régulièrement, le workflow regarde les réponses dont l'heure est venue.",
    etapes: [
      "Il envoie la réponse depuis l'adresse du personnage, dans le fil de votre mail.",
      "Il note l'heure d'envoi.",
    ],
    depot: "La réponse est marquée comme envoyée.",
    repere: "Envoi programmé, puis Réponse envoyée",
  },
];

export default function PageFonctionnement() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Ce qui se passe entre votre mail et la réponse
        </h2>
        <p className="text-sm text-slate-600">
          Personne ne lit vos mails à la main. Trois workflows automatisés
          s&apos;enchaînent, chacun avec une seule mission. Ils ne se parlent
          pas directement : chacun dépose son travail dans la base de données,
          où le suivant vient le chercher.
        </p>
      </div>

      <section className="space-y-3" aria-labelledby="titre-schema">
        <h3 id="titre-schema" className="font-semibold">
          Le parcours d&apos;un mail
        </h3>
        <Schema />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Ce qui décide de la réponse</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Regle titre="Les portes d'entrée">
            Deux personnages répondent à tout le monde. Les autres ne répondent
            qu&apos;aux personnes qu&apos;un collègue leur a recommandées.
          </Regle>
          <Regle titre="Les recommandations">
            Un personnage peut vous recommander auprès d&apos;un collègue si
            votre demande le justifie. Le collègue devient alors joignable.
          </Regle>
          <Regle titre="Les faits">
            Chaque personnage détient des informations utiles à votre enquête.
            Il ne les partage que si votre mail le convainc. Ce qui le convainc
            reste secret : c&apos;est le cœur de l&apos;enquête.
          </Regle>
          <Regle titre="Les destinataires en copie">
            Un personnage en copie lit le mail mais ne répond pas. Écrivez-lui
            directement si vous attendez sa réponse.
          </Regle>
          <Regle titre="Le rythme">
            Plusieurs mails au même personnage en moins d&apos;une heure : il
            cesse de répondre pour un moment, comme un collègue débordé.
          </Regle>
          <Regle titre="Le délai de réponse">
            Une réponse prête n&apos;est pas envoyée tout de suite. Elle part 2
            à 5 minutes plus tard pendant les séances, et plusieurs heures plus
            tard entre deux séances, comme dans une vraie entreprise.
          </Regle>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Ce que ce tableau de bord vous montre</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            L&apos;onglet « Mes échanges » reprend les étapes du schéma pour
            chacun de vos mails, avec leur heure.
          </li>
          <li>
            Le contenu d&apos;un échange n&apos;apparaît qu&apos;une fois la
            réponse arrivée dans votre boîte. Avant, vous voyez seulement
            l&apos;heure d&apos;envoi prévue.
          </li>
          <li>
            Les « coulisses techniques » indiquent les documents que le
            personnage avait sous les yeux, le volume de texte lu et écrit par
            l&apos;IA (en jetons), le coût de l&apos;échange en dollars et le
            temps de calcul. Les échanges les plus anciens n&apos;ont pas été
            mesurés.
          </li>
          <li>
            Les conditions, les fiches des personnages et les informations que
            vous n&apos;avez pas encore obtenues ne sont jamais envoyées à votre
            navigateur.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
        <h3 className="font-semibold text-indigo-900">
          À retenir pour concevoir votre propre workflow
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-indigo-950">
          <li>
            <span className="font-medium">Un déclencheur</span> : un événement
            (un mail reçu) ou un horaire régulier lance le workflow.
          </li>
          <li>
            <span className="font-medium">Une file d&apos;attente</span> : le
            travail est déposé dans un registre. Si une étape tombe en panne,
            rien ne se perd et le traitement reprend où il s&apos;était arrêté.
          </li>
          <li>
            <span className="font-medium">Des règles avant l&apos;IA</span> :
            les vérifications simples (qui écrit, à qui, à quel rythme) se font
            sans IA. Elles sont plus rapides, gratuites et prévisibles.
          </li>
          <li>
            <span className="font-medium">Deux IA aux rôles séparés</span> :
            l&apos;une juge, l&apos;autre rédige. Chacune a des consignes
            courtes et vérifiables.
          </li>
          <li>
            <span className="font-medium">Une trace de chaque étape</span> : les
            heures enregistrées permettent de suivre chaque mail, comme dans «
            Mes échanges ».
          </li>
        </ul>
      </section>
    </div>
  );
}

// Schéma du parcours : vous → 3 workflows → vous. En colonne sur mobile, en ligne
// à partir de la largeur « lg ». Fait en HTML plutôt qu'en SVG : le texte se replie
// tout seul et reste lisible par les lecteurs d'écran.
function Schema() {
  return (
    <div className="space-y-2">
      <Extremite>Vous envoyez un mail à un personnage</Extremite>
      <Fleche />
      <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {WORKFLOWS.map((w, i) => (
          <li
            key={w.numero}
            className="flex flex-col gap-2 lg:flex-1 lg:flex-row"
          >
            {i > 0 && <Fleche />}
            <CarteWorkflow w={w} />
          </li>
        ))}
      </ol>
      <Fleche />
      <Extremite>
        La réponse arrive dans votre boîte, dans le fil de votre mail
      </Extremite>
    </div>
  );
}

function CarteWorkflow({ w }: { w: Workflow }) {
  return (
    <div className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        Workflow {w.numero}
      </p>
      <p className="text-base font-semibold">{w.titre}</p>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Démarre quand : </span>
        {w.declencheur}
      </p>
      <ol className="mt-3 flex-1 space-y-1.5 text-sm text-slate-700">
        {w.etapes.map((e, i) => (
          <li key={i} className="flex gap-2">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
              aria-hidden
            >
              {i + 1}
            </span>
            <span>{e}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
        <span className="font-medium">Résultat : </span>
        {w.depot}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Dans « Mes échanges » : {w.repere}
      </p>
    </div>
  );
}

function Extremite({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm font-medium text-indigo-900">
      {children}
    </p>
  );
}

// Flèche vers le bas ; dans la rangée des workflows, elle pointe vers la droite en « lg »
function Fleche() {
  return (
    <span
      className="flex justify-center text-slate-400 lg:items-center [li_&]:lg:-rotate-90"
      aria-hidden
    >
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
        <path
          d="M8 1v16m0 0-6-6m6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Regle({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <dt className="font-medium">{titre}</dt>
      <dd className="mt-1 text-sm text-slate-600">{children}</dd>
    </div>
  );
}

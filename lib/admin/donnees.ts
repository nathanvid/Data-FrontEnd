// Lectures de l'administration. Contrairement au site étudiant, rien n'est masqué ici :
// conditions secrètes, évaluations, réponses pas encore envoyées… Chaque fonction exportée
// commence donc par exigerAdmin().
//
// Pas de fonction SQL dédiée (aucune migration) : des requêtes simples sur les tables avec
// la clé service, puis les jointures en TypeScript. Les volumes restent petits
// (une cinquantaine d'étudiants, quelques milliers d'échanges sur le module).
import "server-only";

import { supabaseServeur } from "../supabase-serveur";
import { exigerAdmin } from "./session";
import type { Database } from "../types-base";

type Tables = Database["public"]["Tables"];
type Ligne<T extends keyof Tables> = Tables[T]["Row"];

export type Parametres = Ligne<"parametres">;
export type PersonnageAdmin = Pick<
  Ligne<"personnages">,
  "id" | "prenom" | "nom" | "role" | "email" | "porte_entree" | "responsable_id"
>;
export type FaitAdmin = Ligne<"faits">;
export type AreteAdmin = Ligne<"carte_acces">;
export type EtudiantAdmin = Pick<
  Ligne<"etudiants">,
  "id" | "prenom" | "nom" | "email" | "classe" | "est_test" | "actif" | "jeton"
>;

// Un échange, avec tout ce qu'il faut pour le comprendre d'un coup d'œil
export type EchangeAdmin = {
  id: number;
  message_entrant_id: number;
  recu_at: string;
  traite_at: string;
  envoye_at: string | null;
  sujet: string | null;
  texte_etudiant: string | null;
  issue: string;
  generique: boolean | null;
  justification: string | null;
  texte_reponse: string | null;
  recos_accordees: string[];
  faits_debloques: string[];
  cout_usd: number | null;
  modele: string | null;
  expediteur: string | null;
  destinataire: string | null;
  en_copie: boolean;
  personnage_id: string | null;
  etudiant: Pick<EtudiantAdmin, "id" | "prenom" | "nom" | "classe"> | null;
  envoi: Pick<
    Ligne<"outbox">,
    "id" | "statut" | "send_at" | "texte" | "derniere_erreur" | "tentatives"
  > | null;
};

const COLONNES_ECHANGE =
  "id, message_entrant_id, etudiant_id, personnage_id, recu_at, traite_at, envoye_at, sujet, " +
  "texte_etudiant, issue, generique, evaluation, texte_reponse, recos_accordees, " +
  "faits_debloques, cout_usd, modele";

type LigneEchange = Pick<
  Ligne<"echanges">,
  | "id"
  | "message_entrant_id"
  | "etudiant_id"
  | "personnage_id"
  | "recu_at"
  | "traite_at"
  | "envoye_at"
  | "sujet"
  | "texte_etudiant"
  | "issue"
  | "generique"
  | "evaluation"
  | "texte_reponse"
  | "recos_accordees"
  | "faits_debloques"
  | "cout_usd"
  | "modele"
>;

type Reponse<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

function verifier<T>(
  { data, error }: { data: T[] | null; error: { message: string } | null },
  quoi: string,
): T[] {
  if (error) {
    console.error(`admin, ${quoi} :`, error.message);
    throw new Error(`Lecture impossible : ${quoi}`);
  }
  return data ?? [];
}

// L'API Supabase renvoie au plus 1 000 lignes par requête : on lit par pages
const TAILLE_PAGE = 1000;
async function toutLire<T>(
  quoi: string,
  page: (de: number, a: number) => Reponse<T>,
): Promise<T[]> {
  const tout: T[] = [];
  for (let de = 0; ; de += TAILLE_PAGE) {
    const lot = verifier(await page(de, de + TAILLE_PAGE - 1), quoi);
    tout.push(...lot);
    if (lot.length < TAILLE_PAGE) return tout;
  }
}

async function compter(
  table: "messages_entrants" | "outbox",
  statut: string,
): Promise<number> {
  const { count, error } = await supabaseServeur()
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("statut", statut);
  if (error) throw new Error(`Comptage impossible : ${table}`);
  return count ?? 0;
}

// Minuit à Paris, quel que soit le fuseau du serveur
function debutJourParis(): string {
  const maintenant = new Date();
  const paris = new Date(
    maintenant.toLocaleString("en-US", { timeZone: "Europe/Paris" }),
  );
  const decalage = paris.getTime() - maintenant.getTime();
  paris.setHours(0, 0, 0, 0);
  return new Date(paris.getTime() - decalage).toISOString();
}

function justification(evaluation: unknown): string | null {
  if (
    evaluation &&
    typeof evaluation === "object" &&
    "justification" in evaluation
  ) {
    const j = (evaluation as { justification: unknown }).justification;
    return typeof j === "string" ? j : null;
  }
  return null;
}

// ---------------------------------------------------------------------
// Données du jeu (personnages, faits, carte des recommandations)
// ---------------------------------------------------------------------
export async function lireJeu() {
  await exigerAdmin();
  const s = supabaseServeur();
  const [personnages, faits, aretes] = await Promise.all([
    s
      .from("personnages")
      .select("id, prenom, nom, role, email, porte_entree, responsable_id")
      .eq("actif", true)
      .order("porte_entree", { ascending: false })
      .order("id"),
    s.from("faits").select("*").order("personnage_id").order("ordre"),
    s.from("carte_acces").select("*"),
  ]);
  return {
    personnages: verifier(personnages, "personnages") as PersonnageAdmin[],
    faits: verifier(faits, "faits"),
    aretes: verifier(aretes, "carte_acces"),
  };
}

// ---------------------------------------------------------------------
// Jointures communes : un échange brut → EchangeAdmin
// ---------------------------------------------------------------------
async function enrichir(lignes: LigneEchange[]): Promise<EchangeAdmin[]> {
  if (lignes.length === 0) return [];
  const s = supabaseServeur();
  const idsMessages = [...new Set(lignes.map((l) => l.message_entrant_id))];
  const idsEchanges = lignes.map((l) => l.id);
  const idsEtudiants = [
    ...new Set(lignes.map((l) => l.etudiant_id).filter((x) => x !== null)),
  ];

  const [messages, envois, etudiants] = await Promise.all([
    s
      .from("messages_entrants")
      .select("id, expediteur, destinataire, en_copie")
      .in("id", idsMessages),
    s
      .from("outbox")
      .select(
        "id, echange_id, statut, send_at, texte, derniere_erreur, tentatives",
      )
      .in("echange_id", idsEchanges),
    idsEtudiants.length > 0
      ? s
          .from("etudiants")
          .select("id, prenom, nom, classe")
          .in("id", idsEtudiants)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const parMessage = new Map(
    verifier(messages, "messages_entrants").map((m) => [m.id, m]),
  );
  const parEchange = new Map(
    verifier(envois, "outbox").map((o) => [o.echange_id, o]),
  );
  const parEtudiant = new Map(
    verifier(etudiants, "etudiants").map((e) => [e.id, e]),
  );

  return lignes.map((l) => {
    const m = parMessage.get(l.message_entrant_id);
    const o = parEchange.get(l.id);
    return {
      id: l.id,
      message_entrant_id: l.message_entrant_id,
      recu_at: l.recu_at,
      traite_at: l.traite_at,
      envoye_at: l.envoye_at,
      sujet: l.sujet,
      texte_etudiant: l.texte_etudiant,
      issue: l.issue,
      generique: l.generique,
      justification: justification(l.evaluation),
      texte_reponse: l.texte_reponse,
      recos_accordees: l.recos_accordees,
      faits_debloques: l.faits_debloques,
      cout_usd: l.cout_usd,
      modele: l.modele,
      expediteur: m?.expediteur ?? null,
      destinataire: m?.destinataire ?? null,
      en_copie: m?.en_copie ?? false,
      personnage_id: l.personnage_id,
      etudiant: (l.etudiant_id && parEtudiant.get(l.etudiant_id)) || null,
      envoi: o
        ? {
            id: o.id,
            statut: o.statut,
            send_at: o.send_at,
            texte: o.texte,
            derniere_erreur: o.derniere_erreur,
            tentatives: o.tentatives,
          }
        : null,
    };
  });
}

// ---------------------------------------------------------------------
// Vue d'ensemble
// ---------------------------------------------------------------------
export async function lireApercu() {
  await exigerAdmin();
  const s = supabaseServeur();
  const debut = debutJourParis();

  const [
    parametres,
    aTraiter,
    enCours,
    messagesErreur,
    aRevoir,
    envoisErreur,
    programmes,
    etudiants,
    deblocages,
    echangesDuJour,
    couts,
  ] = await Promise.all([
    s.from("parametres").select("*").eq("id", 1).single(),
    compter("messages_entrants", "a_traiter"),
    compter("messages_entrants", "en_cours"),
    compter("messages_entrants", "erreur"),
    compter("outbox", "a_revoir"),
    compter("outbox", "erreur"),
    compter("outbox", "en_attente"),
    s
      .from("etudiants")
      .select("id, classe")
      .eq("actif", true)
      .eq("est_test", false),
    toutLire("deblocages", (de, a) =>
      s.from("deblocages").select("etudiant_id").range(de, a),
    ),
    toutLire("échanges du jour", (de, a) =>
      s
        .from("echanges")
        .select("etudiant_id, issue, cout_usd")
        .gte("traite_at", debut)
        .range(de, a),
    ),
    toutLire("coûts", (de, a) =>
      s
        .from("echanges")
        .select("cout_usd")
        .not("cout_usd", "is", null)
        .range(de, a),
    ),
  ]);
  if (parametres.error) throw new Error("Lecture impossible : parametres");

  const listeEtudiants = verifier(etudiants, "etudiants");
  const faitsParEtudiant = new Map<string, number>();
  for (const d of deblocages)
    faitsParEtudiant.set(
      d.etudiant_id,
      (faitsParEtudiant.get(d.etudiant_id) ?? 0) + 1,
    );
  const actifsAujourdhui = new Set(echangesDuJour.map((e) => e.etudiant_id));

  const classes = new Map<
    string,
    { etudiants: number; faits: number; actifs: number; complets: number }
  >();
  for (const e of listeEtudiants) {
    const c = classes.get(e.classe) ?? {
      etudiants: 0,
      faits: 0,
      actifs: 0,
      complets: 0,
    };
    const n = faitsParEtudiant.get(e.id) ?? 0;
    c.etudiants++;
    c.faits += n;
    if (n >= 11) c.complets++;
    if (actifsAujourdhui.has(e.id)) c.actifs++;
    classes.set(e.classe, c);
  }

  const somme = (l: { cout_usd: number | null }[]) =>
    l.reduce((t, x) => t + (x.cout_usd ?? 0), 0);

  return {
    parametres: parametres.data,
    file: {
      aTraiter,
      enCours,
      messagesErreur,
      aRevoir,
      envoisErreur,
      programmes,
    },
    jour: {
      echanges: echangesDuJour.length,
      reponses: echangesDuJour.filter((e) => e.issue === "reponse").length,
      etudiantsActifs: [...actifsAujourdhui].filter((x) => x !== null).length,
      cout: somme(echangesDuJour),
    },
    coutTotal: somme(couts),
    classes: [...classes.entries()]
      .map(([classe, c]) => ({ classe, ...c }))
      .sort((a, b) => a.classe.localeCompare(b.classe)),
  };
}

// ---------------------------------------------------------------------
// Mails : file à revoir, erreurs, envois en cours, journal
// ---------------------------------------------------------------------
async function echangesParIds(ids: number[]): Promise<LigneEchange[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseServeur()
    .from("echanges")
    .select(COLONNES_ECHANGE)
    .in("id", ids)
    .returns<LigneEchange[]>();
  return verifier({ data, error }, "échanges");
}

export async function lireFileMails() {
  await exigerAdmin();
  const s = supabaseServeur();

  const [aRevoir, programmes, entrants] = await Promise.all([
    s
      .from("outbox")
      .select("echange_id")
      .in("statut", ["a_revoir", "erreur"])
      .order("send_at"),
    s
      .from("outbox")
      .select("echange_id")
      .in("statut", ["en_attente", "en_cours"])
      .order("send_at")
      .limit(200),
    s
      .from("messages_entrants")
      .select(
        "id, expediteur, destinataire, en_copie, sujet, recu_at, statut, tentatives, derniere_erreur",
      )
      .in("statut", ["a_traiter", "en_cours", "erreur"])
      .order("recu_at"),
  ]);

  const idsRevoir = verifier(aRevoir, "outbox").map((o) => o.echange_id);
  const idsProgrammes = verifier(programmes, "outbox").map((o) => o.echange_id);
  const lignes = await echangesParIds([...idsRevoir, ...idsProgrammes]);
  const enrichis = new Map((await enrichir(lignes)).map((e) => [e.id, e]));
  const dans = (ids: number[]) =>
    ids.map((id) => enrichis.get(id)).filter((e) => e !== undefined);

  return {
    aRevoir: dans(idsRevoir),
    programmes: dans(idsProgrammes),
    entrants: verifier(entrants, "messages_entrants"),
  };
}

export type FiltresJournal = {
  classe?: string;
  issue?: string;
  personnage?: string;
};

export const TAILLE_JOURNAL = 100;

export async function lireJournal(filtres: FiltresJournal) {
  await exigerAdmin();
  const s = supabaseServeur();

  let requete = s
    .from("echanges")
    .select(COLONNES_ECHANGE)
    .order("recu_at", { ascending: false })
    .limit(TAILLE_JOURNAL);
  if (filtres.issue) requete = requete.eq("issue", filtres.issue);
  if (filtres.personnage)
    requete = requete.eq("personnage_id", filtres.personnage);
  if (filtres.classe) {
    const ids = verifier(
      await s.from("etudiants").select("id").eq("classe", filtres.classe),
      "etudiants",
    ).map((e) => e.id);
    if (ids.length === 0) return [];
    requete = requete.in("etudiant_id", ids);
  }
  const { data, error } = await requete.returns<LigneEchange[]>();
  return enrichir(verifier({ data, error }, "journal"));
}

export async function lireClasses(): Promise<string[]> {
  await exigerAdmin();
  const lignes = verifier(
    await supabaseServeur()
      .from("etudiants")
      .select("classe")
      .eq("actif", true),
    "classes",
  );
  return [...new Set(lignes.map((l) => l.classe))].sort();
}

// ---------------------------------------------------------------------
// Progression : qui a trouvé quoi
// ---------------------------------------------------------------------
export type LigneProgression = {
  etudiant: Pick<EtudiantAdmin, "id" | "prenom" | "nom" | "email" | "classe">;
  mails: number;
  dernierMail: string | null;
  faits: Set<string>;
  atteints: Set<string>; // personnages qui ont répondu
  acces: Set<string>; // personnages joignables (porte d'entrée ou recommandation)
  refus: number;
  generiques: number;
  recos: number;
  note: number | null;
};

export async function lireProgression(classe: string) {
  await exigerAdmin();
  const s = supabaseServeur();

  const etudiants = verifier(
    await s
      .from("etudiants")
      .select("id, prenom, nom, email, classe")
      .eq("actif", true)
      .eq("classe", classe)
      .order("nom")
      .order("prenom"),
    "etudiants",
  );
  const ids = etudiants.map((e) => e.id);
  if (ids.length === 0) return [];

  const [deblocages, recos, echanges, notes, portes] = await Promise.all([
    toutLire("deblocages", (de, a) =>
      s
        .from("deblocages")
        .select("etudiant_id, fait_id")
        .in("etudiant_id", ids)
        .range(de, a),
    ),
    toutLire("recommandations", (de, a) =>
      s
        .from("recommandations")
        .select("etudiant_id, vers_personnage")
        .in("etudiant_id", ids)
        .range(de, a),
    ),
    toutLire("échanges", (de, a) =>
      s
        .from("echanges")
        .select("etudiant_id, personnage_id, issue, generique, recu_at")
        .in("etudiant_id", ids)
        .range(de, a),
    ),
    s.from("v_note_enquete").select("email, note_sur_20").eq("classe", classe),
    s.from("personnages").select("id").eq("porte_entree", true),
  ]);

  const noteParEmail = new Map(
    verifier(notes, "v_note_enquete").map((n) => [n.email, n.note_sur_20]),
  );
  const idsPortes = verifier(portes, "personnages").map((p) => p.id);

  const lignes = new Map<string, LigneProgression>(
    etudiants.map((e) => [
      e.id,
      {
        etudiant: e,
        mails: 0,
        dernierMail: null,
        faits: new Set(),
        atteints: new Set(),
        acces: new Set(idsPortes),
        refus: 0,
        generiques: 0,
        recos: 0,
        note: noteParEmail.get(e.email) ?? null,
      },
    ]),
  );
  for (const d of deblocages) lignes.get(d.etudiant_id)?.faits.add(d.fait_id);
  for (const r of recos) {
    const l = lignes.get(r.etudiant_id);
    if (!l) continue;
    l.recos++;
    l.acces.add(r.vers_personnage);
  }
  for (const e of echanges) {
    const l = e.etudiant_id ? lignes.get(e.etudiant_id) : undefined;
    if (!l) continue;
    if (e.issue === "reponse" || e.issue === "refus_sans_reco") l.mails++;
    if (e.issue === "reponse" && e.personnage_id)
      l.atteints.add(e.personnage_id);
    if (e.issue === "refus_sans_reco") l.refus++;
    if (e.generique) l.generiques++;
    if (!l.dernierMail || e.recu_at > l.dernierMail) l.dernierMail = e.recu_at;
  }
  return [...lignes.values()];
}

// ---------------------------------------------------------------------
// Fiche d'un étudiant
// ---------------------------------------------------------------------
const FORMAT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lireEtudiant(id: string) {
  await exigerAdmin();
  if (!FORMAT_UUID.test(id)) return null;
  const s = supabaseServeur();

  const { data: etudiant, error } = await s
    .from("etudiants")
    .select("id, prenom, nom, email, classe, est_test, actif, jeton")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Lecture impossible : etudiant");
  if (!etudiant) return null;

  const [echanges, deblocages, recos, note, entrants] = await Promise.all([
    toutLire("échanges", (de, a) =>
      s
        .from("echanges")
        .select(COLONNES_ECHANGE)
        .eq("etudiant_id", id)
        .order("recu_at", { ascending: false })
        .range(de, a)
        .returns<LigneEchange[]>(),
    ),
    s
      .from("deblocages")
      .select("fait_id, debloque_at, echange_id")
      .eq("etudiant_id", id),
    s
      .from("recommandations")
      .select("de_personnage, vers_personnage, accordee_at, echange_id")
      .eq("etudiant_id", id),
    s
      .from("v_note_enquete")
      .select("*")
      .eq("email", etudiant.email)
      .maybeSingle(),
    s
      .from("messages_entrants")
      .select(
        "id, destinataire, en_copie, sujet, recu_at, statut, derniere_erreur",
      )
      .eq("expediteur", etudiant.email)
      .in("statut", ["a_traiter", "en_cours", "erreur"]),
  ]);

  return {
    etudiant,
    echanges: await enrichir(echanges),
    deblocages: verifier(deblocages, "deblocages"),
    recommandations: verifier(recos, "recommandations"),
    note: note.data,
    entrants: verifier(entrants, "messages_entrants"),
  };
}

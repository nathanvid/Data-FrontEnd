-- =====================================================================
-- Tableau de bord étudiant : migration v1
-- À exécuter en une fois dans Supabase > SQL Editor, de préférence hors séance
-- (l'ajout du jeton réécrit la table etudiants : verrou de quelques ms).
-- Idempotente : peut être rejouée sans effet de bord.
--
-- Contenu :
--   1. etudiants.jeton (URL personnelle)
--   2. echanges : métriques LLM et documents injectés
--   3. parametres : afficher_feedback, revelation
--   4. enregistrer_resultat v2 (5 paramètres optionnels en plus, appel actuel de WF2 inchangé)
--   5. tableau_de_bord(jeton) : la seule lecture exposée au site, déjà filtrée
--   6. droits : rien pour anon / authenticated, exécution réservée à service_role
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. JETON PERSONNEL : chaque étudiant (existant ou futur) reçoit un uuid aléatoire
--    gen_random_uuid() est évalué ligne par ligne : un jeton différent par étudiant
-- ---------------------------------------------------------------------
alter table etudiants add column if not exists jeton uuid not null default gen_random_uuid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'etudiants_jeton_key') then
    alter table etudiants add constraint etudiants_jeton_key unique (jeton);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. MÉTRIQUES : renseignées par WF2 (null pour l'historique : « non mesuré »)
-- ---------------------------------------------------------------------
alter table echanges add column if not exists tokens_in          int;      -- évaluateur + personnage
alter table echanges add column if not exists tokens_out         int;
alter table echanges add column if not exists cout_usd           numeric;  -- usage.cost d'OpenRouter, en dollars
alter table echanges add column if not exists latence_ms         int;      -- durée des appels LLM
alter table echanges add column if not exists documents_injectes text[];   -- noms de la table documents

-- ---------------------------------------------------------------------
-- 3. INTERRUPTEURS FORMATEUR
-- ---------------------------------------------------------------------
alter table parametres add column if not exists afficher_feedback boolean not null default false;  -- phase 2
alter table parametres add column if not exists revelation        boolean not null default false;  -- phase 3

-- ---------------------------------------------------------------------
-- 4. ENREGISTRER_RESULTAT v2
--    Piège : « create or replace » avec une liste de paramètres différente crée
--    une DEUXIÈME fonction à côté de l'ancienne, et l'appel de WF2 devient ambigu.
--    On supprime donc l'ancienne signature avant de créer la nouvelle, dans la
--    même transaction : WF2 ne voit jamais d'état intermédiaire.
--    Les 5 nouveaux paramètres sont à la fin et optionnels : l'appel actuel
--    à 10 paramètres continue de fonctionner tel quel.
--    Le corps est identique à la v1, sauf les 5 colonnes ajoutées à l'insert.
-- ---------------------------------------------------------------------
drop function if exists enregistrer_resultat(bigint, text, uuid, text, text, jsonb, boolean, text[], text[], text);

create or replace function enregistrer_resultat(
  p_message_id     bigint,
  p_issue          text,
  p_etudiant       uuid    default null,
  p_personnage     text    default null,
  p_texte_reponse  text    default null,
  p_evaluation     jsonb   default null,
  p_generique      boolean default null,
  p_recos          text[]  default '{}',
  p_faits          text[]  default '{}',
  p_modele         text    default null,
  p_tokens_in      int     default null,   -- nouveaux paramètres (v2)
  p_tokens_out     int     default null,
  p_cout_usd       numeric default null,
  p_latence_ms     int     default null,
  p_documents      text[]  default null)
returns bigint
language plpgsql as $$
declare
  m        messages_entrants;
  p        personnages;
  v_recos  text[];
  v_faits  text[];
  v_id     bigint;
  v_sujet  text;
begin
  select * into m from messages_entrants where id = p_message_id;
  select * into p from personnages where id = p_personnage;

  select coalesce(array_agg(c.vers_personnage), '{}') into v_recos
    from carte_acces c
   where c.de_personnage = p_personnage and c.vers_personnage = any (p_recos);

  select coalesce(array_agg(f.id), '{}') into v_faits
    from faits f
   where f.personnage_id = p_personnage and f.id = any (p_faits);

  insert into echanges (message_entrant_id, etudiant_id, personnage_id, recu_at, sujet,
                        texte_etudiant, issue, generique, evaluation, texte_reponse,
                        recos_accordees, faits_debloques, modele,
                        tokens_in, tokens_out, cout_usd, latence_ms, documents_injectes)
  values (m.id, p_etudiant, p_personnage, m.recu_at, m.sujet,
          m.texte, p_issue, p_generique, p_evaluation, p_texte_reponse,
          v_recos, v_faits, p_modele,
          p_tokens_in, p_tokens_out, p_cout_usd, p_latence_ms, p_documents)
  returning id into v_id;

  if p_etudiant is not null and p_personnage is not null then
    insert into recommandations (etudiant_id, de_personnage, vers_personnage, echange_id)
      select p_etudiant, p_personnage, r, v_id from unnest(v_recos) r
      on conflict do nothing;
    insert into deblocages (etudiant_id, fait_id, echange_id)
      select p_etudiant, f, v_id from unnest(v_faits) f
      on conflict do nothing;
  end if;

  if p_texte_reponse is not null then
    v_sujet := case when m.sujet ~* '^\s*re\s*:' then m.sujet
                    else 'Re: ' || coalesce(m.sujet, '') end;
    insert into outbox (echange_id, send_at, from_email, from_nom, to_email,
                        sujet, texte, in_reply_to, refs)
    values (v_id, calcul_send_at(), p.email, p.prenom || ' ' || p.nom, m.expediteur,
            v_sujet, p_texte_reponse, m.message_id,
            trim(coalesce(m.refs, '') || ' ' || m.message_id));
  end if;

  update messages_entrants set statut = 'traite' where id = m.id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 5. TABLEAU_DE_BORD : tout ce que voit un étudiant, en un appel
--
--    Renvoie null si le jeton est inconnu ou l'étudiant inactif.
--
--    Règle d'or (aucun divulgâchage) :
--      - on ne lit JAMAIS carte_acces.condition, faits.condition, personnages.fiche,
--        documents.contenu, echanges.evaluation, echanges.generique ;
--      - un échange est « visible » quand l'étudiant a reçu la réponse (envoye_at),
--        ou quand son issue ne déclenche aucun envoi (rien à attendre) ;
--      - une recommandation ou un fait ne compte que si le mail qui l'a apporté
--        est arrivé (ou s'il a été ajouté à la main, sans echange_id) ;
--      - tant qu'un échange n'est pas visible, on montre seulement sa progression
--        (reçu, en traitement, programmé à HH:MM), jamais son issue ni son contenu.
--
--    security invoker (par défaut) : la fonction s'exécute avec les droits de
--    l'appelant. Le site l'appelle avec la clé service (rôle service_role, qui
--    ignore le RLS) ; si un autre rôle l'appelait, le RLS sans politique le bloquerait.
-- ---------------------------------------------------------------------
create or replace function tableau_de_bord(p_jeton uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
with
-- l'étudiant (0 ligne si jeton inconnu ou inactif : la fonction renvoie alors null)
et as (
  select id, prenom, classe, email
    from etudiants
   where jeton = p_jeton and actif
),

-- ses échanges traités, avec l'état de l'envoi
ech as (
  select e.id, e.personnage_id, e.recu_at, e.sujet, e.issue, e.traite_at, e.envoye_at,
         e.texte_reponse, e.tokens_in, e.tokens_out, e.cout_usd, e.latence_ms,
         e.documents_injectes,
         m.message_id, m.destinataire, m.en_copie, m.pris_at, m.texte,
         o.send_at, o.statut as envoi_statut, o.texte as envoi_texte,
         (e.envoye_at is not null
          or e.issue in ('en_copie', 'limite_depassee', 'destinataire_inconnu', 'ignore_auto')) as visible
    from echanges e
    join et on et.id = e.etudiant_id
    join messages_entrants m on m.id = e.message_entrant_id
    left join outbox o on o.echange_id = e.id
),

-- ses mails reçus mais pas encore traités par WF2 (pas encore de ligne dans echanges)
attente as (
  select m.message_id, m.destinataire, m.en_copie, m.sujet, m.texte, m.recu_at, m.pris_at, m.statut
    from messages_entrants m
    join et on m.expediteur = et.email
   where not exists (select 1 from echanges e where e.message_entrant_id = m.id)
),

-- recommandations visibles (le mail qui les accordait est arrivé, ou ajout manuel)
recos as (
  select r.de_personnage as de, r.vers_personnage as vers, r.accordee_at,
         coalesce(e.envoye_at, r.accordee_at) as obtenue_at
    from recommandations r
    join et on et.id = r.etudiant_id
    left join echanges e on e.id = r.echange_id
   where r.echange_id is null or e.envoye_at is not null
),

-- faits visibles : le carnet d'enquête
carnet as (
  select f.id, f.personnage_id, f.texte, f.ordre,
         coalesce(e.envoye_at, d.debloque_at) as decouvert_at
    from deblocages d
    join et on et.id = d.etudiant_id
    join faits f on f.id = d.fait_id
    left join echanges e on e.id = d.echange_id
   where d.echange_id is null or e.envoye_at is not null
),

-- état de chaque personnage pour la carte
perso as (
  select p.id, p.prenom, p.nom, p.role, p.email, p.porte_entree,
         p.porte_entree or exists (select 1 from recos r where r.vers = p.id) as acces,
         exists (select 1 from ech e
                  where e.personnage_id = p.id and e.visible and e.issue = 'reponse') as a_repondu,
         -- un mail direct (pas en copie) est en route vers ce personnage
         exists (select 1 from ech e
                  where e.personnage_id = p.id and not e.visible and not e.en_copie)
           or exists (select 1 from attente a
                       where a.destinataire = p.email and not a.en_copie) as en_cours,
         (select count(*) from ech e
           where e.personnage_id = p.id and e.visible and e.issue = 'refus_sans_reco') as refus_recus,
         (select count(*) from carnet c where c.personnage_id = p.id) as faits_decouverts
    from personnages p
   where p.actif
),

-- une ligne par destinataire de chaque mail (traité ou en attente)
lignes as (
  select e.message_id, e.recu_at, e.sujet, e.texte, e.en_copie,
         jsonb_build_object(
           'personnage_id', e.personnage_id,
           'adresse',       e.destinataire,
           'en_copie',      e.en_copie,
           'statut', case
               when e.visible and e.envoye_at is not null then 'envoye'
               when e.visible                            then 'sans_reponse'
               when e.envoi_statut in ('en_attente', 'en_cours') then 'programme'
               else 'en_traitement'   -- y compris a_revoir / erreur : en attente du formateur
             end,
           'etapes', jsonb_build_object(
               'recu_at',   e.recu_at,
               'pris_at',   e.pris_at,
               'traite_at', e.traite_at,
               'send_at',   case when e.envoi_statut in ('en_attente', 'en_cours', 'envoye') then e.send_at end,
               'envoye_at', e.envoye_at),
           -- tout ce qui suit reste à null tant que l'échange n'est pas visible
           'issue', case when e.visible then e.issue end,
           'acces_via', case when e.visible and e.issue = 'reponse' then jsonb_build_object(
               'porte_entree',   p.porte_entree,
               'recommande_par', coalesce((
                   select jsonb_agg(r.de order by r.accordee_at)
                     from recos r
                    where r.vers = e.personnage_id and r.accordee_at <= e.traite_at), '[]'::jsonb))
             end,
           'documents', case when e.visible and e.documents_injectes is not null then coalesce((
               select jsonb_agg(jsonb_build_object('nom', d.nom, 'niveau', d.niveau)
                                order by d.niveau desc, d.nom)          -- façade d'abord
                 from documents d
                where d.nom = any (e.documents_injectes)), '[]'::jsonb)
             end,
           'metriques', case when e.visible
                              and num_nonnulls(e.tokens_in, e.tokens_out, e.cout_usd, e.latence_ms) > 0
             then jsonb_build_object(
               'tokens_in',  e.tokens_in,
               'tokens_out', e.tokens_out,
               'cout_usd',   e.cout_usd,
               'latence_ms', e.latence_ms)
             end,
           -- le texte réellement envoyé (outbox, éventuellement corrigé par le formateur)
           'reponse', case when e.envoye_at is not null then coalesce(e.envoi_texte, e.texte_reponse) end,
           -- recommandations et faits nouvellement obtenus grâce à CE mail
           'recos_obtenues', case when e.envoye_at is not null then coalesce((
               select jsonb_agg(r.vers_personnage order by r.vers_personnage)
                 from recommandations r where r.echange_id = e.id), '[]'::jsonb)
             end,
           'faits_decouverts', case when e.envoye_at is not null then coalesce((
               select jsonb_agg(d.fait_id order by d.fait_id)
                 from deblocages d where d.echange_id = e.id), '[]'::jsonb)
             end
         ) as destinataire
    from ech e
    left join personnages p on p.id = e.personnage_id
  union all
  select a.message_id, a.recu_at, a.sujet, a.texte, a.en_copie,
         jsonb_build_object(
           'personnage_id', p.id,
           'adresse',       a.destinataire,
           'en_copie',      a.en_copie,
           'statut',        case when a.statut = 'a_traiter' then 'en_attente' else 'en_traitement' end,
           'etapes', jsonb_build_object(
               'recu_at', a.recu_at, 'pris_at', a.pris_at, 'traite_at', null,
               'send_at', null, 'envoye_at', null),
           'issue', null, 'acces_via', null, 'documents', null, 'metriques', null,
           'reponse', null, 'recos_obtenues', null, 'faits_decouverts', null)
    from attente a
    left join personnages p on p.email = a.destinataire
),

-- regroupement par mail (un mail avec un personnage en copie = une seule carte)
mails as (
  select min(l.recu_at) as recu_at,
         jsonb_build_object(
           'recu_at', min(l.recu_at),
           'sujet',   (array_agg(l.sujet order by l.en_copie))[1],
           'extrait', left((array_agg(l.texte order by l.en_copie))[1], 280),
           'destinataires', jsonb_agg(l.destinataire order by l.en_copie, l.destinataire->>'adresse')
         ) as mail
    from lignes l
   group by l.message_id
)

select jsonb_build_object(
  'etudiant',  jsonb_build_object('prenom', et.prenom, 'classe', et.classe),
  'genere_at', now(),
  'compteurs', jsonb_build_object(
      'faits_decouverts',     (select count(*) from carnet),
      'faits_total',          (select count(*) from faits),
      'personnages_atteints', (select count(*) from perso where a_repondu),
      'recos_obtenues',       (select count(*) from recos)),
  'personnages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'prenom', p.prenom, 'nom', p.nom, 'role', p.role, 'email', p.email,
               'porte_entree', p.porte_entree,
               'etat', case
                   when p.a_repondu then 'a_repondu'
                   when p.en_cours  then 'contacte'
                   when p.acces     then 'accessible'
                   else 'verrouille'
                 end,
               'refus_recus',      p.refus_recus,
               'faits_decouverts', p.faits_decouverts)
             order by p.porte_entree desc, p.id)
        from perso p), '[]'::jsonb),
  'recommandations', coalesce((
      select jsonb_agg(jsonb_build_object('de', r.de, 'vers', r.vers, 'obtenue_at', r.obtenue_at)
                       order by r.obtenue_at)
        from recos r), '[]'::jsonb),
  'carnet', coalesce((
      select jsonb_agg(jsonb_build_object(
               'fait_id', c.id, 'personnage_id', c.personnage_id,
               'texte', c.texte, 'decouvert_at', c.decouvert_at)
             order by c.decouvert_at, c.ordre)
        from carnet c), '[]'::jsonb),
  'mails', coalesce((
      select jsonb_agg(m.mail order by m.recu_at desc) from mails m), '[]'::jsonb)
)
from et;
$$;

-- ---------------------------------------------------------------------
-- 6. DROITS
--    Dans Supabase, toute nouvelle fonction du schéma public est exécutable par
--    anon et authenticated (privilèges par défaut). On retire ces droits
--    explicitement, sur les deux fonctions (re)créées par cette migration.
-- ---------------------------------------------------------------------
revoke execute on function enregistrer_resultat(bigint, text, uuid, text, text, jsonb, boolean, text[], text[], text,
                                                int, int, numeric, int, text[])
  from public, anon, authenticated;

revoke execute on function tableau_de_bord(uuid) from public, anon, authenticated;
grant  execute on function tableau_de_bord(uuid) to service_role;

commit;

-- Vérification rapide après exécution :
-- select count(*), count(distinct jeton) from etudiants;            -- les deux nombres égaux
-- select tableau_de_bord(jeton) from etudiants where est_test limit 1;
-- puis exécuter simulateur/test_anti_divulgachage.sql

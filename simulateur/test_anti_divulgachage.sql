-- =====================================================================
-- Test anti-divulgâchage du tableau de bord
--
-- À exécuter après la migration, dans Supabase > SQL Editor (ou psql -v ON_ERROR_STOP=1).
-- Succès : la dernière ligne affiche « OK ». Échec : une erreur « Tn : ... » arrête le script.
-- Les messages d'erreur ne citent jamais de contenu caché, seulement la règle et l'étudiant.
--
-- Ne modifie RIEN en base :
--   T1 à T3 ne font que lire ;
--   T4 crée un étudiant et un mail fictifs dans une sous-transaction qui est
--   annulée à la fin du bloc (exception volontaire TDB00). Ces lignes ne sont
--   jamais visibles par WF2 / WF3 (non validées) et disparaissent au rollback.
--   Seul effet : les compteurs d'identifiants (identity) avancent de quelques unités.
-- =====================================================================

-- ---------------------------------------------------------------------
-- T1. Droits : ni anon ni authenticated ne peuvent appeler les fonctions
-- ---------------------------------------------------------------------
do $$
declare
  r text;
  f text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach f in array array[
      'tableau_de_bord(uuid)',
      'enregistrer_resultat(bigint, text, uuid, text, text, jsonb, boolean, text[], text[], text, int, int, numeric, int, text[])'
    ] loop
      if has_function_privilege(r, f, 'execute') then
        raise exception 'T1 : le rôle % peut exécuter %', r, f;
      end if;
    end loop;
  end loop;

  -- l'ancienne signature d'enregistrer_resultat ne doit plus exister (sinon appel ambigu pour WF2)
  if (select count(*) from pg_proc where proname = 'enregistrer_resultat'
        and pronamespace = 'public'::regnamespace) <> 1 then
    raise exception 'T1 : il existe plusieurs versions d''enregistrer_resultat';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- T2. Jeton inconnu : aucune donnée
-- ---------------------------------------------------------------------
do $$
begin
  if tableau_de_bord(gen_random_uuid()) is not null then
    raise exception 'T2 : un jeton inconnu renvoie des données';
  end if;
  if tableau_de_bord(null) is not null then
    raise exception 'T2 : un jeton null renvoie des données';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- T3. Contenu, pour CHAQUE étudiant actif (données réelles, lecture seule)
--     On vérifie le texte complet du JSON, pas seulement les clés.
--     Les règles de « découvert / obtenu » sont réécrites ici indépendamment
--     de la fonction, pour ne pas tester la fonction avec elle-même.
-- ---------------------------------------------------------------------
create or replace function pg_temp.contient(p_json text, p_texte text) returns boolean
language sql immutable as $$
  -- cherche p_texte tel qu'il apparaîtrait dans du JSON (guillemets, sauts de ligne échappés)
  select p_texte is not null and length(p_texte) > 0
     and position(trim(both '"' from to_jsonb(p_texte)::text) in p_json) > 0;
$$;

do $$
declare
  s   record;
  x   record;
  j   jsonb;
  t   text;
  n   int := 0;
begin
  for s in select id, jeton from etudiants where actif loop
    j := tableau_de_bord(s.jeton);
    if j is null then
      raise exception 'T3 : JSON null pour l''étudiant actif %', s.id;
    end if;
    t := j::text;
    n := n + 1;

    -- clés interdites, à n'importe quelle profondeur
    if t ~ '"(condition|fiche|contenu|evaluation|justification|generique|jeton|email_etudiant)":' then
      raise exception 'T3 : clé interdite dans le JSON de %', s.id;
    end if;

    -- conditions de la carte des accès et des faits
    for x in select condition from carte_acces union all select condition from faits loop
      if pg_temp.contient(t, x.condition) then
        raise exception 'T3 : une condition apparaît dans le JSON de %', s.id;
      end if;
    end loop;

    -- fiches des personnages, contenu des documents
    for x in select fiche as v from personnages union all select contenu from documents loop
      if pg_temp.contient(t, x.v) then
        raise exception 'T3 : une fiche ou un document apparaît dans le JSON de %', s.id;
      end if;
    end loop;

    -- faits NON découverts (au sens : mail reçu par l'étudiant, ou ajout manuel)
    for x in
      select f.id, f.texte from faits f
       where not exists (
         select 1 from deblocages d
           left join echanges e on e.id = d.echange_id
          where d.etudiant_id = s.id and d.fait_id = f.id
            and (d.echange_id is null or e.envoye_at is not null))
    loop
      if pg_temp.contient(t, x.texte) or pg_temp.contient(t, x.id) then
        raise exception 'T3 : un fait non découvert (%) apparaît dans le JSON de %', x.id, s.id;
      end if;
    end loop;

    -- recommandations NON obtenues : jamais dans la liste des flèches
    if exists (
      select 1 from jsonb_array_elements(j->'recommandations') r
       where not exists (
         select 1 from recommandations rc
           left join echanges e on e.id = rc.echange_id
          where rc.etudiant_id = s.id
            and rc.de_personnage = r->>'de' and rc.vers_personnage = r->>'vers'
            and (rc.echange_id is null or e.envoye_at is not null)))
    then
      raise exception 'T3 : une recommandation non obtenue apparaît dans le JSON de %', s.id;
    end if;

    -- données des autres étudiants
    for x in select email, jeton::text as jeton from etudiants where id <> s.id loop
      if pg_temp.contient(t, x.email) or pg_temp.contient(t, x.jeton) then
        raise exception 'T3 : des données d''un autre étudiant apparaissent dans le JSON de %', s.id;
      end if;
    end loop;

    -- règle temporelle : un mail pas encore arrivé ne révèle rien
    if jsonb_path_exists(j, '$.mails[*].destinataires[*] ? (
          (@.statut == "en_attente" || @.statut == "en_traitement" || @.statut == "programme")
          && (@.issue != null || @.acces_via != null || @.documents != null || @.metriques != null
              || @.reponse != null || @.recos_obtenues != null || @.faits_decouverts != null))')
    then
      raise exception 'T3 : un mail non arrivé révèle son contenu dans le JSON de %', s.id;
    end if;
  end loop;

  if n = 0 then
    raise exception 'T3 : aucun étudiant actif testé';
  end if;
  raise notice 'T3 : % étudiants vérifiés', n;
end $$;

-- ---------------------------------------------------------------------
-- T4. Scénario complet sur un étudiant fictif (annulé à la fin)
--     mail reçu → traité avec un fait et une reco → envoyé → étudiant désactivé
-- ---------------------------------------------------------------------
do $$
declare
  v_et     uuid;
  v_jeton  uuid;
  v_msg    bigint;
  v_ech    bigint;
  j        jsonb;
  d        jsonb;
  v_fait   text;
begin
  begin  -- sous-transaction : tout ce qui suit est annulé par l'exception TDB00 finale
    select texte into v_fait from faits where id = 'marc_ressaisie';

    insert into etudiants (email, prenom, nom, classe, est_test)
    values ('fixture.tableau-de-bord@exemple.invalid', 'Fixture', 'Test', 'test', true)
    returning id, jeton into v_et, v_jeton;

    insert into messages_entrants (message_id, destinataire, expediteur, sujet, texte)
    values ('<fixture-tableau-de-bord@exemple.invalid>', 'marc.dupuis@pro.moncoinbureau.fr',
            'fixture.tableau-de-bord@exemple.invalid', 'Vos commandes', 'Bonjour Marc')
    returning id into v_msg;

    -- étape 1 : mail reçu, pas encore traité
    j := tableau_de_bord(v_jeton);
    d := j #> '{mails,0,destinataires,0}';
    if d->>'statut' <> 'en_attente' or d->>'personnage_id' <> 'marc' then
      raise exception 'T4.1 : mail non traité mal affiché (statut %)', d->>'statut';
    end if;
    if (select p->>'etat' from jsonb_array_elements(j->'personnages') p where p->>'id' = 'marc') <> 'contacte' then
      raise exception 'T4.1 : Marc devrait être « contacté »';
    end if;

    -- étape 2 : traité par WF2 (fait + reco accordés), réponse programmée mais pas envoyée
    v_ech := enregistrer_resultat(v_msg, 'reponse', v_et, 'marc', 'Bonjour, réponse fixture',
                                  '{"justification":"fixture"}'::jsonb, false,
                                  array['nadia'], array['marc_ressaisie'], 'fixture',
                                  1000, 200, 0.0042, 3500, array['noyau', 'processus_commande']);
    j := tableau_de_bord(v_jeton);
    d := j #> '{mails,0,destinataires,0}';
    if d->>'statut' <> 'programme' or d#>>'{etapes,send_at}' is null then
      raise exception 'T4.2 : la réponse devrait être « programmée » (statut %)', d->>'statut';
    end if;
    if (j#>>'{compteurs,faits_decouverts}')::int <> 0 or (j#>>'{compteurs,recos_obtenues}')::int <> 0
       or jsonb_array_length(j->'carnet') <> 0 or jsonb_array_length(j->'recommandations') <> 0 then
      raise exception 'T4.2 : fait ou reco visible avant l''envoi du mail';
    end if;
    if pg_temp.contient(j::text, v_fait) or pg_temp.contient(j::text, 'marc_ressaisie')
       or pg_temp.contient(j::text, 'réponse fixture') or pg_temp.contient(j::text, 'justification') then
      raise exception 'T4.2 : contenu de la réponse visible avant l''envoi';
    end if;
    if (select p->>'etat' from jsonb_array_elements(j->'personnages') p where p->>'id' = 'nadia') <> 'verrouille' then
      raise exception 'T4.2 : Nadia devrait rester verrouillée avant l''envoi';
    end if;

    -- étape 3 : WF3 envoie le mail
    perform marquer_envoye((select id from outbox where echange_id = v_ech), 'fixture');
    j := tableau_de_bord(v_jeton);
    d := j #> '{mails,0,destinataires,0}';
    if d->>'statut' <> 'envoye' or d->>'issue' <> 'reponse'
       or d->'faits_decouverts' <> '["marc_ressaisie"]'::jsonb
       or d->'recos_obtenues' <> '["nadia"]'::jsonb
       or jsonb_array_length(d->'documents') <> 2
       or (d#>>'{metriques,cout_usd}')::numeric <> 0.0042 then
      raise exception 'T4.3 : mail envoyé mal affiché : %', d - 'reponse';
    end if;
    if (j#>>'{compteurs,faits_decouverts}')::int <> 1 or (j#>>'{compteurs,recos_obtenues}')::int <> 1
       or j#>>'{carnet,0,texte}' <> v_fait then
      raise exception 'T4.3 : fait ou reco absent après l''envoi';
    end if;
    if (select p->>'etat' from jsonb_array_elements(j->'personnages') p where p->>'id' = 'marc') <> 'a_repondu'
       or (select p->>'etat' from jsonb_array_elements(j->'personnages') p where p->>'id' = 'nadia') <> 'accessible' then
      raise exception 'T4.3 : états de Marc / Nadia incorrects après l''envoi';
    end if;
    if j::text ~ '"(condition|fiche|contenu|evaluation|justification|generique)":' then
      raise exception 'T4.3 : clé interdite après l''envoi';
    end if;

    -- étape 4 : étudiant désactivé → plus rien
    update etudiants set actif = false where id = v_et;
    if tableau_de_bord(v_jeton) is not null then
      raise exception 'T4.4 : un étudiant inactif voit encore son tableau de bord';
    end if;

    raise exception using errcode = 'TDB00', message = 'fin du scénario : annulation volontaire';
  exception
    when sqlstate 'TDB00' then null;   -- annulation attendue : rien n'a été écrit
  end;
end $$;

-- Vérifie que l'annulation a bien eu lieu
do $$
begin
  if exists (select 1 from etudiants where email = 'fixture.tableau-de-bord@exemple.invalid')
     or exists (select 1 from messages_entrants where message_id = '<fixture-tableau-de-bord@exemple.invalid>') then
    raise exception 'T4 : les données fictives n''ont pas été annulées';
  end if;
end $$;

select 'OK : tous les tests anti-divulgâchage passent' as resultat;

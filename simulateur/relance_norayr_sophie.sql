-- Relance du dernier mail de Norayr Hayrapetyan à Sophie (message 2008), classé
-- limite_depassee le 30/10 à 08:41 UTC. Rien n'a été écrit pour lui (ni outbox,
-- ni reco, ni déblocage).
--
-- Sophie lui a répondu 6 fois entre 07:48 et 08:21 UTC (1900 à 1971) : la limite
-- de 6 réponses par heure était atteinte. Son mail 1972 (08:26) a été bloqué (1991),
-- et il l'a renvoyé à l'identique (2008, 08:41), bloqué à son tour (2029), car
-- reponses_derniere_heure compte aussi les échanges en limite_depassee.
--
-- On supprime les deux blocages et on remet seulement 2008 en file (1972 est le
-- même texte). Une fois 1991 et 2029 supprimés, il reste 6 échanges dans l'heure
-- jusqu'à 08:48:13 UTC (sortie de 1900) : le garde-fou annule tout avant.

begin;

delete from echanges
where id in (1991, 2029)
  and message_entrant_id in (1972, 2008)
  and issue = 'limite_depassee'
  and texte_reponse is null;

do $$
declare n int;
begin
  select count(*) into n from echanges
   where etudiant_id = '507c484e-3930-482b-9fb8-805c0e13fd34'
     and personnage_id = 'sophie'
     and traite_at > now() - interval '1 hour';
  if n > 5 then
    raise exception 'Encore % échanges Sophie dans l''heure : relance trop tôt, rien n''est modifié', n;
  end if;
end $$;

update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après limite_depassee (30/10)'
where id = 2008
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

-- 1972 n'a plus d'échange : on le marque traité pour qu'il ne reparte pas.
update messages_entrants
set derniere_erreur = 'doublon de 2008, non relancé (30/10)'
where id = 1972;

commit;

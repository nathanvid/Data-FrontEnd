-- Relance de l'échange 1191 de Mathys Bousselat (message 1150), à Thomas,
-- classé limite_depassee le 26/10 à 10:02 (heure de Paris). Rien n'a été écrit
-- pour lui (ni outbox, ni reco, ni déblocage). On supprime l'échange et on remet
-- le message en file pour que l'arbitre et Thomas le traitent normalement.
--
-- Ce blocage vient de l'effet boule de neige : à 10:02, il ne restait que
-- 5 réponses de Thomas dans l'heure (sous la limite de 6), mais les 3 refus
-- précédents (1053, 1084, 1116) étaient comptés aussi.
-- 1053, 1084 et 1116 ne sont pas relancés : à leur heure, Thomas avait déjà
-- répondu 6 fois, le blocage était normal.
-- 1194 (message 1174) n'est pas relancé : il reprend la même question que 1191
-- (les idées de Thomas pour améliorer la gestion du catalogue).
--
-- La limite (contexte_echange.reponses_derniere_heure) compte tous les échanges
-- étudiant-personnage traités dans l'heure, y compris ceux en limite_depassee.
-- Pour que 1191 passe, il faut au plus 5 échanges Thomas dans la fenêtre au
-- moment du traitement, une fois 1191 supprimé. Avec 1194 (10:02) toujours
-- compté, c'est le cas à partir de 10:20, heure de Paris (sortie de 1022).
-- Le garde-fou ci-dessous annule tout si ce n'est pas le cas.

begin;

delete from echanges
where id = 1191
  and message_entrant_id = 1150
  and issue = 'limite_depassee'
  and texte_reponse is null;

do $$
declare n int;
begin
  select count(*) into n from echanges
   where etudiant_id = 'a4e0226f-097f-4c82-bfd3-2a6f9a0ae5b7'
     and personnage_id = 'thomas'
     and traite_at > now() - interval '1 hour';
  if n > 5 then
    raise exception 'Encore % échanges Thomas dans l''heure : relance trop tôt, rien n''est modifié', n;
  end if;
end $$;

update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après limite_depassee (26/10)'
where id = 1150
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

commit;

-- Relance des échanges 1094 et 1119 d'Özge Gul (messages 1088 et 1112), à Karim,
-- classés limite_depassee le 26/10 à 09:36 et 09:42 (heure de Paris) : 6 réponses
-- de Karim en moins d'une heure. Rien n'a été écrit pour eux (ni outbox, ni reco,
-- ni déblocage). On supprime l'échange et on remet le message en file pour que
-- l'arbitre et Karim les traitent normalement.
-- 1147 (message 1141) n'est pas relancé : c'est le même texte que 1119.
--
-- La limite (contexte_echange.reponses_derniere_heure) compte tous les échanges
-- étudiant-personnage traités dans l'heure, y compris ceux en limite_depassee.
-- Pour que les deux passent, il faut au plus 4 échanges Karim dans la fenêtre au
-- moment de la relance, une fois 1094 et 1119 supprimés. Avec 1147 (09:48) toujours
-- compté, c'est le cas à partir de 10:07, heure de Paris. Le garde-fou ci-dessous
-- annule tout si ce n'est pas le cas.

begin;

delete from echanges
where id in (1094, 1119)
  and message_entrant_id in (1088, 1112)
  and issue = 'limite_depassee'
  and texte_reponse is null;

do $$
declare n int;
begin
  select count(*) into n from echanges
   where etudiant_id = '3c7088b0-b8de-4935-8ce1-1ed05c69f6e3'
     and personnage_id = 'karim'
     and traite_at > now() - interval '1 hour';
  if n > 4 then
    raise exception 'Encore % échanges Karim dans l''heure : relance trop tôt, rien n''est modifié', n;
  end if;
end $$;

update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après limite_depassee (26/10)'
where id in (1088, 1112)
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

commit;

-- Relance des messages 927 à 931, traités le 26/10 à 07:33 UTC sans texte de réponse
-- (max_tokens 700 consommé par le raisonnement du modèle : contenu vide, pas d'outbox).
-- On efface ce que ces traitements ont écrit (échange, reco julien→patrick
-- d'Özge, déblocage karim_si d'Özge) pour que l'arbitre et le personnage
-- refassent tout, puis on remet les messages en file.
-- À lancer seulement APRÈS publication de la version WF2 bf864631 (max_tokens 4000).

begin;

delete from recommandations where echange_id between 934 and 938;
delete from deblocages      where echange_id between 934 and 938;
delete from outbox          where echange_id between 934 and 938;
delete from echanges        where id between 934 and 938
  and message_entrant_id between 927 and 931 and texte_reponse is null;

update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après correctif max_tokens (26/10)'
where id between 927 and 931
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

commit;

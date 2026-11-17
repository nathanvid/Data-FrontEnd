-- Revue des 5 réponses en a_revoir (toutes du 29/10), faite le 30/10.
--
-- Remises en file d'envoi (faux positifs du garde-fou) :
--   1440 Karim → Nadjidina Ali : « 100 » vient de « pas fiable à 100 % », rien d'inventé.
--   1618 Thomas → Myriam Bedri : Nadia était déjà recommandée (reco 248, marc→nadia,
--        11:41:51, une minute avant). Le garde-fou ne regarde que les recos de l'échange.
--
-- Annulées (rien n'est supprimé : recos et déblocages restent) :
--   1473 Claire → Tesnim Kobtane : oriente vers Julien sans reco. Sophie (reco 225)
--        a déjà été contactée depuis (échange 1792) : la réponse n'apporte plus rien.
--   1540 Marc → Lydia Ould Hamou : doublon, elle a renvoyé le même mail (1761),
--        qui a eu sa réponse.
--   1626 Claire → Keven Bougheriou : donne l'adresse de Karim alors que l'arbitre
--        a refusé la reco. Il a obtenu Karim par Sophie à 15:07 (reco 254) et
--        échange avec lui depuis.

begin;

update outbox
set statut = 'en_attente', send_at = now(), tentatives = 0, derniere_erreur = null
where id in (1440, 1618) and statut = 'a_revoir';

update outbox
set statut = 'annule'
where id in (1473, 1540, 1626) and statut = 'a_revoir';

commit;

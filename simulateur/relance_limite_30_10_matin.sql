-- Séance de Lyon du 30/10, à la demande de Nathan : limite par fil relevée de 6 à 10
-- réponses par heure pendant la séance, puis relance des mails bloqués en
-- limite_depassee depuis 08:35 UTC, sans les doublons.
--
-- Relancés (un mail par fil) :
--   2015 Adélaïde Wankou → Sophie
--   1992 Logan Billouard → Sophie
--   2013 Logan Billouard → Marc
--   2018 Norayr Hayrapetyan → Sophie
--   2017 Julien Cherblanc → Julien (le plus récent des deux envois identiques)
-- Non relancés :
--   2014 Julien Cherblanc : même texte que 2017.
--   2009 Julien Cherblanc : c'est la réponse de Julien recollée telle quelle
--        (« Bonjour Monsieur Cherblanc, Je vous l'ai dit… »), pas une question.
--
-- Rien n'avait été écrit pour ces échanges (ni outbox, ni reco, ni déblocage).
-- Remettre la limite à 6 après la séance :
--   update parametres set max_reponses_fil_heure = 6, maj_at = now() where id = 1;

update parametres set max_reponses_fil_heure = 10, maj_at = now() where id = 1;

begin;

delete from echanges
where id in (2013, 2030, 2034, 2035, 2037, 2039, 2040)
  and issue = 'limite_depassee'
  and texte_reponse is null;

update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après limite_depassee (30/10)'
where id in (1992, 2013, 2015, 2017, 2018)
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

update messages_entrants
set derniere_erreur = 'doublon de 2017, non relancé (30/10)'
where id = 2014;

update messages_entrants
set derniere_erreur = 'réponse de Julien recollée, non relancé (30/10)'
where id = 2009;

commit;

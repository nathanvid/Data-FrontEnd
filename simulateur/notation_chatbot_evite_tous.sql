-- Notation : bonus « chatbot évité » (+1/10) pour tous les étudiants actifs
-- (20/11/2026, demandé par Nathan : « ils ont compris »).
-- notes_manuelles était vide ; l'upsert garde ajustement et commentaire s'ils existent.

insert into notes_manuelles (etudiant_id, chatbot_evite)
select id, true from etudiants where actif and not est_test
on conflict (etudiant_id) do update set chatbot_evite = true;

-- Retour arrière :
-- update notes_manuelles set chatbot_evite = false;

-- Correctif : WF2 ne peut plus enregistrer ses résultats depuis le 12/10/2026.
-- migration_tableau_de_bord_v1 supprime puis recrée enregistrer_resultat : le
-- droit d'exécution du rôle n8n_simulateur (utilisé par n8n) a disparu avec
-- l'ancienne fonction. Chaque message échoue alors sur « permission denied »
-- après les appels LLM (payés), puis repart 3 fois avant de passer en erreur.
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.

begin;

grant execute on function enregistrer_resultat(bigint, text, uuid, text, text, jsonb, boolean, text[], text[], text,
  integer, integer, numeric, integer, text[]) to n8n_simulateur;

-- Remettre en file les messages bloqués depuis (927 du 12/10, 928 test, 929 à 931 du 26/10).
update messages_entrants
set statut = 'a_traiter', tentatives = 0, pris_at = null,
    derniere_erreur = 'relance après correctif des droits (26/10)'
where id between 927 and 931 and statut = 'erreur'
  and not exists (select 1 from echanges e where e.message_entrant_id = messages_entrants.id);

commit;

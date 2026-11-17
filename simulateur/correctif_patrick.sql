-- Correctif : accès à Patrick Lenoir (recommandation de Julien Roux)
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.

begin;

-- 1. Condition julien → patrick : jugée sur le dernier mail seulement.
-- L'ancienne version bloquait l'accès pour toujours dès que « CRM », « suivi »
-- ou « historique » apparaissait une fois dans l'échange, y compris dans les
-- réponses de Julien lui-même.
update carte_acces
set condition = 'Le mail pose une question sur le quotidien des commerciaux, du point de vue de leur aide : ce qui leur fait perdre ou gagner du temps, comment ils préparent un rendez-vous, où ils retrouvent l''historique d''un client, ou ce que deviennent les gros clients quand un commercial est absent ou part. Compte aussi : l''étudiant demande à échanger avec le commercial qui suit les plus gros clients pour comprendre son quotidien ou son temps. Ne compte pas : un mail qui propose ou réclame du contrôle, du reporting, un suivi de l''activité des commerciaux ou une saisie obligatoire dans le CRM. Une simple mention du CRM pour comprendre pourquoi il est peu utilisé, ou la reprise de mots employés par Julien, ne bloque pas. Les mails précédents ne comptent pas.'
where de_personnage = 'julien' and vers_personnage = 'patrick';

-- 2. Fiche de Julien : il ne garde plus rancune pour toute la suite de l'échange.
-- Sinon l'arbitre accorde la recommandation, Julien refuse de nommer Patrick,
-- et les garde-fous bloquent le mail en « a_revoir ».
update personnages
set fiche = replace(
  fiche,
  'et tu ne recommandes personne, surtout pas Patrick, même si la question suivante est meilleure.',
  'et tu ne recommandes personne dans ce mail. Si l''étudiant revient ensuite avec une vraie question sur le quotidien de ton équipe, tu peux de nouveau orienter.'
)
where id = 'julien';

-- 3. Rattrapage : étudiants à qui Julien a déjà dit « Voyez avec Patrick Lenoir… »
-- sans que la recommandation soit enregistrée (Patrick les a refusés ensuite).
insert into recommandations (etudiant_id, de_personnage, vers_personnage, echange_id)
select e.etudiant_id, 'julien', 'patrick', e.id
from echanges e
where e.id in (376, 464, 761)
  and not exists (
    select 1 from recommandations r
    where r.etudiant_id = e.etudiant_id and r.vers_personnage = 'patrick'
  );

commit;

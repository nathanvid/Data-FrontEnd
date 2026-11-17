-- Correctif : accès à Sophie Lemaire par Claire Morin (PROPOSITION, non appliquée)
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.
--
-- Constat au 26/10 : Sophie est « Responsable administrative et financière », mais
-- la condition claire → sophie n'accepte que les mots marge, coûts ou retour sur
-- investissement. Un étudiant qui demande à Claire le service administratif et
-- financier, la facturation ou les règlements (c'est-à-dire Sophie) est refusé.
-- Claire répond alors « le service concerné vous répondra directement », ce que le
-- simulateur ne fait jamais : l'étudiant attend une réponse qui ne viendra pas.
--
-- Changements :
-- 1. La condition claire → sophie accepte aussi une question sur le fonctionnement
--    administratif et financier (facturation, règlements, relances, comptabilité,
--    budget), ou la demande d'échanger avec la personne qui en est responsable.
-- 2. Rattrapage pour Eymeric Maurage (échanges 1068 et 1101) : il a demandé deux
--    fois le service administratif et financier à Claire, qui a promis de transmettre.

begin;

-- 1. Condition claire → sophie
update carte_acces
set condition = 'L''étudiant parle de marge, de coûts ou de retour sur investissement. Compte aussi : une question sur le fonctionnement administratif et financier de l''entreprise (facturation, suivi des règlements, relances d''impayés, comptabilité, clôture des chiffres, budget), ou la demande d''échanger avec la personne ou le service qui s''en occupe. Ne compte pas : une demande de liste des salariés ou de leurs coordonnées, ou une question sur le chiffre d''affaires seul.'
where de_personnage = 'claire' and vers_personnage = 'sophie';

-- 2. Rattrapage : Eymeric Maurage
insert into recommandations (etudiant_id, de_personnage, vers_personnage, echange_id)
select e.etudiant_id, 'claire', 'sophie', e.id
from echanges e
where e.id = 1068
  and not exists (
    select 1 from recommandations r
    where r.etudiant_id = e.etudiant_id and r.vers_personnage = 'sophie'
  );

-- Autres cas repérés, NON inclus (à trancher par Nathan) : Claire a nommé Sophie
-- ou promis qu'elle répondrait, sans recommandation enregistrée.
--   241   Rayan Mezouar      « je m'assure qu'elle vous réponde » (Sophie Lemaire)
--   1115  Mathys Bousselat   « Sophie Lemaire est effectivement la bonne interlocutrice : je la préviens »
--   487   Estelle Bouchaud   question sur facturation, paiements et clôture ; Claire répond à côté
-- Pour les inclure : remplacer « e.id = 1068 » par « e.id in (1068, 241, 1115, 487) ».

commit;

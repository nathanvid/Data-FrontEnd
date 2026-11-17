-- Rattrapage : Claire Morin a orienté vers Nadia Cherif sans recommandation enregistrée.
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.
--
-- La carte d'accès n'a pas d'arête claire → nadia (Nadia s'ouvre seulement par
-- Thomas ou Marc). Claire a pourtant écrit « je la préviens » ou donné l'adresse
-- de Nadia, et Nadia a ensuite refusé ces étudiants. Le garde-fou de WF2 ne voit
-- pas ce cas : il ne contrôle que les collègues de la carte d'accès du personnage.
--
-- Échanges retenus (relus) :
--   237  Keven Bougheriou       « Vous pouvez lui écrire directement à nadia.cherif@… »
--   804  Yanis Chikhi-Castéran  « je vous mets en relation avec Nadia Cherif »
--   968  Yanis Schiff           « Je transmets votre demande à Nadia Cherif »
--   995  Ilian Perraut          « je confirme à Nadia Cherif mon accord » (aussi 843 et 980)
-- Exclu : 169, simple organigramme.

begin;

insert into recommandations (etudiant_id, de_personnage, vers_personnage, echange_id)
select e.etudiant_id, 'claire', 'nadia', e.id
from echanges e
where e.id in (237, 804, 968, 995)
  and not exists (
    select 1 from recommandations r
    where r.etudiant_id = e.etudiant_id and r.vers_personnage = 'nadia'
  );

commit;

-- Déblocage manuel du fait patrick_excel pour Léa Tinet, à la demande de Nathan (30/10).
--
-- Léa a accès à Patrick depuis le rattrapage du 25/10 (reco 138), mais Patrick la
-- renvoie vers Julien à chaque mail (1927, 1961, 1990, 1997) : son fil contient ses
-- deux refus du 08/10, d'avant le rattrapage, et Julien lui a conseillé de « parler
-- de son temps », question que la condition de patrick_excel n'accepte pas.
--
-- Le déblocage est rattaché à son dernier échange avec Patrick (1997).
-- contexte_echange lit deblocages : au prochain mail de Léa, Patrick a le fait
-- « débloqué » et le livre. Aucun mail n'est renvoyé par ce script.

insert into deblocages (etudiant_id, fait_id, echange_id)
select e.etudiant_id, 'patrick_excel', e.id
from echanges e
where e.id = 1997
  and e.etudiant_id = 'ba335007-a721-4c85-9a26-4f40b00236e9'
  and e.personnage_id = 'patrick'
on conflict do nothing;

-- Même déblocage pour Romain Joannon (même blocage : reco 137 depuis le 25/10,
-- refus du 08/10 dans le fil, question sur son temps). Rattaché à son dernier
-- échange avec Patrick (1988). Pas de relance non plus.

insert into deblocages (etudiant_id, fait_id, echange_id)
select e.etudiant_id, 'patrick_excel', e.id
from echanges e
where e.id = 1988
  and e.etudiant_id = '24d47736-b9ef-4bec-8fef-4af10dbf031f'
  and e.personnage_id = 'patrick'
on conflict do nothing;

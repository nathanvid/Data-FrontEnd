-- Correctif : condition du fait karim_si (PROPOSITION, non appliquée)
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.
--
-- Constat au 26/10 : 24 étudiants ont écrit à Karim (115 échanges), 2 ont débloqué
-- karim_si. Environ 54 mails de 22 étudiants posaient une question technique
-- correcte et ont été refusés sur le seul critère 1 : l'arbitre exigeait une
-- phrase explicite sur l'allègement de la charge (« sans ajouter un outil »,
-- « partir de l'existant »), que rien dans le jeu ne suggère aux étudiants.
--
-- Changements :
-- 1. Le critère 1 devient une absence de faute (ne rien vendre, ne pas critiquer).
--    La phrase sur la charge n'est plus exigée.
-- 2. Le critère 1 peut être rempli par un mail précédent de l'échange avec Karim,
--    tant que le dernier mail ne propose pas d'outil.
-- 3. Le critère 2 est inchangé : c'est lui qui garde la difficulté.

begin;

update faits
set condition = 'Le fait est débloqué si les deux critères suivants sont remplis.
  1. Posture non vendeuse : le dernier mail ne présente ni ne propose aucun outil, logiciel, plateforme, chatbot ou solution d''IA à installer (même au conditionnel), et ni le dernier mail ni les mails précédents de l''échange avec Karim ne critiquent le logiciel de gestion ou son travail. Une phrase montrant le souci de ne pas alourdir sa charge (« partir de l''existant », « sans ajouter un outil de plus ») est un plus, mais elle n''est pas exigée : un mail qui pose sa question sans rien vendre remplit ce critère.
  2. Question technique précise sur l''existant : le dernier mail interroge Karim en expert sur ce qui empêche aujourd''hui les données de circuler (remontée des commandes web dans le logiciel de gestion, lien boutique-logiciel, stock, ressaisies, erreurs du connecteur, qui corrige les données).
- Compte : « Qu''est-ce qui empêche aujourd''hui le stock et les commandes web de remonter seuls dans le logiciel de gestion ? » ; « Vous connaissez le système mieux que personne : où se situent les points de friction entre la boutique et le logiciel ? » ; « Quand une commande web ne remonte pas, qui s''en aperçoit et qui la corrige ? ».
- Ne compte pas : une présentation du cabinet et de ses offres ; « notre solution d''IA pourrait automatiser votre saisie » ; une bonne question technique suivie d''une proposition d''outil ou de connecteur ; « votre logiciel semble vieillissant, avez-vous pensé à un ERP ? » ; « quels outils utilisez-vous ? » sans autre précision ; une demande de chiffres (budget, volumes) sans question sur le fonctionnement ; une question sur le stock ou la logistique seuls, sans lien avec la circulation des données entre les outils.'
where id = 'karim_si';

commit;

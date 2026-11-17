-- Correctif : Claire Morin ne promet plus de suite sans recommandation (PROPOSITION, non appliquée)
-- À appliquer sur la base de production uniquement avec le feu vert de Nathan.
--
-- Constat au 26/10 : sur 216 réponses de Claire sans recommandation accordée,
-- environ 40 promettent une suite (« je transmets », « je la préviens »,
-- « il vous répondra directement », « elle vous recontactera »), pour 21 étudiants.
-- Aucun personnage n'écrit de lui-même : l'étudiant attend une réponse qui ne
-- vient pas, au lieu de reformuler (cas d'Eymeric Maurage, échanges 1068 et 1101).
-- Les autres personnages sont peu touchés (Julien 2, Marc 1).
--
-- Cause : la section « Tes limites » de la fiche lui fait dire « c'est le service
-- concerné qui le suit », que le modèle prolonge en « je lui transmets ».
--
-- Changement : seule la fiche de Claire est modifiée, WF2 n'est pas touché. Sans
-- recommandation, elle ne promet aucune suite et retourne une question pour que
-- l'étudiant précise sa demande, sans lui souffler la condition.

begin;

update personnages
set fiche = replace(
  fiche,
  '« je n''ai pas ce chiffre », « c''est le service concerné qui le suit », sans nommer personne si la recommandation n''est pas accordée.',
  '« je n''ai pas ce chiffre », « ce n''est pas moi qui suis ce sujet au quotidien ». Sans recommandation accordée dans ce mail, tu ne nommes personne et tu ne promets aucune suite : jamais « je transmets », « je fais suivre », « je préviens le service », « il vous recontactera », « il vous répondra directement », « je m''assure qu''elle vous réponde ». Personne n''écrira à l''étudiant de sa propre initiative. Tu dis simplement que tu n''as pas la réponse, et tu lui retournes une question pour qu''il précise ce qu''il cherche à comprendre (« Concrètement, qu''est-ce que vous cherchez à comprendre ? »).'
)
where id = 'claire'
  and position('« c''est le service concerné qui le suit », sans nommer personne' in fiche) > 0;

-- Doit renvoyer une ligne : si la phrase d'origine a changé, rien n'est remplacé.
select id, position('tu ne promets aucune suite' in fiche) > 0 as corrige
from personnages where id = 'claire';

commit;

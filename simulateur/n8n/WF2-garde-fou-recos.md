# WF2 · garde-fou « collègue orienté sans recommandation » (brouillon, non publié)

Workflow « Simulateur · WF2 · Traitement » (`6Ifv91EKOba92J1A`).

- Version publiée, toujours active : `cb0b875e-1066-4d22-bd11-5f6e1ff6d2b1`.
- Nouveau brouillon : `93935214-d81d-4616-a71f-2ae46a1767a0` (« Garde-fou : collègue orienté sans recommandation »).
- Il est construit **sur** le brouillon métriques `1666e4a0` (voir [WF2-metriques-LLM.md](WF2-metriques-LLM.md)) : publier ce brouillon publie aussi les métriques LLM.
- Aucune exécution de WF2. Côté base, uniquement des lectures.

## Problème

Un personnage pouvait écrire « Voyez avec Patrick Lenoir, dites-lui que vous venez de ma part » alors que l'arbitre n'avait pas accordé la recommandation. L'étudiant écrivait au collègue et recevait la phrase de refus. Le garde-fou existant vérifiait seulement l'inverse : un collègue recommandé doit être nommé.

Sur les 771 réponses déjà envoyées, le nouveau contrôle en signale 18. Elles ont toutes été relues : ce sont toutes de vraies fuites. Par exemple, Julien → Patrick (376, 418, 464, 761), Claire → Julien avec son adresse (200, 214, 624), Thomas → Nadia (92, 712, 725), Marc → Nadia (912). L'échange 276 est aussi signalé : c'est une réponse de Claire qui contient tout son prompt.

## Changements

| Nœud                   | Changement                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Préparer le personnage | `controle.collegues_non_recommandes` : collègues de la carte d'accès du personnage dont la reco n'est ni déjà accordée ni accordée dans ce mail (`nom`, `prenom`, `email`). |
| Garde-fous             | Nouvelle raison « collègue orienté sans recommandation accordée : … », donc outbox `a_revoir`.                                                                              |

Règle de détection, sur le texte sans accents et en minuscules :

- le nom complet ou l'adresse du collègue apparaît, **et** le mail contient une formule d'orientation ;
- **ou** le prénom (mot entier, donc « marche » ne compte pas pour Marc) apparaît dans le même paragraphe qu'une formule d'orientation.

Les formules d'orientation sont : `de ma part`, `voyez avec`, `adressez-vous`, `contactez`, `écrivez-lui`, `écrivez à`, `je vous invite à`, `recommand…`, `prenez contact`, `préviens`, `rapprochez-vous`, `posez-lui`, `interlocut…`.

Un simple organigramme (« Julien Roux au commerce, Marc Dupuis à l'ADV ») n'est pas signalé. Une réponse comme « Je n'ai pas de collègue à vous recommander… Marc » peut l'être : elle passe alors en revue manuelle, sans être envoyée.

Sans changement : les autres nœuds, les connexions, les prompts et les modèles.

## Tests faits

- `node --check` sur le code des deux nœuds.
- Le nœud Garde-fous a été exécuté avec des données simulées : une fuite de type 376 ou 418 passe `a_revoir` sans reco et reste `ok` avec reco ; un mail descriptif (« Patrick suit la dizaine de gros clients ») reste `ok`.
- Le contrôle a été rejoué sur l'historique complet : 18 réponses signalées sur 771.

## Après publication

1. Depuis un compte `est_test = true`, écrire à Julien une question sans rapport avec le terrain, puis lui demander le contact de Patrick.
2. Si Julien nomme Patrick, l'outbox doit être en `a_revoir` avec la raison « collègue orienté sans recommandation accordée : Patrick Lenoir ».
3. Surveiller le volume de `a_revoir` les premiers jours (environ 2 % des réponses d'après l'historique).

## Retour arrière

_Workflow → History_ : restaurer `1666e4a0` pour garder seulement les métriques, ou `cb0b875e` pour revenir à la prod actuelle.

## Remarque sur le brouillon métriques

[WF2-metriques-LLM.md](WF2-metriques-LLM.md) annonce que la classe `[̀-ͯ]` de `sansAccent` a été réécrite en `[̀-ͯ]`. Dans n8n, le brouillon contient en fait toujours les caractères combinants bruts. Le comportement est identique et ce brouillon les garde tels quels.

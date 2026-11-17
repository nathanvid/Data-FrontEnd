# WF2 · emballements du personnage (brouillon, non publié)

Workflow « Simulateur · WF2 · Traitement » (`6Ifv91EKOba92J1A`).

- Version publiée, toujours active : `cb0b875e-1066-4d22-bd11-5f6e1ff6d2b1`.
- Nouveau brouillon : `c377662f-0586-4f10-b92f-d606b992a396` (« Personnage : max_tokens, stop et coupe après signature »).
- Chaîne des brouillons : `1666e4a0` (métriques LLM) → `93935214` (garde-fou des recommandations, voir [WF2-garde-fou-recos.md](WF2-garde-fou-recos.md)) → `c377662f`. Publier ce brouillon publie les trois.
- Aucune exécution de WF2. Côté base, uniquement des lectures.

## Problème

Échanges 276 et 540 (Claire), annulés à la main : 14 854 et 11 572 caractères. Le modèle écrit d'abord un mail correct, signature comprise. Il continue ensuite avec de faux contextes : titres `###`, séparateurs `---`, faux mails d'étudiants, fausses consignes, et un faux document « chiffres_commerciaux (sensible) » qui dévoile le fait verrouillé `claire_commerciaux`.

Cause : l'appel au personnage n'avait ni `max_tokens` ni séquence d'arrêt. Le garde-fou « réponse trop longue » ne voyait le problème qu'une fois les tokens payés. Un emballement dure plusieurs minutes (plus de 4 minutes pour l'échange 276) et retarde tout le lot de 10 messages. 24 messages ont été relancés après plus de 10 minutes « en_cours », ce qui fait repayer leurs appels LLM. Le lien avec les emballements est probable mais pas prouvé : les exécutions n8n de ces jours-là sont purgées.

## Changements

| Nœud                          | Changement                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appel personnage (OpenRouter) | `max_tokens: 700` (un mail de 16 lignes fait environ 500 tokens) et `stop: ["\n---", "\n###"]`.                                                                                                                                                                                                                                                                                                                                                                      |
| Garde-fous                    | Coupe au premier `---` ou `###` en début de ligne, puis juste après la dernière ligne de la signature (comparaison sans accents ni espaces superflus). Tous les contrôles portent ensuite sur la partie gardée. Si `finish_reason` vaut `length` et qu'aucune signature n'est trouvée, la raison « réponse tronquée (limite de longueur atteinte) » met le mail en `a_revoir`. Une coupe est tracée dans `echanges.modele` (« … / coupé après signature (N car.) »). |

Si la partie coupée passe tous les contrôles, elle part sans relecture.

## Tests faits

- `node --check` sur le code du nœud.
- Rejeu de la coupe sur les 771 réponses déjà envoyées : seules les réponses 276 et 540 sont coupées, et le résultat est à chaque fois un mail complet (565 et 571 caractères) qui se termine par la signature.
- Nœud exécuté avec des données simulées : l'emballement 276 donne un mail `ok` coupé ; un mail normal n'est pas modifié ; une signature avec des espaces en trop est reconnue ; un texte tronqué sans signature passe `a_revoir` ; un texte tronqué après la signature est coupé et part.
- Le paramètre `stop` n'a pas été testé contre OpenRouter. Si un fournisseur l'ignore, la coupe dans Garde-fous et `max_tokens` prennent le relais.

## Après publication

1. Envoyer quelques mails depuis un compte `est_test = true` et vérifier que les réponses sont normales.
2. Surveiller :
   ```sql
   select id, personnage_id, tokens_out, latence_ms, modele
   from echanges where modele like '%coupé%' or tokens_out >= 650
   order by traite_at desc;
   ```
3. Si des réponses légitimes atteignent souvent 700 tokens (`raisons` = « réponse tronquée »), passer `max_tokens` à 900.

## Retour arrière

_Workflow → History_ : restaurer `93935214` pour retirer seulement ce changement.

# WF2 · relance quand la réponse du personnage est vide (brouillon, non publié)

Workflow « Simulateur · WF2 · Traitement » (`6Ifv91EKOba92J1A`).

- Version publiée, active : `bf864631-e46e-4570-9faf-e16193a3ba38` (max_tokens 4000).
- Nouveau brouillon : `9e7d1a19-bb62-40bc-aedd-b114d165415e` (« Personnage : relance si réponse vide »).
- Il est construit sur `6efe34b8`, la version enregistrée par Nathan dans l'interface le 26/10 à 07:43 : taille de lot `prendre_messages(5)`, et `contentType: json` retiré par n8n parce que c'est la valeur par défaut. Ces deux changements sont conservés.
- Aucune exécution de WF2 pour ce brouillon.

## Problème

`deepseek-v4-flash` raisonne avant d'écrire, et le raisonnement compte dans `max_tokens`. Le 26/10, le mail de test 928 à Claire a raisonné 14 700 caractères (4 000 tokens) sans écrire de mail : `finish_reason: length`, contenu vide. Sans texte, `enregistrer_resultat` ne crée pas d'outbox. L'étape « Mettre à revoir si besoin » n'a alors rien à marquer, et l'étudiant ne reçoit rien sans que rien n'apparaisse dans l'administration.

## Changements

| Nœud                                            | Changement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Réponse vide ? (nouveau, IF)                    | Après « Appel personnage » : vrai si `choices[0].message.content` est vide ou ne contient que des espaces.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Relance personnage (OpenRouter) (nouveau, HTTP) | Même appel (modèle, température, `max_tokens` 4000, `stop`), prompts lus dans « Préparer le personnage », plus `reasoning: { effort: 'low' }` pour réduire le risque de nouvelle boucle. Retry 3 × 3 s, timeout 120 s, identifiant « OpenRouter account ».                                                                                                                                                                                                                                                          |
| Connexions                                      | Appel personnage → Réponse vide ? ; vrai → Relance → Garde-fous ; faux → Garde-fous.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Garde-fous                                      | Reconnaît une relance (identifiant OpenRouter différent de celui du premier appel). Additionne jetons et coût des deux appels du personnage. Ajoute « / relancé (réponse vide) » à `modele`. Si le texte est encore vide, écrit « [Le personnage n'a rien écrit, même après relance : réponse à rédiger avant envoi.] » suivi de la signature. L'outbox est alors créée et aussitôt mise `a_revoir`, et le mail apparaît dans l'administration (page des mails à revoir, texte modifiable, « Valider et envoyer »). |
| Groupe « Réponse du personnage »                | Contient les deux nouveaux nœuds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Tests faits

- `node --check` sur Garde-fous.
- Garde-fous exécuté avec des données simulées :
  - sans relance : `ok`, coût inchangé ;
  - relance réussie : `ok`, coûts additionnés, `modele` indique « relancé » ;
  - relance encore vide : `a_revoir`, texte provisoire et signature, raisons « réponse tronquée ; réponse vide ».
- Brouillon relu après enregistrement : nœuds, connexions, identifiants et groupe conformes.

## Pas encore vérifié

- `reasoning: { effort: 'low' }` n'a pas été testé sur `deepseek-v4-flash` via OpenRouter. Si le paramètre est ignoré, la relance se comporte comme le premier appel, et a quand même de bonnes chances de réussir (température 0,7 : le 928 a réussi à la deuxième tentative). S'il était refusé, l'appel échouerait et le message serait relancé par le mécanisme « bloqué en_cours > 10 min ».
- Le chemin complet n'a pas encore tourné dans n8n.

## Après publication

```sql
select id, personnage_id, tokens_out, cout_usd, modele
from echanges where modele like '%relancé%' order by traite_at desc;
```

Une relance sans texte doit apparaître dans l'outbox en `a_revoir`.

## Retour arrière

_Workflow → History_ : restaurer `bf864631` (ou `6efe34b8` pour garder la taille de lot à 5), puis publier.

# WF2 · ajout des métriques LLM (brouillon, non publié)

Workflow « Simulateur · WF2 · Traitement » (`6Ifv91EKOba92J1A`).

- Version publiée, toujours active : `cb0b875e-1066-4d22-bd11-5f6e1ff6d2b1`. Export : [WF2-publie-cb0b875e.json](WF2-publie-cb0b875e.json).
- Brouillon modifié : `1666e4a0-6174-47d1-ba86-571dd9e5381a` (« Métriques LLM : appels OpenRouter en HTTP »).
- Validation n8n (`validate_workflow`) : valide, 12 nœuds (la note n'est pas comptée).
- Aucune exécution de WF2, aucune écriture dans Supabase. Côté base, j'ai seulement lu la signature de `enregistrer_resultat` et lancé un `EXPLAIN` (planification sans exécution) pour vérifier la requête.

## 1. Nœuds modifiés

| Nœud | Changement |
|---|---|
| Agent évaluateur, OpenRouter · évaluateur (léger), Format de l'évaluation | **Supprimés**, remplacés par **Appel évaluateur (OpenRouter)** |
| Agent personnage, OpenRouter · personnage (solide) | **Supprimés**, remplacés par **Appel personnage (OpenRouter)** |
| Appel évaluateur (OpenRouter) | HTTP Request 4.5, `POST https://openrouter.ai/api/v1/chat/completions`, credential « OpenRouter account » (`openRouterApi`). `deepseek/deepseek-v4.1-flash`, `temperature: 0`, system = `systeme_eval`, user = `prompt_eval`, `response_format` json_schema (generique, faits, recos, justification, tous obligatoires), `usage.include: true`. Retry : 3 essais, 3000 ms. Timeout : 120 s. |
| Appel personnage (OpenRouter) | Même nœud HTTP. `~deepseek/deepseek-v4-flash-latest`, `temperature: 0.7`, system = `systeme_perso`, user = `prompt_perso`, `usage.include: true`. Retry : 3 essais, 3000 ms. Timeout : 120 s. |
| Décider (filtres, accès, refus) | Zéros dans `vide`, `debut_llm` dans la branche `llm` (diff ci-dessous) |
| Préparer le personnage | Lit `choices[0].message.content`, transmet l'usage de l'évaluateur, `debut_llm` et `documents` (diff ci-dessous) |
| Garde-fous | Lit `choices[0].message.content`, additionne les usages, calcule la latence, renseigne `modele` (diff ci-dessous) |
| Enregistrer le résultat | 5 paramètres nommés `$13` à `$17` ajoutés à la requête et à `queryReplacement` |
| Note « WF2 · Traitement » | Décrit les nœuds HTTP et les métriques |
| Groupes de nœuds | « Évaluation » et « Réponse du personnage » pointent vers les nouveaux nœuds |

Sans changement : le déclencheur, les prompts, les modèles, les températures, le filtrage, l'accès, les déblocages, les garde-fous, la mise « à revoir », les autres nœuds et WF1/WF3.

### Écarts au brief, à valider

1. **`strict: true` + `additionalProperties: false`** dans le schéma de l'évaluateur. Le schéma est identique au reste près, mais la documentation OpenRouter des sorties structurées demande `additionalProperties: false` en mode strict. Avant, le parser LangChain injectait des consignes de format dans le prompt. Le format JSON n'est plus garanti que par `response_format`.
2. **`provider: { require_parameters: true }`** sur l'évaluateur. Le modèle ne change pas, mais OpenRouter ne route plus que vers les fournisseurs qui appliquent `response_format`. Sinon un fournisseur pourrait l'ignorer et renvoyer du texte libre, ce qui ferait échouer `JSON.parse` dans « Préparer le personnage ». L'API publique OpenRouter liste bien `response_format` et `structured_outputs` pour les deux modèles.
3. **Timeout HTTP à 120 s.** Le nœud HTTP coupe par défaut à 10 s, ce qui couperait des réponses LLM normales.
4. **Retry.** L'ancien nœud OpenRouter avait aussi `maxRetries: 2` en interne. Il ne reste que le retry du nœud (3 × 3 s).
5. **Garde-fous** : la classe `[̀-ͯ]` (caractères combinants invisibles) est réécrite `[\u0300-\u036f]`. La regex est identique, mais elle ne risque plus d'être abîmée au copier-coller.
6. **Somme des métriques** : si une des deux réponses n'a pas `usage` ou `usage.cost`, le total vaut `null`, pas la moitié mesurée. Un total partiel ferait passer une sous-estimation pour une vraie mesure.
7. La latence couvre aussi les éventuels retries et le Code node intermédiaire (quelques ms).

## Diffs des Code nodes

### Décider (filtres, accès, refus)
```diff
--- avant
+++ apres
@@ -15,7 +15,12 @@
   faits: [],
   modele: '',
   a_revoir: false,
-  raisons: ''
+  raisons: '',
+  tokens_in: 0,
+  tokens_out: 0,
+  cout_usd: 0,
+  latence_ms: 0,
+  documents: []
 };
 
 const auto =
@@ -99,5 +104,6 @@
   },
   contexte: ctx,
   systeme_eval: sansAccolades(systeme),
-  prompt_eval: sansAccolades(utilisateur)
+  prompt_eval: sansAccolades(utilisateur),
+  debut_llm: Date.now()
 } }];
```

### Préparer le personnage
```diff
--- avant
+++ apres
@@ -1,8 +1,11 @@
 const d = $('Décider (filtres, accès, refus)').first().json;
-const sortie = $input.first().json.output;
+const reponseEval = $input.first().json;
+const sortie = reponseEval.choices?.[0]?.message?.content;
 const ctx = d.contexte;
 const p = ctx.personnage;
 
+const nombre = v => (typeof v === 'number' && isFinite(v)) ? v : null;
+const usage = reponseEval.usage || {};
 const sansAccolades = s => String(s || '').replace(/\{/g, '(').replace(/\}/g, ')');
 const ev = typeof sortie === 'string' ? JSON.parse(sortie) : sortie;
 if (!ev || typeof ev !== 'object') throw new Error('Évaluateur : sortie illisible');
@@ -65,6 +68,9 @@
   modele: '',
   a_revoir: false, raisons: '',
   controle: { texte_reference: texteReference, recos_noms: recosCeMail.map(r => r.nom), signature: p.signature, nom: p.prenom + ' ' + p.nom },
+  usage_eval: { prompt_tokens: nombre(usage.prompt_tokens), completion_tokens: nombre(usage.completion_tokens), cost: nombre(usage.cost), model: reponseEval.model || '' },
+  debut_llm: d.debut_llm,
+  documents: docs.map(doc => doc.nom),
   systeme_perso: sansAccolades(systeme),
   prompt_perso: sansAccolades(prompt)
 } }];
```

### Garde-fous
```diff
--- avant
+++ apres
@@ -1,5 +1,6 @@
 const d = $('Préparer le personnage').first().json;
-const brut = String($input.first().json.output || '');
+const reponsePerso = $input.first().json;
+const brut = String(reponsePerso.choices?.[0]?.message?.content || '');
 
 const lireJson = s => {
   const t = String(s || '').replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\x60\x60\x60\s*$/, '').trim();
@@ -8,7 +9,7 @@
     return null;
   }
 };
-const sansAccent = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
+const sansAccent = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
 const normNombres = s => String(s || '').replace(/(\d)[\s  ](?=\d{3}(\D|$))/g, '$1').replace(/(\d),(\d)/g, '$1.$2');
 
 const j = /^\s*(\x60\x60\x60|\{)/.test(brut) ? lireJson(brut) : null;
@@ -45,6 +46,20 @@
 const sortie = { ...d, texte_reponse: texte, ok: ok, raisons: raisons.join(' ; ') };
 
 sortie.a_revoir = !ok;
+
+// Métriques : somme des deux appels. Une valeur absente d'une réponse donne null, jamais une erreur.
+const nombre = v => (typeof v === 'number' && isFinite(v)) ? v : null;
+const somme = (a, b) => (nombre(a) === null || nombre(b) === null) ? null : a + b;
+const u1 = d.usage_eval || {};
+const u2 = reponsePerso.usage || {};
+sortie.tokens_in = somme(u1.prompt_tokens, u2.prompt_tokens);
+sortie.tokens_out = somme(u1.completion_tokens, u2.completion_tokens);
+sortie.cout_usd = somme(u1.cost, u2.cost);
+sortie.latence_ms = nombre(d.debut_llm) === null ? null : Date.now() - d.debut_llm;
+sortie.documents = d.documents || [];
+sortie.modele = 'éval: ' + (u1.model || '?') + ' / perso: ' + (reponsePerso.model || '?');
+delete sortie.usage_eval;
+delete sortie.debut_llm;
 delete sortie.systeme_perso;
 delete sortie.prompt_perso;
 return [{ json: sortie }];
```

### Enregistrer le résultat (requête)
```sql
..., nullif($10::text,''),
     p_tokens_in  => nullif($13::text,'')::int,
     p_tokens_out => nullif($14::text,'')::int,
     p_cout_usd   => nullif($15::text,'')::numeric,
     p_latence_ms => nullif($16::text,'')::int,
     p_documents  => array(select jsonb_array_elements_text($17::jsonb))
) as echange_id, $11::boolean as a_revoir, nullif($12::text,'') as raisons;
```
`queryReplacement` : ajout à la fin de `String($json.tokens_in ?? '')`, `String($json.tokens_out ?? '')`, `String($json.cout_usd ?? '')`, `String($json.latence_ms ?? '')`, `JSON.stringify($json.documents || [])`.

## 2. Procédure de test (après publication)

1. Dans n8n, ouvrir WF2, vérifier le brouillon, puis **Publier**.
2. Depuis un compte étudiant `est_test = true`, envoyer un mail à un personnage porte d'entrée.
3. Attendre le passage de WF2 (≤ 1 min). Dans **Executions**, vérifier que « Appel évaluateur » renvoie `choices[0].message.content` en JSON et un `usage` avec `cost`.
4. Lancer :
   ```sql
   select issue, tokens_in, tokens_out, cout_usd, latence_ms, documents_injectes, modele
   from echanges order by traite_at desc limit 3;
   ```
   Attendu pour la ligne `reponse` : jetons et coût non nuls (coût de l'ordre de 10⁻⁴ à 10⁻³ $), latence de quelques secondes (1 000 à 30 000 ms), `documents_injectes` = noms des documents façade (plus les documents métier si un fait est débloqué), `modele` = `éval: … / perso: …`.
5. Vérifier que la réponse reçue est normale : ton du personnage, signature exacte, pas de passage « à revoir » inattendu.
6. Facultatif : pour une branche sans LLM (réponse auto, en copie, refus), la ligne doit avoir `0` partout et `{}` pour `documents_injectes`.

En cas d'erreur sur un nœud HTTP, le message reste `en_cours` et repart après 10 min (3 essais max), comme avant. Faire alors le retour arrière ci-dessous.

## 3. Retour arrière

- **Avant publication** : rien à faire, la production tourne toujours sur `cb0b875e`. Pour jeter le brouillon : *Workflow → History → version cb0b875e → Restore*.
- **Après publication** : *Workflow → History → version cb0b875e (07/10/2026) → Restore*, puis **Publier**. Solution de secours : importer [WF2-publie-cb0b875e.json](WF2-publie-cb0b875e.json) (*Import from file*) dans le workflow et publier.
- Les lignes `echanges` écrites entre-temps restent valides : seules les colonnes de métriques diffèrent.

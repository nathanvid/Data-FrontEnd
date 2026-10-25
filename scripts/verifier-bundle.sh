#!/usr/bin/env bash
# Vérifie, APRÈS `npm run build`, que rien de secret n'a fuité dans le code envoyé au navigateur.
# Le code client se trouve dans .next/static : c'est exactement ce que télécharge le navigateur.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d .next/static ] || { echo "Lancez d'abord : npm run build"; exit 2; }
[ -f .env.local ] && set -a && . ./.env.local && set +a

echec=0
verifier() {  # $1 = libellé, $2 = motif à ne jamais trouver
  if [ -n "$2" ] && grep -rqF -- "$2" .next/static; then
    echo "✘ FUITE : $1 trouvé dans .next/static"; echec=1
  else
    echo "✔ $1 absent du code client"
  fi
}

verifier "la valeur de la clé service" "${SUPABASE_SERVICE_ROLE_KEY:-}"
verifier "le nom SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"
verifier "le client serveur (supabase-serveur)" "supabaseServeur"
verifier "l'appel rpc tableau_de_bord" "tableau_de_bord"

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "⚠ .env.local absent ou clé vide : la recherche de la VALEUR de la clé n'a pas été faite"
fi
exit $echec

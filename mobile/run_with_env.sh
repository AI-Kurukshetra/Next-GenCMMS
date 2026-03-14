#!/usr/bin/env bash
set -euo pipefail

if [ -f ../.env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source ../.env.local
  set +a
fi

SUPABASE_URL_VALUE="${NEXT_PUBLIC_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_ANON_VALUE="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

if [ -z "${SUPABASE_URL_VALUE}" ] || [ -z "${SUPABASE_ANON_VALUE}" ]; then
  echo "Missing Supabase env values. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in ../.env.local"
  exit 1
fi

flutter run \
  --dart-define=SUPABASE_URL="${SUPABASE_URL_VALUE}" \
  --dart-define=SUPABASE_ANON_KEY="${SUPABASE_ANON_VALUE}" \
  "$@"

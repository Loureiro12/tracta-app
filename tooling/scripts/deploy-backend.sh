#!/usr/bin/env bash
# Publishes the backend to the production Supabase project: migrations, Edge Functions and the
# Apple secrets. Seeds never go (they are local and E2E only).
#
#   pnpm deploy:backend                       # shows what would change, asks, then applies
#   APPLE_P8=~/Downloads/AuthKey_LH4DLC9UC6.p8 pnpm deploy:backend
#
# The Apple key file is only read when APPLE_P8 is set; its contents go straight to Supabase's
# secret store and are never printed or written anywhere else.
set -euo pipefail

PROJECT_REF="pmckwcbwknqmxnjcszwf" # tracta (us-east-2)
APPLE_TEAM_ID="G58V8BP6VH"
APPLE_KEY_ID="LH4DLC9UC6"
APPLE_CLIENT_ID="com.tracta.mobile"

cd "$(dirname "$0")/../.."

linked="$(cat supabase/.temp/project-ref 2>/dev/null || true)"
if [ "$linked" != "$PROJECT_REF" ]; then
  echo "✖ The CLI is linked to '${linked:-nothing}', not to tracta ($PROJECT_REF)."
  echo "  Run: supabase link --project-ref $PROJECT_REF"
  exit 1
fi

echo "▶ Migrations that would be applied:"
supabase db push --dry-run

functions=()
for dir in supabase/functions/*/; do
  [ -f "$dir/index.ts" ] && functions+=("$(basename "$dir")")
done
echo
echo "▶ Edge Functions to deploy: ${functions[*]}"
if [ -n "${APPLE_P8:-}" ]; then
  [ -f "$APPLE_P8" ] || { echo "✖ APPLE_P8 not found: $APPLE_P8"; exit 1; }
  echo "▶ Apple secrets to set: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY"
else
  echo "▶ Apple secrets: skipped (set APPLE_P8 to the .p8 file to send them)"
fi

echo
read -r -p "Apply to the production project tracta? Type 'tracta' to continue: " answer
[ "$answer" = "tracta" ] || { echo "Nothing was changed."; exit 1; }

supabase db push
for fn in "${functions[@]}"; do
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
done
if [ -n "${APPLE_P8:-}" ]; then
  supabase secrets set --project-ref "$PROJECT_REF" \
    APPLE_TEAM_ID="$APPLE_TEAM_ID" \
    APPLE_KEY_ID="$APPLE_KEY_ID" \
    APPLE_CLIENT_ID="$APPLE_CLIENT_ID" \
    APPLE_PRIVATE_KEY="$(cat "$APPLE_P8")"
fi

echo
echo "✔ Backend published. Pending migrations now:"
supabase db push --dry-run

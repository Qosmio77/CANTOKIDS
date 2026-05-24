#!/bin/bash
# Post-build patch for Expo web export
# Fixes: SyntaxError: Cannot use 'import.meta' outside a module
# Cause: Zustand uses import.meta.env.MODE which breaks classic script loading
# Fix: Replace import.meta with a production env mock object

set -e

DIST="${1:-dist}"
BUNDLE=$(ls "$DIST/_expo/static/js/web/"AppEntry-*.js 2>/dev/null | head -1)

if [ -z "$BUNDLE" ]; then
  echo "Error: No AppEntry bundle found in $DIST/_expo/static/js/web/"
  exit 1
fi

echo "Patching bundle: $BUNDLE"
BEFORE=$(grep -o 'import\.meta' "$BUNDLE" | wc -l | tr -d ' ')
sed -i'' 's/import\.meta/({"env":{"MODE":"production"}})/g' "$BUNDLE"
AFTER=$(grep -o 'import\.meta' "$BUNDLE" | wc -l | tr -d ' ')
echo "  import.meta occurrences: $BEFORE → $AFTER"

echo "Patching index.html: ensure defer on script tag"
sed -i'' 's|<script src="/_expo|<script defer src="/_expo|g' "$DIST/index.html"
echo "Done."

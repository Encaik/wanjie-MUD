#!/bin/bash
# File size checker for quality gate
# Limits: components=300, hooks=200, lib=500, data=800

EXIT_CODE=0

check_limit() {
  local file=$1
  local limit=$2
  local category=$3
  local lines=$(wc -l < "$file" 2>/dev/null || echo 0)

  if [ "$lines" -gt "$limit" ]; then
    echo "  [${category}] ${file}: ${lines} lines (limit: ${limit})"
    EXIT_CODE=1
  fi
}

echo "Checking file size limits..."
echo ""

# Components: 300 lines
echo "Components (limit: 300):"
find src/components -name "*.tsx" -o -name "*.ts" | while read f; do
  check_limit "$f" 300 "COMP"
done

# Hooks: 200 lines
echo "Hooks (limit: 200):"
find src/hooks -name "*.tsx" -o -name "*.ts" | while read f; do
  check_limit "$f" 200 "HOOK"
done

# Lib utilities: 500 lines (exclude data files)
echo "Lib utilities (limit: 500):"
find src/lib -name "*.ts" -not -path "*/data/*" -not -path "*/gameData/*" | while read f; do
  check_limit "$f" 500 "LIB "
done

# Data files: 800 lines
echo "Data files (limit: 800):"
find src/lib/data src/lib/gameData -name "*.ts" 2>/dev/null | while read f; do
  check_limit "$f" 800 "DATA"
done

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ All files within size limits"
else
  echo "✗ Some files exceed size limits"
fi

exit $EXIT_CODE

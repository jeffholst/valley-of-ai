#!/bin/bash

# Example: skip deploy when commit message has [skip deploy]
if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -q "\[skip deploy\]"; then
  echo "🛑 - Skipping deploy because commit message contains [skip deploy]"
  exit 0
fi

# Otherwise, allow the build
echo "✅ - Proceeding with deploy"
exit 1

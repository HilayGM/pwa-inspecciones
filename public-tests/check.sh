#!/usr/bin/env bash
set -euo pipefail
test -e 'tests/unit/' && test -e 'tests/integration/' && test -e 'tests/e2e/' && test -e 'docs/test-strategy.md' && test -e '.github/workflows/academic-evaluation.yml'
test -f README.md
! rg -n -i '(api[_-]?key|secret|password|token)' --glob '!public-tests/check.sh' .
echo PUBLIC_OK


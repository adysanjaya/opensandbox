#!/bin/bash
set -e
cd "$(dirname "$0")/../apps/api"
exec bun run src/index.ts

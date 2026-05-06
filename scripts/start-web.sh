#!/bin/bash
set -e
cd "$(dirname "$0")/../apps/web"
exec bun run dev

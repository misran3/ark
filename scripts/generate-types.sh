#!/bin/bash
set -e

# Generate TypeScript types from Pydantic models
# Run from repository root: ./scripts/generate-types.sh

echo "Generating TypeScript types from Pydantic models..."

# Ensure output directory exists
mkdir -p web/src/types

# Generate types using pydantic2ts
cd core && uv run pydantic2ts \
    --module shared.models \
    --output ../web/src/types/api.ts

echo "TypeScript types generated at web/src/types/api.ts"

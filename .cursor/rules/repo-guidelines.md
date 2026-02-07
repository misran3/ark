---
description: Ark project patterns and conventions
globs: "**/*"
alwaysApply: true
---

# Ark Development Patterns

## Monorepo Structure

- `web/` - Next.js 16 frontend
- `infrastructure/` - AWS CDK stacks
- `core/` - Python backend (uv workspace)

## Package Managers

| Directory | Manager | Commands |
|-----------|---------|----------|
| web/, infrastructure/ | Bun | `bun install`, `bun run`, `bunx` |
| core/ | uv | `uv sync`, `uv add`, `uv run` |

## Frontend Rules

- Next.js App Router (not Pages)
- React 19 with TypeScript strict mode
- TailwindCSS 4 utility classes
- No CSS-in-JS libraries

## Infrastructure Rules

- One CDK stack per concern (Auth, Storage, Api, Amplify)
- Stack dependencies explicit in `bin/app.ts`
- CfnOutput for cross-stack references
- Conditional removal policies (RETAIN for prod)

## Python Backend Rules

- AWS Lambda Powertools for all handlers
- Pydantic models for data validation
- Single-table DynamoDB design (PK/SK pattern)
- Type hints required (pyright strict)

## Lambda Handler Pattern

- APIGatewayRestResolver for REST routes
- Logger and Tracer decorators on handlers
- Correlation ID from API Gateway context
- ARM64 architecture, Python 3.12

## DynamoDB Access Pattern

- Composite keys: `PK=USER#{id}`, `SK=PROFILE`
- GSI for secondary access (email lookup)
- Pydantic models serialize to/from DynamoDB items
- Extend `DynamoDBClient` base class for new table clients

## AI Agent Pattern

- Pydantic AI with BedrockConverseModel
- RunContext for typed dependencies
- Instruction callbacks for dynamic prompts

## Don't Use

- express, vite, webpack (use Bun/Next.js)
- npm, yarn, pnpm (use Bun)
- pip, poetry, pipenv (use uv)
- dotenv (Bun auto-loads .env)
- better-sqlite3, pg, ioredis (use Bun built-ins if needed)

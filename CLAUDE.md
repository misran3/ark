# Ark - Project Guidelines

## Project Structure

```
ark/
├── web/            # Next.js 16 frontend (React 19, TailwindCSS 4)
├── infrastructure/ # AWS CDK stacks (TypeScript)
├── core/           # Python backend modules (uv workspace)
│   ├── lambda/     # Lambda handlers
│   ├── agent/      # Pydantic AI agents
│   ├── database/   # DynamoDB clients
│   └── shared/     # Shared utilities
└── conductor/      # Documentation
```

## TypeScript (web/, infrastructure/)

Use Bun instead of Node.js:
- `bun install` instead of npm/yarn/pnpm
- `bun run <script>` instead of npm run
- `bunx <pkg>` instead of npx

## Python (core/)

Use `uv` package manager:
- `uv sync --all-packages` to install all workspace packages
- `uv add <pkg>` to add dependencies
- Workspace imports via `[tool.uv.sources]` in pyproject.toml

## Frontend (web/)

- Next.js 16 with App Router
- React 19 with TypeScript strict mode
- TailwindCSS 4 for styling
- Run: `cd web && bun dev`

## Infrastructure (infrastructure/)

- AWS CDK v2 with TypeScript
- Stacks: Amplify, Auth, Storage, Api
- Deploy: `cd infrastructure && bunx cdk deploy --all`
- Stack dependencies defined in `bin/app.ts`

## Backend Patterns

### Lambda (Python)
- AWS Lambda Powertools for logging/tracing
- APIGatewayRestResolver for routing
- ARM64 architecture, Python 3.12

### DynamoDB
- Single-table design with composite keys (PK/SK)
- GSI on email for lookups
- Pydantic models with `to_dynamodb_item()` / `from_dynamodb_item()`
- Extend `DynamoDBClient` base class for new tables (provides put/get/delete/query/update)

### AI Agents
- Pydantic AI with BedrockConverseModel
- Claude Sonnet 4.5 via AWS Bedrock
- Type-safe RunContext with dependencies

## Environment Variables

Frontend (via SSM → Amplify):
- `NEXT_PUBLIC_USER_POOL_ID`
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_API_BASE_URL`

Lambda:
- `ENVIRONMENT`, `LOG_LEVEL`
- `USERS_TABLE_NAME`, `USERS_TABLE_EMAIL_INDEX`

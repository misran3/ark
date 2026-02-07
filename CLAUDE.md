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

## 3D / Three.js Skill Usage

When working on Three.js threat visuals, 3D components, or the R3F scene, always invoke these skills:

**React Three Fiber (built-in):**
- `r3f-shaders` — Custom GLSL, shaderMaterial, uniforms
- `r3f-geometry` — BufferGeometry, instancing, procedural meshes
- `r3f-materials` — PBR materials, shader materials, material properties
- `r3f-postprocessing` — Bloom, DOF, screen effects
- `r3f-animation` — useFrame, spring physics, keyframes
- `r3f-fundamentals` — Canvas, hooks, JSX elements, events
- `r3f-lighting` — Light types, shadows, environment lighting
- `r3f-textures` — Texture loading, environment maps, PBR sets
- `r3f-interaction` — Pointer events, controls, gestures
- `threejs-scene-builder` — Procedural generation, scene composition

**Installed specializations:**
- `particles-gpu` — GPU-instanced particle systems
- `shader-effects` — Advanced shader techniques (volumetric, lensing, energy)
- `three-best-practices` — Three.js performance, memory management, disposal
- `vfx-realtime` — Real-time VFX patterns for cinematic effects

## Development Workflow

### Commit Granularity

When implementing features from detailed plans:

**Prefer granular commits:**
- Follow the task structure specified in implementation plans
- One commit per logical task (e.g., "Task 5: Bridge Layout Component")
- Commit messages reference task numbers from the plan
- Benefits: easier code review, clearer git history, better bisection

**When consolidation is acceptable:**
- Tightly coupled changes that don't make sense separately
- Rapid prototyping or spike work
- Bug fixes touching multiple related areas

**Example - Good:**
```
feat: add boot sequence state machine (Task 1)
feat: add loading bar with boot text (Task 2)
feat: add eyelid reveal transition (Task 3)
```

**Example - Avoid:**
```
feat: add entire boot sequence system
(consolidates Tasks 1-4 into single commit)
```

### Code Review Checkpoints

For multi-task implementations:
- Request code review after every 3-5 tasks
- Use `/requesting-code-review` skill with proper git SHAs
- Address feedback before continuing to next batch
- Prevents compounding issues

## Environment Variables

Frontend (via SSM → Amplify):
- `NEXT_PUBLIC_USER_POOL_ID`
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_API_BASE_URL`

Lambda:
- `ENVIRONMENT`, `LOG_LEVEL`
- `USERS_TABLE_NAME`, `USERS_TABLE_EMAIL_INDEX`

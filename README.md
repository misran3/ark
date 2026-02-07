# Ark

> Your financial starship bridge, commanded by AI.

**Captain Nova leads a crew of 7 specialized AI agents**, each targeting a specific financial threat: fraud detection, debt spirals, budget overruns, wasteful subscriptions, missed rewards, and more. Threats appear as space hazards on your bridge — and Visa Transaction Controls let you deploy shields instantly.

*Built for TartanHacks 2026*

## The Problem

Traditional finance apps show spreadsheets and pie charts. Users still:
- Miss the $49/mo gym membership they haven't used in 47 days
- Watch dining spending creep to 142% of budget unnoticed
- Lose $500+/year using the wrong credit card for rewards
- React to fraud *after* the damage is done

**Ark takes a gamified approach.** Instead of passive dashboards, you command a starship bridge where financial threats are visualized as space hazards — with AI-powered analysis that tells you exactly what's wrong, why, and what to do about it.

## Threat Visualization

Financial threats materialize as space hazards on your bridge viewport:

| Threat | Visual | Detects |
|--------|--------|---------|
| ☄️ **Asteroid** | Tumbling rock debris | Unused subscriptions, missed card rewards |
| ⚡ **Ion Storm** | Crackling energy storm | Budget category overruns |
| 🌞 **Solar Flare** | Expanding plasma burst | Auto-renewing charges approaching |
| 🕳️ **Black Hole** | Gravitational vortex | Debt spirals, compounding interest |
| 🌀 **Wormhole** | Shimmering portal | Missed savings opportunities |
| 🚀 **Enemy Cruiser** | Hostile vessel | Fraud alerts, suspicious transactions |

Each threat displays real dollar amounts and specific merchant names — never vague warnings.

## Tech Stack

### Frontend
- **Next.js 16** + **React 19** — App Router, TypeScript strict mode
- **React Three Fiber** + **Three.js** — Real-time 3D threat visualization
- **TailwindCSS 4** — Styling
- **Zustand** — State management
- **GSAP** — Animations

### Backend
- **Python 3.12** — Lambda handlers with AWS Powertools
- **Pydantic AI** — Type-safe AI agent framework
- **Claude Haiku 3.5** via **AWS Bedrock** — Fast AI analysis
- **DynamoDB** — Single-table design with composite keys

### Infrastructure
- **AWS CDK v2** — Infrastructure as code
- **API Gateway** + **Cognito** — Secure REST API
- **AWS Amplify** — Hosting

### Integrations
- **Capital One Nessie API** — Banking data sandbox
- **Visa Transaction Controls** — Spending shields

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │  3D Bridge  │  │   HUD +     │  │      Captain Nova Panel     │  │
│  │  Viewport   │  │   Console   │  │      (Chat Interface)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────────┐
│                      AWS API GATEWAY + COGNITO                      │
└───────┬─────────────────────┬─────────────────────┬─────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  data-lambda  │   │ captain-lambda  │   │  visa-lambda    │
│  (Nessie API) │   │  (AI Analysis)  │   │ (Card Controls) │
└───────────────┘   └────────┬────────┘   └─────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      CAPTAIN NOVA           │
              │   Multi-Agent Orchestrator  │
              └──────────────┬──────────────┘
                             │ dispatches to
        ┌────────┬───────┬───┴───┬───────┬────────┬────────┐
        ▼        ▼       ▼       ▼       ▼        ▼        ▼
    ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
    │Fraud  ││Debt   ││Budget ││Wasted ││Missed ││Bills  ││Finance│
    │Detect ││Spirals││Overrun││Subscr.││Rewards││Due    ││Meaning│
    └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
                    7 Specialist Agents (Claude Haiku 3.5)
```

### Captain Nova's Crew

| Agent | Analyzes |
|-------|----------|
| **Fraud Detection** | Suspicious transactions, unusual merchants |
| **Debt Spirals** | Compounding interest, minimum payment traps |
| **Budget Overruns** | Category spending vs. 50/30/20 targets |
| **Wasteful Subscriptions** | Unused services, duplicate charges |
| **Missed Rewards** | Suboptimal card routing, lost cashback |
| **Upcoming Bills** | Auto-renewals, payment due dates |
| **Financial Meaning** | Plain-English summary of your situation |

## Team

- [**Benjamin Faibussowitsch**](https://www.linkedin.com/in/benjamin-faibussowitsch-516528153/)
- [**Mohammed Misran**](https://www.linkedin.com/in/mmisran)
- [**Akshat Sabavat**](https://www.linkedin.com/in/sabavatakshat/)
- [**Varun Shelke**](https://www.linkedin.com/in/vashelke/)

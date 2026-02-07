# VISA Integration Guide

## Overview

Module 2 implements VISA Transaction Controls (VTC) to allow Captain Nova to take real actions on spending limits and category blocks.

## Architecture

```
Frontend (React Hook)
    ↓
API Gateway (/api/visa/controls)
    ↓
VISA Lambda (handler.py)
    ↓
VisaService (visa_service.py)
    ↓ [X-Pay-Token signing]
VISA Sandbox API
```

## Authentication

We are using **API Key + Shared Secret (X-Pay-Token)** authentication (same mechanism validated in `core/scripts/visa_auth.py`).

Each request includes:
- `apiKey=<VISA_API_KEY>` as a query parameter
- `x-pay-token: xv2:<timestamp>:<hmac>` header

## Environment Variables

Set these in AWS Lambda Console or via CDK:

| Variable | Description | Example |
|----------|-------------|---------|
| `VISA_USER_ID` | VISA API Key (apiKey) used for X-Pay-Token | `F9ZNQD...` |
| `VISA_PASSWORD` | VISA Shared Secret used for X-Pay-Token | `********` |

## API Endpoints

### Create Control
```
POST /api/visa/controls
Body: VisaControlRule object
```

Example request:
```json
{
  "rule_id": "temp_id",
  "card_id": "4111111111111111",
  "control_type": "spending_limit",
  "threshold": 25.00,
  "merchant_categories": ["dining"],
  "is_active": true,
  "created_by": "captain_nova"
}
```

### Get Control
```
GET /api/visa/controls/{document_id}
```

### Delete Control
```
DELETE /api/visa/controls/{document_id}
```

## Frontend Usage

```tsx
import { useVisaControls } from '@/src/hooks/security/useSecurity';

function ShieldPanel() {
  const { controls, createControl, deleteControl } = useVisaControls();

  const activateShield = async () => {
    const rule = {
      rule_id: 'temp',
      card_id: 'card_001',
      control_type: 'spending_limit',
      threshold: 25.00,
      is_active: true,
      created_by: 'captain_nova',
    };
    await createControl(rule);
  };

  return (
    <div>
      {controls.map(c => (
        <div key={c.rule_id}>
          {c.control_type} - ${c.threshold}
          <button onClick={() => deleteControl(c.rule_id)}>Remove</button>
        </div>
      ))}
      <button onClick={activateShield}>Activate Shield</button>
    </div>
  );
}
```

## Deployment

After making changes:

```bash
cd infrastructure
bunx cdk deploy --all
```

This will:
1. Update the Lambda with the new VISA service code
2. Set the VISA environment variables
3. Deploy the new API Gateway routes

## Testing

1. Test the health endpoint:
```bash
curl https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/health
```

2. Test VISA control creation (after deploy):
```bash
curl -X POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/visa/controls \
  -H "Content-Type: application/json" \
  -d '{"rule_id":"test","card_id":"4111111111111111","control_type":"spending_limit","threshold":50,"is_active":true,"created_by":"user"}'
```

## Troubleshooting

### VISA API Returns 401
- Verify `VISA_USER_ID` (apiKey) and `VISA_PASSWORD` (shared secret) are set correctly
- Confirm your token-generation logic matches `core/scripts/visa_auth.py` (timestamp + resource_path + query_string + body)

### VISA API Returns 400
- Check the payload structure matches VISA's expected format
- Review CloudWatch logs for the exact error from VISA

## Prize Alignment

This integration is critical for the **VISA Intelligent Budget Planner** prize:

> "SynesthesiaPay doesn't just tell you you're overspending — it acts. Captain Nova uses VISA Transaction Controls to set real spending limits on your behalf. This is the Intelligent Budget Planner as an agentic system: AI that advises, then executes with your permission."

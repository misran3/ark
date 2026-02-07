# VISA Integration Guide

## Overview

Module 2 implements VISA Transaction Controls (VTC) to allow Captain Nova to take real actions on spending limits and category blocks.

## Architecture

```
Frontend (React Hook)
    ↓
API Gateway (/api/visa/controls)
    ↓
Data Lambda (handler.py)
    ↓
VisaService (visa_service.py)
    ↓ [mTLS with certs from S3]
VISA Sandbox API
```

## Certificate Setup

All certificates are stored in S3 and downloaded to Lambda `/tmp` on cold start:

| File | S3 Location | Purpose |
|------|-------------|---------|
| Client Cert | `s3://synesthesia-pay-artifacts/visa/visa-cert.pem` | Proves your identity to VISA |
| Private Key | `s3://synesthesia-pay-artifacts/visa/visa-pvtkey.pem` | Signs the mTLS handshake |
| Root CA | `s3://synesthesia-pay-artifacts/visa/visa-sbx.pem` | Verifies VISA's identity |

## Environment Variables

Set these in AWS Lambda Console or via CDK:

| Variable | Description | Example |
|----------|-------------|---------|
| `VISA_USER_ID` | Your VISA Developer Portal User ID | `ABC123XYZ` |
| `VISA_PASSWORD` | Your VISA Developer Portal Password | `********` |

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
2. Grant S3 read permissions for the certificate bucket
3. Set the VISA environment variables
4. Deploy the new API Gateway routes

## Testing

1. Verify certificates are accessible:
```bash
aws s3 ls s3://synesthesia-pay-artifacts/visa/
```

2. Test the health endpoint:
```bash
curl https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/health
```

3. Test VISA control creation (after deploy):
```bash
curl -X POST https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev/api/visa/controls \
  -H "Content-Type: application/json" \
  -d '{"rule_id":"test","card_id":"4111111111111111","control_type":"spending_limit","threshold":50,"is_active":true,"created_by":"user"}'
```

## Troubleshooting

### Certificate Download Fails
- Check Lambda IAM role has `s3:GetObject` on `synesthesia-pay-artifacts/visa/*`
- Verify files exist in S3: `aws s3 ls s3://synesthesia-pay-artifacts/visa/`

### VISA API Returns 401
- Verify `VISA_USER_ID` and `VISA_PASSWORD` are set correctly
- Check that certificates are valid (not expired)

### VISA API Returns 400
- Check the payload structure matches VISA's expected format
- Review CloudWatch logs for the exact error from VISA

## Prize Alignment

This integration is critical for the **VISA Intelligent Budget Planner** prize:

> "SynesthesiaPay doesn't just tell you you're overspending — it acts. Captain Nova uses VISA Transaction Controls to set real spending limits on your behalf. This is the Intelligent Budget Planner as an agentic system: AI that advises, then executes with your permission."

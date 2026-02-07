# Feature Spec: Enemy Cruiser Threat

**Feature ID:** `THREAT-006`
**Category:** Threat System
**Priority:** P1 (Important for full experience)
**Status:** 🔴 Not Started
**Current Version:** 0.0
**Target Version:** 1.0

---

## Overview

Enemy Cruisers represent **active financial attacks** — fraud attempts, identity theft risks, suspicious transactions, and credit score threats from late payments or collections. Unlike passive threats (subscriptions, overruns), Cruisers are HOSTILE and require immediate defensive action.

**The Core Magic:** Detailed 3D ship model with red hostile glow, aggressive movement patterns, lock-on targeting systems, and combat-style deflection that feels like protecting your financial identity.

---

## Visual Specification

### Ship Design

**Hull Structure:**
- Type: Sci-fi combat vessel (angular, aggressive design)
- Size: 3-4 units length (larger than other threats)
- Polygon count: 5,000-8,000 triangles (moderate detail)
- Material: Dark metallic with red accents
- Color scheme:
  - Hull: Dark gray (#1f2937)
  - Energy: Crimson red (#991b1b)
  - Highlights: Bright red (#dc2626)

**Ship Components:**
- **Bridge:** Forward section with glowing red viewport
- **Engines:** Rear thrusters with red particle exhaust
- **Weapons:** Side turrets that track player
- **Hull panels:** Segmented armor plates
- **Antenna array:** Communications spires (danger indicator)

**Hostile Indicators:**
- Red running lights pulsing (warning beacon)
- Weapon turrets glow red when charging
- Engine trail: Red particles (vs aurora colors for friendly)
- Searchlight: Red cone of light sweeping (scanning for target)

### Movement Behavior

**Spawning:**
- Initial position: Random point (radius 1000-1200 units)
- Entry: Warps in (brief flash, distortion effect)
- Initial state: Immediately locks onto player
- Speed: 1.2 units/second (faster than most threats)

**Aggressive Flight Pattern:**

Unlike passive threats that drift straight, Cruisers actively maneuver:

1. **Approach Phase (Zone 2-3):**
   - Weaves side-to-side (evasive pattern)
   - Occasional barrel roll
   - Maintains heading toward camera
   - Feels intentional, not random

2. **Combat Phase (Zone 3-4):**
   - Slows down (0.5 units/s)
   - Strafes laterally (holds distance, circles)
   - Rotates to face camera (hostile posture)
   - Weapon turrets track cursor position

3. **Attack Phase (Zone 4):**
   - Stops advancing (holds position 80-100 units)
   - Weapons charge (red glow intensifies)
   - Targeting laser appears (red beam to camera)
   - Countdown to attack (5 seconds)

**Evasion Behavior:**
- If deflection laser near-misses, Cruiser dodges
- Rolls to side, brief thruster burst
- Returns to attack pattern
- Makes Cruisers feel intelligent

### Hover State

**Trigger:** Cursor within 80px of ship center, cruiser in Zone 3+

**Visual Changes:**

1. **Target Lock:**
   - Targeting reticle snaps to ship
   - Reticle turns red (hostile)
   - Lock-on sound (beep beep beep, increasing speed)
   - Reticle shows ship health: 100%

2. **Ship Reacts:**
   - Weapon turrets rotate toward cursor
   - Red spotlight focuses on cursor
   - Engine glow intensifies (preparing to evade)
   - Hull panels shift (defensive posture)

3. **Threat Assessment Panel:**
   ```
   ⚠️ HOSTILE CRUISER DETECTED
   Identity: Fraudulent Transaction Attempt

   THREAT ANALYSIS:
   • Location: Amazon.com — Suspicious device
   • Amount: $847.99 (unauthorized)
   • Time: 2:34 AM EST (unusual hour)
   • IP Address: 185.220.XXX.XXX (Romania)

   RISK LEVEL: CRITICAL
   RECOMMENDED ACTION: Block transaction immediately

   DEFENSES AVAILABLE:
   ✓ VISA Fraud Protection
   ✓ Transaction Lock
   ✓ Device Authorization Required

   [ENGAGE DEFENSES] [ALLOW (Not Recommended)]
   ```

4. **Captain Nova Alert:**
   - Urgent, alarmed tone:
     > "Commander, hostile detected! That's a fraudulent transaction attempt from an unrecognized device. Recommend engaging defenses immediately!"

### Click Interaction: Defensive Engagement

**Phase 1: Weapons Lock (0-200ms)**

1. **Targeting Laser:**
   - Bright red laser fires from bottom of screen
   - Locks onto cruiser (follows if it moves)
   - Laser width increases (charging)
   - Warning sound (power-up hum)

2. **Cruiser Defensive Maneuver:**
   - Ship tries to dodge (banks hard left/right)
   - Laser follows (smart tracking)
   - Turrets return fire (red bolts, miss player)

**Phase 2: Shield Activation (200-600ms)**

1. **VISA Protection Shield:**
   - Blue energy shield materializes around player "ship"
   - Shield dome visible (translucent, hexagonal pattern)
   - Incoming fire deflects off shield (sparks)
   - Shield UI indicator appears: "FRAUD PROTECTION: ACTIVE"

2. **Transaction Block:**
   - Visual: Red "DECLINED" stamp appears over cruiser
   - Cruiser's weapons power down (glow fades)
   - Ship systems flicker (EMP effect)

**Phase 3: Countermeasure Strike (600-1200ms)**

1. **Laser Impact:**
   - Player laser hits cruiser
   - Explosion on hull (particle burst, red/orange)
   - Hull armor shatters (pieces fly off)
   - Ship health drops: 100% → 40%

2. **Cruiser Retreat:**
   - Ship banks sharply away
   - Engines flare to maximum (desperate escape)
   - Emits black smoke trail (damaged)
   - Rotates to flee orientation

**Phase 4: Threat Neutralized (1200-2000ms)**

1. **Final Strike (Optional):**
   - Second laser shot (finishing blow)
   - Cruiser explodes (large particle burst)
   - Debris scatters (hull fragments tumble)
   - Shockwave ripple

   OR

1. **Cruiser Escapes:**
   - Ship accelerates away (warp speed)
   - Leaves red trail, then gone
   - Threat removed but not destroyed (fled)

**Phase 5: Captain Nova Debrief (2000-2500ms)**

- Relieved tone:
  > "Threat neutralized! Transaction blocked and device flagged. VISA fraud protection prevented an $847.99 unauthorized charge. Your financial shields held, Commander."

**Phase 6: Security Log (2500ms+)**

- New entry appears in Command Center:
  ```
  SECURITY LOG — 2026-02-06 22:38:23
  ✓ Blocked: $847.99 fraudulent charge
  ✓ Device blacklisted: [Device ID]
  ✓ Account secured: 2FA required
  ```

### Alternative Interaction: Allow (Dangerous)

**If user clicks [ALLOW] instead of [ENGAGE DEFENSES]:**

**Confirmation Modal:**
```
⚠️⚠️⚠️ ALLOW SUSPICIOUS TRANSACTION? ⚠️⚠️⚠️

This transaction shows ALL fraud indicators:
• Unrecognized device
• Foreign IP address
• Unusual time (2:34 AM)
• High amount ($847.99)

Allowing will:
• Charge your card immediately
• Potentially compromise account
• May lead to identity theft

Are you ABSOLUTELY CERTAIN this is legitimate?

[CANCEL] [I'M SURE - ALLOW]
```

**If user confirms ALLOW:**

1. **Cruiser Passes Through:**
   - Ship doesn't attack
   - Glides past peacefully
   - Red lights turn amber (authorized)
   - Docks with shield (transaction approved)

2. **Charge Applied:**
   - Shield bar drops: -$847.99
   - Notification: "CHARGE APPROVED: $847.99"
   - High risk warning persists

3. **Captain Nova Concerned:**
   - Worried tone:
     > "Transaction authorized as requested, Commander. I hope that was legitimate. I'm enabling enhanced monitoring on your account."

### Impact State (Collision, No Defense)

**If cruiser reaches camera without being engaged:**

**Attack Sequence:**

1. **Weapons Fire:**
   - Multiple red laser bolts hit "camera"
   - Screen flashes red (multiple hits)
   - Explosive impacts (particle effects)
   - Camera shakes violently

2. **Massive Shield Damage:**
   - All shield bars drop 15-20%
   - Fraud alert: "UNAUTHORIZED CHARGE: $847.99"
   - Account compromise warning
   - Credit monitoring alert triggered

3. **Identity Theft Cascade:**
   - Additional cruisers may spawn (follow-on fraud)
   - Account lock initiated (security measure)
   - Credit score impact: -25 points
   - Multiple security alerts

4. **Captain Nova Panic:**
   - Alarmed, urgent:
     > "We've been breached! Unauthorized charge posted and account may be compromised. Initiating emergency security protocols. Lock down all financial access!"

5. **Emergency Lockdown UI:**
   - Red alert mode activated
   - All transactions temporarily blocked
   - Security wizard appears: "ACCOUNT RECOVERY"
   - Must complete 2FA verification to restore access

6. **Cruiser Aftermath:**
   - Ship doesn't leave — stays in area (looting)
   - Spawns additional threats (identity theft consequences)
   - Requires active security response to clear
   - Most severe threat impact

---

## Technical Requirements

### Dependencies

**Required Packages:**
- `three` (^0.182.0) - 3D model, animations
- `@react-three/fiber` (^9.5.0) - React integration
- `@react-three/drei` (^10.7.7) - useGLTF, useAnimations

**Required Assets:**
- `models/enemy-cruiser.glb` - Ship 3D model
- `textures/cruiser-hull.jpg` - Hull texture
- `textures/cruiser-emissive.jpg` - Red glow map
- `audio/targeting-lock.mp3` - Lock-on beeping
- `audio/laser-fire.mp3` - Weapon sound
- `audio/explosion.mp3` - Ship destruction
- `audio/alarm-klaxon.mp3` - Red alert sound

### AI Fraud Detection Integration

**Backend: Fraud Analyzer**

```python
# In threat_analyzer.py
def detect_fraud_threats(transactions: list[Transaction]) -> list[Threat]:
    """Analyze transactions for fraud indicators."""
    fraud_threats = []

    for txn in transactions:
        risk_score = calculate_fraud_risk(txn)

        if risk_score > 0.7:  # High risk threshold
            fraud_threats.append(Threat(
                type='enemy-cruiser',
                severity=risk_score,
                name=f"Fraudulent Transaction Attempt",
                description=f"{txn.merchant} — {get_fraud_indicators(txn)}",
                impact_amount=txn.amount,
                days_until_impact=0,  # Immediate threat
                metadata={
                    'transaction_id': txn.id,
                    'fraud_indicators': get_fraud_indicators(txn),
                    'risk_score': risk_score,
                    'ip_address': txn.ip_address,
                    'device_id': txn.device_id,
                }
            ))

    return fraud_threats

def calculate_fraud_risk(txn: Transaction) -> float:
    """Calculate fraud risk score (0-1)."""
    risk = 0.0

    # Unusual time (2 AM - 5 AM)
    if 2 <= txn.timestamp.hour <= 5:
        risk += 0.2

    # Unusual location (foreign country)
    if txn.country != user.home_country:
        risk += 0.3

    # Unrecognized device
    if txn.device_id not in user.known_devices:
        risk += 0.3

    # High amount (> $500)
    if txn.amount > 500:
        risk += 0.2

    return min(risk, 1.0)
```

---

## Acceptance Criteria

### ✅ Visual Quality

- [ ] Ship model looks hostile and aggressive
- [ ] Red glow clearly indicates danger
- [ ] Movement feels intentional (not random drift)
- [ ] Weapon turrets track realistically
- [ ] Explosion is satisfying (good particle count, timing)

### ✅ Interaction Quality

- [ ] Target lock feels responsive (immediate feedback)
- [ ] Defense engagement is clear (shield visual)
- [ ] Transaction block is unambiguous ("DECLINED" stamp)
- [ ] Allow option exists but requires strong confirmation
- [ ] Impact sequence is alarming (motivates prevention)

### ✅ Threat Communication

- [ ] Cruiser clearly represents fraud (not subscription/debt)
- [ ] Fraud indicators are listed (helps user learn)
- [ ] Immediate action required (not passive threat)
- [ ] Consequences of ignoring are severe (appropriate to fraud)

### ✅ Integration

- [ ] Connects to real VISA fraud detection data
- [ ] Transaction blocking actually blocks transaction
- [ ] Security log entries persist
- [ ] Credit monitoring integration works

---

## Brainstormed Enhancements

### Visual Enhancements

**1. Stealth Approach**
Cruiser starts CLOAKED — a Predator-style refraction shimmer that's barely visible against the starfield. Only becomes fully visible when the targeting system detects and locks on. This represents how fraud starts hidden and requires detection to reveal. The "de-cloak" moment (shimmer -> solid hostile ship) should be a dramatic reveal.

**2. Electronic Warfare Interference**
The cruiser actively scrambles nearby UI elements. Text garbles and re-corrects. Numbers briefly show wrong values. Panel borders flicker and distort. The effect intensifies with proximity. This represents the chaos that identity theft causes to your financial information — your own data becomes unreliable.

**3. Warp-In Entry**
Cruisers don't drift in from distance like other threats. They WARP IN — a sudden space distortion, a flash, and the ship is there at medium range. No warning from the distance. This communicates the sudden nature of fraud. One moment everything's fine, the next you're under attack.

**4. Fleet Escalation**
If account is under coordinated attack (multiple fraudulent transactions), cruisers arrive in formation — 3-5 ships in V-pattern. Each represents a different fraudulent charge. They coordinate their approach, sharing targeting data (visible data streams between ships). Defeating the lead ship doesn't stop the others.

### Interaction Enhancements

**5. Shield Frequency Matching**
Deflection isn't just a click — the user must "match shield frequency" by selecting the correct verification method (2FA code, biometric confirm, security question). A simple 1-second interactive moment that represents the verification step and makes the defense feel earned.

**6. Wreckage Intelligence**
After defeating a cruiser, its debris field can be "scanned" (hover over wreckage for 2 seconds). The scan reveals intelligence about the fraud: origin location, device used, attack pattern. This serves as an educational moment — users learn what fraud indicators look like while feeling like they're conducting post-battle analysis.

**7. Cruiser Personality**
Different fraud types get different cruiser variants:
- **Interceptor** (small, fast): Single suspicious transaction
- **Destroyer** (medium, armed): Multiple related fraud attempts
- **Dreadnought** (large, heavily armored): Full identity theft attempt
Each has distinct silhouette and threat level, making the threat type readable at a glance.

**8. Hackathon Reframe**
For demo purposes, reframe from real-time fraud interception to "Security Review" mode. Show historical fraud that was caught, present it as a battle replay. This avoids the liability concern of users manually approving/blocking live transactions, while keeping the dramatic combat interaction.

---

## Related Features

- `BACKEND-001`: Threat Detection Engine (spawns cruisers from fraud data)
- `BACKEND-002`: VISA Controls API (blocks charges)
- `UI-008`: Security Log Panel (shows blocked attempts)
- `FINANCIAL-007`: Identity Protection System

---

## Implementation Checklist

### Phase 1: Ship Model & Rendering
- [ ] Load enemy-cruiser.glb model
- [ ] Apply hull and emissive textures
- [ ] Implement red glow shader
- [ ] Test on starfield background

### Phase 2: Movement & Behavior
- [ ] Implement spawning logic (random radius 1000-1200 units)
- [ ] Code approach/combat/attack phases
- [ ] Implement evasion dodging behavior
- [ ] Add sine-wave strafing pattern

### Phase 3: Hover & Targeting
- [ ] Create targeting reticle (red, with health display)
- [ ] Implement threat assessment panel UI
- [ ] Add lock-on beeping audio
- [ ] Weapon turret tracking animation

### Phase 4: Click Interaction - Defensive Sequence
- [ ] Implement weapons lock laser (0-200ms)
- [ ] Add cruiser evasion maneuvers
- [ ] Build VISA protection shield visualization
- [ ] Create transaction block "DECLINED" stamp

### Phase 5: Countermeasure & Aftermath
- [ ] Implement laser impact explosion
- [ ] Add cruiser retreat animation
- [ ] Build security log UI panel
- [ ] Integrate Captain Nova debrief dialogue

### Phase 6: Documentation & Cleanup
- [ ] Update this feature spec: set Status to 🟢 Complete, bump Current Version, add Revision History entry
- [ ] Update `MASTER-synesthesiapay-bridge.md`: change this feature's status in the Feature Catalog table
- [ ] Update `IMPLEMENTATION-GUIDE.md`: note progress in any relevant phase tracking
- [ ] Commit documentation changes separately from code: `docs: mark enemy-cruiser-threat as complete`

---

## Completion Protocol

When this feature's implementation is finished and all acceptance criteria pass, the implementing agent **must** update the following documents before considering the work done:

1. **This feature spec** — Set `Status` to 🟢 Complete (or 🔵 Needs Polish if partially done), update `Current Version`, and add a row to the Revision History table.
2. **Master Document** (`docs/plans/MASTER-synesthesiapay-bridge.md`) — Update this feature's row in the Feature Catalog to reflect the new status.
3. **Implementation Guide** (`docs/plans/IMPLEMENTATION-GUIDE.md`) — Record any learnings, update phase progress tracking, and note actual vs estimated time if a build guide was created.

These documentation updates should be committed separately from code changes. See the Implementation Guide's [Status Updates](../IMPLEMENTATION-GUIDE.md#status-updates) section for detailed instructions.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.0 | 2026-02-06 | Specification created |
| 1.0 | TBD | Full implementation with fraud integration |

---

**Status:** Ready for ship model creation and fraud detection integration.

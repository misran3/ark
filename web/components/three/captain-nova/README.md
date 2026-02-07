# Captain Nova - Modular Character System

Captain Nova is a procedurally generated holographic character built with React Three Fiber, featuring advanced shader effects and sophisticated animations.

## Architecture

```
captain-nova/
├── index.tsx                 # Main composition component
├── Character.tsx             # Character mesh component
├── ProjectionBase.tsx        # Projection platform/ring/cone
├── geometry.ts               # Procedural geometry functions
├── materials.ts              # Hologram shader materials
├── hooks/                    # Animation hooks
│   ├── useNovaAnimations.ts  # Composite animation hook
│   ├── useBreathing.ts       # Breathing animation
│   ├── useWeightShift.ts     # Weight shift animation
│   ├── useHeadTracking.ts    # Head tracking (cursor)
│   └── useGlitchEffect.ts    # Glitch shader effect
└── examples/                 # Usage examples
```

## Quick Start

### Basic Usage

```tsx
import CaptainNova from '@/components/three/captain-nova';

function Scene() {
  return (
    <Canvas>
      <CaptainNova position={[-4, -2, 0]} />
    </Canvas>
  );
}
```

### Custom Geometry

```tsx
import CaptainNova from '@/components/three/captain-nova';

function Scene() {
  return (
    <Canvas>
      <CaptainNova
        position={[0, 0, 0]}
        geometryConfig={{
          baseHeight: 2.0,  // Taller
          headRadius: 0.15,  // Bigger head
          torsoWidth: 0.3,   // Wider body
        }}
      />
    </Canvas>
  );
}
```

### Custom Animations

```tsx
import CaptainNova from '@/components/three/captain-nova';

function Scene() {
  return (
    <Canvas>
      <CaptainNova
        animationConfig={{
          breathing: {
            cycleDuration: 6,  // Slower breathing
            scaleAmount: 0.04,  // More dramatic
          },
          weightShift: {
            minInterval: 5,
            maxInterval: 10,  // More frequent shifts
          },
          headTracking: {
            maxRotationY: 0.3,  // Wider tracking range
            lerpSpeed: 0.1,  // Faster tracking
          },
          glitch: {
            frequency: 0.005,  // More frequent glitches
            intensity: 0.8,
          },
          idleSway: {
            enabled: true,
            speed: 0.5,  // Faster sway
            amount: 0.06,  // Wider sway
          },
        }}
      />
    </Canvas>
  );
}
```

### Disable Specific Animations

```tsx
import CaptainNova from '@/components/three/captain-nova';

function Scene() {
  return (
    <Canvas>
      <CaptainNova
        animationConfig={{
          weightShift: { enabled: false },
          glitch: { enabled: false },
          idleSway: { enabled: false },
        }}
      />
    </Canvas>
  );
}
```

## Advanced Usage

### Using Individual Modules

```tsx
import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { assembleCharacter } from '@/components/three/captain-nova/geometry';
import { createHologramMaterial } from '@/components/three/captain-nova/materials';
import { useNovaAnimations } from '@/components/three/captain-nova/hooks/useNovaAnimations';

function CustomNova() {
  const characterRef = useRef(null);
  const materialRef = useRef(null);

  // Use individual hooks
  useNovaAnimations(characterRef, materialRef, {
    breathing: { cycleDuration: 5 },
  });

  // Build your own composition
  return (
    <group>
      {/* Your custom implementation */}
    </group>
  );
}
```

### Custom Shaders

You can extend the hologram shader:

```typescript
import {
  hologramVertexShader,
  hologramFragmentShader,
  createHologramMaterial,
} from '@/components/three/captain-nova/materials';

// Extend fragment shader
const customFragmentShader = `
  ${hologramFragmentShader}
  // Add your custom effects here
`;

const material = new THREE.ShaderMaterial({
  vertexShader: hologramVertexShader,
  fragmentShader: customFragmentShader,
  // ...
});
```

## Configuration Options

### GeometryConfig

```typescript
interface NovaGeometryConfig {
  baseHeight?: number;      // Character height (default: 1.8)
  headRadius?: number;      // Head size (default: 0.12)
  torsoWidth?: number;      // Torso width (default: 0.22)
  shoulderWidth?: number;   // Shoulder span (default: 0.3)
  armLength?: number;       // Arm length (default: 0.4)
  legLength?: number;       // Leg length (default: 0.55)
}
```

### AnimationConfig

```typescript
interface NovaAnimationConfig {
  breathing?: {
    enabled?: boolean;
    cycleDuration?: number;  // seconds (default: 4)
    scaleAmount?: number;    // percentage (default: 0.02 = 2%)
  };
  weightShift?: {
    enabled?: boolean;
    minInterval?: number;    // seconds (default: 8)
    maxInterval?: number;    // seconds (default: 16)
    rotationAmount?: number; // radians (default: 0.05)
  };
  headTracking?: {
    enabled?: boolean;
    maxRotationY?: number;   // radians (default: 0.15)
    maxRotationX?: number;   // radians (default: 0.1)
    lerpSpeed?: number;      // 0-1 (default: 0.05)
  };
  glitch?: {
    enabled?: boolean;
    frequency?: number;      // 0-1 (default: 0.002)
    intensity?: number;      // 0-1 (default: 0.5)
    cooldownMs?: number;     // milliseconds (default: 100)
  };
  idleSway?: {
    enabled?: boolean;
    speed?: number;          // multiplier (default: 0.3)
    amount?: number;         // radians (default: 0.03)
  };
}
```

## Performance

- **Polygon Count:** ~3,000 triangles
- **Draw Calls:** 17 (16 meshes + 1 projection base)
- **Target FPS:** 60
- **Memory:** ~15MB

### Optimization Tips

1. **Disable unused animations:**
   ```tsx
   <CaptainNova
     animationConfig={{
       weightShift: { enabled: false },
       glitch: { enabled: false },
     }}
   />
   ```

2. **Reduce geometry detail:**
   ```tsx
   <CaptainNova
     geometryConfig={{
       baseHeight: 1.5,  // Smaller = fewer pixels to shade
     }}
   />
   ```

3. **LOD (future):**
   Use `<Detailed>` from drei to swap geometry at distance

## Integration with UI

The character is designed to be integrated separately from UI systems. Another component/system should handle:

- Speech bubble overlays
- Voice synthesis integration
- Interaction event handling
- Screen positioning/scaling

This component only handles:
- 3D rendering
- Holographic shader effects
- Idle animations
- Basic cursor tracking

## Testing

```bash
# Type check
bunx tsc --noEmit

# Build test
bun run build

# Visual test
bun dev
# Navigate to scene with CaptainNova
```

## Migration from Legacy Component

**Old:**
```tsx
import CaptainNova from '@/components/three/CaptainNova';
```

**New:**
```tsx
import CaptainNova from '@/components/three/captain-nova';
```

The old import path still works (backward compatible wrapper) but is deprecated.

## Related Documentation

- Technical Deep Dive: `web/components/three/CAPTAIN_NOVA_README.md`
- Customization Guide: `web/components/three/CAPTAIN_NOVA_CUSTOMIZATION.md`
- Implementation Summary: `docs/CAPTAIN_NOVA_V2_SUMMARY.md`
- Original Spec: `docs/plans/features/captain-nova-hologram.md`

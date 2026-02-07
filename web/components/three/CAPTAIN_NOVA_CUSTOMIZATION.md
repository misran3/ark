# Captain Nova - Customization Guide

Quick reference for adjusting Captain Nova's appearance and behavior.

---

## Character Proportions

Edit the `createNovaGeometry()` function:

```typescript
// Character height (life-sized = 1.8)
const baseHeight = 1.8; // Change this to make taller/shorter

// Head size
const headRadius = 0.12; // Increase for larger head

// Body width (affects torso, hips, shoulders)
const torsoWidth = 0.22;     // Torso width
const shoulderWidth = 0.3;   // Shoulder span
const hipWidth = 0.2;        // Hip width

// Limb proportions
const armLength = 0.4;  // Arm length
const legLength = 0.55; // Leg length
const armWidth = 0.045; // Arm thickness
const legWidth = 0.06;  // Leg thickness
```

---

## Shader Effects Intensity

Edit the shader uniforms or fragment shader:

### Overall Transparency
```typescript
// In component:
hologramOpacity: { value: 0.8 } // 0.0-1.0 (default: 0.8 = 80%)
```

### Scanline Intensity
```glsl
// In fragment shader:
float scanlineFrequency = 80.0; // More lines = denser effect
float scanlineSpeed = 0.5;      // Faster = quicker scrolling
```

### Fresnel Glow Strength
```glsl
// In fragment shader:
fresnel = pow(fresnel, 2.5); // Higher = tighter edge glow (1.0-5.0)
finalColor += auroraGradient * fresnel * 0.3; // Adjust 0.3 (glow intensity)
```

### Glitch Effect Frequency
```typescript
// In useFrame:
if (Math.random() < 0.002) { // 0.002 = ~1-2 times per 10s
  hologramMaterial.uniforms.uGlitchIntensity.value = 0.5; // Strength (0.0-1.0)
}
```

### Particle Noise Density
```glsl
// In fragment shader:
particleNoise = step(0.98, particleNoise); // 0.98 = 2% of pixels
finalColor += vec3(particleNoise * 0.5);   // Brightness (0.0-1.0)
```

---

## Animation Speed & Timing

### Breathing Animation
```typescript
// In useFrame:
breathPhase.current = time * (Math.PI / 2); // Divide by larger number to slow down
const breathe = Math.sin(breathPhase.current) * 0.02 + 1; // 0.02 = ±2% scale
```

**Examples:**
- Slower breathing: `time * (Math.PI / 3)` (6-second cycle)
- Faster breathing: `time * Math.PI` (2-second cycle)
- More pronounced: `* 0.04 + 1` (±4% scale)

### Weight Shift Timing
```typescript
// In component:
const nextWeightShift = useRef(Math.random() * 8 + 8); // 8-16 seconds

// To change range:
// More frequent: Math.random() * 4 + 4  (4-8 seconds)
// Less frequent: Math.random() * 12 + 12  (12-24 seconds)
```

### Weight Shift Amount
```typescript
// In useFrame:
hips.rotation.z = shiftDirection * 0.05; // 0.05 radians = ~3 degrees

// More dramatic: 0.1 (6 degrees)
// More subtle: 0.03 (1.7 degrees)
```

### Head Tracking Speed
```typescript
// In useFrame:
const targetRotationY = mouse.x * 0.15; // 0.15 = ±15 degrees range
head.rotation.y += (targetRotationY - head.rotation.y) * 0.05; // 0.05 = lerp speed

// Faster tracking: * 0.1
// Slower tracking: * 0.02
// Wider range: mouse.x * 0.3
```

### Idle Sway
```typescript
// In useFrame:
groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;

// Faster: time * 0.6 (faster oscillation)
// Wider: * 0.06 (6-degree range)
// Disable: Comment out this line
```

---

## Projection Base

### Platform Size & Opacity
```tsx
<mesh position={[0, -0.05, 0]}>
  <cylinderGeometry args={[0.4, 0.45, 0.08, 32]} />
  {/* args: [topRadius, bottomRadius, height, segments] */}
  <meshBasicMaterial color={colors[0]} opacity={0.25} transparent />
  {/* opacity: 0.0-1.0 */}
</mesh>
```

### Holographic Ring
```tsx
<mesh position={[0, -0.04, 0]}>
  <ringGeometry args={[0.38, 0.42, 32]} />
  {/* args: [innerRadius, outerRadius, segments] */}
  <meshBasicMaterial color={colors[1]} opacity={0.4} transparent />
</mesh>
```

### Light Cone
```tsx
<mesh position={[0, 0.8, 0]}>
  <coneGeometry args={[0.45, 1.7, 32, 1, true]} />
  {/* args: [radius, height, segments, heightSegments, open] */}
  <meshBasicMaterial color={colors[0]} opacity={0.04} transparent />
  {/* Lower opacity (0.04) for very subtle effect */}
</mesh>
```

---

## Positioning

### Global Position
```tsx
// In your scene:
<CaptainNova position={[-4, -2, 0]} />

// X: Negative = left, Positive = right
// Y: Negative = below center, Positive = above
// Z: Negative = further away, Positive = closer
```

**Common Positions:**
- Left side (default): `[-4, -2, 0]`
- Right side: `[4, -2, 0]`
- Center: `[0, -2, 0]`
- Higher: `[-4, 0, 0]`
- Closer: `[-4, -2, 2]`

---

## Uniform Details

### Chest Emblem
```typescript
// In createNovaGeometry():
const emblemGeo = new THREE.CircleGeometry(0.04, 16);
// args: [radius, segments]

emblem.position.set(0, torso.position.y + 0.15, torsoDepth / 2 + 0.001);
// Adjust Y offset (0.15) to move up/down on torso
```

### Shoulder Pads
```typescript
const shoulderPadGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
// args: [width, height, depth]

// Make bigger: new THREE.BoxGeometry(0.12, 0.06, 0.08)
// Make smaller: new THREE.BoxGeometry(0.06, 0.03, 0.04)
```

---

## Color Themes

### Aurora Colors (Automatic)
Colors automatically sync with global aurora system. No manual changes needed.

```typescript
const colors = useAuroraColors(); // Returns [color1, color2]

// These update every frame in useFrame:
hologramMaterial.uniforms.uAuroraColor1.value.set(colors[0]);
hologramMaterial.uniforms.uAuroraColor2.value.set(colors[1]);
```

### Override Aurora Colors (Not Recommended)
```typescript
// If you must use fixed colors:
hologramMaterial.uniforms.uAuroraColor1.value.set('#00ffff'); // Cyan
hologramMaterial.uniforms.uAuroraColor2.value.set('#ff00ff'); // Magenta

// But this breaks visual cohesion with UI!
```

---

## Performance Tuning

### Reduce Shader Complexity
```glsl
// In fragment shader:

// DISABLE particle noise (saves ~10% GPU):
// float particleNoise = noise(finalUV * 100.0 + uTime * 2.0);
// particleNoise = step(0.98, particleNoise);
// finalColor += vec3(particleNoise * 0.5); // Comment out these lines

// REDUCE scanline frequency (saves ~5% GPU):
float scanlineFrequency = 40.0; // Down from 80.0

// DISABLE glitch effect (saves CPU):
// if (Math.random() < 0.002) { ... } // Comment out in useFrame
```

### Reduce Polygon Count
```typescript
// In createNovaGeometry(), reduce segment count:

// Head (sphere)
const headGeo = new THREE.SphereGeometry(headRadius, 12, 12); // Down from 24, 24

// Arms/legs (cylinders)
const armGeo = new THREE.CylinderGeometry(armWidth, armWidth * 0.8, armLength, 6); // Down from 10

// Result: ~1,500 triangles instead of ~3,000
```

### Throttle Animation Updates
```typescript
// Update animations at 30fps instead of 60fps:
const frameCount = useRef(0);

useFrame(({ clock, mouse }) => {
  frameCount.current++;
  if (frameCount.current % 2 !== 0) return; // Skip every other frame

  // ... animation code
});
```

---

## Debugging

### Make Hologram Solid (Easier to See Geometry)
```typescript
hologramOpacity: { value: 1.0 } // Fully opaque

// In fragment shader:
float alpha = 1.0; // Override all transparency
```

### Disable Shader Effects (Isolate Issues)
```glsl
// In fragment shader, simplify to basic color:
void main() {
  gl_FragColor = vec4(uAuroraColor1, 0.8); // Solid aurora color, 80% opacity
}
```

### Show Wireframe
```typescript
// Apply to all meshes:
character.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true
    });
  }
});
```

### Log Animation Values
```typescript
// In useFrame:
console.log('Breathe:', breathe);
console.log('Head Rotation:', head.rotation.y);
console.log('Glitch Intensity:', hologramMaterial.uniforms.uGlitchIntensity.value);
```

---

## Advanced Customization

### Add New Body Parts

1. Create geometry:
```typescript
const newPartGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const newPart = new THREE.Mesh(newPartGeo);
```

2. Position it:
```typescript
newPart.position.set(x, y, z);
newPart.name = 'newPart'; // For later reference
```

3. Add to character:
```typescript
character.add(newPart);
```

4. Animate (optional):
```typescript
// In useFrame:
const newPart = characterRef.current.getObjectByName('newPart');
if (newPart) {
  newPart.rotation.y += delta; // Rotate
}
```

### Add Emissive Glow to Specific Parts

```typescript
// In createNovaGeometry(), for emblem:
const emblemMaterial = new THREE.MeshBasicMaterial({
  color: colors[1],
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending // Makes it glow
});

emblem.material = emblemMaterial; // Don't use hologram shader for this part
```

---

## Quick Presets

### "Ghost Mode" (Ultra Transparent)
```typescript
hologramOpacity: { value: 0.3 } // 30% opacity
```
```glsl
float baseAlpha = uOpacity * 0.3; // Very faint
```

### "Solid Hologram" (More Visible)
```typescript
hologramOpacity: { value: 1.0 } // 100% opacity
```
```glsl
float baseAlpha = uOpacity * 0.95; // Almost solid
```

### "Glitch Storm" (Frequent Glitches)
```typescript
if (Math.random() < 0.01) { // 10x more frequent
  hologramMaterial.uniforms.uGlitchIntensity.value = 0.8; // Stronger
}
```

### "Calm Presence" (No Glitches, No Sway)
```typescript
// In useFrame, comment out:
// groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;

// Remove glitch trigger:
// if (Math.random() < 0.002) { ... }
```

### "Heavy Breathing" (Dramatic)
```typescript
const breathe = Math.sin(breathPhase.current) * 0.06 + 1; // ±6%
```

---

## Cheat Sheet

| What to Change | Where | Default | Range |
|----------------|-------|---------|-------|
| Overall Transparency | `hologramOpacity` uniform | 0.8 | 0.0-1.0 |
| Character Height | `baseHeight` | 1.8 | 1.0-3.0 |
| Scanline Speed | `scanlineSpeed` shader | 0.5 | 0.1-2.0 |
| Glitch Frequency | `Math.random() < X` | 0.002 | 0.001-0.01 |
| Breathing Speed | `time * (Math.PI / X)` | 2 | 1-5 |
| Head Tracking Range | `mouse.x * X` | 0.15 | 0.05-0.5 |
| Fresnel Glow Power | `pow(fresnel, X)` | 2.5 | 1.0-5.0 |
| Weight Shift Interval | `Math.random() * X + X` | 8+8 | 4+4 to 20+20 |

---

## Tips

✅ **DO:**
- Test changes in small increments
- Keep backup of working values
- Use console.log to debug animations
- Adjust one parameter at a time

❌ **DON'T:**
- Change aurora color (breaks UI cohesion)
- Make opacity too high (loses hologram feel)
- Make animations too fast (feels jittery)
- Disable multiple shader effects at once (hard to debug)

---

## Need Help?

Check these files:
- `CaptainNova.tsx` - Main component code
- `CAPTAIN_NOVA_README.md` - Technical deep dive
- `CAPTAIN_NOVA_V2_SUMMARY.md` - Implementation overview

Or adjust values and see what happens! Captain Nova is designed to be resilient to parameter changes.

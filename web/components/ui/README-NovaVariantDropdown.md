# NovaVariantDropdown Component

## Overview

A dropdown selector for Captain Nova variants, supporting both built-in skeletal animation and community-uploaded GLB models.

## Usage

### Basic Example

```tsx
import { NovaVariantDropdown, NovaVariant } from '@/components/ui/NovaVariantDropdown';

const variants: NovaVariant[] = [
  { type: 'skeletal', label: 'A: Skeletal-less Hierarchical' },
  { type: 'community', label: 'Custom Model', path: '/3D/model.glb' },
];

function MyComponent() {
  const [selected, setSelected] = useState(variants[0]);

  return (
    <NovaVariantDropdown
      value={selected}
      onChange={setSelected}
      variants={variants}
    />
  );
}
```

### With Context (Main Bridge)

```tsx
import { useNovaVariant } from '@/contexts/NovaVariantContext';
import { NovaVariantDropdown } from '@/components/ui/NovaVariantDropdown';

function MyComponent() {
  const { activeVariant, setActiveVariant, availableVariants } = useNovaVariant();

  return (
    <NovaVariantDropdown
      value={activeVariant}
      onChange={setActiveVariant}
      variants={availableVariants}
    />
  );
}
```

## Types

### NovaVariant

```typescript
type NovaVariant =
  | { type: 'skeletal'; label: string }
  | { type: 'community'; label: string; path: string };
```

**skeletal**: Built-in primitive-based character with hologram shader
**community**: GLB model loaded from path

## Scanning for Community Models

Use server-side utilities in `web/lib/nova-variants.ts`:

```typescript
import { getAllNovaVariants } from '@/lib/nova-variants';

// In server component or getStaticProps
const variants = getAllNovaVariants();
```

This scans `web/3D/*.glb` and returns all available variants.

## Styling

Component uses TailwindCSS with cyan/cyberpunk theme matching the bridge UI:
- Hover effects with cyan glow
- Dropdown slides down with backdrop blur
- Selected item marked with checkmark
- Community variants show filename hint

## Integration Points

1. **Dev Page** (`/dev-captain-nova`): Independent dropdown with local state
2. **Main Bridge** (`/`): Uses NovaVariantContext for shared state across HUD components
3. **ThreeScene**: Renders appropriate component based on selected variant

## Features

- **Click-outside detection**: Dropdown closes when clicking outside
- **Keyboard shortcuts**: Dev page supports 1/2/3/4 keys for quick switching
- **Visual feedback**: Selected item highlighted with checkmark
- **Responsive design**: Truncates long labels, scrolls for many options
- **Filename display**: Shows GLB filename for community variants

## Architecture

### Context Provider Pattern

The main bridge uses React Context to share variant state across components:

```
Providers (app/providers.tsx)
  └─ NovaVariantProvider
      ├─ NovaVariantSelector (in CaptainNovaPanel)
      └─ NovaVariantRenderer (in ThreeScene)
```

This ensures:
- Single source of truth for active variant
- Automatic re-renders when variant changes
- Clean separation of concerns

### Dev Page Pattern

The dev page uses local state for independent testing:
- No context dependency
- Hardcoded variant list
- Keyboard shortcuts for quick switching

## Implementation Details

### GLB Model Loading

Community variants use `@react-three/drei`'s `useGLTF` hook:
- Loads GLB file from path
- Clones scene to avoid shared state
- Auto-centers model at origin
- Positioned at `[-4, -2, 0]` in scene

### Skeletal Variant

Built-in variant renders `CaptainNova` component:
- Primitive geometry (capsules, spheres)
- Custom hologram shader
- Gesture system (point, salute, at-ease)
- Animation config (breathing, head tracking, idle sway)

## Future Enhancements

1. **Server-Side Rendering**: Move `getAllNovaVariants()` to server components or API routes
2. **Model Preloading**: Preload GLB files on app load for smoother switching
3. **Model Metadata**: Support JSON metadata files alongside GLBs (descriptions, credits, preview images)
4. **Upload UI**: Allow users to upload their own GLB files dynamically
5. **Model Caching**: Cache loaded models in Three.js to avoid re-parsing
6. **Variant Presets**: Save user's preferred variant to localStorage or user profile
7. **Preview Thumbnails**: Show small 3D preview or static image in dropdown
8. **Model Validation**: Validate GLB files for compatibility before rendering
9. **Loading States**: Show loading spinner while GLB models load
10. **Error Boundaries**: Graceful fallback if GLB fails to load

## Troubleshooting

### Dropdown not appearing
- Ensure `NovaVariantProvider` wraps your component tree
- Check that variants array has at least one item

### GLB model not rendering
- Verify path is correct (should start with `/3D/`)
- Check browser console for Three.js errors
- Ensure GLB file is valid and readable

### TypeScript errors
- Import both type and component: `import { NovaVariantDropdown, type NovaVariant } from '...'`
- Ensure `path` property exists for community variants

### Context not found error
- Wrap app with `NovaVariantProvider` in `app/providers.tsx`
- Use `useNovaVariant()` only inside components under the provider

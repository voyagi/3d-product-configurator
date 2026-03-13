# 3D Product Configurator - Technical Research

**Date:** 2026-03-04
**Context:** 3D product configurator for a Shopify store, with real-time preview, color/material customization, and cart integration.

## Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| 3D Engine | React Three Fiber + drei | Declarative part swapping, state-driven materials, huge ecosystem |
| State | Zustand | Same ecosystem as R3F, scales to complex config state |
| Shopify Integration | Custom App (Remix backend) + Theme App Extension | Keeps existing theme, adds configurator as app block |
| Cart | Ajax Cart API with line item properties | Simplest for theme-embedded configurators, no token needed |
| Pricing | Backend validation + Cart Transform Function | Frontend shows estimate, backend enforces real price |
| Constraints | Slot-based system + JSON rules | Parts fit named slots, rules disable invalid combos |
| Admin Panel | Part of the Remix app | Manage products, options, 3D files, constraint rules, pricing |
| 3D Optimization | gltfjsx --transform + Draco compression | 70-90% file size reduction |

## Architecture

```
Shopify Store (existing theme)
  └── Theme App Extension (app block)
        └── Bundled React app (3D configurator)
              ├── React Three Fiber Canvas (3D viewer)
              │     ├── GLB models loaded via useGLTF
              │     ├── Part swapping = conditional rendering
              │     ├── Material changes = material-color prop
              │     └── CameraControls with step-based presets
              ├── Config UI (steps, color pickers, part selectors)
              └── Zustand store (shared state)
                    └── On "Add to Cart" -> Ajax Cart API
                          └── Line item properties carry config

Remix Backend (app server)
  ├── Admin panel (manage products, slots, rules, 3D files)
  ├── Pricing engine (base + component upcharges)
  ├── Config validation API
  └── Shopify Admin API (product/inventory management)

Cart Transform Function (Shopify Function)
  └── Reads _config_json from line item -> applies correct price
```

## Key Decisions

### Why Not Hydrogen?
They already have a Shopify store. Hydrogen means rebuilding the entire storefront. Way more scope than needed.

### Why Theme App Extension + Custom App?
- Theme App Extension: injects configurator into existing theme via drag-and-drop
- Custom App (Remix): provides backend for admin panel, pricing, validation
- Best of both: merchants keep their theme, we get full backend control

### Why Ajax Cart API Over Storefront API?
Configurator lives inside the theme (via app block). Ajax Cart is simpler, no access token, integrates with existing cart drawer/page.

### Variant Strategy
One base variant per product. All configuration stored as line item properties. No need to create hundreds of Shopify variants. Shopify's 2,048 variant limit is irrelevant with this approach.

### Why Slot-Based Constraints?
The "no more room" requirement maps perfectly to: each product has named slots, each slot has a max count, parts declare which slots they fit. Rules are JSON data manageable through the admin panel.

## React Three Fiber Core Patterns

### Basic Configurator Structure

```jsx
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"

function ProductModel({ color, legStyle }) {
  const { nodes, materials } = useGLTF("/models/chair.glb")
  return (
    <group>
      <mesh geometry={nodes.seat.geometry} material={materials.fabric}>
        <meshStandardMaterial color={color} />
      </mesh>
      {legStyle === "wooden" && (
        <mesh geometry={nodes.legs_wood.geometry} material={materials.wood} />
      )}
      {legStyle === "metal" && (
        <mesh geometry={nodes.legs_metal.geometry} material={materials.metal} />
      )}
    </group>
  )
}
```

### State Management (Zustand)

```jsx
import { create } from "zustand"

const useConfigurator = create((set) => ({
  seatColor: "#8B4513",
  legStyle: "wooden",
  finish: "matte",
  step: 0,
  setSeatColor: (color) => set({ seatColor: color }),
  setLegStyle: (style) => set({ legStyle: style }),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
}))
```

### Camera Presets Per Step

Use CameraControls from drei (not OrbitControls) for smooth animated transitions:

```jsx
import { CameraControls } from "@react-three/drei"

const cameraPresets = {
  overview: { pos: [3, 2, 3], target: [0, 0.5, 0] },
  legs: { pos: [1, 0.3, 1], target: [0, 0.2, 0] },
  cushions: { pos: [0, 2, 1.5], target: [0, 0.6, 0] },
}

// On step change, animate camera
cameraControlsRef.current.setLookAt(...preset.pos, ...preset.target, true)
```

### Studio Lighting

```jsx
<Environment preset="studio" background={false} />
<ContactShadows position={[0, -0.5, 0]} opacity={0.4} blur={2.5} />
```

### Performance

- Use `<Canvas frameloop="demand">` for on-demand rendering (no idle GPU burn)
- Target under 2MB per GLB after Draco compression
- Cap DPR at 1.5 on mobile, 2 on desktop
- Use `PerformanceMonitor` from drei for adaptive quality

## GLB File Handling

### Asset Preparation (run on every model)

```bash
npx gltfjsx model.glb --transform --types
# Produces: model-transformed.glb (compressed) + Model.tsx (typed component)
```

For manual control:
```bash
npx @gltf-transform/cli optimize input.glb output.glb --compress draco --texture-compress webp
```

### Part Swapping Approaches

| Approach | When to Use |
|---|---|
| `visible = false` | Few variants, all pre-loaded, instant toggle |
| Conditional render | Moderate variants, React manages lifecycle |
| Load on demand | Large part libraries, use Suspense for loading |

### Material/Color Changing

```jsx
// Simple color change via prop
<mesh geometry={nodes.legs.geometry} material={materials.Wood} material-color={legsColor} />

// Full material swap (fabric vs leather vs metal)
<mesh geometry={nodes.cushion.geometry} material={presets[selectedMaterial]} />
```

## Constraint System

### Slot-Based Configuration

```typescript
interface Slot {
  id: string            // 'left_armrest' | 'legs' | etc.
  position: [number, number, number]
  accepts: string[]     // part category IDs that fit
  required: boolean
  maxCount: number      // "no more room" enforced here
}
```

### Rule-Based Validation

```typescript
interface ConstraintRule {
  type: 'requires' | 'excludes' | 'maxTotal'
  condition: { if: { partSelected: string } }
  action: 'disable' | 'warn'
  message: string       // shown to user
}
```

Rules are JSON data, manageable through the admin panel without code changes.

## Shopify Integration Details

### Adding Configured Product to Cart (Ajax Cart API)

```javascript
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{
      id: variantId,
      quantity: 1,
      properties: {
        "Frame": "Natural Oak",
        "Cushion": "Velvet Blue",
        "Legs": "Hairpin Metal",
        "_config_id": "cfg_abc123",          // hidden from customer
        "_config_json": JSON.stringify(...)    // hidden from customer
      }
    }]
  })
})
```

Properties with `_` prefix are hidden from customer at checkout but visible in admin.

### Dynamic Pricing Flow

1. Frontend shows estimated price from embedded price table
2. Customer clicks "Add to Cart"
3. Frontend sends config to app backend for validation + final price
4. Backend returns validated price + variant ID
5. Frontend adds to cart via Ajax API with line item properties
6. Cart Transform Function enforces correct price at checkout

### Shopify App Setup

```bash
npm install -g @shopify/cli
shopify app init                    # Scaffold Remix app
shopify app generate extension --type theme_app_extension
shopify app dev                     # Dev server with tunnel + hot reload
```

Required API scopes: read_products, write_products, read_inventory

## 3D Designer Guidelines

Guidelines for 3D asset preparation:

- **Naming**: Every configurable part = separate object with unique name (like legs_oak, cushion_back_01)
- **Origins**: All variant parts for same slot MUST share the same origin point
- **Coordinate system**: glTF standard, +Y up, +Z front, units in meters
- **Polygon budget**: 30K-80K triangles per full product, under 2MB per GLB
- **Textures**: 512x512 or 1024x1024, power-of-two dimensions, use tiling for repeating surfaces
- **Format**: Export as GLB (binary), not glTF (separate files)
- **Validation**: Run through Khronos glTF Validator before handing off

## Reference Projects

1. **[breathingcyborg/3d-configurator](https://github.com/breathingcyborg/3d-configurator)** - React + R3F + Payload CMS. Best open-source reference with admin panel.
2. **[Wawa Sensei Table Configurator](https://wawasensei.dev/tuto/react-three-fiber-tutorial-table-configurator)** - Free tutorial, covers R3F configurator basics.
3. **[bachelors-3dwebprodconf](https://github.com/mishpajz-FIT/bachelors-3dwebprodconf)** - Monorepo with customer app + admin app + collision detection.
4. **gltfjsx** - Essential tool. Auto-generates typed React components from GLB files.

## Commercial Landscape (for context)

- Enterprise: Threekit, Salsita 3D, Roomle ($500-25,000+/month)
- Mid-market: Zakeke ($30-200/mo on Shopify), Kickflip, Expivi
- What we're building sits between mid-market and enterprise in features, at a fraction of the ongoing cost

## Getting Started (Day 1-2 After Acceptance)

1. Create Shopify Partners account (free)
2. Set up development store
3. `shopify app init` to scaffold Remix app
4. `shopify app generate extension --type theme_app_extension`
5. Get sample GLB from client, run `npx gltfjsx model.glb --transform --types`
6. Build minimal proof: load model, change color, orbit. Demo within 3-4 days.

# Technical Decisions

## Integration Approach: Custom App + Theme App Extension

**Decision**: Build a Shopify Custom App (Remix backend) that delivers the configurator via Theme App Extension.

**Options considered**:
1. Hydrogen (headless) - rejected, would require rebuilding entire storefront
2. Standalone page + Storefront API - rejected, disjointed customer experience
3. Theme App Extension only - rejected, no backend for admin/pricing/validation
4. **Custom App + Theme App Extension** - chosen

**Reason**: Designed for stores that want to keep their existing Shopify theme. Theme App Extension embeds the configurator into any theme. Remix backend provides admin panel, pricing engine, and config validation.

**What would invalidate**: If the store decides to rebuild the entire storefront from scratch, Hydrogen would be better.

## Variant Strategy: Single Base Variant + Line Item Properties

**Decision**: One base variant per product. All configuration stored as cart line item properties.

**Reason**: Shopify's 2,048 variant limit is insufficient for the combinatorial explosion of a full configurator (colors x materials x parts x sizes). Line item properties carry the full configuration through checkout. Properties prefixed with `_` are hidden from customers but visible in admin.

**Price enforcement**: Cart Transform Function reads `_config_json` from line item and applies the calculated price at checkout.

## Constraint System: Slot-Based + JSON Rules

**Decision**: Products define named slots (attachment points). Parts declare which slots they fit. JSON rules define compatibility.

**Reason**: The "no more room" requirement maps directly to slot max counts. Compatibility rules (part A excludes part B) are data-driven and manageable through the admin panel without code changes.

## 3D Rendering: React Three Fiber

**Decision**: Use R3F over vanilla Three.js or @google/model-viewer.

**Reason**: The configurator is fundamentally a React UI problem. R3F makes part swapping = conditional rendering, material changes = props, and state flows through Zustand. model-viewer lacks the customization needed for part swapping and constraint visualization.

## State Management: Zustand

**Decision**: Zustand over Valtio or Redux.

**Reason**: Same pmndrs ecosystem as R3F. No provider wrapper needed. Scales to complex configurator state (selected parts per slot, materials, colors, step navigation, validation results).
